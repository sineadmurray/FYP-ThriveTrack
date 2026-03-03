import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";


type SectionKey = "mind" | "body" | "career" | "relationships";

type SectionState = {
  now: string;
  want: string;
};

export default function WhereIAmNowScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sections, setSections] = useState<Record<SectionKey, SectionState>>({
    mind: { now: "", want: "" },
    body: { now: "", want: "" },
    career: { now: "", want: "" },
    relationships: { now: "", want: "" },
  });

  const payload = {
    mind_now: sections.mind.now,
    mind_want: sections.mind.want,

    body_now: sections.body.now,
    body_want: sections.body.want,

    career_now: sections.career.now,
    career_want: sections.career.want,

    relationships_now: sections.relationships.now,
    relationships_want: sections.relationships.want,
  };

  async function handleSave() {
    try {
      setSaving(true);

      const res = await authedFetch("/where_i_am_reflections", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      Alert.alert("Saved✅", "Your reflection has been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log("Save reflection error", e);
      Alert.alert("Oops", "Could not save your reflection. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const updateSection = (key: SectionKey, part: keyof SectionState, value: string) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], [part]: value },
    }));
  };

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
            <Text style={s.title}>Where I Am Now /</Text>
            <Text style={s.title}>Where I Want to Be</Text>
            <Text style={s.subtitle}>
              Reflect on where you are today and where you'd like to grow.
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Sections */}
        <DualPromptSection
          icon="🧠"
          title="Mind"
          nowValue={sections.mind.now}
          wantValue={sections.mind.want}
          onChangeNow={(t) => updateSection("mind", "now", t)}
          onChangeWant={(t) => updateSection("mind", "want", t)}
        />

        <DualPromptSection
          icon="💪"
          title="Body"
          nowValue={sections.body.now}
          wantValue={sections.body.want}
          onChangeNow={(t) => updateSection("body", "now", t)}
          onChangeWant={(t) => updateSection("body", "want", t)}
        />

        <DualPromptSection
          icon="💼"
          title="Career"
          nowValue={sections.career.now}
          wantValue={sections.career.want}
          onChangeNow={(t) => updateSection("career", "now", t)}
          onChangeWant={(t) => updateSection("career", "want", t)}
        />

        <DualPromptSection
          icon="💗"
          title="Relationships"
          nowValue={sections.relationships.now}
          wantValue={sections.relationships.want}
          onChangeNow={(t) => updateSection("relationships", "now", t)}
          onChangeWant={(t) => updateSection("relationships", "want", t)}
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
            {saving ? "Saving..." : "Save Reflection"}
          </Text>
        </Pressable>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  );
}

function DualPromptSection({
  icon,
  title,
  nowValue,
  wantValue,
  onChangeNow,
  onChangeWant,
}: {
  icon: string;
  title: string;
  nowValue: string;
  wantValue: string;
  onChangeNow: (t: string) => void;
  onChangeWant: (t: string) => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionTitle}>
        {icon} <Text style={s.sectionTitleText}>{title}</Text>
      </Text>

      <Text style={s.promptLabel}>Where I Am Now</Text>
      <View style={s.inputShell}>
        <TextInput
          value={nowValue}
          onChangeText={onChangeNow}
          placeholder="Describe your current state..."
          placeholderTextColor={theme.grow.placeholder}
          multiline
          style={s.input}
        />
      </View>

      <Text style={[s.promptLabel, { marginTop: 14 }]}>
        Where I Want To Be
      </Text>
      <View style={s.inputShell}>
        <TextInput
          value={wantValue}
          onChangeText={onChangeWant}
          placeholder="Describe where you’d like to grow..."
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
    fontSize: 28,
    lineHeight: 32,
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

  sectionCard: {
    backgroundColor: theme.card,
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.grow.title,
    marginBottom: 10,
  },
  sectionTitleText: {
    color: theme.grow.title,
  },

  promptLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.text,
    marginBottom: 8,
  },
  inputShell: {
    backgroundColor: theme.grow.inputBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 88,
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
    fontWeight: "800",
  },
});
