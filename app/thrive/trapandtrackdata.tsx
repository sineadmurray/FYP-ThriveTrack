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
import SideDrawer from "../components/SideDrawer";
import { useTheme } from "../theme/ThemeContext";
import type { AppTheme } from "../theme/themes";

export default function TrapTrackEntryDataScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
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

      const res = await authedFetch(`/trap_and_track/${params.id}`,
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
      const res = await authedFetch(`/trap_and_track/${id}`, {
        method: "DELETE",
      });

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

        {/* Back + title */}
        <View style={s.titleRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>Trap & Track</Text>
            <Text style={s.subtitle}>
              {niceDate} — {niceTime}
            </Text>
          </View>

        <View style={{ width: 24 }} />
        </View>

        {/* Trap & Track cards */}
        <View style={{ marginTop: 12 }}>
        <View style={s.card}>
            <Text style={s.cardLabel}>Circumstance</Text>
            <View style={s.cardInner}>
            {isEditing ? (
                <TextInput
                value={circumstance}
                onChangeText={setCircumstance}
                multiline
                style={s.cardInput}
                placeholder="What was going on at the time?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={s.cardText}>
                {circumstance.trim().length > 0
                    ? circumstance
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={s.card}>
            <Text style={s.cardLabel}>Trigger</Text>
            <View style={s.cardInner}>
            {isEditing ? (
                <TextInput
                value={trigger}
                onChangeText={setTrigger}
                multiline
                style={s.cardInput}
                placeholder="What set off the thought or emotion?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={s.cardText}>
                {trigger.trim().length > 0
                    ? trigger
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={s.card}>
            <Text style={s.cardLabel}>Response</Text>
            <View style={s.cardInner}>
            {isEditing ? (
                <TextInput
                value={response}
                onChangeText={setResponse}
                multiline
                style={s.cardInput}
                placeholder="How did you feel or react in the moment?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={s.cardText}>
                {response.trim().length > 0
                    ? response
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={s.card}>
            <Text style={s.cardLabel}>Avoidance Pattern</Text>
            <View style={s.cardInner}>
            {isEditing ? (
                <TextInput
                value={avoidance}
                onChangeText={setAvoidance}
                multiline
                style={s.cardInput}
                placeholder="Did you avoid anything or withdraw in response?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={s.cardText}>
                {avoidance.trim().length > 0
                    ? avoidance
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={s.card}>
            <Text style={s.cardLabel}>Consequences</Text>
            <View style={s.cardInner}>
            {isEditing ? (
                <TextInput
                value={consequence}
                onChangeText={setConsequence}
                multiline
                style={s.cardInput}
                placeholder="How did this affect your thoughts, mood, or behaviour afterward?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={s.cardText}>
                {consequence.trim().length > 0
                    ? consequence
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={s.card}>
            <Text style={s.cardLabel}>Possible Alternative Coping Strategies</Text>
            <View style={s.cardInner}>
            {isEditing ? (
                <TextInput
                value={copingstrategy}
                onChangeText={setCopingStrategy}
                multiline
                style={s.cardInput}
                placeholder="List healthier ways you could respond in this situation."
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={s.cardText}>
                {copingstrategy.trim().length > 0
                    ? copingstrategy
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={s.card}>
            <Text style={s.cardLabel}>Choose One Alternative to Try</Text>
            <View style={s.cardInner}>
            {isEditing ? (
                <TextInput
                value={tryalternative}
                onChangeText={setTryAlternative}
                multiline
                style={s.cardInput}
                placeholder="Pick one strategy to use next time this happens."
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={s.cardText}>
                {tryalternative.trim().length > 0
                    ? tryalternative
                    : "No answer added for this question."}
                </Text>
            )}
            </View>
        </View>

        <View style={s.card}>
            <Text style={s.cardLabel}>Consequences (After Trying the Alternative)</Text>
            <View style={s.cardInner}>
            {isEditing ? (
                <TextInput
                value={consequenceafter}
                onChangeText={setConsequenceAfter}
                multiline
                style={s.cardInput}
                placeholder="If you tried this new approach, how do you think you would feel or react afterward?"
                placeholderTextColor="#b9a5ff"
                />
            ) : (
                <Text style={s.cardText}>
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
