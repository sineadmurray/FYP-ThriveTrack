import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import SideDrawer from "../components/SideDrawer";
import { useTheme } from "../theme/ThemeContext";
import type { AppTheme } from "../theme/themes";

// Theme (same vibe as your other screens)
const BG = "#fff5f7";
const CARD_BG = "#ffffff";
const TEXT = "#222";
const SUBTLE = "#8f8f9a";
const DIVIDER = "#ececf0";
const DANGER = "#E24A4A";
const SHADOW = "#000";
const PINK = "#EB4C87";

export default function SettingsScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [displayName, setDisplayName] = useState("—");
  const [email, setEmail] = useState("—");

  const { theme, isDark, setDark } = useTheme();
  const s = styles(theme);

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    refreshUser();
  }, []);

  async function refreshUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    const user = data.user;

    const name = (user?.user_metadata as any)?.display_name ?? "—";
    setDisplayName(name);
    setNameDraft(name === "—" ? "" : name);
    setEmail(user?.email ?? "—");
  }

  function confirmDelete() {
    Alert.alert(
      "Delete account & data?",
      "This will permanently remove your account and all saved entries. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Not implemented", "This will be implemented later.");
          },
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert("Log out?", "You will need to sign in again to access your account.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) Alert.alert("Logout failed", error.message);
        },
      },
    ]);
  }

  async function saveDisplayName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      Alert.alert("Display name required", "Please enter a name.");
      return;
    }

    setSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    });
    setSavingName(false);

    if (error) {
      Alert.alert("Update failed", error.message);
      return;
    }

    setEditingName(false);
    await refreshUser();
    Alert.alert("Updated", "Your display name has been updated.");
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

        {/* Back + title row */}
        <View style={s.titleRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.title}>Settings</Text>
            <Text style={s.subtitle}>Manage your profile and preferences</Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* PROFILE */}
        <Text style={s.sectionLabel}>PROFILE</Text>
        <View style={s.card}>
          {/* Display name block */}
          <View style={s.rowBlock}>
            <Text style={s.rowLabel}>Display Name</Text>

            {!editingName ? (
              <Text style={s.rowValue}>{displayName}</Text>
            ) : (
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Enter your display name"
                placeholderTextColor="#b2b2bb"
                style={s.nameInput}
                autoCapitalize="words"
              />
            )}
          </View>

          <View style={s.divider} />

          {/* Email block */}
          <View style={s.rowBlock}>
            <Text style={s.rowLabel}>Email</Text>
            <Text style={s.rowValueSmall}>{email}</Text>
          </View>

          <View style={s.divider} />

          {/* Edit / Save actions */}
          {!editingName ? (
            <Pressable
              onPress={() => setEditingName(true)}
              style={({ pressed }) => [s.rowAction, pressed && s.pressed]}
            >
              <Text style={s.actionText}>Edit Display Name</Text>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          ) : (
            <View style={s.editActions}>
              <Pressable
                onPress={() => {
                  setEditingName(false);
                  setNameDraft(displayName === "—" ? "" : displayName);
                }}
                style={({ pressed }) => [s.secondaryBtn, pressed && s.pressed]}
                disabled={savingName}
              >
                <Text style={s.secondaryText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={saveDisplayName}
                style={({ pressed }) => [
                  s.primaryBtn,
                  pressed && s.pressed,
                  savingName && { opacity: 0.7 },
                ]}
                disabled={savingName}
              >
                <Text style={s.primaryText}>{savingName ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* NOTIFICATIONS */}
        <Text style={s.sectionLabel}>NOTIFICATIONS &amp; REMINDERS</Text>
        <View style={s.cardSingle}>
          <Pressable onPress={() => {}} style={({ pressed }) => [s.rowAction, pressed && s.pressed]}>
            <View style={{ flex: 1 }}>
              <Text style={s.actionText}>Manage Notifications</Text>
              <Text style={s.comingSoon}>Coming soon</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </Pressable>
        </View>

        {/* THEME */}
        <Text style={s.sectionLabel}>THEME &amp; PERSONALISATION</Text>

        <View style={s.cardSingle}>
          <View style={s.rowAction}>
            <View style={{ flex: 1 }}>
              <Text style={s.actionText}>Dark Mode</Text>
              <Text style={s.comingSoon}>
                {isDark ? "On" : "Off"}
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={setDark}
            />
          </View>
        </View>

        {/* PRIVACY */}
        <Text style={s.sectionLabel}>PRIVACY &amp; DATA</Text>
        <View style={s.card}>
          <Pressable onPress={() => {}} style={({ pressed }) => [s.rowAction, pressed && s.pressed]}>
            <Text style={s.actionText}>View Privacy Policy</Text>
            <Text style={s.chevron}>›</Text>
          </Pressable>

          <View style={s.divider} />

          <Pressable onPress={confirmDelete} style={({ pressed }) => [s.rowAction, pressed && s.pressed]}>
            <Text style={[s.actionText, { color: DANGER }]}>Delete My Account &amp; Data</Text>
            <Text style={s.chevron}>›</Text>
          </Pressable>
        </View>

        {/* ABOUT */}
        <Text style={s.sectionLabel}>ABOUT THRIVETRACK</Text>
        <View style={s.card}>
          <View style={s.rowBlock}>
            <Text style={s.rowLabel}>App Version</Text>
            <Text style={s.rowValueSmall}>1.0</Text>
          </View>

          <View style={s.spacer} />

          <View style={s.rowBlock}>
            <Text style={s.rowLabel}>Project Type</Text>
            <Text style={s.rowValueSmall}>Final Year Project</Text>
          </View>

          <View style={s.spacer} />

          <View style={s.rowBlock}>
            <Text style={s.rowLabel}>Proof of Value</Text>
            <Text style={s.bodyText}>
              Developed as a Proof of Value to demonstrate how technology can support student wellbeing.
            </Text>
          </View>

          <View style={s.spacer} />

          <View style={s.rowBlock}>
            <Text style={s.rowLabel}>Technologies Used</Text>
            <Text style={s.bodyText}>React Native • Node.js • PostgreSQL</Text>
          </View>
        </View>

        {/* LOGOUT */}
        <Pressable onPress={handleLogout} style={({ pressed }) => [s.logoutBtn, pressed && s.pressed]}>
          <Text style={s.logoutText}>Logout</Text>
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
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
      marginBottom: 10,
    },
    backBtn: { paddingRight: 8 },
    backArrow: { fontSize: 26, color: theme.text },
    title: { fontSize: 22, fontWeight: "800", color: theme.text, textAlign: "center" },
    subtitle: { fontSize: 13, color: theme.subtleText, marginTop: 4 },

    sectionLabel: {
      fontSize: 13,
      letterSpacing: 1.2,
      color: theme.muted,
      fontWeight: "700",
      marginTop: 18,
      marginBottom: 8,
    },

    card: {
      backgroundColor: theme.card,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "#2A2A35" : "#f0f0f4",
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardSingle: {
      backgroundColor: theme.card,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "#2A2A35" : "#f0f0f4",
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },

    rowBlock: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowLabel: {
      fontSize: 14,
      color: theme.muted,
      fontWeight: "600",
      marginBottom: 6,
    },
    rowValue: {
      fontSize: 20,
      color: theme.text,
      fontWeight: "700",
    },
    rowValueSmall: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "700",
    },

    nameInput: {
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "#2A2A35" : "#ececf0",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.mode === "dark" ? "#121218" : "#fff",
      fontWeight: "700",
    },

    rowAction: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    actionText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    chevron: {
      marginLeft: 10,
      fontSize: 22,
      color: theme.mode === "dark" ? "#6b6b78" : "#b6b6c0",
      fontWeight: "700",
    },

    editActions: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    secondaryBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "#2A2A35" : "#f0f0f4",
      backgroundColor: theme.card,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
    },
    secondaryText: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
    },
    primaryBtn: {
      flex: 1,
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryText: {
      fontSize: 16,
      fontWeight: "800",
      color: "#fff",
    },

    divider: { height: 1, backgroundColor: theme.mode === "dark" ? "#2A2A35" : "#ececf0" },

    comingSoon: {
      marginTop: 6,
      fontSize: 14,
      color: theme.subtleText,
      fontWeight: "600",
    },

    spacer: { height: 8 },
    bodyText: {
      fontSize: 15,
      color: theme.subtleText,
      lineHeight: 21,
      fontWeight: "500",
    },

    logoutBtn: {
      marginTop: 18,
      backgroundColor: theme.card,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "#2A2A35" : "#f0f0f4",
    },
    logoutText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },

    pressed: { opacity: 0.7 },
  });