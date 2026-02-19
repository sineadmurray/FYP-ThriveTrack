import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Importing the Expo Router to navigate between screens
import React, { useEffect, useState } from "react"; // Importing React and useState to manage component state
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"; // Importing React Native components used in the UI
import { API_BASE } from "../lib/api";
import SideDrawer from "./components/SideDrawer"; // Importing the custom side drawer menu component

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false); // State to track whether the side drawer is open or closed
  const router = useRouter();  // Router used for navigation between screens

type Quote = { quote_text: string; author: string };

type MoodEntry = {
  id: string;
  user_id: string;
  mood: string;
  mood_value: number;
  notes: string | null;
  created_at: string;
};

type DailyPlan = {
  id: string;
  user_id: string;
  created_at: string;
};

const [quote, setQuote] = useState<Quote | null>(null);
const [loadingQuote, setLoadingQuote] = useState(true);

const userId = "demo-student-1";

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
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
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

useEffect(() => {
  const loadStatus = async () => {
    try {
      setLoadingStatus(true);

      // mood latest
      const moodRes = await fetch(`${API_BASE}/mood_entries?user_id=${encodeURIComponent(userId)}`);
      const moodRows: MoodEntry[] = moodRes.ok ? await moodRes.json() : [];
      const moodLatest = moodRows.length ? moodRows[0] : null;
      setLatestMood(moodLatest);
      setMoodLoggedToday(moodLatest ? isToday(moodLatest.created_at) : false);

      // plan latest
      const planRes = await fetch(`${API_BASE}/daily_plans?user_id=${encodeURIComponent(userId)}`);
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
}, []);

  return (
    <View style={styles.root}>
      {/* MAIN PAGE CONTENT */}
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../assets/images/ThriveTrack Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.appTitle}>Reflect, Grow & Thrive</Text>

          {/* Hamburger */}
          <Pressable style={styles.menu} onPress={() => setDrawerOpen(true)}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 18 }]} />
            <View style={[styles.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* Big headline */}
        <View style={{ marginTop: 12, marginBottom: 8 }}>
          <Text style={styles.headline}>
            You Got This! <Text style={{ fontSize: 36 }}>🤍</Text>
          </Text>
        </View>
        
        {/* Intro quote */}
        <Text style={styles.intro}>
          Each day is a new chance to check in, reset and grow – one thought, one
          step, one win at a time.
        </Text>

        {/* Three main buttons */}
        <View style={styles.actionsRow}>
          <ActionCard
            label="Reflect"
            emoji="🪞"
            bg="#d8d3ff"
            onPress={() => router.push("/reflect")} 
          />
          <ActionCard 
          label="Grow" 
            emoji="🌱" 
            bg="#cdeed6" 
            onPress={() => router.push("/grow")} 
            />
          <ActionCard 
          label="Thrive" 
          emoji="🌸" 
          bg="#edc1cf" 
          onPress={() => router.push("/thrive")}
          />
        </View>

        {/* Overview + Quick actions */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Today’s Overview</Text>

          {loadingStatus ? (
            <ActivityIndicator style={{ marginTop: 10 }} />
          ) : (
            <>
              <View style={styles.pillsRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Mood Today</Text>
                  <View style={styles.pillValueRow}>
                    <Ionicons
                      name={moodLoggedToday ? "checkmark-circle" : "time-outline"}
                      size={18}
                      color={moodLoggedToday ? "#19b46b" : "#9b9b9b"}
                    />
                    <Text style={[styles.pillValue, { color: moodLoggedToday ? "#19b46b" : "#9b9b9b" }]}>
                      {moodLoggedToday ? "Logged" : "To do"}
                    </Text>
                  </View>
                </View>

                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Daily Plan</Text>
                  <View style={styles.pillValueRow}>
                    <Ionicons
                      name={plannerDoneToday ? "checkmark-circle" : "time-outline"}
                      size={18}
                      color={plannerDoneToday ? "#19b46b" : "#9b9b9b"}
                    />
                    <Text style={[styles.pillValue, { color: plannerDoneToday ? "#19b46b" : "#9b9b9b" }]}>
                      {plannerDoneToday ? "Done" : "To do"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.latestMoodBox}>
                <Text style={styles.latestMoodLabel}>Latest mood</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {latestMood && (
                    <Text style={{ fontSize: 20 }}>{moodEmoji}</Text>
                  )}
                  <Text style={styles.latestMoodText}>
                    {latestMood
                      ? `${latestMood.mood}${latestMood.notes ? ` — ${latestMood.notes}` : ""}`
                      : "No mood logged yet"}
                  </Text>
                </View>

              </View>

              <View style={styles.quickRow}>
                <QuickButton
                  label="Log Mood"
                  icon="heart-outline"
                  bg="#d8d3ff"
                  onPress={() => router.push("/reflect/mood")}
                />
                <QuickButton
                  label="Plan Day"
                  icon="calendar-outline"
                  bg="#cdeed6"
                  onPress={() => router.push("/grow/dailyplanner")}
                />
                <QuickButton
                  label="Insights"
                  icon="trending-up-outline"
                  bg="#edc1cf"
                  onPress={() => router.push("/thrive/moodinsights")}
                />
              </View>
            </>
          )}
        </View>


        {/* Daily Motivation Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Motivation</Text>

          {loadingQuote ? (
            <Text style={styles.cardBody}>Loading…</Text>
          ) : quote ? (
            <>
              <Text style={styles.cardBody}>
                {quote.quote_text}
              </Text>
            </>
          ) : (
            <Text style={styles.cardBody}>—</Text>
          )}
        </View>

      </ScrollView>

      {/* Drawer LAST = renders on top */}
      <SideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        { backgroundColor: bg, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.actionIcon}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickBtn,
        { backgroundColor: bg, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Ionicons name={icon} size={18} color="#222222" />
      <Text style={styles.quickBtnText}>{label}</Text>
    </Pressable>
  );
}

/* Colors */
const PINK = "#fdeff2";
const TEXT = "#222222";
const SUBTLE = "#6c6c6c";
const ACCENT = "#ff2d95";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PINK,
    paddingTop: Platform.OS === "android" ? 35 : 55,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Header */
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

  /* Intro */
  intro: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: SUBTLE,
    fontStyle: "italic",
  },

  /* Headline */
  headline: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "800",
    color: ACCENT,
    textAlign: "center"
  },

  /* Buttons */
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
    backgroundColor: "rgba(255,255,255,0.65)",
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
    color: "#444",
  },

  /* Card */
  card: {
    backgroundColor: "white",
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
    color: "#9a86ea",
    textAlign: "center",
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 18,
    lineHeight: 26,
    color: SUBTLE,
    textAlign: "center",
    fontStyle: "italic",
  },
  overviewCard: {
    backgroundColor: "#ffffff",
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
    color: "#2b2f36",
  },
  pillsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  pill: {
    flex: 1,
    backgroundColor: "#f7f7f9",
    borderRadius: 18,
    padding: 12,
  },
  pillLabel: {
    color: "#8b8f9a",
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
  latestMoodBox: {
    marginTop: 12,
    backgroundColor: "#fdeff2",
    borderRadius: 18,
    padding: 14,
  },
  latestMoodLabel: {
    color: "#8b8f9a",
    fontWeight: "800",
    marginBottom: 6,
  },
  latestMoodText: {
    color: "#2b2f36",
    fontWeight: "800",
    fontSize: 16,
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
    color: "#222222",
    fontWeight: "800",
  },
});
