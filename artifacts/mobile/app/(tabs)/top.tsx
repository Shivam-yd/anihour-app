import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { AnimeCardWide } from "@/components/AnimeCard";
import { SkeletonWideCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { fetchTopAnime } from "@/lib/jikan";

type Filter = "bypopularity" | "favorite" | "airing" | "upcoming" | "byrank";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "bypopularity", label: "Popular" },
  { key: "byrank", label: "Top Rated" },
  { key: "airing", label: "Airing" },
  { key: "upcoming", label: "Upcoming" },
  { key: "favorite", label: "Favorites" },
];

export default function TopScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("bypopularity");

  const { data: anime, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["top-anime", filter],
    queryFn: () => fetchTopAnime(1, filter),
  });

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={["rgba(34,211,238,0.12)", "transparent"]}
        style={styles.headerGradient}
      >
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Top Anime</Text>
          <Ionicons name="trophy" size={24} color={Colors.dark.accentCyan} />
        </View>
      </LinearGradient>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {isLoading && (
        <View>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonWideCard key={i} />
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
        data={anime ?? []}
        keyExtractor={(item) => `${item.mal_id}`}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <AnimeCardWide anime={item} index={index} />
        )}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.dark.accentCyan}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerGradient: {
    paddingBottom: 0,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  filtersRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.accentLight,
    borderColor: Colors.dark.accent,
  },
  filterText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  filterTextActive: {
    color: Colors.dark.accent,
    fontFamily: "Inter_600SemiBold",
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
