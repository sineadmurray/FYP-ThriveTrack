import { useRouter, type Href } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";

const { width: W } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(420, W * 0.9);

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SideDrawer({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const s = styles(theme);
  const router = useRouter();

  const slideX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -PANEL_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fade, slideX]);

  const go = (href: Href) => {
    router.push(href);
    onClose();
  };

  // ✅ MenuButton inside so it can use `s`
  const MenuButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [s.menuBtn, { opacity: pressed ? 0.9 : 1 }]}>
      <Text style={s.menuBtnText}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[s.backdrop, { opacity: fade }]} pointerEvents={visible ? "auto" : "none"}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[s.panel, { transform: [{ translateX: slideX }] }]} pointerEvents={visible ? "auto" : "none"}>
        <View style={s.panelContent}>
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeText}>✕</Text>
          </Pressable>

          <MenuButton label="🏡  Home" onPress={() => go("/")} />
          <MenuButton label="🪞  Reflect" onPress={() => go("/reflect")} />
          <MenuButton label="🌱  Grow" onPress={() => go("/grow")} />
          <MenuButton label="🌸  Thrive" onPress={() => go("/thrive")} />
          <MenuButton label="⚙️  Settings" onPress={() => go("/settings")} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.mode === "dark" ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.35)",
      zIndex: 1000,
    },
    panel: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: PANEL_WIDTH,
      backgroundColor: theme.card,
      zIndex: 1001,
      elevation: 10,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      borderRightWidth: 1,
      borderRightColor: theme.border,
    },
    panelContent: { paddingTop: 26, paddingHorizontal: 22 },

    closeBtn: { paddingVertical: 6, marginBottom: 8, width: 44 },
    closeText: { fontSize: 26, color: theme.text },

    menuBtn: {
      backgroundColor: theme.mode === "dark" ? "#1f1f28" : theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 16,
      marginVertical: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    menuBtnText: { fontSize: 20, fontWeight: "700", color: theme.text },
  });