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

      const res = await fetch(`${API_BASE}/where_i_am_reflections/${params.id}`, {
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
      const res = await fetch(`${API_BASE}/where_i_am_reflections/${id}`, {
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
            <Text style={styles.title}>Where I Am Now /</Text>
            <Text style={styles.title}>Where I Want to Be</Text>
            <Text style={styles.subtitle}>
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
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>
        {icon} <Text style={styles.sectionTitleText}>{title}</Text>
      </Text>

      <Text style={styles.promptLabel}>Where I Am Now</Text>
      <View style={styles.cardInner}>
        {isEditing ? (
          <TextInput
            value={nowValue}
            onChangeText={onChangeNow}
            placeholder="Describe your current state..."
            placeholderTextColor={MINT_PLACEHOLDER}
            multiline
            style={styles.cardInput}
          />
        ) : (
          <Text style={styles.cardText}>
            {nowValue.trim().length > 0 ? nowValue : "No answer added for this question."}
          </Text>
        )}
      </View>

      <Text style={[styles.promptLabel, { marginTop: 14 }]}>Where I Want To Be</Text>
      <View style={styles.cardInner}>
        {isEditing ? (
          <TextInput
            value={wantValue}
            onChangeText={onChangeWant}
            placeholder="Describe where you’d like to grow..."
            placeholderTextColor={MINT_PLACEHOLDER}
            multiline
            style={styles.cardInput}
          />
        ) : (
          <Text style={styles.cardText}>
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
    fontSize: 22,
    fontWeight: "900",
    color: MINT,
    textAlign: "center",
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 6,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: MINT,
    marginBottom: 10,
  },
  sectionTitleText: {
    color: MINT,
  },

  promptLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },

  cardInner: {
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 88,
    borderWidth: 1,
    borderColor: "#c9f3df",
    justifyContent: "flex-start",
  },
  cardText: {
    fontSize: 14,
    color: "#2b6a54",
  },
  cardInput: {
    fontSize: 14,
    color: "#2b6a54",
    textAlignVertical: "top",
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
    fontWeight: "800",
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
    fontWeight: "800",
  },
});
