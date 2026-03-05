import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "hasSeenOnboarding";

export async function getHasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === "true";
}

export async function setHasSeenOnboarding(seen: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, seen ? "true" : "false");
}

// Optional for testing
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}