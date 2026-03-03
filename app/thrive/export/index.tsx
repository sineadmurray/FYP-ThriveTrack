import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../theme/ThemeContext";
import type { ExportCategory, TimePeriod } from "../export/exportOptions";
import { GROW_OPTIONS, REFLECT_OPTIONS } from "../export/exportOptions";
import { generateAndSharePdf } from "../export/pdfExport";

function TogglePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
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
  return (
    <TouchableOpacity onPress={onToggle} style={[styles.card, checked && styles.cardChecked]}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ExportShareScreen() {
  const { theme } = useTheme();

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

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  const toggle = (key: ExportCategory) => setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

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
    Alert.alert("Export failed", e?.message ?? "Something went wrong generating the PDF.");
  }
};


  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Export & Share</Text>
      <Text style={[styles.subtitle, { color: theme.subtleText }]}>Create your personal wellbeing record</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Select the data you’d like to include in your PDF. Perfect for sharing with counsellors or saving
          for your own records.
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.text }]}>Time Period</Text>
      <View style={styles.pillsRow}>
        <TogglePill label="Last Week" active={period === "lastWeek"} onPress={() => setPeriod("lastWeek")} />
        <TogglePill label="Last Month" active={period === "lastMonth"} onPress={() => setPeriod("lastMonth")} />
        <TogglePill label="All Time" active={period === "allTime"} onPress={() => setPeriod("allTime")} />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle]} >Reflect Data</Text>
        <TouchableOpacity onPress={selectAllReflect} style={styles.selectAllBtn}>
          <Text style={styles.selectAllText}>Select All</Text>
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

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle]} >Grow Data</Text>
        <TouchableOpacity onPress={selectAllGrow} style={styles.selectAllBtn}>
          <Text style={styles.selectAllText}>Select All</Text>
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

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Export Summary</Text>
        <Text style={styles.summaryText}>
          {selectedCount} categories selected • {period === "lastWeek" ? "Last 7 days" : period === "lastMonth" ? "Last 30 days" : "All time"}
        </Text>
      </View>

      <TouchableOpacity onPress={onGenerate} style={styles.generateBtn}>
        <Text style={styles.generateBtnText}>Generate PDF</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Your data stays private and secure</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  title: { fontSize: 34, fontWeight: "800", textAlign: "center", marginTop: 6 },
  subtitle: { fontSize: 16, textAlign: "center", marginTop: 8, marginBottom: 16 },

  infoBox: { borderRadius: 16, padding: 14, backgroundColor: "#FDEAF4", marginBottom: 18 },
  infoText: { color: "#C13E8C", fontSize: 14, lineHeight: 19 },

  sectionLabel: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  pillsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  pill: { flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F3B8DA" },
  pillActive: { backgroundColor: "#FF5DB1", borderColor: "#FF5DB1" },
  pillText: { textAlign: "center", fontWeight: "700", color: "#B2558C" },
  pillTextActive: { color: "#FFFFFF" },

  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#8D7BD4" },
  selectAllBtn: { backgroundColor: "#EFEAFB", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  selectAllText: { color: "#7E6CD1", fontWeight: "800" },

  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#EEE6FF", marginBottom: 12 },
  cardChecked: { backgroundColor: "#F2EDFF", borderColor: "#B7A8FF" },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#CFC8F5" },
  checkboxChecked: { backgroundColor: "#B7A8FF", borderColor: "#B7A8FF" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#6D5BC5" },
  cardSubtitle: { fontSize: 13, marginTop: 3, color: "#9B8EE0" },

  summaryBox: { marginTop: 12, padding: 16, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#FFD0E8" },
  summaryTitle: { fontWeight: "800", color: "#FF5DB1", fontSize: 16 },
  summaryText: { marginTop: 6, color: "#6B6B6B" },

  generateBtn: { marginTop: 16, borderRadius: 20, backgroundColor: "#FF5DB1", paddingVertical: 16, alignItems: "center" },
  generateBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 18 },
  footerText: { textAlign: "center", marginTop: 14, color: "#C979A9", paddingBottom: 30 },
});