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
import { API_BASE, createMoodEntry } from "../../lib/api";
import SideDrawer from "../components/SideDrawer";

type MoodKey = "Struggling" | "Low" | "Okay" | "Good" | "Amazing";

const MOODS: { key: MoodKey; emoji: string; label: string; value: number }[] = [
  { key: "Struggling", emoji: "😣", label: "Struggling", value: 1 },
  { key: "Low", emoji: "😕", label: "Low", value: 2 },
  { key: "Okay", emoji: "😐", label: "Okay", value: 3 },
  { key: "Good", emoji: "🙂", label: "Good", value: 4 },
  { key: "Amazing", emoji: "🤩", label: "Amazing", value: 5 },
];

export default function MoodJournalScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!selectedMood) {
      Alert.alert("Pick a mood", "Please choose how you're feeling today.");
      return;
    }

    const selected = MOODS.find((m) => m.key === selectedMood);
    if (!selected) {
      Alert.alert("Error", "Could not determine mood value.");
      return;
    }

    try {
      setSaving(true);

      // keep notes reasonable
      const trimmed = notes.trim().slice(0, 300);

      // TEMP user id — replace with real auth later
      const payload = {
        user_id: "demo-student-1",
        mood: selectedMood, // string
        mood_value: selected.value, 
        notes: trimmed || undefined,
      };

      // console for debugging if anything goes wrong
      console.log("POST /mood_entries →", API_BASE, payload);

      await createMoodEntry(payload);

      Alert.alert("Saved ✅", "Your mood entry has been saved.");
      setNotes("");
      setSelectedMood(null);
    } catch (e: any) {
      console.log("Save error:", e?.message || e);
      Alert.alert("Couldn't save", e?.message ?? "Network error");
    } finally {
      // ensures the UI never gets stuck on “Saving…”
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
          <Text style={styles.appTitle}>Reflect, Grow & Thrive</Text>

          {/* Hamburger */}
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
            <Text style={styles.title}>Mood Journal</Text>
          </View>

          <View style={{ width: 24 }} />
        </View>


        {/* Card: Mood picker */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>How are you feeling today?</Text>

          <View style={styles.emojiRow}>
            {MOODS.map((m) => {
              const selected = selectedMood === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setSelectedMood(m.key)}
                  style={({ pressed }) => [
                    styles.emojiBtn,
                    selected && styles.emojiBtnSelected,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text style={styles.emojiText}>{m.emoji}</Text>
                  {selected && <Text style={styles.emojiLabel}>{m.label}</Text>}
                </Pressable>
              );
            })}
          </View>

          {selectedMood && (
            <Text style={styles.selectedText}>
              You’re feeling{" "}
              <Text style={styles.selectedBold}>
                {MOODS.find((m) => m.key === selectedMood)?.label}
              </Text>{" "}
              today.
            </Text>
          )}
        </View>

        {/* Card: What's on your mind */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>What&apos;s on your mind?</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Write your thoughts and feelings here..."
              placeholderTextColor="#a7a2c7"
              style={styles.input}
              multiline
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
              maxLength={300}
            />
          </View>
          <Text style={styles.charCount}>{Math.min(notes.length, 300)}/300</Text>
        </View>

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          disabled={saving || !selectedMood}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              opacity: saving || !selectedMood ? 0.6 : pressed ? 0.95 : 1,
            },
          ]}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save Entry"}
          </Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Drawer */}
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  );
}

/* THEME */
const BG = "#fff5f7";
const PURPLE = "#8f79ea";
const SOFT_PURPLE = "#eee9ff";
const TEXT = "#222";
const SUBTLE = "#6b6b6b";
const SHADOW = "#000";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === "android" ? 35 : 55,
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  /* Header */
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
  debug: {
    marginTop: 4,
    marginBottom: 2,
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },

  pageTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: PURPLE,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 14,
  },

  /* Cards */
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginVertical: 10,
    shadowColor: SHADOW,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: PURPLE,
    marginBottom: 12,
  },

  /* Mood row */
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  emojiBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e1ff",
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnSelected: {
    backgroundColor: SOFT_PURPLE,
    borderColor: PURPLE,
  },
  emojiText: {
    fontSize: 24,
  },
  emojiLabel: {
    marginTop: 4,
    fontSize: 12,
    color: PURPLE,
    fontWeight: "700",
  },
  selectedText: {
    marginTop: 12,
    color: SUBTLE,
    fontSize: 16,
  },
  selectedBold: {
    color: PURPLE,
    fontWeight: "800",
  },

  /* Input */
  inputWrapper: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cfc6ff",
    backgroundColor: "#fbf9ff",
    padding: 10,
  },
  input: {
    minHeight: 140,
    fontSize: 16,
    lineHeight: 22,
    color: TEXT,
  },
  charCount: {
    textAlign: "right",
    color: "#9b95bf",
    marginTop: 6,
    fontSize: 12,
  },

  /* Save */
  saveBtn: {
    marginTop: 14,
    backgroundColor: PURPLE,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: SHADOW,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
