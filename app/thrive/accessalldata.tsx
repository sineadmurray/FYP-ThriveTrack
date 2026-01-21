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

// Types from the backend
type MoodEntry = {
  id: string;
  mood: string;
  notes: string | null;
  created_at: string;
};

type EodReflection = {
  id: string;
  went_well: string | null;
  learned: string | null;
  proud_of: string | null;
  self_care: string | null;
  created_at: string;
};
type TrapTrack = {
  id: string;
  circumstance: string | null;
  trigger: string | null;
  response: string | null;
  avoidance: string | null;
  consequence: string | null;
  copingstrategy: string | null;
  tryalternative: string | null;
  consequenceafter: string | null;
  created_at: string;
};
type GratitudeEntry = {
  id: string;
  text: string;
  created_at: string;
};
type OutsideInEntry = {
  id: string;
  prompt_id: number;
  action_text: string;
  created_at: string;
};

// Combined type for the list
type ListItem =
  | (MoodEntry & { kind: "mood" })
  | (EodReflection & { kind: "eod" })
  | (TrapTrack & { kind: "trap" })
  | (GratitudeEntry & { kind: "gratitude" })
  | (OutsideInEntry & { kind: "outside_in" });

export default function AccessAllDataScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch mood entries
        const moodRes = await fetch(`${API_BASE}/mood_entries`);
        if (!moodRes.ok) throw new Error(`mood HTTP ${moodRes.status}`);
        const moodData: MoodEntry[] = await moodRes.json();

        // Fetch end-of-day reflections
        const eodRes = await fetch(`${API_BASE}/end-of-day-reflections`);
        if (!eodRes.ok) throw new Error(`eod HTTP ${eodRes.status}`);
        const eodData: EodReflection[] = await eodRes.json();

        // Fetch trap & tracks
        const trapRes = await fetch(`${API_BASE}/trap_and_track`);
        if (!trapRes.ok) throw new Error(`trap HTTP ${trapRes.status}`);
        const trapData: TrapTrack[] = await trapRes.json();

        // Fetch gratitude entries
        const gratRes = await fetch(`${API_BASE}/gratitude_entries`);
        if (!gratRes.ok) throw new Error(`gratitude HTTP ${gratRes.status}`);
        const gratData: GratitudeEntry[] = await gratRes.json();

        // Fetch outside-in actions
        const outsideRes = await fetch(`${API_BASE}/outside_in_actions`);
        if (!outsideRes.ok) throw new Error(`outside-in HTTP ${outsideRes.status}`);
        const outsideData: OutsideInEntry[] = await outsideRes.json();

        // Tag each with kind
        const moodItems: ListItem[] = moodData.map((m) => ({
          ...m,
          kind: "mood",
        }));
        const eodItems: ListItem[] = eodData.map((e) => ({
          ...e,
          kind: "eod",
        }));
        const trapItems: ListItem[] = trapData.map((t) => ({
          ...t,
          kind: "trap",
        }));
         const gratItems: ListItem[] = gratData.map((g) => ({
          ...g,
          kind: "gratitude",
        }));
        const outsideItems: ListItem[] = outsideData.map((o) => ({
          ...o,
          kind: "outside_in",
        }));

        // Merge + sort newest first
        const merged = [...moodItems, ...eodItems, ...trapItems, ...gratItems, ...outsideItems].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        setItems(merged);
      } catch (e: any) {
        console.log("Load error", e);
        setError("Could not load entries.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

        {/* Back + title */}
        <View style={styles.pageHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>Access All Data</Text>
            <Text style={styles.subtitle}>
              View, edit or delete all your past reflections, moods and plans.
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Pills (visual only for now) */}
        <View style={styles.filtersRow}>
          <View style={[styles.filterPill, styles.filterPillActive]}>
            <Text style={[styles.filterText, styles.filterTextActive]}>All</Text>
          </View>
          <View style={styles.filterPill}>
            <Text style={styles.filterText}>Reflect</Text>
          </View>
          <View style={styles.filterPill}>
            <Text style={styles.filterText}>Grow</Text>
          </View>
        </View>

        {/* States */}
        {loading && (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: "#666" }}>
              Loading entries...
            </Text>
          </View>
        )}

        {!loading && error && (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
          </View>
        )}

        {!loading && !error && items.length === 0 && (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "#666", textAlign: "center" }}>
              No entries yet. Once you add some reflections or mood entries,
              they will appear here.
            </Text>
          </View>
        )}

        {/* List */}
        {!loading &&
          !error &&
          items.map((item) => {
            const { niceDate, niceTime } = formatDate(item.created_at);

            const title =
              item.kind === "mood"
                ? "Mood Entry"
                : item.kind === "eod"
                ? "End of Day Reflection"
                : item.kind === "trap"
                ? "Trap & Track"
                : item.kind === "gratitude"
                ? "Daily Gratitude"
                : "Outside-In Thinking";

            const emoji =
              item.kind === "mood"
                ? "😊"
                : item.kind === "eod"
                ? "📘"
                : item.kind === "trap"
                ? "🔍"
                : item.kind === "gratitude"
                ? "🙏"
                : "💭";

            return (
              <EntryRow
                key={`${item.kind}-${item.id}`}
                emoji={emoji}
                title={title}
                date={niceDate}
                time={niceTime}
                onPress={() => {
                  if (item.kind === "mood") {
                    const m = item as MoodEntry & { kind: "mood" };
                    router.push({
                      pathname: "/thrive/moodentrydata",
                      params: {
                        id: m.id,
                        mood: m.mood,
                        notes: m.notes ?? "",
                        created_at: m.created_at,
                      },
                    });
                  } else if (item.kind === "eod") {
                    const e = item as EodReflection & { kind: "eod" };
                    router.push({
                      pathname: "/thrive/dailyreflectiondata",
                      params: {
                        id: e.id,
                        created_at: e.created_at,
                        went_well: e.went_well ?? "",
                        learned: e.learned ?? "",
                        proud_of: e.proud_of ?? "",
                        self_care: e.self_care ?? "",
                      },
                    });
                  } else if (item.kind === "trap") {
                    const t = item as TrapTrack & { kind: "trap" };
                    router.push({
                      pathname: "/thrive/trapandtrackdata",
                      params: {
                        id: t.id,
                        created_at: t.created_at,
                        circumstance: t.circumstance ?? "",
                        trigger: t.trigger ?? "",
                        response: t.response ?? "",
                        avoidance: t.avoidance ?? "",
                        consequence: t.consequence ?? "",
                        copingstrategy: t.copingstrategy ?? "",
                        tryalternative: t.tryalternative ?? "",
                        consequenceafter: t.consequenceafter ?? "",
                      },
                    });
                  } else if (item.kind === "gratitude") {
                    const g = item as GratitudeEntry & { kind: "gratitude" };
                    router.push({
                      pathname: "/thrive/gratitudedata",
                      params: {
                        id: g.id,
                        text: g.text ?? "",
                        created_at: g.created_at,
                      },
                    });
                  } else if (item.kind === "outside_in") {
                    const o = item as OutsideInEntry & { kind: "outside_in" };
                    router.push({
                      pathname: "/thrive/outsidethinkingdata",
                      params: {
                        id: o.id,
                        prompt_id: o.prompt_id,
                        action_text: o.action_text,
                        created_at: o.created_at,
                      },
                    });
                  }
                }}
              />
            );
          })}
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );

}

