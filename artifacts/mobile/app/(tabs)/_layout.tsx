import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();
  const { isAdultMode, toggleAdultMode } = useContentSettings();

  const tabBarHeight = isWeb ? 84 : 56 + insets.bottom;
  const floatBottom = tabBarHeight + 12;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.dark.primary,
          tabBarInactiveTintColor: Colors.dark.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : Colors.dark.backgroundSecondary,
            borderTopWidth: 1,
            borderTopColor: Colors.dark.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.dark.backgroundSecondary }]} />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Season",
            tabBarIcon: ({ color }) => <Ionicons name="flame" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="top"
          options={{
            title: "Top",
            tabBarIcon: ({ color }) => <Ionicons name="trophy" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="upcoming"
          options={{
            title: "Upcoming",
            tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color }) => <Feather name="search" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: "News",
            tabBarIcon: ({ color }) => <Feather name="file-text" size={22} color={color} />,
          }}
        />
      </Tabs>

      <Pressable
        style={[
          styles.floatingAdult,
          { bottom: floatBottom },
          isAdultMode && styles.floatingAdultActive,
        ]}
        onPress={toggleAdultMode}
        hitSlop={10}
      >
        <Text style={[styles.floatingAdultText, isAdultMode && styles.floatingAdultTextActive]}>
          18+
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingAdult: {
    position: "absolute",
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 999,
  },
  floatingAdultActive: {
    backgroundColor: "rgba(239,68,68,0.15)",
    borderColor: "#ef4444",
  },
  floatingAdultText: {
    color: Colors.dark.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  floatingAdultTextActive: {
    color: "#ef4444",
  },
});
