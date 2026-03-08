import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { authedFetch } from "../../lib/authedFetch";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";

export default function OutsideThinkingDataScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useLocalSearchParams<{
    id?: string;
    created_at?: string;
    action_text?: string;
    prompt_id?: string; 
  }>();

  const { niceDate, niceTime } = useMemo(
    () => formatDate(params.created_at),
    [params.created_at]
  );

  const [value, setValue] = useState(params.action_text ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!params.id) return;

    const trimmed = value.trim();
    if (!trimmed) {
      Alert.alert("Add an action", "Action text can’t be empty.");
      return;
    }

    try {
      setSaving(true);

      const res = await authedFetch(`/outside_in_actions/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_text: trimmed }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved ✅", "Your Outside-In action has been updated.");
      setIsEditing(false);
    } catch (e) {
      console.log("Outside-In update error", e);
      Alert.alert("Oops", "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!params.id) return;

    Alert.alert("Delete entry?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDelete(params.id!),
      },
    ]);
  }

  async function handleDelete(id: string) {
    try {
      const res = await authedFetch(`/outside_in_actions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Deleted", "Your Outside-In action has been deleted.");
      router.replace("/thrive/accessalldata");
    } catch (e) {
      console.log("Outside-In delete error", e);
      Alert.alert("Oops", "Could not delete entry. Please try again.");
    }
  }

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Image
            source={require("../../assets/images/ThriveTrackLogo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.appTitle}>Reflect, Grow &amp; Thrive</Text>

          <Pressable style={s.menu} onPress={() => setDrawerOpen(true)}>
            <View style={s.menuLine} />
            <View style={s.menuLine} />
            <View style={s.menuLine} />
          </Pressable>
        </View>

        {/* Back + title */}
        <View style={s.titleRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>Outside-In Thinking</Text>
            <Text style={s.subtitle}>
              {niceDate} — {niceTime}
            </Text>
          </View>

          <View style={s.emojiBubble}>
            <Text style={{ fontSize: 22 }}>💭</Text>
          </View>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>My action for tomorrow…</Text>

          <View style={s.cardInner}>
            {isEditing ? (
              <TextInput
                value={value}
                onChangeText={setValue}
                multiline
                style={s.cardInput}
                placeholder="Write one small action you could take."
                placeholderTextColor="#b9a5ff"
                textAlignVertical="top"
              />
            ) : (
              <Text style={s.cardText}>
                {value.trim().length > 0 ? value : "No action saved."}
              </Text>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View style={{ marginTop: 26 }}>
          <Pressable
            style={({ pressed }) => [
              s.primaryButton,
              { opacity: saving ? 0.65 : pressed ? 0.95 : 1 },
            ]}
            onPress={() => {
              if (isEditing) {
                if (!saving) handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={saving}
          >
            <Text style={s.primaryButtonText}>
              {isEditing ? (saving ? "Saving..." : "Save Changes") : "Edit Entry"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              s.secondaryButton,
              { opacity: pressed ? 0.95 : 1 },
            ]}
            onPress={confirmDelete}
          >
            <Text style={s.secondaryButtonText}>Delete Entry</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function formatDate(raw?: string) {
  if (!raw) return { niceDate: "", niceTime: "" };
  const d = new Date(raw);
  const niceDate = d.toLocaleDateString("en-IE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const niceTime = d.toLocaleTimeString("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { niceDate, niceTime };
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
      alignItems: "center",
      marginTop: 12,
    },
    backBtn: { paddingRight: 10 },
    backArrow: { fontSize: 26, color: theme.text },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.reflect.title,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 13,
      color: theme.subtleText,
      marginTop: 4,
    },
    emojiBubble: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.reflect.tint,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },

    card: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 16,
      marginTop: 16,
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.reflect.title,
      marginBottom: 10,
    },
    cardInner: {
      backgroundColor: theme.reflect.inputBg,
      borderRadius: 18,
      padding: 12,
      minHeight: 140,
      justifyContent: "flex-start",
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardText: { fontSize: 14, color: theme.reflect.title },
    cardInput: { fontSize: 14, color: theme.text, textAlignVertical: "top" },

    primaryButton: {
      backgroundColor: theme.reflect.button,
      borderRadius: 24,
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 16,
    },
    primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    secondaryButton: {
      backgroundColor: theme.reflect.tint,
      borderRadius: 24,
      paddingVertical: 12,
      alignItems: "center",
    },
    secondaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });