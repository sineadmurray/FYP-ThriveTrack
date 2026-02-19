import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_BASE } from "../../lib/api";
import SideDrawer from "../components/SideDrawer";

type WeeklySummaryCounts = {
  moodCount: number;
  reflectCount: number;
  growCount: number;
};

export default function WeeklySummaryScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const userId = "demo-student-1"; 

  const [data, setData] = useState<WeeklySummaryCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  //** code sourced from Chatgpt conversation **//
  //...//
  type WeeklyAISummary = {
    overallMoodTrend: string[];
    whatFeltPositive: string[];
    whatFeltChallenging: string[];
    gentleSuggestion: string[];
    note: string;
  };

  const [aiSummary, setAiSummary] = useState<WeeklyAISummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  //...//
  //** code sourced from Chatgpt conversation **//

  const fetchWeeklyCounts = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const url = `${API_BASE}/weekly_summary?user_id=${encodeURIComponent(userId)}`;
      const res = await fetch(url);

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed (${res.status})`);
      }

      const json = (await res.json()) as WeeklySummaryCounts;
      setData(json);
    } catch (e: any) {
      console.error("weekly_summary fetch error:", e);
      setErrorMsg("Could not load your weekly summary. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  //** code sourced from Chatgpt conversation **//
  //...//
  const fetchWeeklyAISummary = async () => {
    try {
      setAiLoading(true);
      setAiError(null);
  
      const res = await fetch(`${API_BASE}/weekly_summary_ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
  
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed (${res.status})`);
      }
  
      const json = await res.json();
      // Backend returns: { summary: { overallMoodTrend: [...], ... } }
      setAiSummary(json.summary);
    } catch (e: any) {
      console.error("weekly_summary_ai fetch error:", e);
      setAiError("Could not generate your AI summary. Please try again.");
      setAiSummary(null);
    } finally {
      setAiLoading(false);
    }
  };
  //...//
  //** code sourced from Chatgpt conversation **//

  useEffect(() => {
    fetchWeeklyCounts();
    fetchWeeklyAISummary();
  }, []);

  const moodLogs = data?.moodCount ?? 0;
  const reflectEntries = data?.reflectCount ?? 0;
  const growEntries = data?.growCount ?? 0;

  const isEmpty = !loading && !errorMsg && moodLogs === 0 && reflectEntries === 0 && growEntries === 0;
  
  
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
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* Title */}
        <View style={{ alignItems: "center", marginTop: 4 }}>
          <Text style={styles.iconTop}>✨</Text>
          <Text style={styles.title}>Weekly Summary</Text>
          <Text style={styles.subtitle}>
            Here's a gentle reflection on your past 7 days
          </Text>
        </View>

        {/* Loading / Error / Empty */}
        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Loading your week…</Text>
          </View>
        )}

        {!loading && errorMsg && (
          <View style={styles.stateBox}>
            <Text style={[styles.stateText, { marginBottom: 10 }]}>{errorMsg}</Text>
            <Pressable onPress={fetchWeeklyCounts} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {!loading && isEmpty && (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>No entries yet this week</Text>
            <Text style={styles.stateText}>
              Start logging moods or reflections to see your weekly summary.
            </Text>
            <Pressable
              onPress={() => router.push("/reflect")} // adjust if your route is different
              style={styles.retryBtn}
            >
              <Text style={styles.retryBtnText}>Log Something</Text>
            </Pressable>
          </View>
        )}

        {/* Stat cards */}
        {!loading && !errorMsg && !isEmpty && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🙂</Text>
              <Text style={styles.statValue}>{moodLogs}</Text>
              <Text style={styles.statLabel}>Mood{"\n"}Logs</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🪞</Text>
              <Text style={styles.statValue}>{reflectEntries}</Text>
              <Text style={styles.statLabel}>Reflect{"\n"}Entries</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🌱</Text>
              <Text style={styles.statValue}>{growEntries}</Text>
              <Text style={styles.statLabel}>Grow{"\n"}Entries</Text>
            </View>
          </View>
        )}

        {/* code sourced from chatgpt conversation */}
        {/* ... */}
        {!loading && !errorMsg && !isEmpty && (
          <View style={styles.bigCard}>
            <Text style={styles.bigCardTitle}>Overall Mood Trend</Text>

            {aiLoading && <Text style={styles.bodyText}>Generating your summary…</Text>}
            {!aiLoading && aiError && <Text style={styles.bodyText}>{aiError}</Text>}
            {!aiLoading && !aiError && aiSummary && (
              <Text style={styles.bodyText}>
              {aiSummary.overallMoodTrend}
            </Text>
            )}
          </View>
        )}
        {!loading && !errorMsg && !isEmpty && (
          <View style={styles.bigCard}>
            <Text style={styles.bigCardTitle}>What Felt Positive</Text>

            {aiLoading && <Text style={styles.bodyText}>Generating your summary…</Text>}
            {!aiLoading && aiError && <Text style={styles.bodyText}>{aiError}</Text>}
            {!aiLoading && !aiError && aiSummary && (
              <Text style={styles.bodyText}>
              {aiSummary.whatFeltPositive}
            </Text>
            )}
          </View>
        )}
        {!loading && !errorMsg && !isEmpty && (
          <View style={styles.bigCard}>
            <Text style={styles.bigCardTitle}>What Felt Challenging</Text>

            {aiLoading && <Text style={styles.bodyText}>Generating your summary…</Text>}
            {!aiLoading && aiError && <Text style={styles.bodyText}>{aiError}</Text>}
            {!aiLoading && !aiError && aiSummary && (
              <Text style={styles.bodyText}>
              {aiSummary.whatFeltChallenging}
            </Text>
            )}
          </View>
        )}
        {!loading && !errorMsg && !isEmpty && (
          <View style={styles.SuggestionCard}>
            <Text style={styles.SuggestionTitle}>Gentle Suggestion</Text>

            {aiLoading && <Text style={styles.SuggestionText}>Generating your summary…</Text>}
            {!aiLoading && aiError && <Text style={styles.SuggestionText}>{aiError}</Text>}
            {!aiLoading && !aiError && aiSummary && (
              <>
                {aiSummary.gentleSuggestion.map((t, i) => (
                  <Text key={i} style={styles.SuggestionText}>
                    {"• "}{t}
                  </Text>
                ))}
                <Text style={[styles.disclaimerText, { marginTop: 6 }]}>
                  {aiSummary.note}
                </Text>
              </>
            )}
          </View>
        )}
        {/* ... */}
        {/* code sourced from chatgpt conversation */}

        {/* Regenerate Button + Disclaimer */}
        {!loading && !errorMsg && !isEmpty && (
          <View style={styles.footerSection}>
            <Pressable
              style={styles.regenerateButton}
              onPress={() => {
                fetchWeeklyCounts();
                fetchWeeklyAISummary();
              }}
            >
              <Text style={styles.regenerateButtonText}>
                Regenerate Summary
              </Text>
            </Pressable>

            <Text style={styles.disclaimerText}>
              This summary is for reflection only and not medical advice.
            </Text>
          </View>
        )}
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
    fontSize: 16,
    fontWeight: "800",
    color: PINK,
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

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
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
  bodyText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    fontWeight: "600",
  },
  SuggestionCard: {
    backgroundColor: "#fff0f6",
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#ffd0e2",
  },
  SuggestionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: PINK,
    marginBottom: 10,
  },
  SuggestionText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    marginBottom: 10,
    fontWeight: "600",
  },
  footerSection: {
    marginTop: 28,
    marginBottom: 30,
  },
  
  regenerateButton: {
    backgroundColor: "#e5b3c7", // soft dusty pink
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  
  regenerateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  
  disclaimerText: {
    marginTop: 18,
    fontSize: 14,
    color: "#a8a8a8",
    textAlign: "center",
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  

  stateBox: {
    marginTop: 18,
    backgroundColor: "#fff0f6",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffd0e2",
    alignItems: "center",
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: PINK,
    marginBottom: 6,
    textAlign: "center",
  },
  stateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: PINK,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
});
