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

  mind?: string;
  body?: string;
  career?: string;
  relationships?: string;

  held_me_back?: string;
  lesson_learned?: string;
  next_weeks_focus?: string;
};

type AreasKey = "mind" | "body" | "career" | "relationships";

export default function WeeklyReflectionDataScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useLocalSearchParams<Params>();

  const { niceDate, niceTime } = useMemo(
    () => formatDate(params.created_at),
    [params.created_at]
  );

  const [areas, setAreas] = useState<Record<AreasKey, string>>({
    mind: params.mind ?? "",
    body: params.body ?? "",
    career: params.career ?? "",
    relationships: params.relationships ?? "",
  });

  const [heldMeBack, setHeldMeBack] = useState(params.held_me_back ?? "");
  const [lessonLearned, setLessonLearned] = useState(params.lesson_learned ?? "");
  const [nextWeeksFocus, setNextWeeksFocus] = useState(params.next_weeks_focus ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateArea = (key: AreasKey, value: string) => {
    setAreas((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSave() {
    if (!params.id) return;

    try {
      setSaving(true);

      const res = await authedFetch(`/weekly_reflections/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mind: areas.mind,
          body: areas.body,
          career: areas.career,
          relationships: areas.relationships,
          held_me_back: heldMeBack,
          lesson_learned: lessonLearned,
          next_weeks_focus: nextWeeksFocus,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Saved ✅", "Your weekly reflection has been updated.");
      setIsEditing(false);
    } catch (e) {
      console.log("Weekly reflection update error", e);
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
      const res = await authedFetch(`/weekly_reflections/${id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);

      Alert.alert("Deleted", "Your weekly reflection has been deleted.");
      router.replace("/thrive/accessalldata");
    } catch (e) {
      console.log("Weekly reflection delete error", e);
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
            <Text style={s.title}>Weekly Reflection</Text>
            <Text style={s.subtitle}>
              {niceDate} {niceTime ? `— ${niceTime}` : ""}
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Group card: 4 areas */}
        <View style={s.groupCard}>
          <AreaBlock
            icon="🧠"
            title="Mind"
            value={areas.mind}
            isEditing={isEditing}
            onChangeText={(t) => updateArea("mind", t)}
          />
          <AreaBlock
            icon="💪"
            title="Body"
            value={areas.body}
            isEditing={isEditing}
            onChangeText={(t) => updateArea("body", t)}
          />
          <AreaBlock
            icon="💼"
            title="Career"
            value={areas.career}
            isEditing={isEditing}
            onChangeText={(t) => updateArea("career", t)}
          />
          <AreaBlock
            icon="💗"
            title="Relationships"
            value={areas.relationships}
            isEditing={isEditing}
            onChangeText={(t) => updateArea("relationships", t)}
          />
        </View>

        {/* Other cards */}
        <SingleCard
          title="What Held Me Back?"
          placeholder="Was there anything that made the week harder?"
          value={heldMeBack}
          isEditing={isEditing}
          onChangeText={setHeldMeBack}
        />

        <SingleCard
          title="Lesson Learned"
          placeholder="What did this week teach you?"
          value={lessonLearned}
          isEditing={isEditing}
          onChangeText={setLessonLearned}
        />

        <SingleCard
          title="Next Week’s Focus"
          placeholder="What do you want to bring into the next week?"
          value={nextWeeksFocus}
          isEditing={isEditing}
          onChangeText={setNextWeeksFocus}
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

function AreaBlock({
  icon,
  title,
  value,
  isEditing,
  onChangeText,
}: {
  icon: string;
  title: string;
  value: string;
  isEditing: boolean;
  onChangeText: (t: string) => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.areaBlock}>
      <Text style={s.areaTitle}>
        {icon} <Text style={s.areaTitleText}>{title}</Text>
      </Text>

      <View style={s.inputShell}>
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Reflect on how you showed progress in this area..."
            placeholderTextColor={theme.grow.placeholder}
            multiline
            style={s.input}
          />
        ) : (
          <Text style={s.readText}>
            {value.trim().length > 0 ? value : "No answer added for this area."}
          </Text>
        )}
      </View>
    </View>
  );
}

function SingleCard({
  title,
  placeholder,
  value,
  isEditing,
  onChangeText,
}: {
  title: string;
  placeholder: string;
  value: string;
  isEditing: boolean;
  onChangeText: (t: string) => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.singleCard}>
      <Text style={s.singleTitle}>{title}</Text>
      <View style={s.inputShellTall}>
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.grow.placeholder}
            multiline
            style={s.input}
          />
        ) : (
          <Text style={s.readText}>
            {value.trim().length > 0 ? value : "No answer added for this section."}
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
      fontSize: 30,
      lineHeight: 34,
      fontWeight: "900",
      color: theme.grow.title,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 13,
      color: theme.subtleText,
      textAlign: "center",
      marginTop: 6,
    },

    groupCard: {
      backgroundColor: theme.card,
      borderRadius: 26,
      padding: 16,
      marginTop: 10,
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    areaBlock: {
      marginBottom: 14,
    },
    areaTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: theme.grow.title,
      marginBottom: 8,
    },
    areaTitleText: {
      color: theme.grow.title,
    },

    inputShell: {
      backgroundColor: theme.grow.inputBg,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 82,
      borderWidth: 1,
      borderColor: theme.grow.inputBorder,
    },
    inputShellTall: {
      backgroundColor: theme.grow.inputBg,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 120,
      borderWidth: 1,
      borderColor: theme.grow.inputBorder,
    },
    input: {
      fontSize: 14,
      color: theme.grow.inputText,
      textAlignVertical: "top",
    },
    readText: {
      fontSize: 14,
      color: theme.grow.inputText,
      lineHeight: 20,
    },

    singleCard: {
      backgroundColor: theme.card,
      borderRadius: 26,
      padding: 16,
      marginTop: 14,
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    singleTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: theme.grow.title,
      marginBottom: 10,
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
      fontWeight: "900",
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
      fontWeight: "900",
    },
  });