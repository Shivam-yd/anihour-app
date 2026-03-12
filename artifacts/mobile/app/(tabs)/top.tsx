import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
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

type Filter = "bypopularity" | "" | "airing" | "upcoming" | "favorite";
type AnimeType = "all" | "tv" | "movie" | "ova" | "special" | "ona";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "bypopularity", label: "Popular" },
  { key: "", label: "Top Rated" },
  { key: "airing", label: "Airing" },
  { key: "upcoming", label: "Upcoming" },
  { key: "favorite", label: "Favorites" },
];

const TYPES: { key: AnimeType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "tv", label: "TV" },
  { key: "movie", label: "Movie" },
  { key: "ova", label: "OVA" },
  { key: "special", label: "Special" },
  { key: "ona", label: "ONA" },
];

export default function TopScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("bypopularity");
  const [animeType, setAnimeType] = useState<AnimeType>("all");

  const { data: anime, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["top-anime", filter, animeType],
    queryFn: () => fetchTopAnime(1, filter, animeType === "all" ? undefined : animeType),
  });

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={["rgba(78,205,196,0.15)", "transparent"]}
        style={styles.headerGradient}
      >
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
          <View>
            <Text style={styles.brandText}>ANIHOUR</Text>
            <Text style={styles.headerTitle}>Top Anime</Text>
          </View>
          <View style={styles.trophyBox}>
            <Ionicons name="trophy" size={22} color={Colors.dark.secondary} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.chip, filter === item.key && styles.chipActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.chipText, filter === item.key && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typesRow}
      >
        {TYPES.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.typeChip, animeType === item.key && styles.typeChipActive]}
            onPress={() => setAnimeType(item.key)}
          >
            <Text style={[styles.typeChipText, animeType === item.key && styles.typeChipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading && (
        <View>{Array.from({ length: 6 }).map((_, i) => <SkeletonWideCard key={i} />)}</View>
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
        renderItem={({ item, index }) => <AnimeCardWide anime={item} index={index} />}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.dark.secondary} />
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
  brandText: {
    color: Colors.dark.secondary,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    marginBottom: 2,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  trophyBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  filtersRow: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  typesRow: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
    gap: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chipActive: {
    backgroundColor: Colors.dark.primaryLight,
    borderColor: Colors.dark.primary,
  },
  chipText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  chipTextActive: {
    color: Colors.dark.primary,
    fontFamily: "Inter_600SemiBold",
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  typeChipActive: {
    backgroundColor: Colors.dark.secondaryLight,
    borderColor: Colors.dark.secondary,
  },
  typeChipText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  typeChipTextActive: {
    color: Colors.dark.secondary,
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
