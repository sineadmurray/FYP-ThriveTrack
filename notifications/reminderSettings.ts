import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReminderKey = "dailyPlan" | "mood" | "reflection";

export type ReminderSetting = {
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId: string | null;
};

export type ReminderSettings = Record<ReminderKey, ReminderSetting>;

const STORAGE_KEY = "thriveTrack:reminders:v1";

export const DEFAULT_REMINDERS: ReminderSettings = {
  dailyPlan: { enabled: false, hour: 9, minute: 0, notificationId: null },
  mood: { enabled: true, hour: 19, minute: 0, notificationId: null },
  reflection: { enabled: false, hour: 21, minute: 30, notificationId: null },
};

export async function loadReminders(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_REMINDERS;

  try {
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return {
      dailyPlan: { ...DEFAULT_REMINDERS.dailyPlan, ...(parsed.dailyPlan ?? {}) },
      mood: { ...DEFAULT_REMINDERS.mood, ...(parsed.mood ?? {}) },
      reflection: { ...DEFAULT_REMINDERS.reflection, ...(parsed.reflection ?? {}) },
    };
  } catch {
    return DEFAULT_REMINDERS;
  }
}

export async function saveReminders(settings: ReminderSettings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}