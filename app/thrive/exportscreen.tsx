import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { ExportCategory, TimePeriod } from "../../export/exportOptions";
import { GROW_OPTIONS, REFLECT_OPTIONS } from "../../export/exportOptions";
import { generateAndSharePdf } from "../../export/pdfExport";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";

/* -------------------- */
/* Small UI components */
/* -------------------- */

function TogglePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.pill, active && s.pillActive]}
      activeOpacity={0.9}
    >
      <Text style={[s.pillText, active && s.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CheckboxCard({
  title,
  subtitle,
  checked,
  onToggle,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[s.card, checked && s.cardChecked]}
      activeOpacity={0.9}
    >
      <View style={[s.checkbox, checked && s.checkboxChecked]} />
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle}>{title}</Text>
        <Text style={s.cardSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* -------------------- */
/* Screen */
/* -------------------- */

export default function ExportShareScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = styles(theme);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [period, setPeriod] = useState<TimePeriod>("lastMonth");
  const [selected, setSelected] = useState<Record<ExportCategory, boolean>>({
    moodLogs: true,
    dailyReflection: true,
    gratitude: false,
    trapAndTrack: false,
    outsideInThinking: false,
    whereIAm: true,
    weeklyReflection: false,
    longTermVision: false,
    dailyPlanner: false,
  });

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const toggle = (key: ExportCategory) =>
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

  const selectAllReflect = () => {
    setSelected((prev) => {
      const next = { ...prev };
      REFLECT_OPTIONS.forEach((o) => (next[o.key] = true));
      return next;
    });
  };

  const selectAllGrow = () => {
    setSelected((prev) => {
      const next = { ...prev };
      GROW_OPTIONS.forEach((o) => (next[o.key] = true));
      return next;
    });
  };

  const onGenerate = async () => {
    if (selectedCount === 0) {
      Alert.alert("Nothing selected", "Please select at least one category to export.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      const userName = data.user?.email ?? "User";

      await generateAndSharePdf({
        period,
        selected,
        userName,
      });
    } catch (e: any) {
      Alert.alert(
        "Export failed",
        e?.message ?? "Something went wrong generating the PDF."
      );
    }
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Header (same layout as Resources screen) */}
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

        {/* Back */}
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </Pressable>

        {/* Title */}
        <Text style={s.title}>Export &amp; Share</Text>
        <Text style={s.subtitle}>Create your personal wellbeing record</Text>

        {/* Info */}
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            Select the data you’d like to include in your PDF. Perfect for sharing with counsellors
            or saving for your own records.
          </Text>
        </View>

        {/* Period */}
        <Text style={s.sectionLabel}>Time Period</Text>
        <View style={s.pillsRow}>
          <TogglePill label="Last Week" active={period === "lastWeek"} onPress={() => setPeriod("lastWeek")} />
          <TogglePill label="Last Month" active={period === "lastMonth"} onPress={() => setPeriod("lastMonth")} />
          <TogglePill label="All Time" active={period === "allTime"} onPress={() => setPeriod("allTime")} />
        </View>

        {/* Reflect */}
        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionTitle}>Reflect Data</Text>
          <TouchableOpacity onPress={selectAllReflect} style={s.selectAllBtn} activeOpacity={0.9}>
            <Text style={s.selectAllText}>Select All</Text>
          </TouchableOpacity>
        </View>

        {REFLECT_OPTIONS.map((o) => (
          <CheckboxCard
            key={o.key}
            title={o.title}
            subtitle={o.subtitle}
            checked={!!selected[o.key]}
            onToggle={() => toggle(o.key)}
          />
        ))}

        {/* Grow */}
        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionTitle}>Grow Data</Text>
          <TouchableOpacity onPress={selectAllGrow} style={s.selectAllBtn} activeOpacity={0.9}>
            <Text style={s.selectAllText}>Select All</Text>
          </TouchableOpacity>
        </View>

        {GROW_OPTIONS.map((o) => (
          <CheckboxCard
            key={o.key}
            title={o.title}
            subtitle={o.subtitle}
            checked={!!selected[o.key]}
            onToggle={() => toggle(o.key)}
          />
        ))}

        {/* Summary */}
        <View style={s.summaryBox}>
          <Text style={s.summaryTitle}>Export Summary</Text>
          <Text style={s.summaryText}>
            {selectedCount} categories selected •{" "}
            {period === "lastWeek" ? "Last 7 days" : period === "lastMonth" ? "Last 30 days" : "All time"}
          </Text>
        </View>

        <TouchableOpacity onPress={onGenerate} style={s.generateBtn} activeOpacity={0.9}>
          <Text style={s.generateBtnText}>Generate PDF</Text>
        </TouchableOpacity>

        <Text style={s.footerText}>Your data stays private and secure</Text>
      </ScrollView>

      {/* IMPORTANT: SideDrawer prop is `visible` (not isOpen) */}
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

/* -------------------- */
/* Styles (theme-based) */
/* -------------------- */

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

    backBtn: {
      paddingRight: 8,
      paddingTop: 4,
    },
    backArrow: {
      color: theme.thrive.title,
      fontSize: 28,
      marginTop: -2,
    },

    title: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      marginTop: 6,
    },
    subtitle: {
      textAlign: "center",
      color: theme.subtleText,
      fontSize: 16,
      lineHeight: 24,
      marginTop: 8,
      marginBottom: 16,
    },

    infoBox: {
      borderRadius: 16,
      padding: 14,
      backgroundColor: theme.thrive.panelBg,
      marginBottom: 18,
    },
    infoText: {
      color: theme.thrive.title,
      fontSize: 14,
      lineHeight: 19,
    },

    sectionLabel: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 10,
      color: theme.text,
    },

    pillsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
    pill: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.thrive.pillBorder,
    },
    pillActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    pillText: { textAlign: "center", fontWeight: "700", color: theme.thrive.pillText },
    pillTextActive: { color: "#FFFFFF" },

    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
      marginBottom: 10,
    },
    sectionTitle: { fontSize: 22, fontWeight: "800", color: theme.thrive.title },
    selectAllBtn: {
      backgroundColor: theme.thrive.pillBg,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
    },
    selectAllText: { color: theme.thrive.title, fontWeight: "800" },

    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 18,
      backgroundColor: theme.card,
      borderWidth: 2,
      borderColor: theme.thrive.pillBorder,
      marginBottom: 12,
    },
    cardChecked: { backgroundColor: theme.thrive.pillBg, borderColor: theme.thrive.title },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.thrive.pillBorder,
    },
    checkboxChecked: { backgroundColor: theme.thrive.title, borderColor: theme.thrive.title },
    cardTitle: { fontSize: 16, fontWeight: "800", color: theme.text },
    cardSubtitle: { fontSize: 13, marginTop: 3, color: theme.subtleText },

    summaryBox: {
      marginTop: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.thrive.pillBorder,
    },
    summaryTitle: { fontWeight: "800", color: theme.accent, fontSize: 16 },
    summaryText: { marginTop: 6, color: theme.subtleText },

    generateBtn: {
      marginTop: 16,
      borderRadius: 20,
      backgroundColor: theme.accent,
      paddingVertical: 16,
      alignItems: "center",
    },
    generateBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 18 },

    footerText: { textAlign: "center", marginTop: 14, color: theme.subtleText, paddingBottom: 30 },
  });