import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { authedFetch } from "../../lib/authedFetch";
import { supabase } from "../../lib/supabase";
import { cancelScheduled, ensureNotificationPermission, scheduleDailyReminder } from "../../notifications/notifications";
import type { ReminderKey, ReminderSettings } from "../../notifications/reminderSettings";
import { loadReminders, saveReminders } from "../../notifications/reminderSettings";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";

const DANGER = "#E24A4A";

const LABELS: Record<ReminderKey, { title: string; subtitle: string }> = {
  dailyPlan: { title: "Daily plan reminder", subtitle: "Morning nudge to set your priorities" },
  mood: { title: "Mood reminder", subtitle: "Gentle check-in to log how you feel" },
  reflection: { title: "Reflection reminder", subtitle: "Evening prompt for reflection" },
};

function formatTime(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour);
  d.setMinutes(minute);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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

  // Notification settings state
  const [reminders, setReminders] = useState<ReminderSettings | null>(null);
  const [pickerKey, setPickerKey] = useState<ReminderKey | null>(null);

  useEffect(() => {
    refreshUser();
    loadNotificationPrefs();
  }, []);

  async function loadNotificationPrefs() {
    const loaded = await loadReminders();
    setReminders(loaded);
  }

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

  async function deleteAccountAndData() {
  try {
    // Cancel scheduled notifications first 
    if (reminders) {
      await cancelScheduled(reminders.dailyPlan.notificationId);
      await cancelScheduled(reminders.mood.notificationId);
      await cancelScheduled(reminders.reflection.notificationId);
    }

    // Call backend to delete DB rows + Supabase user
    const res = await authedFetch("/me", { method: "DELETE" });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Delete failed");
    }

    // Sign out locally
    await supabase.auth.signOut();

    // Navigate to your auth screen
    router.replace("/"); 
  } catch (e: any) {
    Alert.alert("Delete failed", e?.message ?? "Something went wrong.");
  }
}

function confirmDelete() {
  Alert.alert(
    "Delete account & data?",
    "This will permanently remove your account and all saved entries. This cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteAccountAndData },
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

  // ---------------------------
  // Notification logic
  // ---------------------------
  async function persist(next: ReminderSettings) {
    setReminders(next);
    await saveReminders(next);
  }

  async function setReminderEnabled(key: ReminderKey, enabled: boolean) {
    if (!reminders) return;

    if (enabled) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert(
          "Notifications disabled",
          "Enable notifications in your phone settings to use reminders."
        );
        return;
      }

      // Cancel existing schedule if any 
      await cancelScheduled(reminders[key].notificationId);

      const id = await scheduleDailyReminder(key, reminders[key].hour, reminders[key].minute);

      const next: ReminderSettings = {
        ...reminders,
        [key]: { ...reminders[key], enabled: true, notificationId: id },
      };
      await persist(next);
      return;
    }

    // disabling
    await cancelScheduled(reminders[key].notificationId);

    const next: ReminderSettings = {
      ...reminders,
      [key]: { ...reminders[key], enabled: false, notificationId: null },
    };
    await persist(next);
  }

  async function setReminderTime(key: ReminderKey, hour: number, minute: number) {
    if (!reminders) return;

    const prev = reminders[key];

    // If enabled, reschedule immediately
    if (prev.enabled) {
      await cancelScheduled(prev.notificationId);
      const id = await scheduleDailyReminder(key, hour, minute);

      const next: ReminderSettings = {
        ...reminders,
        [key]: { ...prev, hour, minute, notificationId: id },
      };
      await persist(next);
    } else {
      const next: ReminderSettings = {
        ...reminders,
        [key]: { ...prev, hour, minute },
      };
      await persist(next);
    }
  }

  const pickerValue = useMemo(() => {
    const d = new Date();
    if (!reminders || !pickerKey) return d;
    d.setHours(reminders[pickerKey].hour);
    d.setMinutes(reminders[pickerKey].minute);
    d.setSeconds(0);
    return d;
  }, [reminders, pickerKey]);

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
        <View style={s.card}>
          {reminders ? (
            (["dailyPlan", "mood", "reflection"] as ReminderKey[]).map((key, idx, arr) => {
              const item = reminders[key];

              return (
                <View key={key}>
                  <View style={s.reminderRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={s.reminderTitle}>{LABELS[key].title}</Text>
                      <Text style={s.reminderSub}>{LABELS[key].subtitle}</Text>

                      <Pressable
                        onPress={() => setPickerKey(key)}
                        style={({ pressed }) => [
                          s.timePill,
                          pressed && s.pressed,
                          !item.enabled && { opacity: 0.75 },
                        ]}
                        hitSlop={6}
                      >
                        <Text style={s.timePillText}>
                          Time: {formatTime(item.hour, item.minute)}
                        </Text>
                      </Pressable>
                    </View>

                    <Switch value={item.enabled} onValueChange={(v) => setReminderEnabled(key, v)} />
                  </View>

                  {idx !== arr.length - 1 && <View style={s.divider} />}
                </View>
              );
            })
          ) : (
            <View style={s.rowBlock}>
              <Text style={s.comingSoon}>Loading reminders…</Text>
            </View>
          )}
        </View>

        {/* Time Picker */}
        {pickerKey && reminders && (
          <View style={{ marginTop: 10 }}>
            <DateTimePicker
              value={pickerValue}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                if (Platform.OS !== "ios") setPickerKey(null); // Android closes on select/cancel
                if (!date) return;

                setReminderTime(pickerKey, date.getHours(), date.getMinutes());
              }}
            />

            {Platform.OS === "ios" && (
              <Pressable
                onPress={() => setPickerKey(null)}
                style={({ pressed }) => [s.doneBtn, pressed && s.pressed]}
              >
                <Text style={s.doneText}>Done</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* THEME */}
        <Text style={s.sectionLabel}>THEME &amp; PERSONALISATION</Text>

        <View style={s.cardSingle}>
          <View style={s.rowAction}>
            <View style={{ flex: 1 }}>
              <Text style={s.actionText}>Dark Mode</Text>
              <Text style={s.comingSoon}>{isDark ? "On" : "Off"}</Text>
            </View>

            <Switch value={isDark} onValueChange={setDark} />
          </View>
        </View>

        {/* PRIVACY */}
        <Text style={s.sectionLabel}>PRIVACY &amp; DATA</Text>
        <View style={s.card}>
          <Pressable onPress={() => {router.push("/settings/privacy")}} style={({ pressed }) => [s.rowAction, pressed && s.pressed]}>
            <Text style={s.actionText}>View Privacy Policy</Text>
            <Text style={s.chevron}>›</Text>
          </Pressable>

          <View style={s.divider} />

          <Pressable
            onPress={confirmDelete}
            style={({ pressed }) => [s.rowAction, pressed && s.pressed]}
          >
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

  
    reminderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    reminderTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
    },
    reminderSub: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: "600",
      color: theme.subtleText,
    },
    timePill: {
      alignSelf: "flex-start",
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "#2A2A35" : "#ececf0",
      backgroundColor: theme.mode === "dark" ? "#121218" : "#fff",
    },
    timePillText: {
      fontSize: 13,
      fontWeight: "800",
      color: theme.text,
    },
    doneBtn: {
      marginTop: 10,
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "#2A2A35" : "#ececf0",
      backgroundColor: theme.card,
    },
    doneText: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
    },

    pressed: { opacity: 0.7 },
  });