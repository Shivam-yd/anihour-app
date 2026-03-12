import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function AniHourSplash() {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0)).current;
  const dotOpacity2 = useRef(new Animated.Value(0)).current;
  const dotOpacity3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.stagger(120, [
        Animated.timing(dotOpacity1, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dotOpacity2, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dotOpacity3, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.splash}>
      <View style={styles.splashCenter}>
        <Animated.Text style={[styles.splashEmoji, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          🎌
        </Animated.Text>
        <Animated.View style={{ opacity: textOpacity, alignItems: "center" }}>
          <Text style={styles.splashTitle}>
            <Text style={{ color: Colors.dark.primary }}>Ani</Text>
            <Text style={{ color: Colors.dark.secondary }}>hour</Text>
          </Text>
          <Text style={styles.splashTagline}>Your ultimate anime companion</Text>
        </Animated.View>
        <View style={styles.splashDots}>
          <Animated.View style={[styles.splashDot, { opacity: dotOpacity1, backgroundColor: Colors.dark.primary }]} />
          <Animated.View style={[styles.splashDot, { opacity: dotOpacity2, backgroundColor: Colors.dark.secondary }]} />
          <Animated.View style={[styles.splashDot, { opacity: dotOpacity3, backgroundColor: Colors.dark.accent }]} />
        </View>
      </View>
      <View style={styles.splashGlow1} />
      <View style={styles.splashGlow2} />
    </View>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="anime/[id]" options={{ headerShown: false, animation: "slide_from_bottom" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <AniHourSplash />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  splashCenter: {
    alignItems: "center",
    gap: 10,
    zIndex: 1,
  },
  splashEmoji: {
    fontSize: 72,
    marginBottom: 4,
  },
  splashTitle: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
  },
  splashTagline: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  splashDots: {
    flexDirection: "row",
    gap: 10,
    marginTop: 32,
  },
  splashDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  splashGlow1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,107,157,0.08)",
    top: -80,
    left: -80,
  },
  splashGlow2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(78,205,196,0.06)",
    bottom: -60,
    right: -60,
  },
});
