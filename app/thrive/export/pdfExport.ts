import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { API_BASE } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";
import type { ExportCategory, TimePeriod } from "./exportOptions";
import { getLogoBase64 } from "./logoBase64";

/* ---------------- Timeout + Authed HTTP ---------------- */

function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Request timeout")), ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });
}

async function authedHttp<T = any>(path: string): Promise<T> {
  // Get current session token
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("Not logged in (missing access token).");

  const url = `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await withTimeout(
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

/* ---------------- Period Helper ---------------- */

function getPeriodRange(period: TimePeriod): { label: string; fromISO: string | null } {
  const now = new Date();
  if (period === "allTime") return { label: "All Time", fromISO: null };

  const days = period === "lastWeek" ? 7 : 30;
  const from = new Date(now);
  from.setDate(now.getDate() - days);

  return {
    label: period === "lastWeek" ? "Last 7 Days" : "Last 30 Days",
    fromISO: from.toISOString(),
  };
}

/* ---------------- Timeline Normalisation ---------------- */

type TimelineItem = {
  dateISO: string;
  sectionTitle: string;
  lines: { label?: string; value: string }[];
};

function formatDateHeading(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function escapeHtml(text: string) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildHtml({
  logoDataUri,
  userName,
  generatedLabel,
  periodLabel,
  items,
}: {
  logoDataUri: string | null;
  userName: string;
  generatedLabel: string;
  periodLabel: string;
  items: TimelineItem[];
}) {
  // Group by date heading (chronological layout like your last Figma screen)
  const grouped = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const key = formatDateHeading(item.dateISO);
    const arr = grouped.get(key) ?? [];
    arr.push(item);
    grouped.set(key, arr);
  }

  const datesInOrder = Array.from(grouped.keys());

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; padding: 24px; color: #2b2b2b; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .brand h1 { margin: 0; font-size: 40px; color: #ff5db1; }
        .brand h2 { margin: 6px 0 0 0; font-size: 18px; font-weight: 600; color: #6b6b6b; }
        .logo { width: 64px; height: 64px; border-radius: 16px; background: #ffe3f2; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .logo img { width: 100%; height: 100%; object-fit: cover; }
        .meta { margin-top: 14px; font-size: 14px; color: #444; line-height: 1.5; }
        hr { border: none; border-top: 1px solid #e6e6e6; margin: 18px 0; }

        .date { font-size: 20px; font-weight: 800; margin: 22px 0 10px; color: #444; }
        .entry { margin-bottom: 14px; }
        .entry-title { font-weight: 800; color: #6d5bc5; margin-bottom: 6px; }
        .line { margin: 3px 0; color: #4a4a4a; }
        .label { font-weight: 700; color: #6b6b6b; }
        .footer { margin-top: 30px; font-size: 11px; color: #8a8a8a; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          <h1>ThriveTrack</h1>
          <h2>Personal Wellbeing Record</h2>
        </div>
        <div class="logo">
          ${logoDataUri ? `<img src="${logoDataUri}" />` : ""}
        </div>
      </div>

      <div class="meta">
        <div><span class="label">Name:</span> ${escapeHtml(userName)}</div>
        <div><span class="label">Generated:</span> ${escapeHtml(generatedLabel)}</div>
        <div><span class="label">Period:</span> ${escapeHtml(periodLabel)}</div>
      </div>

      <hr />

      ${
        datesInOrder.length === 0
          ? `<div>No entries found for the selected period.</div>`
          : datesInOrder
              .map((date) => {
                const entries = grouped.get(date)!;
                return `
                  <div class="date">${escapeHtml(date)}</div>
                  ${entries
                    .map(
                      (e) => `
                    <div class="entry">
                      <div class="entry-title">${escapeHtml(e.sectionTitle)}</div>
                      ${e.lines
                        .map((l) => {
                          const label = l.label ? `<span class="label">${escapeHtml(l.label)}:</span> ` : "";
                          return `<div class="line">${label}${escapeHtml(l.value)}</div>`;
                        })
                        .join("")}
                    </div>`
                    )
                    .join("")}
                `;
              })
              .join("")
      }

      <div class="footer">
        This report is for personal reflection and not a medical diagnosis.
      </div>
    </body>
  </html>
  `;
}

/* ---------------- Endpoint Mapping (YOUR ROUTES) ---------------- */

function getEndpointForCategory(cat: ExportCategory, fromISO: string | null) {
  const qs = fromISO ? `?from=${encodeURIComponent(fromISO)}` : "";

  switch (cat) {
    // Reflect
    case "moodLogs":
      return `/mood_entries${qs}`;
    case "trapAndTrack":
      return `/trap_and_track${qs}`;
    case "dailyReflection":
      return `/end_of_day_reflections${qs}`;
    case "gratitude":
      return `/gratitude_entries${qs}`;
    case "outsideInThinking":
      return `/outside_in_actions${qs}`;

    // Grow
    case "whereIAm":
      return `/where_i_am_reflections${qs}`;
    case "weeklyReflection":
      return `/weekly_reflections${qs}`;
    case "longTermVision":
      return `/long_term_visions${qs}`;
    case "dailyPlanner":
      return `/daily_plans${qs}`;

    default:
      return null;
  }
}

/* ---------------- Row -> Timeline Mapping (YOUR COLUMNS) ---------------- */

