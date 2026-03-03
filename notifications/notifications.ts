import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type ReminderKey = "dailyPlan" | "mood" | "reflection";

const CONTENT: Record<ReminderKey, { title: string; body: string }> = {
  dailyPlan: {
    title: "Daily Plan",
    body: "Plan your day: set your main goal and top priorities.",
  },
  mood: {
    title: "Mood Check-In",
    body: "Quick check-in: how are you feeling today?",
  },
  reflection: {
    title: "Evening Reflection",
    body: "Take 2 minutes to reflect on today.",
  },
};

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;

  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

export async function cancelScheduled(notificationId: string | null | undefined) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}

export async function scheduleDailyReminder(
  key: ReminderKey,
  hour: number,
  minute: number
): Promise<string> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: CONTENT[key].title,
      body: CONTENT[key].body,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === "android" ? "reminders" : undefined,
    },
  });

  return id;
}