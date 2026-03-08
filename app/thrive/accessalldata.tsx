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

type WhereIAmEntry = {
  id: string;
  mind_now: string | null;
  mind_want: string | null;
  body_now: string | null;
  body_want: string | null;
  career_now: string | null;
  career_want: string | null;
  relationships_now: string | null;
  relationships_want: string | null;
  created_at: string;
};

type DailyPlanEntry = {
  id: string;
  main_goal: string | null;
  priority_1: string | null;
  priority_2: string | null;
  priority_3: string | null;
  other_todos: string | null;
  self_care_actions: string | null;
  productivity_reward: string | null;
  notes: string | null;
  created_at: string;
};

type LongTermVisionEntry = {
  id: string;
  vision: string | null;
  clear_direction: string | null;
  created_at: string;
};

type WeeklyReflectionEntry = {
  id: string;
  mind: string | null;
  body: string | null;
  career: string | null;
  relationships: string | null;
  held_me_back: string | null;
  lesson_learned: string | null;
  next_weeks_focus: string | null;
  created_at: string;
};

// Combined type for the list
type ListItem =
  | (MoodEntry & { kind: "mood" })
  | (EodReflection & { kind: "eod" })
  | (TrapTrack & { kind: "trap" })
  | (GratitudeEntry & { kind: "gratitude" })
  | (OutsideInEntry & { kind: "outside_in" })
  | (WhereIAmEntry & { kind: "whereiam" })
  | (DailyPlanEntry & { kind: "daily_plan" })
  | (LongTermVisionEntry & { kind: "longtermvision" })
  | (WeeklyReflectionEntry & { kind: "weekly_reflection" });

type Filter = "all" | "reflect" | "grow";

const REFLECT_KINDS: ListItem["kind"][] = [
  "mood",
  "eod",
  "trap",
  "gratitude",
  "outside_in",
];

const GROW_KINDS: ListItem["kind"][] = [
  "daily_plan",
  "whereiam",
  "weekly_reflection",
  "longtermvision",
];

