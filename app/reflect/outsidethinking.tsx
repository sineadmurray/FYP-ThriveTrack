import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

const DEMO_USER_ID = "demo-student-1";

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

      const res = await fetch(`${API_BASE}/outside_in_actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: DEMO_USER_ID,
          prompt_id: prompt.id,
          action_text: value,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved 💜", "Your action has been saved.", [
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
            <View style={[styles.menuLine, { width: 18 }]} />
            <View style={[styles.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* Back + Title */}
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>Outside-In Thinking</Text>
            <Text style={styles.subtitle}>
              Small actions can shift big feelings.
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Prompt Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today’s Prompt</Text>

          <Text style={styles.promptText}>
            {prompt ? prompt.prompt_text : loading ? "Loading…" : "No prompt available."}
          </Text>

          <Pressable
            onPress={() => {
              if (!loading) loadNewPrompt();
            }}
            disabled={loading}
            style={({ pressed }) => [
              styles.tryButton,
              { opacity: loading ? 0.65 : pressed ? 0.95 : 1 },
            ]}
          >
            <Text style={styles.tryButtonText}>
              {loading ? "Loading..." : "Try a different prompt"}
            </Text>
          </Pressable>
        </View>

        {/* Action Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your Action for Tomorrow</Text>

          <View style={styles.cardInner}>
            <TextInput
              value={trimmed}
              onChangeText={setAction}
              placeholder="Write one small step you could take."
              placeholderTextColor="#b9a5ff"
              multiline
              style={styles.cardInput}
              textAlignVertical="top"
              maxLength={maxLen}
            />
          </View>

          <Text style={styles.charCount}>
            {trimmed.length}/{maxLen}
          </Text>
        </View>

        {/* Inspiration dropdown */}
        <View style={styles.dropdown}>
          <Pressable
            onPress={() => setOpenInspo((v) => !v)}
            style={({ pressed }) => [
              styles.dropdownHeader,
              { opacity: pressed ? 0.96 : 1 },
            ]}
          >
            <Text style={styles.dropdownTitle}>Need Inspiration?</Text>
            <Text style={styles.dropdownChevron}>{openInspo ? "˄" : "˅"}</Text>
          </Pressable>

          {openInspo && (
            <View style={styles.dropdownBody}>
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
                    styles.inspoItem,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text style={styles.inspoText}>• {i.inspiration_text}</Text>
                </Pressable>
              ))}

              {!loading && inspirations.length === 0 ? (
                <Text style={styles.inspoText}>• No inspirations found.</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Save button */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: saving ? 0.65 : pressed ? 0.95 : 1 },
          ]}
          onPress={() => {
            if (!saving) handleSave();
          }}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Action"}
          </Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

/* Theme (matches your purple reflect screens) */
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
    color: TEXT,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    color: PURPLE,
    textAlign: "center",
    marginTop: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#6f6f6f",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    marginTop: 8,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: PURPLE,
    marginBottom: 12,
  },

  promptText: {
    fontSize: 16,
    color: PURPLE,
    lineHeight: 22,
    marginBottom: 14,
    fontStyle: "italic",
    textAlign: "center",
  },

  tryButton: {
    alignSelf: "center",
    backgroundColor: INNER_BG,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  tryButtonText: {
    color: PURPLE,
    fontWeight: "800",
    fontSize: 14,
  },

  cardInner: {
    backgroundColor: INNER_BG,
    borderRadius: 18,
    padding: 12,
    minHeight: 160,
    justifyContent: "flex-start",
  },
  cardInput: {
    fontSize: 14,
    color: PURPLE,
    textAlignVertical: "top",
  },
  charCount: {
    marginTop: 8,
    textAlign: "right",
    fontSize: 12,
    color: "#9b95bf",
  },

  dropdown: {
    marginTop: 16,
    backgroundColor: CARD_BG,
    borderRadius: 22,
    shadowColor: SHADOW,
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
    color: PURPLE,
  },
  dropdownChevron: {
    fontSize: 18,
    color: PURPLE,
    fontWeight: "800",
  },
  dropdownBody: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: 4,
    backgroundColor: "#faf7ff",
  },
  inspoItem: {
    paddingVertical: 10,
    borderRadius: 12,
  },
  inspoText: {
    color: PURPLE,
    fontSize: 14,
    lineHeight: 20,
  },

  saveButton: {
    marginTop: 28,
    marginBottom: 10,
    backgroundColor: BUTTON_PURPLE,
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
