import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useScrollToTop } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimeCardWide } from "@/components/AnimeCard";
import { ContentToggleBar } from "@/components/ContentToggleBar";
import { SkeletonWideCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";
import { fetchTopAnime, Anime } from "@/lib/jikan";

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
  const flatListRef = useRef<FlatList>(null);
  useScrollToTop(flatListRef);
  const [filter, setFilter] = useState<Filter>("bypopularity");
  const [animeType, setAnimeType] = useState<AnimeType>("all");
  const [mangaType, setMangaType] = useState<MangaType>("all");
  const { contentType, isAdultMode } = useContentSettings();
  const isManga = contentType === "manga";

  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);

  const safeFilter: Filter =
    isManga && (filter === "airing" || filter === "upcoming") ? "bypopularity" : filter;
  const activeType = isManga
    ? (mangaType === "all" ? undefined : mangaType)
    : (animeType === "all" ? undefined : animeType);

  const isLoadingRef = useRef(false);

  const load = useCallback(async (
    p: number,
    f: Filter,
    type: string | undefined,
    ct: typeof contentType,
    adult: boolean,
    refresh = false
  ) => {
    if (p === 1 && isLoadingRef.current) return;
    isLoadingRef.current = true;
    if (refresh) setIsRefreshing(true);
    else if (p === 1) { setLoading(true); setError(false); }
    else setLoadingMore(true);

    try {
      const safF: Filter = ct === "manga" && (f === "airing" || f === "upcoming") ? "bypopularity" : f;
      const { items, hasNext } = await fetchTopAnime(p, safF, type, ct, adult);
      setAllAnime(prev => p === 1 ? items : [...prev, ...items]);
      setHasMore(hasNext);
      setPage(p);
    } catch {
      if (p === 1) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setFilter("bypopularity");
    setAnimeType("all");
    setMangaType("all");
  }, [contentType, isAdultMode]);

  useEffect(() => {
    setAllAnime([]);
    setPage(1);
    setHasMore(true);
    setError(false);
    load(1, safeFilter, activeType, contentType, isAdultMode);
  }, [safeFilter, activeType, contentType, isAdultMode]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    load(page + 1, safeFilter, activeType, contentType, isAdultMode);
  }, [loadingMore, hasMore, page, safeFilter, activeType, contentType, isAdultMode, load]);

  const handleRefresh = useCallback(() => {
    setAllAnime([]);
    setPage(1);
    setHasMore(true);
    load(1, safeFilter, activeType, contentType, isAdultMode, true);
  }, [safeFilter, activeType, contentType, isAdultMode, load]);

  const renderHeader = useCallback(() => (
    <View>
      <LinearGradient colors={["rgba(78,205,196,0.15)", "transparent"]} style={styles.headerGradient}>
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
          <View>
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
                style={[styles.chip, safeFilter === item.key && styles.chipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text style={[styles.chipText, safeFilter === item.key && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typesRow}
            contentContainerStyle={styles.typesRowContent}
          >
            {(isManga ? MANGA_TYPES : ANIME_TYPES).map((item) => {
              const active = isManga ? mangaType === item.key : animeType === item.key;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => isManga ? setMangaType(item.key as MangaType) : setAnimeType(item.key as AnimeType)}
                >
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

      {loading && (
        <View>{Array.from({ length: 6 }).map((_, i) => <SkeletonWideCard key={i} />)}</View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.errorTitle}>Failed to load</Text>
          <Text style={styles.errorText}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [insets.top, isManga, safeFilter, filter, animeType, mangaType, loading, error, isAdultMode, handleRefresh]);

  const renderFooter = useCallback(() => {
    if (!hasMore || loading || error || allAnime.length === 0) return null;
    return (
      <TouchableOpacity
        style={styles.loadMoreBtn}
        onPress={handleLoadMore}
        disabled={loadingMore}
        activeOpacity={0.8}
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color={Colors.dark.secondary} />
        ) : (
          <Text style={styles.loadMoreText}>Load More</Text>
        )}
      </TouchableOpacity>
    );
  }, [hasMore, loading, error, allAnime.length, loadingMore, handleLoadMore]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={loading ? [] : allAnime}
        keyExtractor={(item) => `${item.mal_id}`}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => <AnimeCardWide anime={item} index={index} />}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={6}
        initialNumToRender={8}
        removeClippedSubviews={Platform.OS !== "web"}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.dark.secondary} />}
        ListEmptyComponent={loading || error ? null : (
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
  headerTitle: { color: Colors.dark.text, fontSize: 26, fontFamily: "Inter_700Bold" },
  trophyBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.dark.secondaryLight,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.dark.secondary,
  },
  filtersRow: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  typesRow: { paddingBottom: 12 },
  typesRowContent: { paddingHorizontal: 16, gap: 7, flexDirection: "row" },
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
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.dark.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.dark.secondary,
  },
  retryText: { color: Colors.dark.secondary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  loadMoreBtn: {
    marginHorizontal: 16, marginVertical: 16, paddingVertical: 14,
    backgroundColor: Colors.dark.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.dark.secondary,
    alignItems: "center", justifyContent: "center",
  },
  loadMoreText: { color: Colors.dark.secondary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
