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
import { API_BASE } from "../../lib/api";
import SideDrawer from "../components/SideDrawer";

const DEMO_USER_ID = "demo-student-1";

type AreasKey = "mind" | "body" | "career" | "relationships";

export default function WeeklyReflectionsReviewScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [areas, setAreas] = useState<Record<AreasKey, string>>({
    mind: "",
    body: "",
    career: "",
    relationships: "",
  });

  const [heldMeBack, setHeldMeBack] = useState("");
  const [lessonLearned, setLessonLearned] = useState("");
  const [nextWeeksFocus, setNextWeeksFocus] = useState("");

  const payload = useMemo(
    () => ({
      user_id: DEMO_USER_ID,
      mind: areas.mind,
      body: areas.body,
      career: areas.career,
      relationships: areas.relationships,
      held_me_back: heldMeBack,
      lesson_learned: lessonLearned,
      next_weeks_focus: nextWeeksFocus,
    }),
    [areas, heldMeBack, lessonLearned, nextWeeksFocus]
  );

  const updateArea = (key: AreasKey, value: string) => {
    setAreas((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSave() {
    try {
      setSaving(true);

      // Change endpoint to match API
      const res = await fetch(`${API_BASE}/weekly_reflections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved✅", "Your weekly reflection has been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log("Save weekly reflection error", e);
      Alert.alert("Oops", "Could not save your reflection. Please try again.");
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
        <View style={styles.root}>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
            <Text style={styles.title}>Weekly Reflections &amp;</Text>
            <Text style={styles.title}>Review</Text>
            <Text style={styles.subtitle}>
              Look back at your week — what helped, what can you tweak?
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Group card: 4 areas */}
        <View style={styles.groupCard}>
          <AreaPrompt
            icon="🧠"
            title="Mind"
            value={areas.mind}
            onChangeText={(t) => updateArea("mind", t)}
          />
          <AreaPrompt
            icon="💪"
            title="Body"
            value={areas.body}
            onChangeText={(t) => updateArea("body", t)}
          />
          <AreaPrompt
            icon="💼"
            title="Career"
            value={areas.career}
            onChangeText={(t) => updateArea("career", t)}
          />
          <AreaPrompt
            icon="💗"
            title="Relationships"
            value={areas.relationships}
            onChangeText={(t) => updateArea("relationships", t)}
          />
        </View>

        {/* Other cards */}
        <SinglePromptCard
          title="What Held Me Back?"
          placeholder="Was there anything that made the week harder?"
          value={heldMeBack}
          onChangeText={setHeldMeBack}
        />

        <SinglePromptCard
          title="Lesson Learned"
          placeholder="What did this week teach you?"
          value={lessonLearned}
          onChangeText={setLessonLearned}
        />

        <SinglePromptCard
          title="Next Week’s Focus"
          placeholder="What do you want to bring into the next week?"
          value={nextWeeksFocus}
          onChangeText={setNextWeeksFocus}
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
            {saving ? "Saving..." : "Save Weekly Reflection"}
          </Text>
        </Pressable>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  );
}

function AreaPrompt({
  icon,
  title,
  value,
  onChangeText,
}: {
  icon: string;
  title: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.areaBlock}>
      <Text style={styles.areaTitle}>
        {icon} <Text style={styles.areaTitleText}>{title}</Text>
      </Text>

      <View style={styles.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Reflect on how you showed progress in this area..."
          placeholderTextColor={MINT_PLACEHOLDER}
          multiline
          style={styles.input}
        />
      </View>
    </View>
  );
}

function SinglePromptCard({
  title,
  placeholder,
  value,
  onChangeText,
}: {
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.singleCard}>
      <Text style={styles.singleTitle}>{title}</Text>
      <View style={styles.inputShellTall}>
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
  titleCenter: {
    flex: 1,
    alignItems: "center",
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

  groupCard: {
    backgroundColor: CARD_BG,
    borderRadius: 26,
    padding: 16,
    marginTop: 10,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  areaBlock: {
    marginBottom: 14,
  },
  areaTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: MINT,
    marginBottom: 8,
  },
  areaTitleText: {
    color: MINT,
  },

  inputShell: {
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 82,
    borderWidth: 1,
    borderColor: "#c9f3df",
  },
  inputShellTall: {
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#c9f3df",
  },
  input: {
    fontSize: 14,
    color: "#2b6a54",
    textAlignVertical: "top",
  },

  singleCard: {
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
  singleTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: MINT,
    marginBottom: 10,
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
