import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { authedFetch } from "../../lib/authedFetch";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";


type OutsideInPrompt = {
  id: number;
  prompt_text: string;
};

type OutsideInInspiration = {
  inspiration_text: string;
};

async function fetchRandomOutsideInPrompt(): Promise<OutsideInPrompt> {
  const res = await fetch(`${API_BASE}/outside_in/random`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchInspirationsForPrompt(
  promptId: number
): Promise<OutsideInInspiration[]> {
  const res = await fetch(`${API_BASE}/outside_in/${promptId}/inspirations`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
export default function OutsideThinking() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [prompt, setPrompt] = useState<OutsideInPrompt | null>(null);
  const [inspirations, setInspirations] = useState<OutsideInInspiration[]>([]);
  const [loading, setLoading] = useState(false);

  const [action, setAction] = useState("");
  const [saving, setSaving] = useState(false);

  const [openInspo, setOpenInspo] = useState(false);

  const maxLen = 250;
  const trimmed = useMemo(() => action.slice(0, maxLen), [action]);

  const loadNewPrompt = useCallback(async () => {
    try {
      setLoading(true);

      const p = await fetchRandomOutsideInPrompt();
      setPrompt(p);

      const inspo = await fetchInspirationsForPrompt(p.id);
      setInspirations(inspo);

      setAction("");
      setOpenInspo(false);
    } catch (e: any) {
      console.log("Outside-In load error:", e?.message || e);
      Alert.alert("Oops", "Could not load a prompt. Please try again.");
      setPrompt(null);
      setInspirations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNewPrompt();
  }, [loadNewPrompt]);

  async function handleSave() {
    const value = trimmed.trim();

    if (!prompt) {
      Alert.alert("No prompt", "Please load a prompt first.");
      return;
    }

    if (!value) {
      Alert.alert("Add an action", "Write one small action for tomorrow first.");
      return;
    }

    try {
      setSaving(true);

      const res = await authedFetch("/outside_in_actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_id: prompt.id,
          action_text: value,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved ✅", "Your action has been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);

      setAction("");
    } catch (e: any) {
      console.log("Save outside-in action error:", e?.message || e);
      Alert.alert("Oops", "Could not save your action. Please try again.");
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
            <Text style={s.title}>Outside-In Thinking</Text>
            <Text style={s.subtitle}>
              Small actions can shift big feelings.
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Prompt Card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Today’s Prompt</Text>

          <Text style={s.promptText}>
            {prompt ? prompt.prompt_text : loading ? "Loading…" : "No prompt available."}
          </Text>

          <Pressable
            onPress={() => {
              if (!loading) loadNewPrompt();
            }}
            disabled={loading}
            style={({ pressed }) => [
              s.tryButton,
              { opacity: loading ? 0.65 : pressed ? 0.95 : 1 },
            ]}
          >
            <Text style={s.tryButtonText}>
              {loading ? "Loading..." : "Try a different prompt"}
            </Text>
          </Pressable>
        </View>

        {/* Action Card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Your Action for Tomorrow</Text>

          <View style={s.cardInner}>
            <TextInput
              value={trimmed}
              onChangeText={setAction}
              placeholder="Write one small step you could take."
              placeholderTextColor="#b9a5ff"
              multiline
              style={s.cardInput}
              textAlignVertical="top"
              maxLength={maxLen}
            />
          </View>

          <Text style={s.charCount}>
            {trimmed.length}/{maxLen}
          </Text>
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
              {loading ? <ActivityIndicator /> : null}

              {inspirations.map((i, idx) => (
                <Pressable
                  key={`${idx}-${i.inspiration_text}`}
                  onPress={() => {
                    setAction((prev) => {
                      const base = prev.trim();
                      const line = i.inspiration_text;
                      return base.length === 0 ? line : `${base}\n• ${line}`;
                    });
                  }}
                  style={({ pressed }) => [
                    s.inspoItem,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text style={s.inspoText}>• {i.inspiration_text}</Text>
                </Pressable>
              ))}

              {!loading && inspirations.length === 0 ? (
                <Text style={s.inspoText}>• No inspirations found.</Text>
              ) : null}
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
            {saving ? "Saving..." : "Save Action"}
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

    promptText: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 22,
      marginBottom: 14,
      fontStyle: "italic",
      textAlign: "center",
    },

    tryButton: {
      alignSelf: "center",
      backgroundColor: theme.reflect.inputBg,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.reflect.inputBg,
    },
    tryButtonText: {
      color: theme.reflect.title,
      fontWeight: "800",
      fontSize: 14,
    },

    cardInner: {
      backgroundColor: theme.reflect.inputBg,
      borderRadius: 18,
      padding: 12,
      minHeight: 160,
      justifyContent: "flex-start",
      borderWidth: 1,
      borderColor: theme.reflect.inputBg,
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
      borderTopWidth: 1,
      borderTopColor: theme.reflect.inputBg,
    },
    inspoItem: {
      paddingVertical: 10,
      borderRadius: 12,
    },
    inspoText: {
      color: theme.text,
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