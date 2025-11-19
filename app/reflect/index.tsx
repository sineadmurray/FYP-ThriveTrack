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
import SideDrawer from "../components/SideDrawer";

export default function ReflectScreen() {
 const [drawerOpen, setDrawerOpen] = useState(false);
   const router = useRouter();

  const items: { title: string; desc: string; onPress?: () => void }[] = [
    {
      title: "Mood Journal",
      desc: "Take 30 seconds to note how you feel – it helps you spot patterns.",
      onPress: () => router.push("/reflect/mood"),
    },
    { title: "Trap & Track", desc: "Catch an unhelpful thought and reframe it." },
    {
      title: "Daily Reflection & Positive Thoughts",
      desc: "End your day by focusing on the wins, not the worries.",
    },
    {
      title: "Outside-In Thinking",
      desc: "Small actions can shift big feelings – what's one thing you could do tomorrow?",
    },
    {
      title: "Daily Gratitude",
      desc: "Train your brain to notice the good – What are you grateful for today?",
    },
  ];

  return (
    <View style={styles.root}>
      {/* Main content */}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ----- Header (identical to Home) ----- */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/ThriveTrack Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>Reflect, Grow & Thrive</Text>

          {/* Hamburger */}
          <Pressable style={styles.menu} onPress={() => setDrawerOpen(true)}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 18 }]} />
            <View style={[styles.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* ----- Hero ----- */}
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <View style={styles.mirrorBadge}>
            <Text style={{ fontSize: 22 }}>🪞</Text>
          </View>
          <Text style={styles.title}>Reflect</Text>
          <Text style={styles.subtitle}>
            Take a moment to understand how you feel.
          </Text>
        </View>

        {/* ----- Cards ----- */}
        <View style={{ marginTop: 10 }}>
          {items.map((it, idx) => (
            <ReflectCard
              key={idx}
              title={it.title}
              desc={it.desc}
              onPress={it.onPress ?? (() => {})}
            />
          ))}
        </View>
      </ScrollView>

      {/* Drawer LAST so it sits on top */}
      <SideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </View>
  );
}

function ReflectCard({
  title,
  desc,
  onPress,
}: {
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.96 : 1 }]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>

      <View style={styles.chev}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>➜</Text>
      </View>
    </Pressable>
  );
}

/* Theme */
const BG = "#fff5f7";      
const CARD_BG = "#ffffff"; // white card
const PURPLE = "#8f79ea";
const SHADOW = "#000";
const TEXT = "#222";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === "android" ? 35 : 55, // same as Home
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Header (identical to Home) */
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

  /* Hero */
  mirrorBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: SHADOW,
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
    color: PURPLE,
    textAlign: "center",
    marginTop: 6,
  },
  subtitle: {
    textAlign: "center",
    color: "#616161",
    fontSize: 18,
    lineHeight: 26,
    marginTop: 8,
    marginBottom: 8,
  },

  /* Cards */
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginVertical: 10,
    shadowColor: SHADOW,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: PURPLE,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
  },
  chev: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0e5ff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
