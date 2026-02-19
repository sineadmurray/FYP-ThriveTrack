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

export default function TrapTrackEntryDataScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useLocalSearchParams<{
    id?: string;
    created_at?: string;
    circumstance?: string;
    trigger?: string;
    response?: string;
    avoidance?: string;
    consequence?: string;
    copingstrategy?: string;
    tryalternative?: string;
    consequenceafter?: string;
  }>();

  const { niceDate, niceTime } = useMemo(
    () => formatDate(params.created_at),
    [params.created_at]
  );

  const [circumstance, setCircumstance] = useState(params.circumstance ?? "");
  const [trigger, setTrigger] = useState(params.trigger ?? "");
  const [response, setResponse] = useState(params.response ?? "");
  const [avoidance, setAvoidance] = useState(params.avoidance ?? "");
  const [consequence, setConsequence] = useState(params.consequence ?? "");
  const [copingstrategy, setCopingStrategy] = useState(params.copingstrategy ?? "");
  const [tryalternative, setTryAlternative] = useState(params.tryalternative ?? "");
  const [consequenceafter, setConsequenceAfter] = useState(params.consequenceafter ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!params.id) return;

    try {
      setSaving(true);

      const res = await fetch(
        `${API_BASE}/trap_and_track/${params.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            circumstance: circumstance,
            trigger: trigger,
            response: response,
            avoidance: avoidance,
            consequence: consequence,
            copingstrategy: copingstrategy,
            tryalternative: tryalternative,
            consequenceafter: consequenceafter,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      Alert.alert("Saved ✅", "Your Trap & Track has been updated.");
      setIsEditing(false);
    } catch (e) {
      console.log("TT update error", e);
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
      const res = await fetch(
        `${API_BASE}/trap_and_track/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok && res.status !== 204) {
        throw new Error(`HTTP ${res.status}`);
      }

      Alert.alert("Deleted", "Your Trap & Track has been deleted.");
      router.replace("/thrive/accessalldata");
    } catch (e) {
      console.log("TT delete error", e);
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
            <Text style={styles.title}>Trap & Track</Text>
            <Text style={styles.subtitle}>
              {niceDate} — {niceTime}
            </Text>
          </View>

        <View style={{ width: 24 }} />
        </View>

        {/* Trap & Track cards */}
        <View style={{ marginTop: 12 }}>
        <View style={styles.card}>
            <Text style={styles.cardLabel}>Circumstance</Text>
            <View style={styles.cardInner}>
            {isEditing ? (
                <TextInput
                value={circumstance}
                onChangeText={setCircumstance}
                multiline
                style={styles.cardInput}
                placeholder="What was going on at the time?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={styles.cardText}>
                {circumstance.trim().length > 0
                    ? circumstance
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardLabel}>Trigger</Text>
            <View style={styles.cardInner}>
            {isEditing ? (
                <TextInput
                value={trigger}
                onChangeText={setTrigger}
                multiline
                style={styles.cardInput}
                placeholder="What set off the thought or emotion?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={styles.cardText}>
                {trigger.trim().length > 0
                    ? trigger
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardLabel}>Response</Text>
            <View style={styles.cardInner}>
            {isEditing ? (
                <TextInput
                value={response}
                onChangeText={setResponse}
                multiline
                style={styles.cardInput}
                placeholder="How did you feel or react in the moment?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={styles.cardText}>
                {response.trim().length > 0
                    ? response
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardLabel}>Avoidance Pattern</Text>
            <View style={styles.cardInner}>
            {isEditing ? (
                <TextInput
                value={avoidance}
                onChangeText={setAvoidance}
                multiline
                style={styles.cardInput}
                placeholder="Did you avoid anything or withdraw in response?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={styles.cardText}>
                {avoidance.trim().length > 0
                    ? avoidance
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardLabel}>Consequences</Text>
            <View style={styles.cardInner}>
            {isEditing ? (
                <TextInput
                value={consequence}
                onChangeText={setConsequence}
                multiline
                style={styles.cardInput}
                placeholder="How did this affect your thoughts, mood, or behaviour afterward?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={styles.cardText}>
                {consequence.trim().length > 0
                    ? consequence
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardLabel}>Possible Alternative Coping Strategies</Text>
            <View style={styles.cardInner}>
            {isEditing ? (
                <TextInput
                value={copingstrategy}
                onChangeText={setCopingStrategy}
                multiline
                style={styles.cardInput}
                placeholder="List healthier ways you could respond in this situation."
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={styles.cardText}>
                {copingstrategy.trim().length > 0
                    ? copingstrategy
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardLabel}>Choose One Alternative to Try</Text>
            <View style={styles.cardInner}>
            {isEditing ? (
                <TextInput
                value={tryalternative}
                onChangeText={setTryAlternative}
                multiline
                style={styles.cardInput}
                placeholder="Pick one strategy to use next time this happens."
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={styles.cardText}>
                {tryalternative.trim().length > 0
                    ? tryalternative
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardLabel}>Consequences (After Trying the Alternative)</Text>
            <View style={styles.cardInner}>
            {isEditing ? (
                <TextInput
                value={consequenceafter}
                onChangeText={setConsequenceAfter}
                multiline
                style={styles.cardInput}
                placeholder="If you tried this new approach, how do you think you would feel or react afterward?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={styles.cardText}>
                {consequenceafter.trim().length > 0
                    ? consequenceafter
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>
        </View>



        {/* Buttons */}
        <View style={{ marginTop: 40 }}>
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
              {isEditing
                ? saving
                  ? "Saving..."
                  : "Save Changes"
                : "Edit Entry"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={confirmDelete}
          >
            <Text style={styles.secondaryButtonText}>Delete Entry</Text>
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

/* Purple theme */
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
    marginTop: 16,
  },
  backBtn: {
    paddingRight: 8,
  },
  backArrow: {
    fontSize: 26,
    color: TEXT,
  },
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

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: PURPLE,
    marginBottom: 10,
  },
  cardInner: {
    backgroundColor: INNER_BG,
    borderRadius: 18,
    padding: 12,
    minHeight: 80,
    justifyContent: "flex-start",
  },
  cardText: {
    fontSize: 14,
    color: PURPLE,
  },
  cardInput: {
    fontSize: 14,
    color: PURPLE,
    textAlignVertical: "top",
  },

  primaryButton: {
    backgroundColor: BUTTON_PURPLE,
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
    backgroundColor: "#f8bbd0",
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
