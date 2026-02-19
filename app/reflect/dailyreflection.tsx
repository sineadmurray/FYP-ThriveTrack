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
import { API_BASE } from "../../lib/api";
import SideDrawer from "../components/SideDrawer";

const DEMO_USER_ID = "demo-student-1";

export default function DailyReflectionScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [wentWell, setWentWell] = useState("");
  const [learned, setLearned] = useState("");
  const [proudOf, setProudOf] = useState("");
  const [selfCare, setSelfCare] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);

      const res = await fetch(`${API_BASE}/end-of-day-reflections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: DEMO_USER_ID,
          went_well: wentWell,
          learned,
          proud_of: proudOf,
          self_care: selfCare,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      Alert.alert("Saved✅", "Your daily reflection has been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log("Save EOD error", e);
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

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>Daily Reflection &amp;</Text>
            <Text style={styles.title}>Positive Thoughts</Text>
            <Text style={styles.subtitle}>
              End your day by focusing on the wins, not the worries.
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Cards */}
        <ReflectionCard
          label="What went well today?"
          placeholder="Write a moment, action, or small win that made today better."
          value={wentWell}
          onChangeText={setWentWell}
        />
        <ReflectionCard
          label="Something I learned"
          placeholder="What did today teach you about yourself, others, or life?"
          value={learned}
          onChangeText={setLearned}
        />
        <ReflectionCard
          label="I’m proud of myself for..."
          placeholder="A choice, action, or habit you showed today."
          value={proudOf}
          onChangeText={setProudOf}
        />
        <ReflectionCard
          label="Self-care I practiced"
          placeholder="Anything you did, small or big, that supported your well being."
          value={selfCare}
          onChangeText={setSelfCare}
        />

        {/* Save button */}
        <Pressable
          style={styles.saveButton}
          onPress={() => {
            if (!saving) handleSave();
          }}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Entry"}
          </Text>
        </Pressable>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  );
}

function ReflectionCard({
  label,
  placeholder,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.cardInner}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#b9a5ff"
          multiline
          style={styles.cardInput}
        />
      </View>
    </View>
  );
}

/* Reflect / purple theme */
const BG = "#fff5f7";
const CARD_BG = "#ffffff";
const INNER_BG = "#f6edff";
const PURPLE = "#8f79ea";
const BUTTON_PURPLE = "#b49cff";
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
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 12,
  },
  backBtn: {
    paddingRight: 8,
    paddingTop: 4,
  },
  backArrow: {
    fontSize: 26,
    color: TEXT,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: PURPLE,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#6f6f6f",
    textAlign: "center",
    marginTop: 6,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: PURPLE,
    marginBottom: 10,
  },
  cardInner: {
    backgroundColor: INNER_BG,
    borderRadius: 18,
    padding: 12,
    minHeight: 90,
    justifyContent: "flex-start",
  },
  cardInput: {
    fontSize: 14,
    color: PURPLE,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 18,
    marginBottom: 24,
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