export default function AccessAllDataScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch mood entries
        const moodRes = await authedFetch("/mood_entries");
        if (!moodRes.ok) throw new Error(`mood HTTP ${moodRes.status}`);
        const moodData: MoodEntry[] = await moodRes.json();

        // Fetch end-of-day reflections
        const eodRes = await authedFetch("/end_of_day_reflections");
        if (!eodRes.ok) throw new Error(`eod HTTP ${eodRes.status}`);
        const eodData: EodReflection[] = await eodRes.json();

        // Fetch trap & tracks
        const trapRes = await authedFetch("/trap_and_track");
        if (!trapRes.ok) throw new Error(`trap HTTP ${trapRes.status}`);
        const trapData: TrapTrack[] = await trapRes.json();

        // Fetch gratitude entries
        const gratRes = await authedFetch("/gratitude_entries");
        if (!gratRes.ok) throw new Error(`gratitude HTTP ${gratRes.status}`);
        const gratData: GratitudeEntry[] = await gratRes.json();

        // Fetch outside-in actions
        const outsideRes = await authedFetch("/outside_in_actions");
        if (!outsideRes.ok)
          throw new Error(`outside-in HTTP ${outsideRes.status}`);
        const outsideData: OutsideInEntry[] = await outsideRes.json();

        // Fetch where-i-am reflections
        const whereRes = await authedFetch("/where_i_am_reflections");
        if (!whereRes.ok) throw new Error(`whereiam HTTP ${whereRes.status}`);
        const whereData: WhereIAmEntry[] = await whereRes.json();

        // Fetch daily plans
        const planRes = await authedFetch("/daily_plans");
        if (!planRes.ok) throw new Error(`daily_plans HTTP ${planRes.status}`);
        const planData: DailyPlanEntry[] = await planRes.json();

        // Fetch long term visions
        const ltvRes = await authedFetch("/long_term_visions");
        if (!ltvRes.ok)
          throw new Error(`long_term_visions HTTP ${ltvRes.status}`);
        const ltvData: LongTermVisionEntry[] = await ltvRes.json();

        // Fetch weekly reflections
        const weeklyRes = await authedFetch("/weekly_reflections");
        if (!weeklyRes.ok)
          throw new Error(`weekly_reflections HTTP ${weeklyRes.status}`);
        const weeklyData: WeeklyReflectionEntry[] = await weeklyRes.json();

        // Tag each with kind
        const moodItems: ListItem[] = moodData.map((m) => ({ ...m, kind: "mood" }));
        const eodItems: ListItem[] = eodData.map((e) => ({ ...e, kind: "eod" }));
        const trapItems: ListItem[] = trapData.map((t) => ({ ...t, kind: "trap" }));
        const gratItems: ListItem[] = gratData.map((g) => ({ ...g, kind: "gratitude" }));
        const outsideItems: ListItem[] = outsideData.map((o) => ({ ...o, kind: "outside_in" }));
        const whereItems: ListItem[] = whereData.map((w) => ({ ...w, kind: "whereiam" }));
        const planItems: ListItem[] = planData.map((p) => ({ ...p, kind: "daily_plan" }));
        const ltvItems: ListItem[] = ltvData.map((v) => ({ ...v, kind: "longtermvision" }));
        const weeklyItems: ListItem[] = weeklyData.map((w) => ({ ...w, kind: "weekly_reflection" }));

        // Merge + sort newest first
        const merged = [
          ...moodItems,
          ...eodItems,
          ...trapItems,
          ...gratItems,
          ...outsideItems,
          ...whereItems,
          ...planItems,
          ...ltvItems,
          ...weeklyItems,
        ].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "reflect") return REFLECT_KINDS.includes(item.kind);
    if (filter === "grow") return GROW_KINDS.includes(item.kind);
    return true;
  });

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Image
            source={require("../../assets/images/ThriveTrackLogo.png")}
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

        {/* Back + title */}
        <View style={s.pageHeader}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>Access All Data</Text>
            <Text style={s.subtitle}>
              View, edit or delete all your past reflections, moods and plans.
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Pills */}
        <View style={s.filtersRow}>
          <Pressable
            onPress={() => setFilter("all")}
            style={[
              s.filterPill,
              filter === "all" && s.filterPillActive,
            ]}
          >
            <Text
              style={[
                s.filterText,
                filter === "all" && s.filterTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("reflect")}
            style={[
              s.filterPill,
              filter === "reflect" && s.filterPillActive,
            ]}
          >
            <Text
              style={[
                s.filterText,
                filter === "reflect" && s.filterTextActive,
              ]}
            >
              Reflect
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("grow")}
            style={[
              s.filterPill,
              filter === "grow" && s.filterPillActive,
            ]}
          >
            <Text
              style={[
                s.filterText,
                filter === "grow" && s.filterTextActive,
              ]}
            >
              Grow
            </Text>
          </Pressable>
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

        {!loading && !error && filteredItems.length === 0 && (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "#666", textAlign: "center" }}>
              No entries for this filter yet.
            </Text>
          </View>
        )}

        {/* List */}
        {!loading &&
          !error &&
          filteredItems.map((item) => {
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
                : item.kind === "outside_in"
                ? "Outside-In Thinking"
                : item.kind === "whereiam"
                ? "Where I Am"
                : item.kind === "daily_plan"
                ? "Daily Planner"
                : item.kind === "longtermvision"
                ? "Long-Term Vision"
                : item.kind === "weekly_reflection"
                ? "Weekly Reflection"
                : "Entry";

            const emoji =
              item.kind === "mood"
                ? "😊"
                : item.kind === "eod"
                ? "📘"
                : item.kind === "trap"
                ? "🔍"
                : item.kind === "gratitude"
                ? "🙏"
                : item.kind === "outside_in"
                ? "💭"
                : item.kind === "whereiam"
                ? "🧭"
                : item.kind === "daily_plan"
                ? "🗓️"
                : item.kind === "longtermvision"
                ? "🌿"
                : item.kind === "weekly_reflection"
                ? "📅"
                : "📄";

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
                  } else if (item.kind === "whereiam") {
                    const w = item as WhereIAmEntry & { kind: "whereiam" };
                    router.push({
                      pathname: "/thrive/whereiamdata",
                      params: {
                        id: w.id,
                        created_at: w.created_at,
                        mind_now: w.mind_now ?? "",
                        mind_want: w.mind_want ?? "",
                        body_now: w.body_now ?? "",
                        body_want: w.body_want ?? "",
                        career_now: w.career_now ?? "",
                        career_want: w.career_want ?? "",
                        relationships_now: w.relationships_now ?? "",
                        relationships_want: w.relationships_want ?? "",
                      },
                    });
                  } else if (item.kind === "daily_plan") {
                    const p = item as DailyPlanEntry & { kind: "daily_plan" };
                    router.push({
                      pathname: "/thrive/dailyplannerdata",
                      params: {
                        id: p.id,
                        created_at: p.created_at,
                        main_goal: p.main_goal ?? "",
                        priority_1: p.priority_1 ?? "",
                        priority_2: p.priority_2 ?? "",
                        priority_3: p.priority_3 ?? "",
                        other_todos: p.other_todos ?? "",
                        self_care_actions: p.self_care_actions ?? "",
                        productivity_reward: p.productivity_reward ?? "",
                        notes: p.notes ?? "",
                      },
                    });
                  } else if (item.kind === "longtermvision") {
                    const v = item as LongTermVisionEntry & { kind: "longtermvision" };
                    router.push({
                      pathname: "/thrive/longtermvisiondata",
                      params: {
                        id: v.id,
                        created_at: v.created_at,
                        vision: v.vision ?? "",
                        clear_direction: v.clear_direction ?? "",
                      },
                    });
                  } else if (item.kind === "weekly_reflection") {
                    const w = item as WeeklyReflectionEntry & { kind: "weekly_reflection" };
                    router.push({
                      pathname: "/thrive/weeklyreflectiondata",
                      params: {
                        id: w.id,
                        created_at: w.created_at,
                        mind: w.mind ?? "",
                        body: w.body ?? "",
                        career: w.career ?? "",
                        relationships: w.relationships ?? "",
                        held_me_back: w.held_me_back ?? "",
                        lesson_learned: w.lesson_learned ?? "",
                        next_weeks_focus: w.next_weeks_focus ?? "",
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
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.rowCard, { opacity: pressed ? 0.96 : 1 }]}
    >
      <View style={s.rowEmojiBadge}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>

      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowMeta}>
          {date} — {time}
        </Text>
      </View>

      <View style={s.chev}>
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

// ✅ AccessAllDataScreen styles (theme-based)
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
      color: theme.text,
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.thrive.title,
      textAlign: "center",
    },
    subtitle: {
      textAlign: "center",
      color: theme.subtleText,
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
      backgroundColor: theme.thrive.pillBg,
      borderWidth: 1,
      borderColor: theme.thrive.pillBorder,
    },
    filterPillActive: {
      backgroundColor: theme.thrive.title,
      borderColor: theme.thrive.title,
    },
    filterText: {
      fontSize: 14,
      color: theme.thrive.pillText, 
      fontWeight: "600",
    },
    filterTextActive: {
      color: "#fff",
    },

    rowCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginVertical: 6,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    rowEmojiBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.thrive.iconCircleBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.thrive.title,
    },
    rowMeta: {
      fontSize: 13,
      color: theme.subtleText,
      marginTop: 2,
    },
    chev: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.thrive.chevBg,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
  });