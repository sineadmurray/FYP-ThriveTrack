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
import { API_BASE } from "../../lib/api";
import SideDrawer from "../components/SideDrawer";

export default function OutsideThinkingDataScreen() {
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

      const res = await fetch(`${API_BASE}/outside_in_actions/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_text: trimmed }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved", "Your Outside-In action has been updated.");
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
      const res = await fetch(`${API_BASE}/outside_in_actions/${id}`, {
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
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </View>

        {/* Back + title */}
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>Outside-In Thinking</Text>
            <Text style={styles.subtitle}>
              {niceDate} — {niceTime}
            </Text>
          </View>

          <View style={styles.emojiBubble}>
            <Text style={{ fontSize: 22 }}>💭</Text>
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>My action for tomorrow…</Text>

          <View style={styles.cardInner}>
            {isEditing ? (
              <TextInput
                value={value}
                onChangeText={setValue}
                multiline
                style={styles.cardInput}
                placeholder="Write one small action you could take."
                placeholderTextColor="#b9a5ff"
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.cardText}>
                {value.trim().length > 0 ? value : "No action saved."}
              </Text>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View style={{ marginTop: 26 }}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
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
            <Text style={styles.primaryButtonText}>
              {isEditing ? (saving ? "Saving..." : "Save Changes") : "Edit Entry"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed ? 0.95 : 1 },
            ]}
            onPress={confirmDelete}
          >
            <Text style={styles.secondaryButtonText}>Delete Entry</Text>
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

/* Theme */
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
    alignItems: "center",
    marginTop: 12,
  },
  backBtn: { paddingRight: 10 },
  backArrow: { fontSize: 26, color: TEXT },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: PURPLE,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  emojiBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff5d9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    marginTop: 16,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: PURPLE,
    marginBottom: 10,
  },
  cardInner: {
    backgroundColor: INNER_BG,
    borderRadius: 18,
    padding: 12,
    minHeight: 140,
    justifyContent: "flex-start",
  },
  cardText: { fontSize: 14, color: PURPLE },
  cardInput: { fontSize: 14, color: PURPLE, textAlignVertical: "top" },

  primaryButton: {
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#f8bbd0",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
