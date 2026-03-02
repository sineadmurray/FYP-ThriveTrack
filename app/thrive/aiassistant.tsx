import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { supabase } from "../../lib/supabase";
import SideDrawer from "../components/SideDrawer";
import { useTheme } from "../theme/ThemeContext";
import type { AppTheme } from "../theme/themes";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
};

export default function AIReflectionAssistantScreen() {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ Messages start with the assistant greeting (matches your mock)
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Hi. I'm here with you. What's been on your mind today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const prompts = useMemo(
    () => [
      "I had a bad day",
      "I'm feeling anxious",
      "Help me sleep better",
      "I feel overwhelmed",
      "Give me a grounding exercise",
    ],
    []
  );

  // ✅ Auto-scroll
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  // ✅ Send message (stale state safe)
  async function sendMessage(userText: string) {
    const trimmed = userText.trim();
    if (!trimmed || loading) return;

    setInput("");
    setLoading(true);

    // Build conversation from the latest messages state (avoids stale bug)
    let nextMessages: ChatMsg[] = [];

    setMessages((prev) => {
      nextMessages = [...prev, { role: "user", content: trimmed }];
      return nextMessages;
    });

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Not authenticated. Please log in again.");

      // Wait one tick so nextMessages is set
      await new Promise((r) => setTimeout(r, 0));

      const resp = await fetch(`${API_BASE}/ai/reflection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: nextMessages.slice(-12),
        }),
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || "Request failed");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.reply },
      ]);

      // Optional: you can use json.flags?.crisis later if you want
      // const crisis = json.flags?.crisis === true;
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry — I couldn’t respond right now. Please try again in a moment.",
        },
      ]);
      console.log("AI sendMessage error:", e?.message || e);
    } finally {
      setLoading(false);
    }
  }


  
  return (
    <View style={s.root}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ----- Header (same as Thrive) ----- */}
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

        {/* ----- Screen Title ----- */}
        <View style={s.topBlock}>
          <Pressable onPress={() => router.back()} style={s.backRow}>
            <Text style={s.backArrow}>←</Text>
          </Pressable>

          <Text style={s.screenTitle}>AI Reflection Assistant</Text>
          <Text style={s.screenSubtitle}>
            Talk it through. I&apos;m here to listen.
          </Text>
        </View>

        {/* ----- Chat Area ----- */}
        <View style={s.chatArea}>
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <View
                key={idx}
                style={[
                  s.botBubble,
                  isUser ? s.userBubble : null,
                ]}
              >
                <Text style={[s.botText, isUser ? s.userText : null]}>
                  {m.content}
                </Text>
              </View>
            );
          })}

          {loading && (
            <View style={s.botBubble}>
              <Text style={s.botText}>Thinking…</Text>
            </View>
          )}
        </View>

        {/* ----- Prompt Chips ----- */}
        <View style={s.chipsWrap}>
          {prompts.map((p) => (
            <Pressable
              key={p}
              onPress={() => sendMessage(p)} // ✅ instant send (optional UX win)
              disabled={loading}
              style={({ pressed }) => [
                s.chip,
                { opacity: loading ? 0.55 : pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={s.chipText}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {/* ----- Composer ----- */}
        <View style={s.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Tell me what's on your mind..."
            placeholderTextColor="#9a9a9a"
            style={s.input}
            multiline
          />

          <Pressable
            onPress={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={({ pressed }) => [
              s.sendBtn,
              {
                opacity:
                  loading || !input.trim() ? 0.5 : pressed ? 0.92 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <Text style={s.sendIcon}>↗</Text>
          </Pressable>
        </View>

        {/* ----- Disclaimer ----- */}
        <Text style={s.disclaimer}>
          This assistant provides supportive guidance and is not a replacement for
          professional support.
        </Text>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

// ✅ AIReflectionAssistantScreen styles (theme-based)
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
      marginBottom: 14,
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

    topBlock: {
      marginTop: 6,
      marginBottom: 10,
    },
    backRow: {
      width: 44,
      height: 36,
      justifyContent: "center",
    },
    backArrow: {
      fontSize: 20,
      color: theme.text,
      fontWeight: "700",
    },
    screenTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
      color: theme.thrive.title,
      marginTop: 6,
    },
    screenSubtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.subtleText,
      marginTop: 6,
    },

    chatArea: {
      marginTop: 14,
      minHeight: 260,
      paddingTop: 6,
    },
    botBubble: {
      marginBottom: 10,
      alignSelf: "flex-start",
      maxWidth: "86%",
      backgroundColor: theme.thrive.bubbleBg, // ✅ new theme key
      borderRadius: 22,
      paddingVertical: 14,
      paddingHorizontal: 16,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    botText: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "500",
    },

    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: theme.thrive.userBubbleBg, // ✅ new theme key
    },
    userText: {
      color: theme.text,
    },

    chipsWrap: {
      marginTop: 14,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    chip: {
      backgroundColor: theme.thrive.chipBg, // ✅ new theme key
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.thrive.chipBorder, // ✅ new theme key
    },
    chipText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
    },

    composer: {
      marginTop: 16,
      flexDirection: "row",
      alignItems: "flex-end",
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 12,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      paddingRight: 10,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.thrive.sendBtnBg, // ✅ new theme key
      alignItems: "center",
      justifyContent: "center",
    },
    sendIcon: {
      fontSize: 18,
      color: theme.text,
    },

    disclaimer: {
      marginTop: 16,
      textAlign: "center",
      color: theme.thrive.disclaimerText, // ✅ new theme key
      fontSize: 13,
      lineHeight: 18,
      paddingHorizontal: 10,
    },
  });