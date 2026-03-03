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
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";


const INSPIRATION = [
  "A person who supports me",
  "My health (even small improvements)",
  "A safe place to sleep",
  "A good meal or a warm drink",
  "Something my body allows me to do",
  "A small win I had today",
  "Fresh air / nature / sunlight",
  "A pet or an animal I saw",
  "A moment of calm",
  "Music / a book / a show I enjoyed",
  "A skill I’m learning",
  "A future plan I’m excited about",
];

export default function DailyGratitudeScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [gratitude, setGratitude] = useState("");
  const [saving, setSaving] = useState(false);

  const [openInspo, setOpenInspo] = useState(false);

  // optional: show character count like mood.tsx
  const maxLen = 250;
  const trimmed = useMemo(() => gratitude.slice(0, maxLen), [gratitude]);

async function handleSave() {
  const value = trimmed.trim();

  if (!value) {
    Alert.alert("Add something", "Write one thing you’re grateful for first.");
    return;
  }

  try {
    setSaving(true);

    const res = await authedFetch("/gratitude_entries", {
      method: "POST",
      body: JSON.stringify({ text: value }),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `HTTP ${res.status}`);
    }

    Alert.alert("Saved ✅", "Your gratitude has been saved.", [
      { text: "OK", onPress: () => router.back() },
    ]);

    setGratitude("");
  } catch (e: any) {
    console.log("Save gratitude error:", e?.message || e);
    Alert.alert("Oops", e?.message || "Could not save your gratitude. Please try again.");
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

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>Daily Gratitude</Text>
            <Text style={s.subtitle}>
              Train your brain to notice the good – what are you grateful for today?
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Main Card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Today I’m Grateful For..</Text>

          <View style={s.cardInner}>
            <TextInput
              value={trimmed}
              onChangeText={setGratitude}
              placeholder="Write one thing you’re grateful for."
              placeholderTextColor={theme.reflect.placeholder}
              multiline
              style={s.cardInput}
              textAlignVertical="top"
              maxLength={maxLen}
            />
          </View>

          <Text style={s.charCount}>{trimmed.length}/{maxLen}</Text>
        </View>

        {/* Inspiration dropdown */}
        <View style={s.dropdown}>
          <Pressable
            onPress={() => setOpenInspo((v) => !v)}
            style={({ pressed }) => [
              s.dropdownHeader,
              { opacity: pressed ? 0.96 : 1 },
            ]}
          >
            <Text style={s.dropdownTitle}>Need Inspiration?</Text>
            <Text style={s.dropdownChevron}>{openInspo ? "˄" : "˅"}</Text>
          </Pressable>

          {openInspo && (
            <View style={s.dropdownBody}>
              {INSPIRATION.map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    setGratitude((prev: string) => {
                      const base = prev.trim();
                      return base.length === 0
                        ? item
                        : `${base}\n• ${item}`;
                    });
                  }}
                  style={({ pressed }) => [
                    s.inspoItem,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text style={s.inspoText}>• {item}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Save button */}
        <Pressable
          style={({ pressed }) => [
            s.saveButton,
            { opacity: saving ? 0.65 : pressed ? 0.95 : 1 },
          ]}
          onPress={() => {
            if (!saving) handleSave();
          }}
          disabled={saving}
        >
          <Text style={s.saveButtonText}>
            {saving ? "Saving..." : "Save Gratitude"}
          </Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  );
}

// ✅ DailyGratitudeScreen styles (theme-based)

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
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
      fontSize: 36,
      lineHeight: 40,
      fontWeight: "800",
      color: theme.reflect.title,
      textAlign: "center",
      marginTop: 6,
    },
    subtitle: {
      fontSize: 15,
      color: theme.subtleText,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 22,
    },

    card: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 16,
      marginTop: 8,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardLabel: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.reflect.title,
      marginBottom: 12,
    },
    cardInner: {
      backgroundColor: theme.reflect.inputBg,
      borderRadius: 18,
      padding: 12,
      minHeight: 160,
      justifyContent: "flex-start",
    },
    cardInput: {
      fontSize: 14,
      color: theme.text,
      textAlignVertical: "top",
    },
    charCount: {
      marginTop: 8,
      textAlign: "right",
      fontSize: 12,
      color: theme.subtleText,
    },

    dropdown: {
      marginTop: 16,
      backgroundColor: theme.card,
      borderRadius: 22,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      overflow: "hidden",
    },
    dropdownHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    dropdownTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "800",
      color: theme.reflect.title,
    },
    dropdownChevron: {
      fontSize: 18,
      color: theme.reflect.title,
      fontWeight: "800",
    },
    dropdownBody: {
      paddingHorizontal: 18,
      paddingBottom: 14,
      paddingTop: 4,
      backgroundColor: theme.background,
    },
    inspoItem: {
      paddingVertical: 10,
      borderRadius: 12,
    },
    inspoText: {
      color: theme.reflect.title,
      fontSize: 14,
      lineHeight: 20,
    },

    saveButton: {
      marginTop: 28,
      marginBottom: 10,
      backgroundColor: theme.reflect.button,
      borderRadius: 26,
      paddingVertical: 16,
      alignItems: "center",
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
  });