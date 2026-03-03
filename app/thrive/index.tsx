import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";

export default function ThriveScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const items: { title: string; desc: string; onPress?: () => void }[] = [
    {
      title: "AI Reflection Assistant",
      desc: "A calm companion to help you process your thoughts.",
      onPress: () => router.push("/thrive/aiassistant"),
    },
    {
      title: "Mood Insights & Graphs",
      desc: "See your mood patterns over time with simple, clear visuals.",
      onPress: () => router.push("/thrive/moodinsights"),
    },
    {
      title: "Weekly Summary",
      desc: "Get a quick snapshot of your week – highs, lows, and progress.",
      onPress: () => router.push("/thrive/weeklysummary"),
      
    },
    {
      title: "Access All Data",
      desc: "View your past entries in one place to spot trends and reflect.",
      onPress: () => router.push("/thrive/accessalldata"),
    },
    {
      title: "Export & Share",
      desc: "Export or share your progress if you’d like extra support.",
     onPress: () => router.push("/thrive/export"),
    },
    {
      title: "Resources Hub",
      desc: "Find helpful supports, links, and information when you need it.",
      onPress: () => router.push("/thrive/resources"),
    },
  ];

  return (
    <View style={s.root}>
      {/* Main content */}
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ----- Header  ----- */}
        <View style={s.header}>
          <Image
            source={require("../../assets/images/ThriveTrack Logo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.appTitle}>Reflect, Grow &amp; Thrive</Text>

          {/* Hamburger */}
          <Pressable style={s.menu} onPress={() => setDrawerOpen(true)}>
            <View style={s.menuLine} />
            <View style={[s.menuLine, { width: 18 }]} />
            <View style={[s.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* ----- Hero ----- */}
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <View style={s.iconBadge}>
            <Text style={{ fontSize: 22 }}>🌸</Text>
          </View>
          <Text style={s.title}>Thrive</Text>
          <Text style={s.subtitle}>
            See your progress, celebrate wins, and stay inspired.
          </Text>
        </View>

        {/* ----- Cards ----- */}
        <View style={{ marginTop: 10 }}>
          {items.map((it, idx) => (
            <ThriveCard
              key={idx}
              title={it.title}
              desc={it.desc}
              onPress={it.onPress ?? (() => {})}
            />
          ))}
        </View>
      </ScrollView>

      {/* Drawer LAST so it sits on top */}
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function ThriveCard({
  title,
  desc,
  onPress,
}: {
  title: string;
  desc: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, { opacity: pressed ? 0.96 : 1 }]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={s.cardTitle}>{title}</Text>
        <Text style={s.cardDesc}>{desc}</Text>
      </View>

      <View style={s.chev}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>➜</Text>
      </View>
    </Pressable>
  );
}

// ✅ ThriveScreen styles (theme-based)
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

    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
      marginBottom: 8,
    },
    title: {
      fontSize: 36,
      lineHeight: 40,
      fontWeight: "800",
      color: theme.thrive.title,
      textAlign: "center",
      marginTop: 6,
    },
    subtitle: {
      textAlign: "center",
      color: theme.subtleText,
      fontSize: 18,
      lineHeight: 26,
      marginTop: 8,
      marginBottom: 8,
    },

    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 22,
      paddingVertical: 18,
      paddingHorizontal: 20,
      marginVertical: 10,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    cardTitle: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "800",
      color: theme.thrive.title,
      marginBottom: 6,
    },
    cardDesc: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.subtleText,
    },
    chev: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.thrive.chevBg, // ✅ new theme key
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },
  });