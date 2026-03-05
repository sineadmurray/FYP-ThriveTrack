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
import { authedFetch } from "../../lib/authedFetch";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";

type WeeklySummaryCounts = {
  moodCount: number;
  reflectCount: number;
  growCount: number;
};

export default function WeeklySummaryScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
 

  const [data, setData] = useState<WeeklySummaryCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  //** code sourced from Chatgpt conversation **//
  //...//
  type WeeklyAISummary = {
    overallMoodTrend: string;
    whatFeltPositive: string;
    whatFeltChallenging: string;
    gentleSuggestion: string;
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

    const res = await authedFetch("/weekly_summary");

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

    const res = await authedFetch("/weekly_summary_ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Request failed (${res.status})`);
    }

    const json = await res.json();
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
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Image
            source={require("../../assets/images/ThriveTrack Logo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.appTitle}>Reflect, Grow &amp; Thrive</Text>

          <Pressable style={s.menu} onPress={() => setDrawerOpen(true)}>
            <View style={s.menuLine} />
            <View style={[s.menuLine, { width: 18 }]} />
            <View style={[s.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

        {/* Title */}
        <View style={{ alignItems: "center", marginTop: 4 }}>
          <Text style={s.iconTop}>✨</Text>
          <Text style={s.title}>Weekly Summary</Text>
          <Text style={s.subtitle}>
            Here's a gentle reflection on your past 7 days
          </Text>
        </View>

        {/* Loading / Error / Empty */}
        {loading && (
          <View style={s.stateBox}>
            <ActivityIndicator />
            <Text style={s.stateText}>Loading your week…</Text>
          </View>
        )}

        {!loading && errorMsg && (
          <View style={s.stateBox}>
            <Text style={[s.stateText, { marginBottom: 10 }]}>{errorMsg}</Text>
            <Pressable onPress={fetchWeeklyCounts} style={s.retryBtn}>
              <Text style={s.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {!loading && isEmpty && (
          <View style={s.stateBox}>
            <Text style={s.stateTitle}>No entries yet this week</Text>
            <Text style={s.stateText}>
              Start logging moods or reflections to see your weekly summary.
            </Text>
            <Pressable
              onPress={() => router.push("/reflect")}
              style={s.retryBtn}
            >
              <Text style={s.retryBtnText}>Log Something</Text>
            </Pressable>
          </View>
        )}

        {/* Stat cards */}
        {!loading && !errorMsg && !isEmpty && (
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statIcon}>🙂</Text>
              <Text style={s.statValue}>{moodLogs}</Text>
              <Text style={s.statLabel}>Mood{"\n"}Logs</Text>
            </View>

            <View style={s.statCard}>
              <Text style={s.statIcon}>🪞</Text>
              <Text style={s.statValue}>{reflectEntries}</Text>
              <Text style={s.statLabel}>Reflect{"\n"}Entries</Text>
            </View>

            <View style={s.statCard}>
              <Text style={s.statIcon}>🌱</Text>
              <Text style={s.statValue}>{growEntries}</Text>
              <Text style={s.statLabel}>Grow{"\n"}Entries</Text>
            </View>
          </View>
        )}

        {/* code sourced from chatgpt conversation */}
        {/* ... */}
        {!loading && !errorMsg && !isEmpty && (
          <View style={s.bigCard}>
            <Text style={s.bigCardTitle}>Overall Mood Trend</Text>

            {aiLoading && <Text style={s.bodyText}>Generating your summary…</Text>}
            {!aiLoading && aiError && <Text style={s.bodyText}>{aiError}</Text>}
            {!aiLoading && !aiError && aiSummary && (
              <Text style={s.bodyText}>
              {aiSummary.overallMoodTrend}
            </Text>
            )}
          </View>
        )}
        {!loading && !errorMsg && !isEmpty && (
          <View style={s.bigCard}>
            <Text style={s.bigCardTitle}>What Felt Positive</Text>

            {aiLoading && <Text style={s.bodyText}>Generating your summary…</Text>}
            {!aiLoading && aiError && <Text style={s.bodyText}>{aiError}</Text>}
            {!aiLoading && !aiError && aiSummary && (
              <Text style={s.bodyText}>
              {aiSummary.whatFeltPositive}
            </Text>
            )}
          </View>
        )}
        {!loading && !errorMsg && !isEmpty && (
          <View style={s.bigCard}>
            <Text style={s.bigCardTitle}>What Felt Challenging</Text>

            {aiLoading && <Text style={s.bodyText}>Generating your summary…</Text>}
            {!aiLoading && aiError && <Text style={s.bodyText}>{aiError}</Text>}
            {!aiLoading && !aiError && aiSummary && (
              <Text style={s.bodyText}>
              {aiSummary.whatFeltChallenging}
            </Text>
            )}
          </View>
        )}
        {!loading && !errorMsg && !isEmpty && (
          <View style={s.SuggestionCard}>
            <Text style={s.SuggestionTitle}>Gentle Suggestion</Text>

            {aiLoading && (
              <Text style={s.SuggestionText}>Generating your summary…</Text>
            )}

            {!aiLoading && aiError && (
              <Text style={s.SuggestionText}>{aiError}</Text>
            )}

            {!aiLoading && !aiError && aiSummary && (
              <>
                <Text style={s.SuggestionText}>{aiSummary.gentleSuggestion}</Text>

                <Text style={[s.disclaimerText, { marginTop: 10 }]}>
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
          <View style={s.footerSection}>
            <Pressable
              style={s.regenerateButton}
              onPress={() => {
                fetchWeeklyCounts();
                fetchWeeklyAISummary();
              }}
            >
              <Text style={s.regenerateButtonText}>
                Regenerate Summary
              </Text>
            </Pressable>

            <Text style={s.disclaimerText}>
              This summary is for reflection only and not medical advice.
            </Text>
          </View>
        )}
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
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
      color: theme.text,
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
      backgroundColor: theme.text,
    },

    backBtn: {
      paddingRight: 8,
      paddingTop: 4,
    },
    backArrow: {
      fontSize: 28,
      color: theme.thrive.title,
      marginTop: -2,
    },

    iconTop: {
      fontSize: 34,
      marginBottom: 6,
    },
    title: {
      fontSize: 42,
      fontWeight: "900",
      color: theme.thrive.title,
      textAlign: "center",
    },
    subtitle: {
      marginTop: 6,
      fontSize: 18,
      color: theme.subtleText,
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
      backgroundColor: theme.card,
      borderRadius: 22,
      paddingVertical: 16,
      alignItems: "center",
      shadowColor: "#000",
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
      color: theme.thrive.title,
    },
    statLabel: {
      marginTop: 6,
      textAlign: "center",
      color: theme.subtleText,
      fontWeight: "700",
    },

    bigCard: {
      backgroundColor: theme.card,
      borderRadius: 26,
      padding: 18,
      marginTop: 14,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    bigCardTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: theme.thrive.title,
      marginBottom: 8,
    },
    bodyText: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 22,
      fontWeight: "600",
    },

    SuggestionCard: {
      backgroundColor: theme.thrive.panelBg,
      borderRadius: 22,
      padding: 18,
      marginTop: 14,
      borderWidth: 1,
      borderColor: theme.thrive.pillBorder,
    },
    SuggestionTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: theme.thrive.title,
      marginBottom: 10,
    },
    SuggestionText: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 22,
      marginBottom: 10,
      fontWeight: "600",
    },

    footerSection: {
      marginTop: 28,
      marginBottom: 30,
    },
    regenerateButton: {
      backgroundColor: theme.thrive.regenerateBtnBg, 
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
      color: theme.thrive.disclaimerText,
      textAlign: "center",
      fontWeight: "600",
      paddingHorizontal: 10,
    },

    stateBox: {
      marginTop: 18,
      backgroundColor: theme.thrive.panelBg,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.thrive.pillBorder,
      alignItems: "center",
    },
    stateTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: theme.thrive.title,
      marginBottom: 6,
      textAlign: "center",
    },
    stateText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
      textAlign: "center",
      lineHeight: 20,
    },
    retryBtn: {
      marginTop: 12,
      backgroundColor: theme.thrive.title,
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