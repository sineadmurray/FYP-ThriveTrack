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

export default function EodEntryDataScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useLocalSearchParams<{
    id?: string;
    created_at?: string;
    went_well?: string;
    learned?: string;
    proud_of?: string;
    self_care?: string;
  }>();

  const { niceDate, niceTime } = useMemo(
    () => formatDate(params.created_at),
    [params.created_at]
  );

  const [wentWell, setWentWell] = useState(params.went_well ?? "");
  const [learned, setLearned] = useState(params.learned ?? "");
  const [proudOf, setProudOf] = useState(params.proud_of ?? "");
  const [selfCare, setSelfCare] = useState(params.self_care ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!params.id) return;

    try {
      setSaving(true);

      const res = await authedFetch(`/end_of_day_reflections/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          went_well: wentWell,
          learned,
          proud_of: proudOf,
          self_care: selfCare,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      Alert.alert("Saved ✅", "Your reflection has been updated.");
      setIsEditing(false);
    } catch (e) {
      console.log("EOD update error", e);
      Alert.alert("Oops", "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!params.id) return;

    Alert.alert(
      "Delete entry?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(params.id!),
        },
      ],
      { cancelable: true }
    );
  }

  async function handleDelete(id: string) {
    try {
      const res = await authedFetch(`/end_of_day_reflections/${id}`, { method: "DELETE" });

      if (!res.ok && res.status !== 204) {
        throw new Error(`HTTP ${res.status}`);
      }

      Alert.alert("Deleted", "Your reflection has been deleted.");
      router.replace("/thrive/accessalldata");
    } catch (e) {
      console.log("EOD delete error", e);
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
            <View style={[s.menuLine, { width: 18 }]} />
            <View style={[s.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* Back + title */}
        <View style={s.titleRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>End of Day Reflection</Text>
            <Text style={s.subtitle}>
              {niceDate} — {niceTime}
            </Text>
          </View>

        <View style={{ width: 24 }} />
        </View>

        {/* Four cards  */}
        <View style={{ marginTop: 12 }}>
          <View style={s.card}>
            <Text style={s.cardLabel}>What went well today?</Text>
            <View style={s.cardInner}>
              {isEditing ? (
                <TextInput
                  value={wentWell}
                  onChangeText={setWentWell}
                  multiline
                  style={s.cardInput}
                  placeholder="Write a moment, action, or small win that made today better."
                  placeholderTextColor="#b9a5ff"
                />
              ) : (
                <Text style={s.cardText}>
                  {wentWell.trim().length > 0
                    ? wentWell
                    : "No answer added for this question."}
                </Text>
              )}
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardLabel}>Something I learned</Text>
            <View style={s.cardInner}>
              {isEditing ? (
                <TextInput
                  value={learned}
                  onChangeText={setLearned}
                  multiline
                  style={s.cardInput}
                  placeholder="What did today teach you about yourself, others, or life?"
                  placeholderTextColor="#b9a5ff"
                />
              ) : (
                <Text style={s.cardText}>
                  {learned.trim().length > 0
                    ? learned
                    : "No answer added for this question."}
                </Text>
              )}
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardLabel}>I’m proud of myself for...</Text>
            <View style={s.cardInner}>
              {isEditing ? (
                <TextInput
                  value={proudOf}
                  onChangeText={setProudOf}
                  multiline
                  style={s.cardInput}
                  placeholder="A choice, action, or habit you showed today."
                  placeholderTextColor="#b9a5ff"
                />
              ) : (
                <Text style={s.cardText}>
                  {proudOf.trim().length > 0
                    ? proudOf
                    : "No answer added for this question."}
                </Text>
              )}
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardLabel}>Self-care I practiced</Text>
            <View style={s.cardInner}>
              {isEditing ? (
                <TextInput
                  value={selfCare}
                  onChangeText={setSelfCare}
                  multiline
                  style={s.cardInput}
                  placeholder="Anything you did, small or big, that supported your well being."
                  placeholderTextColor="#b9a5ff"
                />
              ) : (
                <Text style={s.cardText}>
                  {selfCare.trim().length > 0
                    ? selfCare
                    : "No answer added for this question."}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={{ marginTop: 40 }}>
          <Pressable
            style={s.primaryButton}
            onPress={() => {
              if (isEditing) {
                if (!saving) handleSave();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Text style={s.primaryButtonText}>
              {isEditing
                ? saving
                  ? "Saving..."
                  : "Save Changes"
                : "Edit Entry"}
            </Text>
          </Pressable>

          <Pressable
            style={s.secondaryButton}
            onPress={confirmDelete}
          >
            <Text style={s.secondaryButtonText}>Delete Entry</Text>
          </Pressable>
        </View>
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
      marginTop: 16,
    },
    backBtn: {
      paddingRight: 8,
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
      marginTop: 4,
    },

    card: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 16,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.06,
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
      minHeight: 80,
      justifyContent: "flex-start",
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardText: {
      fontSize: 14,
      color: theme.reflect.title,
    },
    cardInput: {
      fontSize: 14,
      color: theme.text,
      textAlignVertical: "top",
    },

    primaryButton: {
      backgroundColor: theme.reflect.button,
      borderRadius: 24,
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 16,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryButton: {
      backgroundColor: theme.reflect.tint,
      borderRadius: 24,
      paddingVertical: 12,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
  });