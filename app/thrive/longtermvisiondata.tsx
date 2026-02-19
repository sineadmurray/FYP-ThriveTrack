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

type Params = {
  id?: string;
  created_at?: string;
  vision?: string;
  clear_direction?: string;
};

export default function LongTermVisionDataScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useLocalSearchParams<Params>();

  const { niceDate, niceTime } = useMemo(
    () => formatDate(params.created_at),
    [params.created_at]
  );

  const [vision, setVision] = useState(params.vision ?? "");
  const [clearDirection, setClearDirection] = useState(params.clear_direction ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!params.id) return;

    try {
      setSaving(true);

      const res = await fetch(`${API_BASE}/long_term_visions/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vision,
          clear_direction: clearDirection,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved ✅", "Your long-term vision has been updated.");
      setIsEditing(false);
    } catch (e) {
      console.log("Long-term vision update error", e);
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
        { text: "Delete", style: "destructive", onPress: () => handleDelete(params.id!) },
      ],
      { cancelable: true }
    );
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${API_BASE}/long_term_visions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Deleted", "Your long-term vision has been deleted.");
      router.replace("/thrive/accessalldata");
    } catch (e) {
      console.log("Long-term vision delete error", e);
      Alert.alert("Oops", "Could not delete entry. Please try again.");
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
            <View style={[styles.menuLine, { width: 18 }]} />
            <View style={[styles.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* Back + title */}
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>Long-Term Vision</Text>
            <Text style={styles.subtitle}>
              {niceDate} {niceTime ? `— ${niceTime}` : ""}
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Your Vision */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Vision</Text>
          <View style={[styles.inputShell, { minHeight: 290 }]}>
            {isEditing ? (
              <TextInput
                value={vision}
                onChangeText={setVision}
                placeholder="Describe the future you want — how do you want to feel, live, and show up?"
                placeholderTextColor={MINT_PLACEHOLDER}
                multiline
                style={styles.input}
              />
            ) : (
              <Text style={styles.readText}>
                {vision.trim().length > 0 ? vision : "No answer added for this section."}
              </Text>
            )}
          </View>
        </View>

        {/* SMART helper card (read-only, same as entry screen) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Make Your Vision Clear &amp; Achievable</Text>
          <View style={styles.smartBox}>
            <SmartRow letter="S" label="Specific:" text="What exactly do you want to achieve?" />
            <SmartRow
              letter="M"
              label="Measurable:"
              text="How will you know you’re making progress?"
            />
            <SmartRow
              letter="A"
              label="Achievable:"
              text="Is this realistic for you right now? What supports you’ll need?"
            />
            <SmartRow
              letter="R"
              label="Relevant:"
              text="Why does this matter to you? How does it fit your life?"
            />
            <SmartRow
              letter="T"
              label="Time:"
              text="What’s your timeframe? When do you want to reach it?"
            />
          </View>
        </View>

        {/* Clear Direction */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Clear Direction</Text>
          <View style={[styles.inputShell, { minHeight: 210 }]}>
            {isEditing ? (
              <TextInput
                value={clearDirection}
                onChangeText={setClearDirection}
                placeholder="What’s one clear long-term direction you want to work towards?"
                placeholderTextColor={MINT_PLACEHOLDER}
                multiline
                style={styles.input}
              />
            ) : (
              <Text style={styles.readText}>
                {clearDirection.trim().length > 0
                  ? clearDirection
                  : "No answer added for this section."}
              </Text>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View style={{ marginTop: 24 }}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (isEditing) {
                if (!saving) handleSave();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>
              {isEditing ? (saving ? "Saving..." : "Save Changes") : "Edit Entry"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={confirmDelete}>
            <Text style={styles.secondaryButtonText}>Delete Entry</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function SmartRow({
  letter,
  label,
  text,
}: {
  letter: string;
  label: string;
  text: string;
}) {
  return (
    <View style={styles.smartRow}>
      <Text style={styles.smartLetter}>{letter}</Text>
      <Text style={styles.smartText}>
        <Text style={styles.smartLabel}>{label} </Text>
        {text}
      </Text>
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

/* Mint theme */
const BG = "#fbf6f8";
const TEXT = "#222";
const MINT = "#9fe7c0";
const CARD_BG = "#ffffff";
const INPUT_BG = "#e8fbf1";
const MINT_PLACEHOLDER = "#b7e8d0";
const SHADOW = "#000";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === "android" ? 35 : 55,
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

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
    fontSize: 19,
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
    backgroundColor: "#444",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    marginBottom: 10,
  },
  backBtn: {
    paddingRight: 10,
    paddingTop: 2,
    width: 28,
  },
  backArrow: {
    fontSize: 28,
    color: "#666",
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: MINT,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 6,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 26,
    padding: 16,
    marginTop: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: MINT,
    marginBottom: 10,
  },

  inputShell: {
    backgroundColor: INPUT_BG,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#c9f3df",
    justifyContent: "flex-start",
  },
  input: {
    fontSize: 14,
    color: "#2b6a54",
    textAlignVertical: "top",
  },
  readText: {
    fontSize: 14,
    color: "#2b6a54",
    lineHeight: 20,
  },

  smartBox: {
    backgroundColor: INPUT_BG,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#c9f3df",
  },
  smartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  smartLetter: {
    width: 22,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "900",
    color: MINT,
    marginRight: 8,
    marginTop: 1,
  },
  smartText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#7a7a7a",
  },
  smartLabel: {
    fontWeight: "800",
    color: "#6b6b6b",
  },

  primaryButton: {
    backgroundColor: MINT,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: "#bfeedd",
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
