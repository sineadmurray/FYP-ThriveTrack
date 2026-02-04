import { useRouter } from "expo-router";
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

const DEMO_USER_ID = "demo-student-1";

export default function DailyPlannerScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [mainGoal, setMainGoal] = useState("");
  const [priority1, setPriority1] = useState("");
  const [priority2, setPriority2] = useState("");
  const [priority3, setPriority3] = useState("");
  const [otherTodos, setOtherTodos] = useState("");
  const [selfCare, setSelfCare] = useState("");
  const [reward, setReward] = useState("");
  const [notes, setNotes] = useState("");

  const payload = useMemo(
    () => ({
      user_id: DEMO_USER_ID,
      main_goal: mainGoal,
      priority_1: priority1,
      priority_2: priority2,
      priority_3: priority3,
      other_todos: otherTodos,
      self_care_actions: selfCare,
      productivity_reward: reward,
      notes: notes,
    }),
    [mainGoal, priority1, priority2, priority3, otherTodos, selfCare, reward, notes]
  );


  async function handleSave() {
    try {
      setSaving(true);

      // Change endpoint to match your API
      const res = await fetch(`${API_BASE}/daily_plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved", "Your plan has been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log("Save daily plan error", e);
      Alert.alert("Oops", "Could not save your plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }

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

        {/* Back + Title */}
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={styles.titleCenter}>
            <Text style={styles.title}>Daily Planner</Text>
            <Text style={styles.subtitle}>
              Reward yourself for progress — even small wins
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Cards */}
        <PlannerCard
          title="Main Goal Of The Day"
          placeholder="Write Your Main Focus For Today.."
          value={mainGoal}
          onChangeText={setMainGoal}
          minHeight={130}
        />

        <PrioritiesCard
          title="Top 3 Priorities"
          values={[priority1, priority2, priority3]}
          onChangeTexts={[setPriority1, setPriority2, setPriority3]}
        />

        <PlannerCard
          title="Other To-Dos"
          placeholder="Tasks to keep in mind..."
          value={otherTodos}
          onChangeText={setOtherTodos}
          minHeight={130}
        />

        <PlannerCard
          title="Self-Care Actions"
          placeholder="How will you take care of yourself today?"
          value={selfCare}
          onChangeText={setSelfCare}
          minHeight={130}
        />

        <PlannerCard
          title="Productivity Reward"
          placeholder="Treat yourself for your effort today..."
          value={reward}
          onChangeText={setReward}
          minHeight={130}
        />

        <PlannerCard
          title="Notes / Appointments / Lectures"
          placeholder="Times, reminders, or anything you need to remember..."
          value={notes}
          onChangeText={setNotes}
          minHeight={140}
        />

        {/* Save button */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { transform: [{ scale: 0.99 }] },
            saving && { opacity: 0.8 },
          ]}
          onPress={() => !saving && handleSave()}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Plan"}
          </Text>
        </Pressable>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function PlannerCard({
  title,
  placeholder,
  value,
  onChangeText,
  minHeight = 120,
}: {
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  minHeight?: number;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={[styles.inputShell, { minHeight }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={MINT_PLACEHOLDER}
          multiline
          style={styles.input}
        />
      </View>
    </View>
  );
}

function PrioritiesCard({
  title,
  values,
  onChangeTexts,
}: {
  title: string;
  values: [string, string, string];
  onChangeTexts: [(t: string) => void, (t: string) => void, (t: string) => void];
}) {
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

/* Mint theme to match screenshot */
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
  titleCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
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

  saveButton: {
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: MINT,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
