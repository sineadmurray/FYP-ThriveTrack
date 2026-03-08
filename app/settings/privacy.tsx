import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer"; // ✅ same import style as Settings

export default function PrivacyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = styles(theme);

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Header (matches Settings) */}
        <View style={s.header}>
          <Image
            source={require("../../assets/images/ThriveTrackLogo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.appTitle}>Reflect, Grow &amp; Thrive</Text>

          {/* ✅ Menu button (opens SideDrawer) */}
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
            <Text style={s.title}>Privacy Policy</Text>
            <Text style={s.subtitle}>How your data is handled in ThriveTrack</Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Content card */}
        <View style={s.card}>
          <View style={s.block}>
            <Text style={s.sectionTitle}>What We Store</Text>
            <Text style={s.text}>
              ThriveTrack stores your mood entries, reflections, goals and wellbeing data securely in
              our database.
            </Text>
          </View>

          <View style={s.divider} />

          <View style={s.block}>
            <Text style={s.sectionTitle}>How We Use Your Data</Text>
            <Text style={s.text}>
              Your data is used only to display trends, summaries, reminders and exports within the
              app. We do not sell or share your data.
            </Text>
          </View>

          <View style={s.divider} />

          <View style={s.block}>
            <Text style={s.sectionTitle}>Your Control</Text>
            <Text style={s.text}>
              You can edit, delete, export, or permanently remove your account and all associated
              data at any time.
            </Text>
          </View>

          <View style={s.divider} />

          <View style={s.block}>
            <Text style={s.sectionTitle}>Disclaimer</Text>
            <Text style={s.text}>
              ThriveTrack is a wellbeing support tool and does not replace professional medical or
              psychological advice.
            </Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ✅ Side Drawer */}
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
    block: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    divider: {
      height: 1,
      backgroundColor: theme.mode === "dark" ? "#2A2A35" : "#ececf0",
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 6,
    },
    text: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.subtleText,
      fontWeight: "600",
    },
  });