function EntryRow({
  emoji,
  title,
  date,
  time,
  onPress,
}: {
  emoji: string;
  title: string;
  date: string;
  time: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.rowCard, { opacity: pressed ? 0.96 : 1 }]}
    >
      {/* Emoji/icon */}
      <View style={styles.rowEmojiBadge}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>

      {/* Text info */}
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>
          {date} — {time}
        </Text>
      </View>

      {/* Chevron */}
      <View style={styles.chev}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>›</Text>
      </View>
    </Pressable>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);

  const niceDate = d.toLocaleDateString("en-IE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const niceTime = d.toLocaleTimeString("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { niceDate, niceTime };
}

/* Pink / Thrive theme */
const BG = "#fff5f9";
const CARD_BG = "#ffffff";
const PINK = "#f06292";
const CHEV_BG = "#ffe0ec";
const SHADOW = "#000";
const TEXT = "#222";

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
    marginBottom: 10,
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

  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  backBtn: {
    paddingRight: 10,
    paddingTop: 6,
  },
  backArrow: {
    fontSize: 26,
    color: TEXT,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: PINK,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#616161",
    fontSize: 14,
    marginTop: 4,
  },

  filtersRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fbe0ef",
  },
  filterPillActive: {
    backgroundColor: PINK,
  },
  filterText: {
    fontSize: 14,
    color: "#8f8f8f",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
  },

  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 6,
    shadowColor: SHADOW,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowEmojiBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff5d9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PINK,
  },
  rowMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  chev: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CHEV_BG,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
