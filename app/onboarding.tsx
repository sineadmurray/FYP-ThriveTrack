import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import type { AppTheme } from "../theme/themes";
import { setHasSeenOnboarding } from "../utils/onboarding";

const { width } = Dimensions.get("window");

type Slide = {
  key: string;
  title: string;
  body: string;
  tag: "welcome" | "reflect" | "grow" | "thrive";
  emoji?: string;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = styles(theme);

  const slides: Slide[] = [
    {
      key: "welcome",
      tag: "welcome",
      title: "Welcome to ThriveTrack!",
      body:
        "Track your moods. Build resilience. Thrive through student life.\n\n" +
        "This app is your space to reflect, grow, and stay grounded.",
    },
    {
      key: "reflect",
      tag: "reflect",
      emoji: "🪞",
      title: "Reflect",
      body:
        "Log your moods, journal your thoughts, and use CBT-inspired prompts\n" +
        "to understand your emotions better.",
    },
    {
      key: "grow",
      tag: "grow",
      emoji: "🌱",
      title: "Grow",
      body:
        "Set goals, build habits, and take small daily actions\n" +
        "that support your wellbeing.",
    },
    {
      key: "thrive",
      tag: "thrive",
      emoji: "🌸",
      title: "Thrive",
      body: "See your progress, gain insights, and celebrate how far you’ve come.",
    },
  ];

  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;

  const onDone = async () => {
    await setHasSeenOnboarding(true);
    router.replace("/" as any); 
  };

  const goNext = () => {
    const next = Math.min(index + 1, slides.length - 1);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  const tintFor = (tag: Slide["tag"]) => {
    if (tag === "reflect") return theme.reflect.tint;
    if (tag === "grow") return theme.grow.tint;
    if (tag === "thrive") return theme.thrive.tint;
    return theme.accent;
  };

  return (
    <View style={s.root}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>
            {item.key === "welcome" ? (
              <View style={s.logoTile}>
                <Image
                  source={require("../assets/images/ThriveTrackLogo.png")}
                  style={s.logo}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[s.iconTile, { backgroundColor: tintFor(item.tag) }]}>
                <Text style={s.emoji}>{item.emoji}</Text>
              </View>
            )}

            <Text style={s.title}>{item.title}</Text>
            <Text style={s.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={s.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === index && { width: 18, opacity: 1, backgroundColor: theme.accent },
            ]}
          />
        ))}
      </View>

      {/* Bottom buttons */}
      <View style={s.bottom}>
        {!isLast ? (
          <Pressable onPress={goNext} style={[s.button, { backgroundColor: theme.accent }]}>
            <Text style={s.buttonText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onDone} style={[s.button, { backgroundColor: theme.accent }]}>
            <Text style={s.buttonText}>Start My Journey</Text>
          </Pressable>
        )}

        {!isLast && (
          <Pressable onPress={onDone} style={s.skipBtn}>
            <Text style={s.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 40,
    },
    slide: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
      alignItems: "center",
    },

    // Welcome logo tile
    logoTile: {
      width: 110,
      height: 110,
      borderRadius: 24,
      backgroundColor: theme.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    logo: {
      width: 80,
      height: 80,
    },

    // Other slides emoji tile
    iconTile: {
      width: 86,
      height: 86,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
      opacity: 0.95,
    },
    emoji: {
      fontSize: 34,
    },

    title: {
      fontSize: 28,
      fontWeight: "900",
      color: theme.text,
      textAlign: "center",
      marginBottom: 10,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.subtleText,
      textAlign: "center",
      paddingHorizontal: 6,
    },

    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      paddingBottom: 14,
      paddingTop: 6,
    },
    dot: {
      height: 8,
      width: 8,
      borderRadius: 8,
      backgroundColor: theme.border,
      opacity: 0.7,
    },

    bottom: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      gap: 10,
    },
    button: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    buttonText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 16,
    },

    skipBtn: {
      alignItems: "center",
      paddingVertical: 6,
    },
    skipText: {
      color: theme.muted,
      fontWeight: "800",
    },
  });