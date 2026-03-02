import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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
import { API_BASE } from "../lib/api";
import { authedFetch } from "../lib/authedFetch";
import SideDrawer from "./components/SideDrawer";
import { useTheme } from "./theme/ThemeContext";
import type { AppTheme } from "./theme/themes";

type Quote = { quote_text: string; author: string };

type MoodEntry = {
  id: string;
  user_id?: string;
  mood: string;
  mood_value: number;
  notes: string | null;
  created_at: string;
};

type DailyPlan = {
  id: string;
  user_id?: string;
  created_at: string;
};

export default function Home() {
  const { theme } = useTheme();
  const s = styles(theme);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [moodLoggedToday, setMoodLoggedToday] = useState(false);
  const [plannerDoneToday, setPlannerDoneToday] = useState(false);
  const [latestMood, setLatestMood] = useState<MoodEntry | null>(null);

  const moodEmoji = (() => {
    const v = latestMood?.mood_value;
    if (v === 5) return "😁";
    if (v === 4) return "😊";
    if (v === 3) return "😐";
    if (v === 2) return "😔";
    if (v === 1) return "😞";
    return "🙂";
  })();

  const isToday = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  useEffect(() => {
    const loadQuote = async () => {
      try {
        setLoadingQuote(true);
        const res = await fetch(`${API_BASE}/quotes/random`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Quote = await res.json();
        setQuote(data);
      } catch (e) {
        console.error("Quote fetch failed:", e);
        setQuote(null);
      } finally {
        setLoadingQuote(false);
      }
    };

    loadQuote();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadStatus = async () => {
        try {
          setLoadingStatus(true);

          const moodRes = await authedFetch("/mood_entries");
          const moodRows: MoodEntry[] = moodRes.ok ? await moodRes.json() : [];
          const moodLatest = moodRows.length ? moodRows[0] : null;
          setLatestMood(moodLatest);
          setMoodLoggedToday(moodLatest ? isToday(moodLatest.created_at) : false);

          const planRes = await authedFetch("/daily_plans");
          const planRows: DailyPlan[] = planRes.ok ? await planRes.json() : [];
          const planLatest = planRows.length ? planRows[0] : null;
          setPlannerDoneToday(planLatest ? isToday(planLatest.created_at) : false);
        } catch (e) {
          console.error("Status fetch failed:", e);
          setLatestMood(null);
          setMoodLoggedToday(false);
          setPlannerDoneToday(false);
        } finally {
          setLoadingStatus(false);
        }
      };

      loadStatus();
    }, [])
  );

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Image
            source={require("../assets/images/ThriveTrack Logo.png")}
            style={s.logo}
            resizeMode="contain"
          />

          <Text style={s.appTitle}>Reflect, Grow & Thrive</Text>

          <Pressable style={s.menu} onPress={() => setDrawerOpen(true)}>
            <View style={s.menuLine} />
            <View style={[s.menuLine, { width: 18 }]} />
            <View style={[s.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* Big headline */}
        <View style={{ marginTop: 12, marginBottom: 8 }}>
          <Text style={s.headline}>
            You Got This! <Text style={{ fontSize: 36 }}>🤍</Text>
          </Text>
        </View>

        {/* Intro quote */}
        <Text style={s.intro}>
          Each day is a new chance to check in, reset and grow – one thought, one step, one win at a time.
        </Text>

        {/* Three main buttons */}
        <View style={s.actionsRow}>
          <ActionCard
            label="Reflect"
            emoji="🪞"
            bg={theme.reflect.tint}
            onPress={() => router.push("/reflect")}
          />
          <ActionCard
            label="Grow"
            emoji="🌱"
            bg={theme.grow.tint}
            onPress={() => router.push("/grow")}
          />
          <ActionCard
            label="Thrive"
            emoji="🌸"
            bg={theme.thrive.tint}
            onPress={() => router.push("/thrive")}
          />
        </View>

        {/* Overview + Quick actions */}
        <View style={s.overviewCard}>
          <Text style={s.overviewTitle}>Today’s Overview</Text>

          {loadingStatus ? (
            <ActivityIndicator style={{ marginTop: 10 }} />
          ) : (
            <>
              <View style={s.pillsRow}>
                <View style={s.pill}>
                  <Text style={s.pillLabel}>Mood Today</Text>
                  <View style={s.pillValueRow}>
                    <Ionicons
                      name={moodLoggedToday ? "checkmark-circle" : "time-outline"}
                      size={18}
                      color={moodLoggedToday ? theme.success : theme.muted}
                    />
                    <Text style={[s.pillValue, { color: moodLoggedToday ? theme.success : theme.muted }]}>
                      {moodLoggedToday ? "Logged" : "To do"}
                    </Text>
                  </View>
                </View>

                <View style={s.pill}>
                  <Text style={s.pillLabel}>Daily Plan</Text>
                  <View style={s.pillValueRow}>
                    <Ionicons
                      name={plannerDoneToday ? "checkmark-circle" : "time-outline"}
                      size={18}
                      color={plannerDoneToday ? theme.success : theme.muted}
                    />
                    <Text style={[s.pillValue, { color: plannerDoneToday ? theme.success : theme.muted }]}>
                      {plannerDoneToday ? "Done" : "To do"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={s.latestMoodBox}>
                <Text style={s.latestMoodLabel}>Latest mood</Text>

                <View style={s.latestMoodRow}>
                  {latestMood && <Text style={s.latestMoodEmoji}>{moodEmoji}</Text>}

                  <Text style={s.latestMoodText}>
                    {latestMood
                      ? `${latestMood.mood}${latestMood.notes ? ` — ${latestMood.notes}` : ""}`
                      : "No mood logged yet"}
                  </Text>
                </View>
              </View>

              <View style={s.quickRow}>
                <QuickButton
                  label="Log Mood"
                  icon="heart-outline"
                  bg={theme.reflect.tint}
                  onPress={() => router.push("/reflect/mood")}
                />
                <QuickButton
                  label="Plan Day"
                  icon="calendar-outline"
                  bg={theme.grow.tint}
                  onPress={() => router.push("/grow/dailyplanner")}
                />
                <QuickButton
                  label="Insights"
                  icon="trending-up-outline"
                  bg={theme.thrive.tint}
                  onPress={() => router.push("/thrive/moodinsights")}
                />
              </View>
            </>
          )}
        </View>

        {/* Daily Motivation Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Daily Motivation</Text>

          {loadingQuote ? (
            <Text style={s.cardBody}>Loading…</Text>
          ) : quote ? (
            <Text style={s.cardBody}>{quote.quote_text}</Text>
          ) : (
            <Text style={s.cardBody}>—</Text>
          )}
        </View>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

type ActionCardProps = {
  label: string;
  emoji: string;
  bg: string;
  onPress: () => void;
};

function ActionCard({ label, emoji, bg, onPress }: ActionCardProps) {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.actionCard,
        { backgroundColor: bg, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={s.actionIcon}>
        <Text style={s.actionEmoji}>{emoji}</Text>
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function QuickButton({
  label,
  icon,
  bg,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  bg: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.quickBtn,
        { backgroundColor: bg, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Ionicons name={icon} size={18} color={theme.text} />
      <Text style={s.quickBtnText}>{label}</Text>
    </Pressable>
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
      marginBottom: 16,
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

    intro: {
      marginTop: 8,
      fontSize: 16,
      lineHeight: 24,
      color: theme.subtleText,
      fontStyle: "italic",
    },

    headline: {
      fontSize: 42,
      lineHeight: 48,
      fontWeight: "800",
      color: theme.accent,
      textAlign: "center",
    },

    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 14,
      marginTop: 12,
      marginBottom: 20,
    },
    actionCard: {
      flex: 1,
      borderRadius: 22,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.65)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    actionEmoji: {
      fontSize: 22,
    },
    actionLabel: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.mode === "dark" ? theme.text : "#444",
    },

    overviewCard: {
      backgroundColor: theme.card,
      borderRadius: 26,
      padding: 18,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
      marginBottom: 18,
    },
    overviewTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
    },
    pillsRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },
    pill: {
      flex: 1,
      backgroundColor: theme.mode === "dark" ? "#1f1f28" : "#f7f7f9",
      borderRadius: 18,
      padding: 12,
    },
    pillLabel: {
      color: theme.muted,
      fontWeight: "700",
      marginBottom: 8,
    },
    pillValueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pillValue: {
      fontWeight: "800",
      fontSize: 16,
    },

    latestMoodRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    latestMoodBox: {
      marginTop: 12,
      backgroundColor: theme.mode === "dark" ? "#1b1216" : theme.background,
      borderRadius: 18,
      padding: 14,
    },
    latestMoodLabel: {
      color: theme.muted,
      fontWeight: "800",
      marginBottom: 6,
    },
    latestMoodText: {
      flex: 1,
      flexShrink: 1,
      flexWrap: "wrap",
      color: theme.text,
      fontWeight: "800",
      fontSize: 16,
      lineHeight: 22,
    },
    latestMoodEmoji: {
      fontSize: 20,
      marginTop: 2,
    },

    quickRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 14,
    },
    quickBtn: {
      flex: 1,
      borderRadius: 20,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    quickBtnText: {
      color: theme.text,
      fontWeight: "800",
    },

    card: {
      backgroundColor: theme.card,
      borderRadius: 24,
      paddingVertical: 22,
      paddingHorizontal: 18,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.mode === "dark" ? theme.accent : "#9a86ea",
      textAlign: "center",
      marginBottom: 8,
    },
    cardBody: {
      fontSize: 18,
      lineHeight: 26,
      color: theme.subtleText,
      textAlign: "center",
      fontStyle: "italic",
    },
  });