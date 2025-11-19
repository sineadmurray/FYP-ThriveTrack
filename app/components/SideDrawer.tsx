import { useRouter, type Href } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { width: W } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(420, W * 0.9);

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SideDrawer({ visible, onClose }: Props) {
  const router = useRouter();
  const slideX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(fade,   { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -PANEL_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fade,   { toValue: 0,           duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const go = (href: Href) => {
    router.push(href);
    onClose();
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]} pointerEvents={visible ? "auto" : "none"}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { transform: [{ translateX: slideX }] }]} pointerEvents={visible ? "auto" : "none"}>
        <View style={styles.panelContent}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <MenuButton label="🏡  Home"   onPress={() => go("/")} />
          <MenuButton label="🪞  Reflect" onPress={() => go("/reflect")} />
          <MenuButton label="🌱  Grow"    onPress={() => go("/")} />
          <MenuButton label="🌸  Thrive"  onPress={() => go("/")} />
          <MenuButton label="⚙️  Profile / Settings" onPress={() => go("/")} />
        </View>
      </Animated.View>
    </View>
  );
}

function MenuButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuBtn, { opacity: pressed ? 0.9 : 1 }]}>
      <Text style={styles.menuBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 1000 },
  panel: {
    position: "absolute", top: 0, bottom: 0, left: 0, width: PANEL_WIDTH, backgroundColor: "#fff",
    zIndex: 1001, elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  panelContent: { paddingTop: 26, paddingHorizontal: 22 },
  closeBtn: { paddingVertical: 6, marginBottom: 8, width: 44 },
  closeText: { fontSize: 26, color: "#333" },
  menuBtn: {
    backgroundColor: "#fdeff2", borderWidth: 1, borderColor: "#d8c7cd", borderRadius: 12,
    paddingVertical: 18, paddingHorizontal: 16, marginVertical: 12, shadowColor: "#000",
    shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  menuBtnText: { fontSize: 20, fontWeight: "700", color: "#222" },
});
