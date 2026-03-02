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
import SideDrawer from "../components/SideDrawer";
import { useTheme } from "../theme/ThemeContext";
import type { AppTheme } from "../theme/themes";


export default function DailyReflectionScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
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

      const res = await authedFetch("/end_of_day_reflections", {
        method: "POST",
        body: JSON.stringify({
          went_well: wentWell,
          learned,
          proud_of: proudOf,
          self_care: selfCare,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
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
            <Text style={s.title}>Daily Reflection &amp;</Text>
            <Text style={s.title}>Positive Thoughts</Text>
            <Text style={s.subtitle}>
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
          style={s.saveButton}
          onPress={() => {
            if (!saving) handleSave();
          }}
        >
          <Text style={s.saveButtonText}>
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
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{label}</Text>
      <View style={s.cardInner}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.reflect.placeholder}
          multiline
          style={s.cardInput}
        />
      </View>
    </View>
  );
}

/* Reflect / purple theme */
// ✅ DailyReflectionScreen styles (theme-based)
// Remove the old hard-coded constants (BG, CARD_BG, PURPLE, etc.)

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

    card: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 16,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.reflect.title,
      marginBottom: 10,
    },
    cardInner: {
      backgroundColor: theme.reflect.inputBg,
      borderRadius: 18,
      padding: 12,
      minHeight: 90,
      justifyContent: "flex-start",
    },
    cardInput: {
      fontSize: 14,
      color: theme.text,
      textAlignVertical: "top",
    },

    saveButton: {
      marginTop: 18,
      marginBottom: 24,
      backgroundColor: theme.reflect.button,
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