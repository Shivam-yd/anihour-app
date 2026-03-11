import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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

import { AnimeCard, AnimeCardWide } from "@/components/AnimeCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { fetchSeasonNow, Anime } from "@/lib/jikan";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type ViewMode = "grid" | "list";

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month < 3) return "Winter";
  if (month < 6) return "Spring";
  if (month < 9) return "Summer";
  return "Fall";
}

export default function SeasonScreen() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const {
    data: anime,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["season-now"],
    queryFn: () => fetchSeasonNow(1),
  });

  const season = getCurrentSeason();
  const year = new Date().getFullYear();

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={["rgba(168,85,247,0.15)", "transparent"]}
        style={styles.headerGradient}
      >
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
          <View>
            <Text style={styles.headerEyebrow}>NOW AIRING</Text>
            <Text style={styles.headerTitle}>
              {season} {year}
            </Text>
          </View>
          <View style={styles.viewToggle}>
            <Ionicons
              name={viewMode === "grid" ? "grid" : "list"}
              size={20}
              color={Colors.dark.accent}
              onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            />
          </View>
        </View>
      </LinearGradient>

      {isLoading && (
        <View style={[styles.grid, { paddingHorizontal: 16 }]}>
          {Array.from({ length: 6 }).map((_, i) => (
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

  if (viewMode === "grid") {
    const rows = anime ? chunkArray(anime, 2) : [];

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
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.dark.accent}
            />
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={anime ?? []}
        keyExtractor={(item) => `${item.mal_id}`}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <AnimeCardWide anime={item} index={index} />
        )}
        contentContainerStyle={[
          { paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.dark.accent}
          />
        }
        ListEmptyComponent={isLoading ? null : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No anime found</Text>
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
    color: Colors.dark.accent,
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
  viewToggle: {
    width: 40,
    height: 40,
    backgroundColor: Colors.dark.accentLight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 8,
  },
  gridContent: {
    paddingBottom: 90,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  errorContainer: {
    flex: 1,
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
