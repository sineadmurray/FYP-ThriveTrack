import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SideDrawer from "../components/SideDrawer";

/* -------------------- */
/* Types */
/* -------------------- */

type ResourceItem = {
  title: string;
  desc: string;
  url?: string;
  phone?: string;
  type: "link" | "phone";
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

type ResourceSection = {
  heading: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  items: ResourceItem[];
};

/* -------------------- */
/* Data */
/* -------------------- */

const QUICK_SUPPORT: ResourceItem[] = [
  {
    title: "Samaritans Crisis Helpline",
    desc: "24/7 confidential support",
    type: "phone",
    phone: "116123",
    icon: "call-outline",
  },
  {
    title: "Text About It (50808)",
    desc: "Free, anonymous, 24/7 messaging service",
    type: "link",
    url: "https://www.textaboutit.ie/",
    icon: "chatbubble-ellipses-outline",
  },
  {
    title: "Emergency Services",
    desc: "Immediate emergency help",
    type: "phone",
    phone: "999",
    icon: "alert-circle-outline",
  },
];

const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    heading: "Mental Health Support",
    icon: "medkit-outline",
    items: [
      {
        title: "Find Your College Student Counselling Service",
        desc: "Search for your university or college's official counselling page.",
        type: "link",
        url: "https://www.google.com/search?q=college+student+counselling+service+ireland",
        icon: "school-outline",
      },
      {
        title: "Therapy & Professional Support",
        desc: "Information on therapy types and professional support options.",
        type: "link",
        url: "https://fettle.ie/types-of-therapy/",
        icon: "pulse-outline",
      },
      {
        title: "CBT & Coping Tools",
        desc: "Self-help techniques you can try.",
        type: "link",
        url: "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/",
        icon: "book-outline",
      },
    ],
  },
  {
    heading: "Academic & Student Support",
    icon: "book-outline",
    items: [
      {
        title: "Exam Stress Support",
        desc: "Managing pressure and anxiety around exams.",
        type: "link",
        url: "https://www2.hse.ie/mental-health/life-situations-events/exam-stress/",
        icon: "time-outline",
      },
      {
        title: "Study Skills & Overwhelm",
        desc: "Tips for managing your workload.",
        type: "link",
        url: "https://libguides.ucd.ie/StudySkills/time",
        icon: "bulb-outline",
      },
      {
        title: "Time Management Help",
        desc: "Balance academics and wellbeing.",
        type: "link",
        url: "https://www.universityofgalway.ie/counsellors/resources/self-help/time-management/",
        icon: "timer-outline",
      },
    ],
  },
  {
    heading: "Self-Care & Wellbeing",
    icon: "cafe-outline",
    items: [
      {
        title: "Sleep & Rest Tips",
        desc: "Improve your sleep quality.",
        type: "link",
        url: "https://www2.hse.ie/mental-health/issues/sleep-problems/",
        icon: "moon-outline",
      },
      {
        title: "Mindfulness & Grounding",
        desc: "Simple exercises to calm your mind.",
        type: "link",
        url: "https://www.healthline.com/health/grounding-techniques",
        icon: "leaf-outline",
      },
      {
        title: "Burnout Prevention",
        desc: "Recognize and prevent overwhelm.",
        type: "link",
        url: "https://www.psychiatry.org/news-room/apa-blogs/preventing-burnout-protecting-your-well-being",
        icon: "heart-outline",
      },
      {
        title: "Healthy Habits Guide",
        desc: "Small steps to better wellbeing.",
        type: "link",
        url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/five-steps-to-mental-wellbeing/",
        icon: "cafe-outline",
      },
    ],
  },
  {
    heading: "Financial & Practical Support",
    icon: "wallet-outline",
    items: [
      {
        title: "Financial Stress Support",
        desc: "Help managing money worries.",
        type: "link",
        url: "https://www2.hse.ie/mental-health/life-situations-events/money-worries/",
        icon: "wallet-outline",
      },
      {
        title: "Budgeting Help",
        desc: "Student budgeting tips and tools.",
        type: "link",
        url: "https://www.anpost.com/Money/Managing-Finances/Blog/How-To-Budget-Money-As-a-College-Student",
        icon: "book-outline",
      },
      {
        title: "Find Your College Student Assistance Fund",
        desc: "Search your college’s official Student Assistance Fund page.",
        type: "link",
        url: "https://www.google.com/search?q=student+assistance+fund+ireland+college",
        icon: "shield-outline",
      },
    ],
  },
];

/* -------------------- */
/* Safe open handler */
/* -------------------- */