function toTimelineItems(cat: ExportCategory, rows: any[]): TimelineItem[] {
  switch (cat) {
    case "moodLogs":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Mood Log",
        lines: [
          ...(r.mood ? [{ label: "Mood", value: r.mood }] : []),
          ...(r.mood_value != null ? [{ label: "Mood Value", value: String(r.mood_value) }] : []),
          ...(r.notes ? [{ label: "Notes", value: r.notes }] : []),
        ],
      }));

    case "dailyReflection":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Daily Reflection",
        lines: [
          ...(r.went_well ? [{ label: "What went well", value: r.went_well }] : []),
          ...(r.learned ? [{ label: "Something I learned", value: r.learned }] : []),
          ...(r.proud_of ? [{ label: "I’m proud of myself for", value: r.proud_of }] : []),
          ...(r.self_care ? [{ label: "Self-care I practiced", value: r.self_care }] : []),
        ],
      }));

    case "gratitude":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Gratitude",
        lines: [{ value: r.text ?? "" }],
      }));

    case "trapAndTrack":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Trap & Track",
        lines: [
          ...(r.circumstance ? [{ label: "Circumstance", value: r.circumstance }] : []),
          ...(r.trigger ? [{ label: "Trigger", value: r.trigger }] : []),
          ...(r.response ? [{ label: "Response", value: r.response }] : []),
          ...(r.avoidance ? [{ label: "Avoidance", value: r.avoidance }] : []),
          ...(r.consequence ? [{ label: "Consequences", value: r.consequence }] : []),
          ...(r.copingstrategy ? [{ label: "Coping Strategies", value: r.copingstrategy }] : []),
          ...(r.tryalternative ? [{ label: "Alternative to Try", value: r.tryalternative }] : []),
          ...(r.consequenceafter ? [{ label: "After Trying", value: r.consequenceafter }] : []),
        ],
      }));

    case "outsideInThinking":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Outside-In Thinking",
        lines: [{ value: r.action_text ?? "" }],
      }));

    case "whereIAm":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Where I Am",
        lines: [
          ...(r.mind_now || r.mind_want ? [{ label: "Mind", value: `Now: ${r.mind_now ?? ""} | Want: ${r.mind_want ?? ""}` }] : []),
          ...(r.body_now || r.body_want ? [{ label: "Body", value: `Now: ${r.body_now ?? ""} | Want: ${r.body_want ?? ""}` }] : []),
          ...(r.career_now || r.career_want ? [{ label: "Career", value: `Now: ${r.career_now ?? ""} | Want: ${r.career_want ?? ""}` }] : []),
          ...(r.relationships_now || r.relationships_want ? [{ label: "Relationships", value: `Now: ${r.relationships_now ?? ""} | Want: ${r.relationships_want ?? ""}` }] : []),
        ],
      }));

    case "weeklyReflection":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Weekly Reflection",
        lines: [
          ...(r.mind ? [{ label: "Mind", value: r.mind }] : []),
          ...(r.body ? [{ label: "Body", value: r.body }] : []),
          ...(r.career ? [{ label: "Career", value: r.career }] : []),
          ...(r.relationships ? [{ label: "Relationships", value: r.relationships }] : []),
          ...(r.held_me_back ? [{ label: "What held me back", value: r.held_me_back }] : []),
          ...(r.lesson_learned ? [{ label: "Lessons learned", value: r.lesson_learned }] : []),
          ...(r.next_weeks_focus ? [{ label: "Next week’s focus", value: r.next_weeks_focus }] : []),
        ],
      }));

    case "dailyPlanner":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Daily Planner",
        lines: [
          ...(r.main_goal ? [{ label: "Main goal", value: r.main_goal }] : []),
          ...(r.priority_1 ? [{ label: "Priority 1", value: r.priority_1 }] : []),
          ...(r.priority_2 ? [{ label: "Priority 2", value: r.priority_2 }] : []),
          ...(r.priority_3 ? [{ label: "Priority 3", value: r.priority_3 }] : []),
          ...(r.other_todos ? [{ label: "Other to-dos", value: r.other_todos }] : []),
          ...(r.self_care_actions ? [{ label: "Self-care actions", value: r.self_care_actions }] : []),
          ...(r.productivity_reward ? [{ label: "Productivity reward", value: r.productivity_reward }] : []),
          ...(r.notes ? [{ label: "Notes", value: r.notes }] : []),
        ],
      }));

    case "longTermVision":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Long-Term Vision",
        lines: [
          ...(r.vision ? [{ label: "Vision", value: r.vision }] : []),
          ...(r.clear_direction ? [{ label: "How I’m going to get there", value: r.clear_direction }] : []),
        ],
      }));

    default:
      return [];
  }
}

/* ---------------- Main Export Function ---------------- */

export async function generateAndSharePdf({
  period,
  selected,
  userName,
}: {
  period: TimePeriod;
  selected: Record<ExportCategory, boolean>;
  userName: string;
}) {
  const { label: periodLabel, fromISO } = getPeriodRange(period);

  const chosenCats = Object.entries(selected)
    .filter(([, on]) => on)
    .map(([k]) => k as ExportCategory);

  const results = await Promise.all(
    chosenCats.map(async (cat) => {
      const path = getEndpointForCategory(cat, fromISO);
      if (!path) return { cat, rows: [] as any[] };

      const rows = await authedHttp<any[]>(path);
      return { cat, rows };
    })
  );

  const items: TimelineItem[] = results.flatMap(({ cat, rows }) => toTimelineItems(cat, rows));
  items.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());

  const logoDataUri = await getLogoBase64();
  const generatedLabel = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = buildHtml({
    logoDataUri,
    userName,
    generatedLabel,
    periodLabel,
    items,
  });

  const { uri } = await Print.printToFileAsync({ html });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(uri);
}