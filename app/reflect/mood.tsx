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

type MoodKey = "Struggling" | "Low" | "Okay" | "Good" | "Amazing";

const MOODS: { key: MoodKey; emoji: string; label: string; value: number }[] = [
  { key: "Struggling", emoji: "😣", label: "Struggling", value: 1 },
  { key: "Low", emoji: "😕", label: "Low", value: 2 },
  { key: "Okay", emoji: "😐", label: "Okay", value: 3 },
  { key: "Good", emoji: "🙂", label: "Good", value: 4 },
  { key: "Amazing", emoji: "🤩", label: "Amazing", value: 5 },
];

export default function MoodJournalScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
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

      
      const trimmed = notes.trim().slice(0, 300);


      const payload = {
        mood: selectedMood,
        mood_value: selected.value,
        notes: trimmed || undefined,
      };

      const res = await authedFetch("/mood_entries", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
}

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
          <Text style={s.appTitle}>Reflect, Grow & Thrive</Text>

          {/* Hamburger */}
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

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>Mood Journal</Text>
          </View>

          <View style={{ width: 24 }} />
        </View>


        {/* Card: Mood picker */}
        <View style={s.card}>
          <Text style={s.cardHeading}>How are you feeling today?</Text>

          <View style={s.emojiRow}>
            {MOODS.map((m) => {
              const selected = selectedMood === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setSelectedMood(m.key)}
                  style={({ pressed }) => [
                    s.emojiBtn,
                    selected && s.emojiBtnSelected,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text style={s.emojiText}>{m.emoji}</Text>
                  {selected && <Text style={s.emojiLabel}>{m.label}</Text>}
                </Pressable>
              );
            })}
          </View>

          {selectedMood && (
            <Text style={s.selectedText}>
              You’re feeling{" "}
              <Text style={s.selectedBold}>
                {MOODS.find((m) => m.key === selectedMood)?.label}
              </Text>{" "}
              today.
            </Text>
          )}
        </View>

        {/* Card: What's on your mind */}
        <View style={s.card}>
          <Text style={s.cardHeading}>What&apos;s on your mind?</Text>
          <View style={s.inputWrapper}>
            <TextInput
              placeholder="Write your thoughts and feelings here..."
              placeholderTextColor="#a7a2c7"
              style={s.input}
              multiline
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
              maxLength={300}
            />
          </View>
          <Text style={s.charCount}>{Math.min(notes.length, 300)}/300</Text>
        </View>

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          disabled={saving || !selectedMood}
          style={({ pressed }) => [
            s.saveBtn,
            {
              opacity: saving || !selectedMood ? 0.6 : pressed ? 0.95 : 1,
            },
          ]}
        >
          <Text style={s.saveText}>
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



const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
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

    /* Back + Title */
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
      color: theme.text,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.reflect.title,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 13,
      color: theme.subtleText,
      textAlign: "center",
      marginTop: 6,
    },

    /* Optional debug */
    debug: {
      marginTop: 4,
      marginBottom: 2,
      fontSize: 12,
      color: theme.subtleText,
      textAlign: "center",
    },

    pageTitle: {
      fontSize: 36,
      fontWeight: "800",
      color: theme.reflect.title,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 14,
    },

    /* Cards */
    card: {
      backgroundColor: theme.card,
      borderRadius: 24,
      paddingVertical: 18,
      paddingHorizontal: 18,
      marginVertical: 10,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    cardHeading: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.reflect.title,
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
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.reflect.inputBg,
      minWidth: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    emojiBtnSelected: {
      backgroundColor: theme.reflect.tint,
      borderColor: theme.reflect.title,
    },
    emojiText: {
      fontSize: 24,
    },
    emojiLabel: {
      marginTop: 4,
      fontSize: 12,
      color: theme.reflect.title,
      fontWeight: "700",
    },
    selectedText: {
      marginTop: 12,
      color: theme.subtleText,
      fontSize: 16,
    },
    selectedBold: {
      color: theme.reflect.title,
      fontWeight: "800",
    },

    /* Input */
    inputWrapper: {
      marginTop: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.reflect.inputBg,
      backgroundColor: theme.reflect.inputBg,
      padding: 10,
    },
    input: {
      minHeight: 140,
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      textAlignVertical: "top",
    },
    charCount: {
      textAlign: "right",
      color: theme.subtleText,
      marginTop: 6,
      fontSize: 12,
    },

    /* Save */
    saveBtn: {
      marginTop: 14,
      backgroundColor: theme.reflect.button,
      borderRadius: 22,
      paddingVertical: 16,
      alignItems: "center",
      shadowColor: "#000",
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