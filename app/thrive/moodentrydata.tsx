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


export default function MoodEntryDataScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useLocalSearchParams<{
    id?: string;
    mood?: string;
    notes?: string;
    created_at?: string;
  }>();

  const { niceDate, niceTime } = useMemo(
    () => formatDate(params.created_at),
    [params.created_at]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notesValue, setNotesValue] = useState(params.notes ?? "");

  const moodLabel = params.mood ?? "Mood Entry";

  async function handleSave() {
    if (!params.id) return;

    try {
      setSaving(true);
      const res = await authedFetch(`/mood_entries/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: params.mood ?? "Mood Entry",
          notes: notesValue,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      Alert.alert("Saved ✅", "Your entry has been updated.");
      setIsEditing(false);
    } catch (e) {
      console.log("Update error", e);
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
      const res = await authedFetch(`/mood_entries/${id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`HTTP ${res.status}`);
      }

      Alert.alert("Deleted", "Your entry has been deleted.");
      // go back to Access All Data screen
      router.replace("/thrive/accessalldata");
    } catch (e) {
      console.log("Delete error", e);
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

        {/* Back + title row */}
        <View style={s.titleRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>{moodLabel}</Text>
            <Text style={s.subtitle}>
              {niceDate} — {niceTime}
            </Text>
          </View>

          {/* Emoji on the right */}
          <View style={s.emojiBubble}>
            <Text style={{ fontSize: 26 }}>😊</Text>
          </View>
        </View>

        {/* Notes bubble */}
        <View style={s.notesBubble}>
          {isEditing ? (
            <TextInput
              value={notesValue}
              onChangeText={setNotesValue}
              multiline
              placeholder="Write your thoughts here..."
              style={s.notesInput}
            />
          ) : (
            <Text style={s.notesText}>
              {notesValue.trim().length > 0
                ? notesValue
                : "No extra notes added for this entry."}
            </Text>
          )}
        </View>

        {/* Buttons */}
        <View style={{ marginTop: 60 }}>
          <Pressable
            style={s.primaryButton}
            onPress={() => {
              if (isEditing) {
                // save changes
                if (!saving) {
                  handleSave();
                }
              } else {
                // enter edit mode
                setIsEditing(true);
              }
            }}
          >
            <Text style={s.primaryButtonText}>
              {isEditing ? (saving ? "Saving..." : "Save Changes") : "Edit Entry"}
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
  if (!raw) {
    return { niceDate: "", niceTime: "" };
  }
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
      paddingRight: 10,
    },
    backArrow: {
      fontSize: 26,
      color: theme.text,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.thrive.title,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 13,
      color: theme.subtleText,
      marginTop: 4,
    },
    emojiBubble: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.thrive.iconCircleBg,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },

    notesBubble: {
      marginTop: 24,
      backgroundColor: theme.card,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 16,
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    notesText: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
    },
    notesInput: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      minHeight: 120,
      textAlignVertical: "top",
    },

    primaryButton: {
      backgroundColor: theme.thrive.sendBtnBg,
      borderRadius: 24,
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 16,
    },
    primaryButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
    },

    secondaryButton: {
      backgroundColor: theme.thrive.regenerateBtnBg,
      borderRadius: 24,
      paddingVertical: 12,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
    },
  });