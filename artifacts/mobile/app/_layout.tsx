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
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import Colors from "@/constants/colors";
import { ContentSettingsProvider } from "@/lib/content-settings";

SplashScreen.preventAutoHideAsync();

const SPLASH_MIN_MS = 2000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function AniHourSplash() {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const pulse = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, { toValue: 1, duration: 500, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0.3, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        );
      Animated.parallel([pulse(dot1, 0), pulse(dot2, 180), pulse(dot3, 360)]).start();
    });
  }, []);

  return (
    <View style={styles.splash}>
      <View style={styles.splashGlow1} />
      <View style={styles.splashGlow2} />

      <View style={styles.splashCenter}>
        <Animated.View
          style={[styles.splashLogo, { transform: [{ scale: logoScale }] }]}
        >
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.splashLogoImg}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: "center" }}>
          <Text style={styles.splashTitle}>
            <Text style={{ color: Colors.dark.primary }}>Ani</Text>
            <Text style={{ color: Colors.dark.secondary }}>hour</Text>
          </Text>
        </Animated.View>

        <Animated.Text style={[styles.splashTagline, { opacity: taglineOpacity }]}>
          Your ultimate anime companion
        </Animated.Text>

        <View style={styles.splashDots}>
          <Animated.View style={[styles.splashDot, { opacity: dot1, backgroundColor: Colors.dark.primary }]} />
          <Animated.View style={[styles.splashDot, { opacity: dot2, backgroundColor: Colors.dark.secondary }]} />
          <Animated.View style={[styles.splashDot, { opacity: dot3, backgroundColor: Colors.dark.accent }]} />
        </View>
      </View>
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
      <Stack.Screen
        name="anime/[id]"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
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

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && minTimeElapsed) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, minTimeElapsed]);

  const isReady = (fontsLoaded || fontError) && minTimeElapsed;

  if (!isReady) {
    return <AniHourSplash />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ContentSettingsProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </ContentSettingsProvider>
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
    zIndex: 1,
  },
  splashLogo: {
    width: 110,
    height: 110,
    marginBottom: 12,
  },
  splashLogoImg: {
    width: 110,
    height: 110,
    borderRadius: 24,
  },
  splashTitle: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  splashTagline: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: "center",
  },
  splashDots: {
    flexDirection: "row",
    gap: 12,
    marginTop: 48,
  },
  splashDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  splashGlow1: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "rgba(255,107,157,0.1)",
    top: -100,
    left: -100,
  },
  splashGlow2: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(78,205,196,0.08)",
    bottom: -80,
    right: -80,
  },
});
