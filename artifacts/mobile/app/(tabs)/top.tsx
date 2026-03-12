import { Ionicons } from "@expo/vector-icons";
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
import { ContentToggleBar } from "@/components/ContentToggleBar";
import { SkeletonWideCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";
import { fetchTopAnime } from "@/lib/jikan";

type Filter = "bypopularity" | "" | "airing" | "upcoming";
type AnimeType = "all" | "tv" | "movie" | "ova" | "special" | "ona";
type MangaType = "all" | "manga" | "manhwa" | "manhua" | "novel" | "oneshot";

const ANIME_FILTERS: { key: Filter; label: string }[] = [
  { key: "bypopularity", label: "Popular" },
  { key: "", label: "Top Rated" },
  { key: "airing", label: "Airing" },
  { key: "upcoming", label: "Upcoming" },
];

const MANGA_FILTERS: { key: Filter; label: string }[] = [
  { key: "bypopularity", label: "Popular" },
  { key: "", label: "Top Rated" },
];

const ANIME_TYPES: { key: AnimeType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "tv", label: "TV" },
  { key: "movie", label: "Movie" },
  { key: "ova", label: "OVA" },
  { key: "special", label: "Special" },
  { key: "ona", label: "ONA" },
];

const MANGA_TYPES: { key: MangaType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "manga", label: "Manga" },
  { key: "manhwa", label: "Manhwa" },
  { key: "manhua", label: "Manhua" },
  { key: "novel", label: "Novel" },
  { key: "oneshot", label: "One-Shot" },
];

export default function TopScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("bypopularity");
  const [animeType, setAnimeType] = useState<AnimeType>("all");
  const [mangaType, setMangaType] = useState<MangaType>("all");
  const { contentType, isAdultMode } = useContentSettings();
  const isManga = contentType === "manga";

  const activeType = isManga
    ? (mangaType === "all" ? undefined : mangaType)
    : (animeType === "all" ? undefined : animeType);

  const { data: anime, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["top-anime", filter, activeType, contentType, isAdultMode],
    queryFn: () => fetchTopAnime(1, filter, activeType, contentType, isAdultMode),
  });

  const renderHeader = () => (
    <View>
      <LinearGradient colors={["rgba(78,205,196,0.15)", "transparent"]} style={styles.headerGradient}>
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
          <View>
            <Text style={styles.brandText}>ANIHOUR</Text>
            <Text style={styles.headerTitle}>Top {isManga ? "Manga" : "Anime"}</Text>
          </View>
          <View style={styles.trophyBox}>
            <Ionicons name="trophy" size={22} color={Colors.dark.secondary} />
          </View>
        </View>
      </LinearGradient>

      <ContentToggleBar />

      {!isAdultMode && (
        <>
          <View style={styles.filtersRow}>
            {(isManga ? MANGA_FILTERS : ANIME_FILTERS).map((item) => (
              <Pressable
                key={item.key + (isManga ? "-m" : "-a")}
                style={[styles.chip, filter === item.key && styles.chipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text style={[styles.chipText, filter === item.key && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.typesRow}>
            {isManga
              ? MANGA_TYPES.map((item) => (
                  <Pressable
                    key={item.key}
                    style={[styles.typeChip, mangaType === item.key && styles.typeChipActive]}
                    onPress={() => setMangaType(item.key)}
                  >
                    <Text style={[styles.typeChipText, mangaType === item.key && styles.typeChipTextActive]}>{item.label}</Text>
                  </Pressable>
                ))
              : ANIME_TYPES.map((item) => (
                  <Pressable
                    key={item.key}
                    style={[styles.typeChip, animeType === item.key && styles.typeChipActive]}
                    onPress={() => setAnimeType(item.key)}
                  >
                    <Text style={[styles.typeChipText, animeType === item.key && styles.typeChipTextActive]}>{item.label}</Text>
                  </Pressable>
                ))
            }
          </View>
        </>
      )}

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
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.dark.secondary} />}
        ListEmptyComponent={isLoading ? null : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No content found</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  headerGradient: { paddingBottom: 0 },
  headerContent: {
    paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  brandText: { color: Colors.dark.secondary, fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 3, marginBottom: 2 },
  headerTitle: { color: Colors.dark.text, fontSize: 26, fontFamily: "Inter_700Bold" },
  trophyBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.dark.secondaryLight,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.dark.secondary,
  },
  filtersRow: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  typesRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingBottom: 12, gap: 7 },
  chip: {
    flex: 1, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, alignItems: "center",
  },
  chipActive: { backgroundColor: Colors.dark.primaryLight, borderColor: Colors.dark.primary },
  chipText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_500Medium" },
  chipTextActive: { color: Colors.dark.primary, fontFamily: "Inter_600SemiBold" },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
  },
  typeChipActive: { backgroundColor: Colors.dark.secondaryLight, borderColor: Colors.dark.secondary },
  typeChipText: { color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_500Medium" },
  typeChipTextActive: { color: Colors.dark.secondary, fontFamily: "Inter_600SemiBold" },
  errorContainer: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  errorTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  errorText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
