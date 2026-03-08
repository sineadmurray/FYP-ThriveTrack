import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { authedFetch } from "../../lib/authedFetch";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
import SideDrawer from "../components/SideDrawer";


export default function LongTermVisionScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [vision, setVision] = useState("");
  const [clearDirection, setClearDirection] = useState("");

  const payload = useMemo(
    () => ({
      vision,
      clear_direction: clearDirection,
    }),
    [vision, clearDirection]
  );

  async function handleSave() {
    try {
      setSaving(true);

      const res = await authedFetch("/long_term_visions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `HTTP ${res.status}`);
    }

      Alert.alert("Saved✅", "Your vision has been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log("Save long-term vision error", e);
      Alert.alert("Oops", "Could not save your vision. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.root}>
          <ScrollView
            contentContainerStyle={s.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
        {/* Header */}
        <View style={s.header}>
          <Image
            source={require("../../assets/images/ThriveTrackLogo.png")}
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

        {/* Back + Title */}
        <View style={s.titleRow}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </Pressable>

          <View style={s.titleCenter}>
            <Text style={s.title}>Long-Term Vision</Text>
            <Text style={s.subtitle}>
              Visualise what success and balance look like for you.
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Your Vision */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Your Vision</Text>
          <View style={[s.inputShell, { minHeight: 290 }]}>
            <TextInput
              value={vision}
              onChangeText={setVision}
              placeholder="Describe the future you want — how do you want to feel, live, and show up?"
              placeholderTextColor={theme.grow.placeholder}
              multiline
              style={s.input}
            />
          </View>
        </View>

        {/* SMART helper card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Make Your Vision Clear &amp; Achievable</Text>

          <View style={s.smartBox}>
            <SmartRow letter="S" label="Specific:" text="What exactly do you want to achieve?" />
            <SmartRow
              letter="M"
              label="Measurable:"
              text="How will you know you’re making progress?"
            />
            <SmartRow
              letter="A"
              label="Achievable:"
              text="Is this realistic for you right now? What supports you’ll need?"
            />
            <SmartRow
              letter="R"
              label="Relevant:"
              text="Why does this matter to you? How does it fit your life?"
            />
            <SmartRow
              letter="T"
              label="Time:"
              text="What’s your timeframe? When do you want to reach it?"
            />
          </View>
        </View>

        {/* Clear Direction */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Your Clear Direction</Text>
          <View style={[s.inputShell, { minHeight: 210 }]}>
            <TextInput
              value={clearDirection}
              onChangeText={setClearDirection}
              placeholder="What’s one clear long-term direction you want to work towards?"
              placeholderTextColor={theme.grow.placeholder}
              multiline
              style={s.input}
            />
          </View>
        </View>

        {/* Save button */}
        <Pressable
          style={({ pressed }) => [
            s.saveButton,
            pressed && { transform: [{ scale: 0.99 }] },
            saving && { opacity: 0.8 },
          ]}
          onPress={() => !saving && handleSave()}
        >
          <Text style={s.saveButtonText}>
            {saving ? "Saving..." : "Save Vision"}
          </Text>
        </Pressable>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  );
}

function SmartRow({
  letter,
  label,
  text,
}: {
  letter: string;
  label: string;
  text: string;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={s.smartRow}>
      <Text style={s.smartLetter}>{letter}</Text>
      <Text style={s.smartText}>
        <Text style={s.smartLabel}>{label} </Text>
        {text}
      </Text>
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
  titleCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
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

  card: {
    backgroundColor: theme.card,
    borderRadius: 26,
    padding: 16,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.grow.title,
    marginBottom: 10,
  },

  inputShell: {
    backgroundColor: theme.grow.inputBg,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.grow.inputBorder,
  },
  input: {
    fontSize: 14,
    color: theme.grow.inputText,
    textAlignVertical: "top",
  },

  smartBox: {
    backgroundColor: theme.grow.inputBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.grow.inputBorder,
  },
  smartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  smartLetter: {
    width: 22,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "900",
    color: theme.grow.title,
    marginRight: 8,
    marginTop: 1,
  },
  smartText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.subtleText,
  },
  smartLabel: {
    fontWeight: "800",
    color: theme.text,
  },

  saveButton: {
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: theme.grow.button,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
