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
import { API_BASE } from "../../lib/api";
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

      const res = await fetch(`${API_BASE}/daily_plans/${params.id}`, {
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
      const res = await fetch(`${API_BASE}/daily_plans/${id}`, { method: "DELETE" });

      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Deleted", "Your daily plan has been deleted.");
      router.replace("/thrive/accessalldata");
    } catch (e) {
      console.log("Daily plan delete error", e);
      Alert.alert("Oops", "Could not delete entry. Please try again.");
    }
  }

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

        {/* Back + title */}
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>Daily Planner</Text>
            <Text style={styles.subtitle}>
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
            style={styles.primaryButton}
            onPress={() => {
              if (isEditing) {
                if (!saving) handleSave();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>
              {isEditing ? (saving ? "Saving..." : "Save Changes") : "Edit Entry"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={confirmDelete}>
            <Text style={styles.secondaryButtonText}>Delete Entry</Text>
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
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={[styles.inputShell, { minHeight }]}>
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={MINT_PLACEHOLDER}
            multiline
            style={styles.input}
          />
        ) : (
          <Text style={styles.readText}>
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
  if (isEditing) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>

        <View style={styles.smallInputShell}>
          <TextInput
            value={values[0]}
            onChangeText={onChangeTexts[0]}
            placeholder="Priority #1..."
            placeholderTextColor={MINT_PLACEHOLDER}
            style={styles.input}
          />
        </View>

        <View style={[styles.smallInputShell, { marginTop: 12 }]}>
          <TextInput
            value={values[1]}
            onChangeText={onChangeTexts[1]}
            placeholder="Priority #2..."
            placeholderTextColor={MINT_PLACEHOLDER}
            style={styles.input}
          />
        </View>

        <View style={[styles.smallInputShell, { marginTop: 12 }]}>
          <TextInput
            value={values[2]}
            onChangeText={onChangeTexts[2]}
            placeholder="Priority #3..."
            placeholderTextColor={MINT_PLACEHOLDER}
            style={styles.input}
          />
        </View>
      </View>
    );
  }

  // View mode
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.inputShell}>
        <Text style={styles.readText}>
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

/* Mint theme */
const BG = "#fbf6f8";
const TEXT = "#222";
const MINT = "#9fe7c0";
const CARD_BG = "#ffffff";
const INPUT_BG = "#e8fbf1";
const MINT_PLACEHOLDER = "#b7e8d0";
const SHADOW = "#000";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
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
    backgroundColor: "#444",
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
    color: "#666",
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: MINT,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 6,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 26,
    padding: 16,
    marginTop: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: MINT,
    marginBottom: 10,
  },

  inputShell: {
    backgroundColor: INPUT_BG,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#c9f3df",
    justifyContent: "flex-start",
  },
  smallInputShell: {
    backgroundColor: INPUT_BG,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#c9f3df",
  },
  input: {
    fontSize: 14,
    color: "#2b6a54",
    textAlignVertical: "top",
  },
  readText: {
    fontSize: 14,
    color: "#2b6a54",
    lineHeight: 20,
  },

  primaryButton: {
    backgroundColor: MINT,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
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
    backgroundColor: "#bfeedd",
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
