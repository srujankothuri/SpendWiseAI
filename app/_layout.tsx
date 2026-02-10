import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../src/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { COLORS } from "../src/constants/colors";
import { ONBOARDING_KEY } from "./onboarding";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(ONBOARDING_KEY),
      supabase.auth.getSession(),
    ]).then(([onboardingValue, { data: { session } }]) => {
      setOnboardingDone(onboardingValue === "true");
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Re-check onboarding flag when navigating away from onboarding
  // This catches the moment when onboarding sets the flag and navigates
  useEffect(() => {
    if (segments[0] !== "onboarding" && !onboardingDone) {
      SecureStore.getItemAsync(ONBOARDING_KEY).then((value) => {
        if (value === "true") {
          setOnboardingDone(true);
        }
      });
    }
  }, [segments]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const inOnboarding = segments[0] === "onboarding";
    const inModal = segments[0] === "add-transaction" || segments[0] === "edit-transaction" || segments[0] === "set-budget" || segments[0] === "ai-entry" || segments[0] === "add-category" || segments[0] === "import-csv";

    // First time user — show onboarding
    if (!onboardingDone && !inOnboarding) {
      router.replace("/onboarding");
      return;
    }

    // Onboarding done — normal auth flow
    if (onboardingDone) {
      if (session && !inTabsGroup && !inModal) {
        router.replace("/(tabs)");
      } else if (!session && !inAuthGroup) {
        router.replace("/(auth)/login");
      }
    }
  }, [session, loading, segments, onboardingDone]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
        <Stack.Screen name="add-transaction" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="edit-transaction" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="set-budget" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="ai-entry" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="add-category" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="import-csv" options={{ presentation: "modal", headerShown: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});