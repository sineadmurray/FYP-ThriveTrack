import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { ExportCategory, TimePeriod } from "./exportOptions";
import { getLogoBase64 } from "./logoBase64";

import { API_BASE } from "../lib/api";
import { supabase } from "../lib/supabase";

/* ---------------- Timeout + Authed HTTP ---------------- */

function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
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
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not logged in (missing access token).");

  const url = `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await withTimeout(
    fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
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

type ItemGroup = "reflect" | "grow";

type TimelineItem = {
  dateISO: string;
  sectionTitle: string;
  group: ItemGroup; // ✅ new
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

/* ---------------- HTML Builder (better design) ---------------- */

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
  const grouped = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const key = formatDateHeading(item.dateISO);
    const arr = grouped.get(key) ?? [];
    arr.push(item);
    grouped.set(key, arr);
  }

  const datesInOrder = Array.from(grouped.keys());

  // Colours (tweak if you want)
  const PINK = "#ff5db1";
  const REFLECT = "#6d5bc5"; // purple
  const GROW = "#2ea66f"; // green

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
          margin: 0;
          background: #fbf6f9;
          color: #242424;
        }
        .page {
          padding: 26px;
        }

        /* Header */
        .top {
          background: #ffffff;
          border: 1px solid #f0e6ec;
          border-radius: 18px;
          padding: 18px 18px 14px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .brand h1 {
          margin: 0;
          font-size: 36px;
          letter-spacing: -0.5px;
          color: ${PINK};
        }
        .brand h2 {
          margin: 6px 0 0 0;
          font-size: 14px;
          font-weight: 700;
          color: #6b6b6b;
        }
        .logo {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: #ffe3f2;
          border: 1px solid #ffd0e8;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .meta {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
          font-size: 12.5px;
          color: #4a4a4a;
        }
        .meta .label {
          font-weight: 800;
          color: #666;
        }

        /* Date sections */
        .date {
          margin: 20px 2px 10px;
          font-size: 18px;
          font-weight: 900;
          color: #3a3a3a;
        }

        /* Entry cards */
        .entry {
          background: #ffffff;
          border: 1px solid #f0e6ec;
          border-radius: 18px;
          padding: 14px 14px 12px;
          margin-bottom: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }
        .entry-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .entry-title {
          margin: 0;
          font-weight: 900;
          font-size: 15px;
        }
        .entry-title.reflect { color: ${REFLECT}; }
        .entry-title.grow { color: ${GROW}; }

        .pill {
          font-size: 11px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid;
          display: inline-block;
          white-space: nowrap;
        }
        .pill.reflect {
          color: ${REFLECT};
          background: #f2edff;
          border-color: #d9d0ff;
        }
        .pill.grow {
          color: ${GROW};
          background: #e9fbf2;
          border-color: #c9f3df;
        }

        .line {
          margin: 4px 0;
          font-size: 13px;
          line-height: 1.35;
          color: #3f3f3f;
          word-wrap: break-word;
        }
        .line .k {
          font-weight: 900;
          color: #666;
        }

        .footer {
          margin-top: 18px;
          font-size: 11px;
          color: #8a8a8a;
          text-align: center;
        }
      </style>
    </head>

    <body>
      <div class="page">

        <div class="top">
          <div class="header-row">
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
            <div><span class="label">Entries:</span> ${items.length}</div>
          </div>
        </div>

        ${
          datesInOrder.length === 0
            ? `<div class="date">No entries found for the selected period.</div>`
            : datesInOrder
                .map((date) => {
                  const entries = grouped.get(date)!;
                  return `
                    <div class="date">${escapeHtml(date)}</div>

                    ${entries
                      .map((e) => {
                        const groupClass = e.group === "grow" ? "grow" : "reflect";
                        const pillLabel = e.group === "grow" ? "Grow" : "Reflect";

                        return `
                          <div class="entry">
                            <div class="entry-head">
                              <div class="entry-title ${groupClass}">${escapeHtml(e.sectionTitle)}</div>
                              <div class="pill ${groupClass}">${pillLabel}</div>
                            </div>

                            ${e.lines
                              .filter((l) => String(l.value ?? "").trim().length > 0)
                              .map((l) => {
                                const key = l.label ? `<span class="k">${escapeHtml(l.label)}:</span> ` : "";
                                return `<div class="line">${key}${escapeHtml(l.value)}</div>`;
                              })
                              .join("")}
                          </div>
                        `;
                      })
                      .join("")}
                  `;
                })
                .join("")
        }

        <div class="footer">
          This report is for personal reflection and not a medical diagnosis.
        </div>
      </div>
    </body>
  </html>
  `;
}

/* ---------------- Endpoint Mapping ---------------- */

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

/* ---------------- Row -> Timeline Mapping (with group) ---------------- */

function groupForCategory(cat: ExportCategory): ItemGroup {
  const reflect: ExportCategory[] = [
    "moodLogs",
    "trapAndTrack",
    "dailyReflection",
    "gratitude",
    "outsideInThinking",
  ];
  return reflect.includes(cat) ? "reflect" : "grow";
}

function toTimelineItems(cat: ExportCategory, rows: any[]): TimelineItem[] {
  const group = groupForCategory(cat);

  switch (cat) {
    case "moodLogs":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Mood Log",
        group,
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
        group,
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
        group,
        lines: [{ value: r.text ?? "" }],
      }));

    case "trapAndTrack":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Trap & Track",
        group,
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
        group,
        lines: [{ value: r.action_text ?? "" }],
      }));

    case "whereIAm":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Where I Am",
        group,
        lines: [
          ...(r.mind_now || r.mind_want
            ? [{ label: "Mind", value: `Now: ${r.mind_now ?? ""} | Want: ${r.mind_want ?? ""}` }]
            : []),
          ...(r.body_now || r.body_want
            ? [{ label: "Body", value: `Now: ${r.body_now ?? ""} | Want: ${r.body_want ?? ""}` }]
            : []),
          ...(r.career_now || r.career_want
            ? [{ label: "Career", value: `Now: ${r.career_now ?? ""} | Want: ${r.career_want ?? ""}` }]
            : []),
          ...(r.relationships_now || r.relationships_want
            ? [
                {
                  label: "Relationships",
                  value: `Now: ${r.relationships_now ?? ""} | Want: ${r.relationships_want ?? ""}`,
                },
              ]
            : []),
        ],
      }));

    case "weeklyReflection":
      return rows.map((r) => ({
        dateISO: r.created_at,
        sectionTitle: "Weekly Reflection",
        group,
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
        group,
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
        group,
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