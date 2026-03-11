import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { AnimeCard } from "@/components/AnimeCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { fetchUpcoming } from "@/lib/jikan";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function UpcomingScreen() {
  const insets = useSafeAreaInsets();

  const { data: anime, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["upcoming"],
    queryFn: () => fetchUpcoming(1),
  });

  const rows = anime ? chunkArray(anime, 2) : [];

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={["rgba(236,72,153,0.12)", "transparent"]}
        style={styles.headerGradient}
      >
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
          <View>
            <Text style={styles.headerEyebrow}>NEXT SEASON</Text>
            <Text style={styles.headerTitle}>Upcoming</Text>
          </View>
          <View style={styles.calendarIcon}>
            <Feather name="calendar" size={22} color={Colors.dark.accentPink} />
          </View>
        </View>
      </LinearGradient>

      {isLoading && (
        <View style={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      )}

      {isError && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.errorTitle}>Failed to load</Text>
          <Text style={styles.errorText}>Check your connection and try again</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(_, i) => `row-${i}`}
        ListHeaderComponent={renderHeader}
        renderItem={({ item: row }) => (
          <View style={styles.gridRow}>
            {row.map((a) => (
              <AnimeCard key={a.mal_id} anime={a} />
            ))}
          </View>
        )}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.dark.accentPink}
          />
        }
        ListEmptyComponent={isLoading ? null : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No upcoming anime found</Text>
          </View>
        )}
      />
    </View>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerGradient: {
    paddingBottom: 8,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerEyebrow: {
    color: Colors.dark.accentPink,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  calendarIcon: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(236,72,153,0.12)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.3)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  errorTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
