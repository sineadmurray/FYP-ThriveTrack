import { useRouter } from "expo-router";
import React, { useState } from "react";
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

type SectionKey = "mind" | "body" | "career" | "relationships";

type SectionState = {
  now: string;
  want: string;
};

export default function WhereIAmNowScreen() {
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
    user_id: DEMO_USER_ID,

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

      const res = await fetch(`${API_BASE}/where_i_am_reflections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved", "Your reflection has been saved.", [
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
            <Text style={styles.title}>Where I Am Now /</Text>
            <Text style={styles.title}>Where I Want to Be</Text>
            <Text style={styles.subtitle}>
              Reflect on where you are today and where you'd like{"\n"}to grow.
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
            styles.saveButton,
            pressed && { transform: [{ scale: 0.99 }] },
            saving && { opacity: 0.8 },
          ]}
          onPress={() => !saving && handleSave()}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Reflection"}
          </Text>
        </Pressable>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
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
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        {icon} <Text style={styles.sectionTitleText}>{title}</Text>
      </Text>

      <Text style={styles.promptLabel}>Where I Am Now</Text>
      <View style={styles.inputShell}>
        <TextInput
          value={nowValue}
          onChangeText={onChangeNow}
          placeholder="Describe your current state..."
          placeholderTextColor={MINT_PLACEHOLDER}
          multiline
          style={styles.input}
        />
      </View>

      <Text style={[styles.promptLabel, { marginTop: 14 }]}>
        Where I Want To Be
      </Text>
      <View style={styles.inputShell}>
        <TextInput
          value={wantValue}
          onChangeText={onChangeWant}
          placeholder="Describe where you’d like to grow..."
          placeholderTextColor={MINT_PLACEHOLDER}
          multiline
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
const MINT_DARK = "#5fbf93";
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
    fontSize: 28,
    lineHeight: 32,
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

  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: MINT,
    marginBottom: 10,
  },
  sectionTitleText: {
    color: MINT,
  },

  promptLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  inputShell: {
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 88,
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
    fontWeight: "800",
  },
});
