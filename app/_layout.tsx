import type { Session } from "@supabase/supabase-js";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Auth from "../app/components/Auth";
import { supabase } from "../lib/supabase";
import { ThemeProvider } from "../theme/ThemeContext";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider>
      {loading ? (
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