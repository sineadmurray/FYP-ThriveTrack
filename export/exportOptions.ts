export type TimePeriod = "lastWeek" | "lastMonth" | "allTime";

export type ExportCategory =
  // Reflect
  | "moodLogs"
  | "trapAndTrack"
  | "dailyReflection"
  | "gratitude"
  | "outsideInThinking"
  // Grow
  | "whereIAm"
  | "weeklyReflection"
  | "longTermVision"
  | "dailyPlanner";

export const REFLECT_OPTIONS: { key: ExportCategory; title: string; subtitle: string }[] = [
  { key: "moodLogs", title: "Mood Logs", subtitle: "All mood check-ins with notes" },
  { key: "dailyReflection", title: "Daily Reflection", subtitle: "What went well & tomorrow’s focus" },
  { key: "gratitude", title: "Gratitude", subtitle: "Daily gratitude entries" },
  { key: "trapAndTrack", title: "Trap & Track", subtitle: "CBT thought records" },
  { key: "outsideInThinking", title: "Outside-In Thinking", subtitle: "Perspective-shifting reflections" },
];

export const GROW_OPTIONS: { key: ExportCategory; title: string; subtitle: string }[] = [
  { key: "whereIAm", title: "Where I Am", subtitle: "Mind, body, career, relationships" },
  { key: "weeklyReflection", title: "Weekly Reflection", subtitle: "Lessons learned & next week’s focus" },
  { key: "longTermVision", title: "Long-Term Vision", subtitle: "Vision + how to get there" },
  { key: "dailyPlanner", title: "Daily Planner", subtitle: "Priorities, to-dos & self-care" },
];