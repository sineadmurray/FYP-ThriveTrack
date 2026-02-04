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

      const res = await fetch(`${API_BASE}/weekly_reflections/${params.id}`, {
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

      Alert.alert("Saved", "Your weekly reflection has been updated.");
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
      const res = await fetch(`${API_BASE}/weekly_reflections/${id}`, {
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
            <Text style={styles.title}>Weekly Reflection</Text>
            <Text style={styles.subtitle}>
              {niceDate} {niceTime ? `— ${niceTime}` : ""}
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Group card: 4 areas */}
        <View style={styles.groupCard}>
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
  return (
    <View style={styles.areaBlock}>
      <Text style={styles.areaTitle}>
        {icon} <Text style={styles.areaTitleText}>{title}</Text>
      </Text>

      <View style={styles.inputShell}>
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Reflect on how you showed progress in this area..."
            placeholderTextColor={MINT_PLACEHOLDER}
            multiline
            style={styles.input}
          />
        ) : (
          <Text style={styles.readText}>
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
  return (
    <View style={styles.singleCard}>
      <Text style={styles.singleTitle}>{title}</Text>
      <View style={styles.inputShellTall}>
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={MINT_PLACEHOLDER}
            multiline
            style={styles.input}
          />
        ) : (
          <Text style={styles.readText}>
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

  groupCard: {
    backgroundColor: CARD_BG,
    borderRadius: 26,
    padding: 16,
    marginTop: 10,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
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
    color: MINT,
    marginBottom: 8,
  },
  areaTitleText: {
    color: MINT,
  },

  inputShell: {
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 82,
    borderWidth: 1,
    borderColor: "#c9f3df",
  },
  inputShellTall: {
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#c9f3df",
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

  singleCard: {
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
  singleTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: MINT,
    marginBottom: 10,
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
