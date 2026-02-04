import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
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
  mood: string; // "good" etc
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
  // Mon, Tue...
  return date.toLocaleDateString("en-IE", { weekday: "short" });
}

export default function MoodInsightsScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [range, setRange] = useState<RangeKey>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]);

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
    // ensure mood_value always exists
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
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (range === "week") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const map: Record<string, number[]> = {};
      days.forEach((d) => (map[d] = []));

      sorted.forEach((e) => {
        const d = weekdayKey(new Date(e.created_at));
        if (!map[d]) map[d] = [];
        map[d].push(e.mood_value || 0);
      });

      return days.map((d) => {
        const vals = map[d];
        if (!vals || vals.length === 0) {
          return { label: d, value: 0, hideDataPoint: true };
        }
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        return { label: d, value: avg };
      });
    }

    // month/all: last 7 entries by date label (simple)
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

  // Helpers
  const avg = Number(averageMood); // averageMood is a string like "4.3"
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

  // 1) Average mood level (overall)
  if (avg >= 4.2) {
    out.push("🌟 Overall, your mood has been very positive in this period.");
  } else if (avg >= 3.5) {
    out.push("😊 Overall, your mood has been mostly positive in this period.");
  } else if (avg >= 2.6) {
    out.push("🧡 Overall, your mood has been mixed — some good days, some tougher days.");
  } else {
    out.push("🫶 Overall, this period looks tough. Be kind to yourself and take small steps.");
  }

  // Build a clean series of points for trend/volatility
  const series = lineData
    .map((p) => (typeof p.value === "number" ? p.value : 0))
    .filter((v) => v > 0); // ignore missing days/zeros

  // 2) Trend direction (up/down/flat)
  if (series.length >= 2) {
    const first = series[0];
    const last = series[series.length - 1];
    const diff = last - first;

    if (diff >= 0.35) {
      out.push("📈 Your mood is trending upward across this period.");
    } else if (diff <= -0.35) {
      out.push("📉 Your mood is trending downward across this period.");
    } else {
      out.push("➡️ Your mood has stayed fairly steady across this period.");
    }
  }

  // 3) Mood distribution: positive vs difficult ratio
  const positiveCount = (moodCounts.good ?? 0) + (moodCounts.amazing ?? 0);
  const difficultCount = (moodCounts.low ?? 0) + (moodCounts.struggling ?? 0);
  const posRatio = positiveCount / totalEntries;
  const diffRatio = difficultCount / totalEntries;

  if (posRatio >= 0.6) {
    out.push("😊 You’ve had more positive days (Good/Amazing) than difficult ones.");
  } else if (diffRatio >= 0.5) {
    out.push("🫶 A lot of days have been difficult (Low/Struggling). Consider extra self-care support.");
  } else {
    out.push("⚖️ Your days are balanced between positive and difficult moods.");
  }

  // 4) Most common mood (already calculated)
  if (mostCommonMood !== "—") {
    out.push(`🏷️ Your most common mood in this period was **${mostCommonMood}**.`);
  }

  // 5) Consistency: how many distinct days did you log?
  const uniqueDays = new Set(
    normalized.map((e) => new Date(e.created_at).toDateString())
  ).size;

  if (range === "week") {
    if (uniqueDays >= 5) out.push("📅 Great consistency — you checked in on most days this week.");
    else if (uniqueDays >= 3) out.push("📅 Nice work — a few more check-ins would make trends clearer.");
    else out.push("📌 Add a few more check-ins to unlock clearer insights for the week.");
  } else {
    if (uniqueDays >= 12) out.push("📅 Strong consistency — regular check-ins make patterns easier to spot.");
    else if (uniqueDays >= 6) out.push("📅 Good effort — more regular check-ins will improve accuracy of trends.");
    else out.push("📌 Try checking in a bit more often to see clearer patterns over time.");
  }

  // 6) Weekday vs weekend pattern (consistency style)
  const weekdayCount = normalized.filter((e) => {
    const day = new Date(e.created_at).getDay(); // 0 Sun..6 Sat
    return day >= 1 && day <= 5;
  }).length;
  const weekendCount = totalEntries - weekdayCount;

  if (weekdayCount >= weekendCount + 2) {
    out.push("⭐ You log moods more on weekdays — routines seem to help your tracking.");
  } else if (weekendCount >= weekdayCount + 2) {
    out.push("🌿 You log moods more on weekends — that might be your best reflection time.");
  } else {
    out.push("🗓️ Your logging is fairly even across weekdays and weekends.");
  }

  // 7) Volatility (big swings day-to-day)
  if (series.length >= 3) {
    const deltas: number[] = [];
    for (let i = 1; i < series.length; i++) {
      deltas.push(Math.abs(series[i] - series[i - 1]));
    }
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;

    if (avgDelta >= 1.1) {
      out.push("🎢 Your mood has been changing a lot day-to-day (high variability).");
    } else if (avgDelta >= 0.6) {
      out.push("🔄 Your mood has had some ups and downs, which is completely normal.");
    } else {
      out.push("🌿 Your mood has been fairly steady (low variability).");
    }
  }

  // Optional: limit to 3–4 lines so the UI stays tidy
  return out.slice(0, 4);
}, [averageMood, lineData, moodCounts, mostCommonMood, normalized, range, totalEntries]);

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Back to Thrive</Text>
        </Pressable>

        {/* Title */}
        <View style={{ alignItems: "center", marginTop: 4 }}>
          <Text style={styles.iconTop}>📊</Text>
          <Text style={styles.title}>Mood Insights</Text>
          <Text style={styles.subtitle}>
            Discover patterns in your wellbeing journey
          </Text>
        </View>

        {/* Range Pills */}
        <View style={styles.pillsRow}>
          <Pressable
            onPress={() => setRange("week")}
            style={[styles.pill, range === "week" && styles.pillActive]}
          >
            <Text
              style={[
                styles.pillText,
                range === "week" && styles.pillTextActive,
              ]}
            >
              This Week
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRange("month")}
            style={[styles.pill, range === "month" && styles.pillActive]}
          >
            <Text
              style={[
                styles.pillText,
                range === "month" && styles.pillTextActive,
              ]}
            >
              This Month
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRange("all")}
            style={[styles.pill, range === "all" && styles.pillActive]}
          >
            <Text
              style={[
                styles.pillText,
                range === "all" && styles.pillTextActive,
              ]}
            >
              All Time
            </Text>
          </Pressable>
        </View>

        {/* States */}
        {loading && (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: "#666" }}>
              Loading mood data...
            </Text>
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
                <Text style={styles.statValue}>{averageMood}</Text>
                <Text style={styles.statLabel}>Average{"\n"}Mood</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={styles.statValue}>{totalEntries}</Text>
                <Text style={styles.statLabel}>Total{"\n"}Entries</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statIcon}>😊</Text>
                <Text style={styles.statValue}>{mostCommonMood}</Text>
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
                  initialSpacing={14}
                  spacing={range === "week" ? 32 : 38}
                  thickness={3}
                  curved
                  hideRules={false}
                  rulesType="dashed"
                  yAxisTextStyle={{ color: "#777" }}
                  xAxisLabelTextStyle={{ color: "#777" }}
                  maxValue={5}
                  noOfSections={5}
                  yAxisLabelTexts={["1", "2", "3", "4", "5"]}
                  yAxisColor="#ddd"
                  xAxisColor="#ddd"
                  dataPointsColor={PINK}
                  color={PINK}
                  startFillColor={PINK}
                  endFillColor={PINK}
                  hideDataPoints={false}
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
                          <View
                            style={[
                              styles.dot,
                              { backgroundColor: r.color },
                            ]}
                          />
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
  backText: {
    color: PINK,
    fontSize: 18,
    fontWeight: "600",
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
});
