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
import { useTheme } from "../../theme/ThemeContext";
import type { AppTheme } from "../../theme/themes";
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
  const { theme } = useTheme();
  const s = styles(theme);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Image
            source={require("../../assets/images/ThriveTrack Logo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.appTitle}>Reflect, Grow & Thrive</Text>

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

        {/* Hero */}
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <View style={s.iconBadge}>
            <Text style={{ fontSize: 22 }}>🤝</Text>
          </View>
          <Text style={s.title}>Support & Resources</Text>
          <Text style={s.subtitle}>
            Helpful links and supports for when you need a{"\n"}little extra help.
          </Text>
        </View>

        {/* Quick Support */}
        <View style={s.quickPanel}>
          <Text style={s.quickTitle}>Need support right now?</Text>
          <Text style={s.quickDesc}>
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
            <View style={s.sectionHeader}>
              <Ionicons name={section.icon} size={20} color={theme.thrive.title} />
              <Text style={s.sectionTitle}>{section.heading}</Text>
            </View>

            {section.items.map((item) => (
              <ResourceCard key={item.title} item={item} onPress={() => openResource(item)} />
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={s.footerCard}>
          <Text style={{ fontSize: 24, marginBottom: 10 }}>💛</Text>
          <Text style={s.footerText}>You're not alone. Support is always available.</Text>
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
  const { theme } = useTheme();
  const s = styles(theme);
  const isQuick = variant === "quick";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.resourceCard, { opacity: pressed ? 0.96 : 1 }]}>
      <View style={s.iconCircle}>
        <Ionicons name={item.icon} size={18} color={theme.thrive.title} />
      </View>

      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={s.resourceTitle}>{item.title}</Text>
        <Text style={s.resourceDesc}>{item.desc}</Text>
      </View>

      {isQuick ? (
        <Ionicons name="open-outline" size={18} color={theme.thrive.title} />
      ) : (
        <View style={s.openPill}>
          <Text style={s.openText}>Open</Text>
          <Ionicons name="open-outline" size={14} color={theme.thrive.title} />
        </View>
      )}
    </Pressable>
  );
}

// ✅ ResourcesScreen styles (theme-based)
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
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "800",
      color: theme.thrive.title,
      textAlign: "center",
      marginTop: 6,
    },
    subtitle: {
      textAlign: "center",
      color: theme.subtleText,
      fontSize: 16,
      lineHeight: 24,
      marginTop: 8,
      marginBottom: 8,
    },

    quickPanel: {
      backgroundColor: theme.thrive.panelBg,
      borderRadius: 22,
      padding: 18,
      marginTop: 14,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    quickTitle: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "800",
      color: theme.thrive.title,
      marginBottom: 8,
    },
    quickDesc: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.subtleText,
    },

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
      color: theme.thrive.title,
    },

    resourceCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 22,
      paddingVertical: 16,
      paddingHorizontal: 18,
      marginVertical: 10,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.thrive.iconCircleBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    resourceTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 4,
    },
    resourceDesc: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.subtleText,
    },

    openPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.thrive.pillBg,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
    },
    openText: {
      color: theme.thrive.title,
      fontWeight: "800",
      fontSize: 13,
    },

    footerCard: {
      marginTop: 18,
      backgroundColor: theme.thrive.footerBg, // ✅ new theme key
      borderRadius: 22,
      paddingVertical: 26,
      paddingHorizontal: 18,
      alignItems: "center",
    },
    footerText: {
      textAlign: "center",
      color: theme.subtleText,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "600",
    },
  });