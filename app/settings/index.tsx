import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SideDrawer from "../components/SideDrawer";

// Theme (same vibe as your other screens)
const BG = "#fff5f7";
const CARD_BG = "#ffffff";
const TEXT = "#222";
const SUBTLE = "#8f8f9a";
const DIVIDER = "#ececf0";
const DANGER = "#E24A4A";
const SHADOW = "#000";

export default function SettingsScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Placeholder profile values
  const displayName = "Sinead";
  const email = "sinead@email.com";

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
            // TODO: hook up real delete later
            Alert.alert("Not implemented", "This will be implemented later.");
          },
        },
      ]
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header (MATCHES Trap & Track) */}
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

        {/* Back + title row (MATCHES Trap & Track) */}
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your profile and preferences</Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* PROFILE */}
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.card}>
          <View style={styles.rowBlock}>
            <Text style={styles.rowLabel}>Display Name</Text>
            <Text style={styles.rowValue}>{displayName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBlock}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{email}</Text>
          </View>

          <View style={styles.divider} />

          <Pressable onPress={() => {}} style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}>
            <Text style={styles.actionText}>Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* NOTIFICATIONS */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS &amp; REMINDERS</Text>
        <View style={styles.cardSingle}>
          <Pressable onPress={() => {}} style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionText}>Manage Notifications</Text>
              <Text style={styles.comingSoon}>Coming soon</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* THEME */}
        <Text style={styles.sectionLabel}>THEME &amp; PERSONALISATION</Text>
        <View style={styles.cardSingle}>
          <Pressable onPress={() => {}} style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionText}>Appearance Settings</Text>
              <Text style={styles.comingSoon}>Coming soon</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* PRIVACY */}
        <Text style={styles.sectionLabel}>PRIVACY &amp; DATA</Text>
        <View style={styles.card}>
          <Pressable onPress={() => {}} style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}>
            <Text style={styles.actionText}>View Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable onPress={confirmDelete} style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}>
            <Text style={[styles.actionText, { color: DANGER }]}>Delete My Account &amp; Data</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* ABOUT */}
        <Text style={styles.sectionLabel}>ABOUT THRIVETRACK</Text>
        <View style={styles.card}>
          <View style={styles.rowBlock}>
            <Text style={styles.rowLabel}>App Version</Text>
            <Text style={styles.rowValue}>1.0</Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.rowBlock}>
            <Text style={styles.rowLabel}>Project Type</Text>
            <Text style={styles.rowValue}>Final Year Project</Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.rowBlock}>
            <Text style={styles.rowLabel}>Proof of Value</Text>
            <Text style={styles.bodyText}>
              Developed as a Proof of Value to demonstrate how technology can support student wellbeing.
            </Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.rowBlock}>
            <Text style={styles.rowLabel}>Technologies Used</Text>
            <Text style={styles.bodyText}>React Native • Node.js • PostgreSQL</Text>
          </View>
        </View>

        {/* LOGOUT */}
        <Pressable onPress={() => {}} style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Side Drawer (MATCHES Trap & Track) */}
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

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

  /* Header (same as Trap & Track) */
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

  /* Back + title row (same pattern as Trap & Track) */
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
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
    color: TEXT,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  sectionLabel: {
    fontSize: 13,
    letterSpacing: 1.2,
    color: SUBTLE,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 8,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f4",
    shadowColor: SHADOW,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardSingle: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f4",
    shadowColor: SHADOW,
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
    color: SUBTLE,
    fontWeight: "600",
    marginBottom: 6,
  },
  rowValue: {
    fontSize: 20,
    color: TEXT,
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
    color: TEXT,
  },
  chevron: {
    marginLeft: 10,
    fontSize: 22,
    color: "#b6b6c0",
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: DIVIDER,
  },

  comingSoon: {
    marginTop: 6,
    fontSize: 14,
    color: "#b2b2bb",
    fontWeight: "600",
  },

  spacer: {
    height: 8,
  },
  bodyText: {
    fontSize: 15,
    color: "#5b5b66",
    lineHeight: 21,
    fontWeight: "500",
  },

  logoutBtn: {
    marginTop: 18,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f4",
  },
  logoutText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2f2f3a",
  },

  pressed: {
    opacity: 0.7,
  },
});
