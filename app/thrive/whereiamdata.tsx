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

type Params = {
  id?: string;
  created_at?: string;

  mind_now?: string;
  mind_want?: string;

  body_now?: string;
  body_want?: string;

  career_now?: string;
  career_want?: string;

  relationships_now?: string;
  relationships_want?: string;
};

export default function WhereIAmEntryDataScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useLocalSearchParams<Params>();

  const { niceDate, niceTime } = useMemo(
    () => formatDate(params.created_at),
    [params.created_at]
  );

  // Local editable state (start from params)
  const [mindNow, setMindNow] = useState(params.mind_now ?? "");
  const [mindWant, setMindWant] = useState(params.mind_want ?? "");

  const [bodyNow, setBodyNow] = useState(params.body_now ?? "");
  const [bodyWant, setBodyWant] = useState(params.body_want ?? "");

  const [careerNow, setCareerNow] = useState(params.career_now ?? "");
  const [careerWant, setCareerWant] = useState(params.career_want ?? "");

  const [relNow, setRelNow] = useState(params.relationships_now ?? "");
  const [relWant, setRelWant] = useState(params.relationships_want ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!params.id) return;

    try {
      setSaving(true);

      const res = await authedFetch(`/where_i_am_reflections/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mind_now: mindNow,
          mind_want: mindWant,
          body_now: bodyNow,
          body_want: bodyWant,
          career_now: careerNow,
          career_want: careerWant,
          relationships_now: relNow,
          relationships_want: relWant,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved ✅", "Your reflection has been updated.");
      setIsEditing(false);
    } catch (e) {
      console.log("WhereIAm update error", e);
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
      const res = await authedFetch(`/where_i_am_reflections/${id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Deleted", "Your reflection has been deleted.");
      router.replace("/thrive/accessalldata");
    } catch (e) {
      console.log("WhereIAm delete error", e);
      Alert.alert("Oops", "Could not delete entry. Please try again.");
    }
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
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
            <Text style={s.title}>Where I Am Now /</Text>
            <Text style={s.title}>Where I Want to Be</Text>
            <Text style={s.subtitle}>
              {niceDate} {niceTime ? `— ${niceTime}` : ""}
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Sections */}
        <DualSectionCard
          icon="🧠"
          title="Mind"
          nowValue={mindNow}
          wantValue={mindWant}
          isEditing={isEditing}
          onChangeNow={setMindNow}
          onChangeWant={setMindWant}
        />

        <DualSectionCard
          icon="💪"
          title="Body"
          nowValue={bodyNow}
          wantValue={bodyWant}
          isEditing={isEditing}
          onChangeNow={setBodyNow}
          onChangeWant={setBodyWant}
        />

        <DualSectionCard
          icon="💼"
          title="Career"
          nowValue={careerNow}
          wantValue={careerWant}
          isEditing={isEditing}
          onChangeNow={setCareerNow}
          onChangeWant={setCareerWant}
        />

        <DualSectionCard
          icon="💗"
          title="Relationships"
          nowValue={relNow}
          wantValue={relWant}
          isEditing={isEditing}
          onChangeNow={setRelNow}
          onChangeWant={setRelWant}
        />

        {/* Buttons */}
        <View style={{ marginTop: 24 }}>
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
              {isEditing ? (saving ? "Saving..." : "Save Changes") : "Edit Entry"}
            </Text>
          </Pressable>

          <Pressable style={s.secondaryButton} onPress={confirmDelete}>
            <Text style={s.secondaryButtonText}>Delete Entry</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function DualSectionCard({
  icon,
  title,
  nowValue,
  wantValue,
  isEditing,
  onChangeNow,
  onChangeWant,
}: {
  icon: string;
  title: string;
  nowValue: string;
  wantValue: string;
  isEditing: boolean;
  onChangeNow: (t: string) => void;
  onChangeWant: (t: string) => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>
        {icon} <Text style={s.sectionTitleText}>{title}</Text>
      </Text>

      <Text style={s.promptLabel}>Where I Am Now</Text>
      <View style={s.cardInner}>
        {isEditing ? (
          <TextInput
            value={nowValue}
            onChangeText={onChangeNow}
            placeholder="Describe your current state..."
            placeholderTextColor={theme.grow.placeholder}
            multiline
            style={s.cardInput}
          />
        ) : (
          <Text style={s.cardText}>
            {nowValue.trim().length > 0 ? nowValue : "No answer added for this question."}
          </Text>
        )}
      </View>

      <Text style={[s.promptLabel, { marginTop: 14 }]}>Where I Want To Be</Text>
      <View style={s.cardInner}>
        {isEditing ? (
          <TextInput
            value={wantValue}
            onChangeText={onChangeWant}
            placeholder="Describe where you’d like to grow..."
            placeholderTextColor={theme.grow.placeholder}
            multiline
            style={s.cardInput}
          />
        ) : (
          <Text style={s.cardText}>
            {wantValue.trim().length > 0 ? wantValue : "No answer added for this question."}
          </Text>
        )}
      </View>
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
      opacity: 0.75,
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
      color: theme.subtleText,
    },
    title: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.grow.title,
      textAlign: "center",
      lineHeight: 26,
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
      marginTop: 14,
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: theme.grow.title,
      marginBottom: 10,
    },
    sectionTitleText: { color: theme.grow.title },

    promptLabel: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 8,
    },

    cardInner: {
      backgroundColor: theme.grow.inputBg,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 88,
      borderWidth: 1,
      borderColor: theme.grow.inputBorder,
      justifyContent: "flex-start",
    },
    cardText: {
      fontSize: 14,
      color: theme.grow.inputText,
    },
    cardInput: {
      fontSize: 14,
      color: theme.grow.inputText,
      textAlignVertical: "top",
    },

    primaryButton: {
      backgroundColor: theme.grow.button,
      borderRadius: 24,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 14,
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
    secondaryButton: {
      backgroundColor: theme.grow.tint,
      borderRadius: 24,
      paddingVertical: 14,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
  });