async function openResource(item: ResourceItem) {
  if (item.type === "link") {
    if (!item.url) {
      Alert.alert("Link not available");
      return;
    }
    const ok = await Linking.canOpenURL(item.url);
    if (!ok) {
      Alert.alert("Cannot open link");
      return;
    }
    await Linking.openURL(item.url);
    return;
  }

  if (item.type === "phone") {
    if (!item.phone) {
      Alert.alert("Phone number not available");
      return;
    }

    const tel = `tel:${item.phone.replace(/\s+/g, "")}`;
    const ok = await Linking.canOpenURL(tel);

    if (!ok) {
      Alert.alert("Calling not supported on this device");
      return;
    }

    await Linking.openURL(tel);
  }
}

/* -------------------- */
/* Screen */
/* -------------------- */

export default function ResourcesScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/ThriveTrack Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>Reflect, Grow & Thrive</Text>

          <Pressable style={styles.menu} onPress={() => setDrawerOpen(true)}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 18 }]} />
            <View style={[styles.menuLine, { width: 22 }]} />
          </Pressable>
        </View>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

        {/* Hero */}
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <View style={styles.iconBadge}>
            <Text style={{ fontSize: 22 }}>🤝</Text>
          </View>
          <Text style={styles.title}>Support & Resources</Text>
          <Text style={styles.subtitle}>
            Helpful links and supports for when you need a{"\n"}little extra help.
          </Text>
        </View>

        {/* Quick Support */}
        <View style={styles.quickPanel}>
          <Text style={styles.quickTitle}>Need support right now?</Text>
          <Text style={styles.quickDesc}>
            If you're in crisis or need immediate help, these services are here 24/7.
          </Text>

          <View style={{ marginTop: 8 }}>
            {QUICK_SUPPORT.map((item) => (
              <ResourceCard
                key={item.title}
                item={item}
                variant="quick"
                onPress={() => openResource(item)}
              />
            ))}
          </View>
        </View>

        {/* Sections */}
        {RESOURCE_SECTIONS.map((section) => (
          <View key={section.heading} style={{ marginTop: 12 }}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon} size={20} color={PINK} />
              <Text style={styles.sectionTitle}>{section.heading}</Text>
            </View>

            {section.items.map((item) => (
              <ResourceCard key={item.title} item={item} onPress={() => openResource(item)} />
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footerCard}>
          <Text style={{ fontSize: 24, marginBottom: 10 }}>💛</Text>
          <Text style={styles.footerText}>You're not alone. Support is always available.</Text>
        </View>
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}


function ResourceCard({
  item,
  onPress,
  variant,
}: {
  item: ResourceItem;
  onPress: () => void;
  variant?: "quick";
}) {
  const isQuick = variant === "quick";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.resourceCard, { opacity: pressed ? 0.96 : 1 }]}>
      <View style={styles.iconCircle}>
        <Ionicons name={item.icon} size={18} color={PINK} />
      </View>

      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.resourceTitle}>{item.title}</Text>
        <Text style={styles.resourceDesc}>{item.desc}</Text>
      </View>

      {isQuick ? (
        <Ionicons name="open-outline" size={18} color={PINK} />
      ) : (
        <View style={styles.openPill}>
          <Text style={styles.openText}>Open</Text>
          <Ionicons name="open-outline" size={14} color={PINK} />
        </View>
      )}
    </Pressable>
  );
}

/* Theme – pink tones for Thrive */
const BG = "#fff5f9";
const CARD_BG = "#ffffff";
const PINK = "#f06292";
const CHEV_BG = "#ffe0ec";
const SHADOW = "#000";
const TEXT = "#222";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === "android" ? 35 : 55,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Header (copied) */
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

  /* Back row */
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  backArrow: {
    color: PINK,
    fontSize: 28,
    marginRight: 6,
    marginTop: -2,
  },
  backText: {
    color: PINK,
    fontSize: 18,
    fontWeight: "600",
  },
  backBtn: {
    paddingRight: 8,
    paddingTop: 4,
  },

  /* Hero (copied style) */
  iconBadge: {
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
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: PINK,
    textAlign: "center",
    marginTop: 6,
  },
  subtitle: {
    textAlign: "center",
    color: "#616161",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 8,
  },

  /* Quick support panel */
  quickPanel: {
    backgroundColor: "#fde2ec",
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    shadowColor: SHADOW,
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  quickTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: PINK,
    marginBottom: 8,
  },
  quickDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PINK,
  },

  /* Resource cards */
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginVertical: 10,
    shadowColor: SHADOW,
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff0f7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },

  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: CHEV_BG,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  openText: {
    color: PINK,
    fontWeight: "800",
    fontSize: 13,
  },

  /* Footer */
  footerCard: {
    marginTop: 18,
    backgroundColor: "#f8eaf1",
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
    color: "#616161",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
});
