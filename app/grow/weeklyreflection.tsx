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


type AreasKey = "mind" | "body" | "career" | "relationships";

export default function WeeklyReflectionsReviewScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();
  const s = styles(theme);

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

      const res = await authedFetch("/weekly_reflections", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

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
            <Text style={s.title}>Weekly Reflections &amp;</Text>
            <Text style={s.title}>Review</Text>
            <Text style={s.subtitle}>
              Look back at your week — what helped, what can you tweak?
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Group card: 4 areas */}
        <View style={s.groupCard}>
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
            s.saveButton,
            pressed && { transform: [{ scale: 0.99 }] },
            saving && { opacity: 0.8 },
          ]}
          onPress={() => !saving && handleSave()}
        >
          <Text style={s.saveButtonText}>
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
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.areaBlock}>
      <Text style={s.areaTitle}>
        {icon} <Text style={s.areaTitleText}>{title}</Text>
      </Text>

      <View style={s.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Reflect on how you showed progress in this area..."
          placeholderTextColor={theme.grow.placeholder}
          multiline
          style={s.input}
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
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.singleCard}>
      <Text style={s.singleTitle}>{title}</Text>
      <View style={s.inputShellTall}>
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

  groupCard: {
    backgroundColor: theme.card,
    borderRadius: 26,
    padding: 16,
    marginTop: 10,
    shadowColor: "#000",
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
    color: theme.grow.title,
    marginBottom: 8,
  },
  areaTitleText: {
    color: theme.grow.title,
  },

  inputShell: {
    backgroundColor: theme.grow.inputBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 82,
    borderWidth: 1,
    borderColor: theme.grow.inputBorder,
  },
  inputShellTall: {
    backgroundColor: theme.grow.inputBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.grow.inputBorder,
  },
  input: {
    fontSize: 14,
    color: theme.grow.inputText,
    textAlignVertical: "top",
  },

  singleCard: {
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
  singleTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.grow.title,
    marginBottom: 10,
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
