import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { authedFetch } from "../../lib/authedFetch";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";

type Params = {
  id?: string;
  created_at?: string;

  main_goal?: string;
  priority_1?: string;
  priority_2?: string;
  priority_3?: string;

  other_todos?: string;
  self_care_actions?: string;
  productivity_reward?: string;
  notes?: string;
};

export default function DailyPlannerEntryDataScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useLocalSearchParams<Params>();

  const { niceDate, niceTime } = useMemo(
    () => formatDate(params.created_at),
    [params.created_at]
  );

  // Local state from params
  const [mainGoal, setMainGoal] = useState(params.main_goal ?? "");
  const [p1, setP1] = useState(params.priority_1 ?? "");
  const [p2, setP2] = useState(params.priority_2 ?? "");
  const [p3, setP3] = useState(params.priority_3 ?? "");
  const [otherTodos, setOtherTodos] = useState(params.other_todos ?? "");
  const [selfCare, setSelfCare] = useState(params.self_care_actions ?? "");
  const [reward, setReward] = useState(params.productivity_reward ?? "");
  const [notes, setNotes] = useState(params.notes ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!params.id) return;

    try {
      setSaving(true);

      const res = await authedFetch(`/daily_plans/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          main_goal: mainGoal,
          priority_1: p1,
          priority_2: p2,
          priority_3: p3,
          other_todos: otherTodos,
          self_care_actions: selfCare,
          productivity_reward: reward,
          notes: notes,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved ✅", "Your daily plan has been updated.");
      setIsEditing(false);
    } catch (e) {
      console.log("Daily plan update error", e);
      Alert.alert("Oops", "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!params.id) return;

    Alert.alert(
      "Delete entry?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDelete(params.id!) },
      ],
      { cancelable: true }
    );
  }

  async function handleDelete(id: string) {
    try {
      const res = await authedFetch(`/daily_plans/${id}`, { method: "DELETE" });

      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Deleted", "Your daily plan has been deleted.");
      router.replace("/thrive/accessalldata");
    } catch (e) {
      console.log("Daily plan delete error", e);
      Alert.alert("Oops", "Could not delete entry. Please try again.");
    }
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
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
        <View style={s.titleRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>Daily Planner</Text>
            <Text style={s.subtitle}>
              {niceDate} {niceTime ? `— ${niceTime}` : ""}
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Cards */}
        <PlannerCardData
          title="Main Goal Of The Day"
          placeholder="Write your main focus for today..."
          value={mainGoal}
          onChangeText={setMainGoal}
          isEditing={isEditing}
          minHeight={140}
        />

        <PrioritiesData
          title="Top 3 Priorities"
          isEditing={isEditing}
          values={[p1, p2, p3]}
          onChangeTexts={[setP1, setP2, setP3]}
        />

        <PlannerCardData
          title="Other To-Dos"
          placeholder="Tasks to keep in mind..."
          value={otherTodos}
          onChangeText={setOtherTodos}
          isEditing={isEditing}
          minHeight={140}
        />

        <PlannerCardData
          title="Self-Care Actions"
          placeholder="How will you take care of yourself today?"
          value={selfCare}
          onChangeText={setSelfCare}
          isEditing={isEditing}
          minHeight={140}
        />

        <PlannerCardData
          title="Productivity Reward"
          placeholder="Treat yourself for your effort today..."
          value={reward}
          onChangeText={setReward}
          isEditing={isEditing}
          minHeight={140}
        />

        <PlannerCardData
          title="Notes / Appointments / Lectures"
          placeholder="Times, reminders, or anything you need to remember..."
          value={notes}
          onChangeText={setNotes}
          isEditing={isEditing}
          minHeight={160}
        />

        {/* Buttons */}
        <View style={{ marginTop: 24 }}>
          <Pressable
            style={s.primaryButton}
            onPress={() => {
              if (isEditing) {
                if (!saving) handleSave();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Text style={s.primaryButtonText}>
              {isEditing ? (saving ? "Saving..." : "Save Changes") : "Edit Entry"}
            </Text>
          </Pressable>

          <Pressable style={s.secondaryButton} onPress={confirmDelete}>
            <Text style={s.secondaryButtonText}>Delete Entry</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function PlannerCardData({
  title,
  placeholder,
  value,
  onChangeText,
  isEditing,
  minHeight = 130,
}: {
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  isEditing: boolean;
  minHeight?: number;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <View style={[s.inputShell, { minHeight }]}>
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.grow.placeholder}
            multiline
            style={s.input}
          />
        ) : (
          <Text style={s.readText}>
            {value.trim().length > 0 ? value : "No answer added for this section."}
          </Text>
        )}
      </View>
    </View>
  );
}

function PrioritiesData({
  title,
  isEditing,
  values,
  onChangeTexts,
}: {
  title: string;
  isEditing: boolean;
  values: [string, string, string];
  onChangeTexts: [(t: string) => void, (t: string) => void, (t: string) => void];
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  if (isEditing) {
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>{title}</Text>

        <View style={s.smallInputShell}>
          <TextInput
            value={values[0]}
            onChangeText={onChangeTexts[0]}
            placeholder="Priority #1..."
            placeholderTextColor={theme.grow.placeholder}
            style={s.input}
          />
        </View>

        <View style={[s.smallInputShell, { marginTop: 12 }]}>
          <TextInput
            value={values[1]}
            onChangeText={onChangeTexts[1]}
            placeholder="Priority #2..."
            placeholderTextColor={theme.grow.placeholder}
            style={s.input}
          />
        </View>

        <View style={[s.smallInputShell, { marginTop: 12 }]}>
          <TextInput
            value={values[2]}
            onChangeText={onChangeTexts[2]}
            placeholder="Priority #3..."
            placeholderTextColor={theme.grow.placeholder}
            style={s.input}
          />
        </View>
      </View>
    );
  }

  // View mode
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <View style={s.inputShell}>
        <Text style={s.readText}>
          {values.some((v) => v.trim().length > 0)
            ? `1) ${values[0] || "—"}\n2) ${values[1] || "—"}\n3) ${values[2] || "—"}`
            : "No priorities added."}
        </Text>
      </View>
    </View>
  );
}

function formatDate(raw?: string) {
  if (!raw) return { niceDate: "", niceTime: "" };
  const d = new Date(raw);
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

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === "android" ? 35 : 55,
    },
    container: {
      paddingHorizontal: 18,
      paddingBottom: 36,
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
      fontSize: 19,
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
      opacity: 0.75,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 6,
      marginBottom: 10,
    },
    backBtn: {
      paddingRight: 10,
      paddingTop: 2,
      width: 28,
    },
    backArrow: {
      fontSize: 28,
      color: theme.subtleText,
    },
    title: {
      fontSize: 30,
      lineHeight: 34,
      fontWeight: "900",
      color: theme.grow.title,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 13,
      color: theme.subtleText,
      textAlign: "center",
      marginTop: 6,
    },

    card: {
      backgroundColor: theme.card,
      borderRadius: 26,
      padding: 16,
      marginTop: 14,
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: theme.grow.title,
      marginBottom: 10,
    },

    inputShell: {
      backgroundColor: theme.grow.inputBg,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.grow.inputBorder,
      justifyContent: "flex-start",
    },
    smallInputShell: {
      backgroundColor: theme.grow.inputBg,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.grow.inputBorder,
    },

    input: {
      fontSize: 14,
      color: theme.grow.inputText,
      textAlignVertical: "top",
    },
    readText: {
      fontSize: 14,
      color: theme.grow.inputText,
      lineHeight: 20,
    },

    primaryButton: {
      backgroundColor: theme.grow.button,
      borderRadius: 24,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 14,
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "900",
    },

    secondaryButton: {
      backgroundColor: theme.grow.tint,
      borderRadius: 24,
      paddingVertical: 14,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "900",
    },
  });