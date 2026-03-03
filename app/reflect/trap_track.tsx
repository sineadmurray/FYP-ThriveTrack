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


export default function TrapTrackScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [circumstance, setCircumstance] = useState("");
  const [trigger, setTrigger] = useState("");
  const [response, setResponse] = useState("");
  const [avoidance, setAvoidance] = useState("");
  const [consequence, setConsequence] = useState("");
  const [copingstrategy, setCopingStrategy] = useState("");
  const [tryalternative, setTryAlternative] = useState("");
  const [consequenceafter, setConsequenceAfter] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);

      const res = await authedFetch("/trap_and_track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circumstance,
          trigger,
          response,
          avoidance,
          consequence,
          copingstrategy,
          tryalternative,
          consequenceafter,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved✅", "Your Trap & Track has been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);

    } catch (e) {
      console.log("Save TT error", e);
      Alert.alert("Oops", "Could not save your Trap & Track. Please try again.");
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
            <Text style={s.title}>Trap & Track</Text>
            <Text style={s.subtitle}>
              Catch an unhelpful thought & reframe it
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Cards */}
        <ReflectionCard
          label="Circumstance"
          placeholder="What was going on at the time?"
          value={circumstance}
          onChangeText={setCircumstance}
        />
        <ReflectionCard
          label="Trigger"
          placeholder="What set off the thought or emotion?"
          value={trigger}
          onChangeText={setTrigger}
        />
        <ReflectionCard
          label="Response"
          placeholder="How did you feel or react in the moment?"
          value={response}
          onChangeText={setResponse}
        />
        <ReflectionCard
          label="Avoidance Pattern"
          placeholder="Did you avoid anything or withdraw in response?"
          value={avoidance}
          onChangeText={setAvoidance}
        />
        <ReflectionCard
          label="Consequences"
          placeholder="How did this affect your thoughts, mood, or behaviour afterward?"
          value={consequence}
          onChangeText={setConsequence}
        />
        <ReflectionCard
          label="Possible Alternative Coping Strategies"
          placeholder="List healthier ways you could respond in this situation."
          value={copingstrategy}
          onChangeText={setCopingStrategy}
        />
        <ReflectionCard
          label="Choose One Alternative to Try"
          placeholder="Pick one strategy to use next time this happens."
          value={tryalternative}
          onChangeText={setTryAlternative}
        />
        <ReflectionCard
          label="Consequences (After Trying the Alternative)"
          placeholder="If you tried this new approach, how do you think you would feel or react afterward?"
          value={consequenceafter}
          onChangeText={setConsequenceAfter}
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
          placeholderTextColor="#b9a5ff"
          multiline
          style={s.cardInput}
        />
      </View>
    </View>
  );
}

// ✅ TrapTrackScreen styles (theme-based)

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
      borderWidth: 1,
      borderColor: theme.reflect.inputBg
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