import type { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Auth from "../app/components/Auth";
import { supabase } from "../lib/supabase";
import { ThemeProvider } from "../theme/ThemeContext";
import { getHasSeenOnboarding } from "../utils/onboarding";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // null = not checked yet, true/false = checked
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  const router = useRouter();
  const segments = useSegments();

  // 1) Get session + listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoadingSession(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // 2) Load onboarding flag:
  useEffect(() => {
    const refreshOnboardingFlag = async () => {
      if (!session) {
        setSeenOnboarding(null);
        return;
      }

      const seen = await getHasSeenOnboarding();
      setSeenOnboarding(seen);
    };

    refreshOnboardingFlag();
  }, [session, segments]);

  // 3) Redirect logic
  useEffect(() => {
    if (!session) return;
    if (seenOnboarding === null) return;

    const firstSegment = String(segments?.[0] ?? "");
    const onOnboardingRoute = firstSegment === "onboarding";

    // If they haven't seen onboarding, force onboarding
    if (!seenOnboarding && !onOnboardingRoute) {
      router.replace("/onboarding" as any);
      return;
    }

    // If they have seen onboarding but are on onboarding, send home
    if (seenOnboarding && onOnboardingRoute) {
      router.replace("/" as any);
    }
  }, [session, seenOnboarding, segments]);

  // 4) Loading
  const stillLoading = loadingSession || (session && seenOnboarding === null);

  return (
    <ThemeProvider>
      {stillLoading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : !session ? (
        <Auth />
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </ThemeProvider>
  );
}