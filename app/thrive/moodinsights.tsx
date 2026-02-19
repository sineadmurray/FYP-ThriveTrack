import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart, PieChart } from "react-native-gifted-charts";
import { API_BASE } from "../../lib/api";
import SideDrawer from "../components/SideDrawer";

type MoodEntry = {
  id: string;
  user_id?: string;
  mood: string;
  mood_value?: number | null; // 1-5
  notes?: string | null;
  created_at: string;
};

type RangeKey = "week" | "month" | "all";

const LABEL_MAP: Record<string, string> = {
  struggling: "Struggling",
  low: "Low",
  okay: "Okay",
  good: "Good",
  amazing: "Amazing",
};

const VALUE_MAP: Record<string, number> = {
  struggling: 1,
  low: 2,
  okay: 3,
  good: 4,
  amazing: 5,
};

const COLOR_MAP: Record<string, string> = {
  amazing: "#f06292",
  good: "#f8a7c3",
  okay: "#b9a7f3",
  low: "#a9c3b1",
  struggling: "#cfd2d6",
};

function startDateForRange(range: RangeKey) {
  const now = new Date();
  if (range === "all") return null;
  const days = range === "week" ? 7 : 30;
  const d = new Date(now);
  d.setDate(now.getDate() - days);
  return d;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function niceCap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function weekdayKey(date: Date) {
  return date.toLocaleDateString("en-IE", { weekday: "short" }); // Mon, Tue...
}

export default function MoodInsightsScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [range, setRange] = useState<RangeKey>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  // Support prompt modal
  const [showSupportPrompt, setShowSupportPrompt] = useState(false);
  const supportShownOnceRef = useRef(false);

  // TEMP user id
  const userId = "demo-student-1";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/mood_entries?user_id=${userId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: MoodEntry[] = await res.json();
        setEntries(data);
      } catch (e: any) {
        console.log("MoodInsights load error", e);
        setError("Could not load mood entries.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const start = startDateForRange(range);
    if (!start) return entries;
    return entries.filter((e) => new Date(e.created_at) >= start);
  }, [entries, range]);

  const normalized = useMemo(() => {
    return filtered
      .map((e) => {
        const moodKey = (e.mood || "").toLowerCase().trim();
        const v = e.mood_value ?? VALUE_MAP[moodKey] ?? null;
        return {
          ...e,
          mood: moodKey,
          mood_value: v == null ? null : clamp(v, 1, 5),
        };
      })
      .filter((e) => e.mood_value != null);
  }, [filtered]);

  const totalEntries = normalized.length;

  const averageMood = useMemo(() => {
    if (totalEntries === 0) return "0.0";
    const sum = normalized.reduce((acc, e) => acc + (e.mood_value || 0), 0);
    return (sum / totalEntries).toFixed(1);
  }, [normalized, totalEntries]);

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {
      amazing: 0,
      good: 0,
      okay: 0,
      low: 0,
      struggling: 0,
    };
    normalized.forEach((e) => {
      const k = e.mood;
      if (counts[k] !== undefined) counts[k] += 1;
    });
    return counts;
  }, [normalized]);

  const mostCommonMood = useMemo(() => {
    const ent = Object.entries(moodCounts);
    ent.sort((a, b) => b[1] - a[1]);
    const top = ent[0];
    if (!top || top[1] === 0) return "—";
    return LABEL_MAP[top[0]] ?? niceCap(top[0]);
  }, [moodCounts]);

  // ---------- Trend Data (Line Chart) ----------
  const trend = useMemo(() => {
    const sorted = [...normalized].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (range === "week") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const map: Record<string, number[]> = {};
      days.forEach((d) => (map[d] = []));

      sorted.forEach((e) => {
        const d = weekdayKey(new Date(e.created_at));
        map[d]?.push(e.mood_value || 0);
      });

      // Carry forward last known value so the line never drops to 0 / disappears
      let lastKnown: number | null = null;

      return days.map((d) => {
        const vals = map[d];

        if (!vals || vals.length === 0) {
          if (lastKnown != null) return { label: d, value: lastKnown, hideDataPoint: true };
          return { label: d, value: 1, hideDataPoint: true }; // keep within 1–5
        }

        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        lastKnown = avg;
        return { label: d, value: avg };
      });
    }

    // month/all: last 7 entries
    const last = sorted.slice(-7);
    return last.map((e) => {
      const d = new Date(e.created_at);
      const label = d.toLocaleDateString("en-IE", {
        day: "2-digit",
        month: "short",
      });
      return { label, value: e.mood_value || 0 };
    });
  }, [normalized, range]);

  const lineData = useMemo(() => {
    return trend.map((p: any) => ({
      value: p.value,
      label: p.label,
      hideDataPoint: p.hideDataPoint ?? false,
    }));
  }, [trend]);

  // ---------- Mood-triggered support prompt (rule-based) ----------
  const supportPrompt = useMemo(() => {
    const recent = [...normalized]
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    if (recent.length < 5) return null;

    const avg =
      recent.reduce((acc, e) => acc + (e.mood_value || 0), 0) / recent.length;

    if (avg < 2) {
      return {
        avg: avg.toFixed(1),
        message:
          "It looks like your last few check-ins have been on the tougher side. If you’d like, you can explore some gentle support resources.",
      };
    }
    return null;
  }, [normalized]);

  // Show modal once (per screen visit) if the rule triggers
  useEffect(() => {
    if (!supportPrompt) return;
    if (supportShownOnceRef.current) return;

    supportShownOnceRef.current = true;
    setShowSupportPrompt(true);
  }, [supportPrompt]);

  // ---------- Breakdown Data (Donut) ----------
  const pieData = useMemo(() => {
    const total = totalEntries || 1;
    const order: Array<keyof typeof moodCounts> = [
      "amazing",
      "good",
      "okay",
      "low",
      "struggling",
    ];

    return order
      .filter((k) => (moodCounts[k] ?? 0) > 0)
      .map((k) => ({
        value: moodCounts[k],
        color: COLOR_MAP[k],
        text: `${Math.round((moodCounts[k] / total) * 100)}%`,
        label: LABEL_MAP[k],
      }));
  }, [moodCounts, totalEntries]);

  const breakdownRows = useMemo(() => {
    const total = totalEntries || 1;
    const order: Array<keyof typeof moodCounts> = [
      "amazing",
      "good",
      "okay",
      "low",
      "struggling",
    ];

    return order.map((k) => {
      const count = moodCounts[k] ?? 0;
      const pct = Math.round((count / total) * 100);
      return {
        key: k,
        label: LABEL_MAP[k],
        count,
        pct,
        color: COLOR_MAP[k],
      };
    });
  }, [moodCounts, totalEntries]);

  // ---------- Insights (rule-based) ----------
  const insights = useMemo(() => {
    const out: string[] = [];
    if (totalEntries === 0) return out;

    const avg = Number(averageMood);

    if (avg >= 4.2) out.push("🌟 Overall, your mood has been very positive in this period.");
    else if (avg >= 3.5) out.push("😊 Overall, your mood has been mostly positive in this period.");
    else if (avg >= 2.6) out.push("🧡 Overall, your mood has been mixed — some good days, some tougher days.");
    else out.push("🫶 Overall, this period looks tough. Be kind to yourself and take small steps.");

    const series = lineData
      .map((p: any) => (typeof p.value === "number" ? p.value : 0))
      .filter((v: number) => v > 0);

    if (series.length >= 2) {
      const diff = series[series.length - 1] - series[0];
      if (diff >= 0.35) out.push("📈 Your mood is trending upward across this period.");
      else if (diff <= -0.35) out.push("📉 Your mood is trending downward across this period.");
      else out.push("➡️ Your mood has stayed fairly steady across this period.");
    }

    const positiveCount = (moodCounts.good ?? 0) + (moodCounts.amazing ?? 0);
    const difficultCount = (moodCounts.low ?? 0) + (moodCounts.struggling ?? 0);
    const posRatio = positiveCount / totalEntries;
    const diffRatio = difficultCount / totalEntries;

    if (posRatio >= 0.6) out.push("😊 You’ve had more positive days (Good/Amazing) than difficult ones.");
    else if (diffRatio >= 0.5) out.push("🫶 A lot of days have been difficult (Low/Struggling). Consider extra self-care support.");
    else out.push("⚖️ Your days are balanced between positive and difficult moods.");

    if (mostCommonMood !== "—") out.push(`🏷️ Your most common mood in this period was **${mostCommonMood}**.`);

    return out.slice(0, 4);
  }, [averageMood, lineData, moodCounts, mostCommonMood, totalEntries]);

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/ThriveTrack Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>Reflect, Grow &amp; Thrive</Text>

          <Pressable style={styles.menu} onPress={() => setDrawerOpen(true)}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 18 }]} />
            <View style={[styles.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

        {/* Title */}
        <View style={{ alignItems: "center", marginTop: 4 }}>
          <Text style={styles.iconTop}>📊</Text>
          <Text style={styles.title}>Mood Insights</Text>
          <Text style={styles.subtitle}>Discover patterns in your wellbeing journey</Text>
        </View>

        {/* Range Pills */}
        <View style={styles.pillsRow}>
          <Pressable onPress={() => setRange("week")} style={[styles.pill, range === "week" && styles.pillActive]}>
            <Text style={[styles.pillText, range === "week" && styles.pillTextActive]}>This Week</Text>
          </Pressable>

          <Pressable onPress={() => setRange("month")} style={[styles.pill, range === "month" && styles.pillActive]}>
            <Text style={[styles.pillText, range === "month" && styles.pillTextActive]}>This Month</Text>
          </Pressable>

          <Pressable onPress={() => setRange("all")} style={[styles.pill, range === "all" && styles.pillActive]}>
            <Text style={[styles.pillText, range === "all" && styles.pillTextActive]}>All Time</Text>
          </Pressable>
        </View>

        {/* States */}
        {loading && (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: "#666" }}>Loading mood data...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Stat cards */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📈</Text>
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.statValue}>{averageMood}</Text>
                  <Text style={styles.statSubValue}>(out of 5)</Text>
                </View>
                <Text style={styles.statLabel}>Average{"\n"}Mood</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={styles.statValue}>{totalEntries}</Text>
                <Text style={styles.statLabel}>Total{"\n"}Entries</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statIcon}>😊</Text>
                <Text
                  style={styles.statValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {mostCommonMood}
                </Text>
                <Text style={styles.statLabel}>Most{"\n"}Common</Text>
              </View>
            </View>

            {/* Mood Trend */}
            <View style={styles.bigCard}>
              <Text style={styles.bigCardTitle}>Mood Trend</Text>

              {totalEntries === 0 ? (
                <Text style={{ color: "#777", marginTop: 10 }}>
                  No mood entries yet for this range.
                </Text>
              ) : (
                <LineChart
                  data={lineData}
                  height={220}
                  width={screenWidth - 40}
                  yAxisLabelWidth={36}
                  initialSpacing={24}
                  spacing={range === "week" ? 32 : 38}
                  thickness={3}
                  curved={false}
                  hideRules={false}
                  rulesType="dashed"
                  yAxisTextStyle={{ color: "#777" }}
                  xAxisLabelTextStyle={{ color: "#777" }}

                  // Keep scale meaningful for your app (1–5)
                  yAxisOffset={1}
                  stepValue={1}
                  noOfSections={4}
                  maxValue={5}

                  // Bigger dots so logged moods stand out
                  dataPointsRadius={7}
                  dataPointsColor={PINK}

                  yAxisColor="#ddd"
                  xAxisColor="#ddd"
                  color={PINK}
                />
              )}

              <View style={styles.scaleRow}>
                <Text style={styles.scaleText}>1 - Struggling</Text>
                <Text style={styles.scaleText}>5 - Amazing</Text>
              </View>
            </View>

            {/* Mood Breakdown */}
            <View style={styles.bigCard}>
              <Text style={styles.bigCardTitle}>Mood Breakdown</Text>

              {totalEntries === 0 ? (
                <Text style={{ color: "#777", marginTop: 10 }}>
                  Add a few mood entries to see your breakdown.
                </Text>
              ) : (
                <>
                  <View style={{ alignItems: "center", marginTop: 10 }}>
                    <PieChart
                      data={pieData}
                      donut
                      radius={92}
                      innerRadius={62}
                      innerCircleColor="#fff"
                      strokeWidth={3}
                      strokeColor="#fff"
                    />
                  </View>

                  <View style={{ marginTop: 16 }}>
                    {breakdownRows.map((r) => (
                      <View key={r.key} style={styles.breakRow}>
                        <View style={styles.breakLeft}>
                          <View style={[styles.dot, { backgroundColor: r.color }]} />
                          <Text style={styles.breakLabel}>{r.label}</Text>
                        </View>
                        <Text style={styles.breakRight}>
                          {r.count} ({r.pct}%)
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Insights */}
            {insights.length > 0 && (
              <View style={styles.insightsCard}>
                <Text style={styles.insightsTitle}>✨ Your Insights</Text>
                {insights.map((t, idx) => (
                  <Text key={idx} style={styles.insightLine}>
                    {t}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Support Prompt Modal */}
      <Modal
        visible={showSupportPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSupportPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💛 A gentle check-in</Text>

            <Text style={styles.modalText}>
              {supportPrompt?.message}
            </Text>

            <Pressable
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowSupportPrompt(false);
                router.push("/thrive/resources"); 
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>View Support Resources</Text>
            </Pressable>

            <Pressable
              style={styles.modalSecondaryBtn}
              onPress={() => setShowSupportPrompt(false)}
            >
              <Text style={styles.modalSecondaryBtnText}>Not right now</Text>
            </Pressable>

            <Text style={styles.modalFootnote}>
              Based on your last 5 mood check-ins (avg {supportPrompt?.avg}/5).
            </Text>
          </View>
        </View>
      </Modal>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

/* Theme */
const BG = "#fff5f9";
const CARD_BG = "#ffffff";
const PINK = "#f06292";
const TEXT = "#222";
const SHADOW = "#000";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === "android" ? 35 : 55,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  appTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: TEXT,
  },
  menu: {
    width: 28,
    alignItems: "flex-end",
    gap: 5,
    marginLeft: 12,
  },
  menuLine: {
    height: 3,
    width: 24,
    borderRadius: 3,
    backgroundColor: TEXT,
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  backArrow: {
    fontSize: 28,
    color: PINK,
    marginTop: -2,
  },
  backBtn: {
    paddingRight: 8,
    paddingTop: 4,
  },

  iconTop: {
    fontSize: 34,
    marginBottom: 6,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: PINK,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 18,
    color: "#6b6b6b",
    textAlign: "center",
  },

  pillsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#ffe0ec",
    borderWidth: 1,
    borderColor: "#ffd0e2",
  },
  pillActive: {
    backgroundColor: PINK,
    borderColor: PINK,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b56b87",
  },
  pillTextActive: {
    color: "#fff",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: SHADOW,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: PINK,
  },
  statSubValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: "#777",
  },
  statLabel: {
    marginTop: 6,
    textAlign: "center",
    color: "#666",
    fontWeight: "700",
  },

  bigCard: {
    backgroundColor: CARD_BG,
    borderRadius: 26,
    padding: 18,
    marginTop: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  bigCardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: PINK,
    marginBottom: 8,
  },

  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  scaleText: {
    color: "#777",
    fontWeight: "600",
  },

  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  breakLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  breakLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  breakRight: {
    fontSize: 16,
    fontWeight: "800",
    color: PINK,
  },

  insightsCard: {
    backgroundColor: "#fff0f6",
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#ffd0e2",
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: PINK,
    marginBottom: 10,
  },
  insightLine: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    marginBottom: 10,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    borderWidth: 1,
    borderColor: "#ffd0e2",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: PINK,
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  modalPrimaryBtn: {
    marginTop: 14,
    backgroundColor: PINK,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  modalPrimaryBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  modalSecondaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#ffe0ec",
    borderWidth: 1,
    borderColor: "#ffd0e2",
  },
  modalSecondaryBtnText: {
    color: "#b56b87",
    fontWeight: "900",
    fontSize: 15,
  },
  modalFootnote: {
    marginTop: 10,
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    fontWeight: "700",
  },

});
