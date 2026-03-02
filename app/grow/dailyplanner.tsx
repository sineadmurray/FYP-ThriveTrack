import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { authedFetch } from "../../lib/authedFetch";
import SideDrawer from "../components/SideDrawer";
import { useTheme } from "../theme/ThemeContext";
import type { AppTheme } from "../theme/themes";

export default function DailyPlannerScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
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

      const res = await authedFetch("/daily_plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      Alert.alert("Saved ✅", "Your plan has been saved.", [
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.root}>
          <ScrollView
            contentContainerStyle={s.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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

        {/* Back + Title */}
        <View style={s.titleRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

          <View style={s.titleCenter}>
            <Text style={s.title}>Daily Planner</Text>
            <Text style={s.subtitle}>
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
            s.saveButton,
            pressed && { transform: [{ scale: 0.99 }] },
            saving && { opacity: 0.8 },
          ]}
          onPress={() => !saving && handleSave()}
        >
          <Text style={s.saveButtonText}>
            {saving ? "Saving..." : "Save Plan"}
          </Text>
        </Pressable>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
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
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <View style={[s.inputShell, { minHeight }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.grow.placeholder}
          multiline
          style={s.input}
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
  const { theme } = useTheme();
  const s = styles(theme);
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
  titleCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
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
    shadowOpacity: 0.06,
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

  saveButton: {
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: theme.grow.button,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
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
