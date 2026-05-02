import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimeCard, AnimeCardWide } from "@/components/AnimeCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { fetchAnimeByGenre, type ContentType, type Anime } from "@/lib/jikan";
import { chunkArray } from "@/lib/utils";

export default function GenreScreen() {
  const { id, name, contentType } = useLocalSearchParams<{
    id: string;
    name: string;
    contentType?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const ct: ContentType = contentType === "manga" ? "manga" : "anime";
  const genreId = parseInt(id ?? "1", 10);
  const genreName = name ?? "Genre";

  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: number, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else if (p === 1) { setLoading(true); setError(false); }
    else setLoadingMore(true);

    try {
      const { items, hasNext } = await fetchAnimeByGenre(genreId, p, ct);
      setAllAnime(prev => p === 1 ? items : [...prev, ...items]);
      setHasMore(hasNext);
      setPage(p);
    } catch {
      if (p === 1) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [genreId, ct]);

  useEffect(() => {
    setAllAnime([]);
    setPage(1);
    setHasMore(true);
    setError(false);
    load(1);
  }, [load]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    load(page + 1);
  }, [loadingMore, hasMore, page, load]);

  const handleRefresh = useCallback(() => {
    setAllAnime([]);
    setPage(1);
    setHasMore(true);
    load(1, true);
  }, [load]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const rows = useMemo(() => chunkArray(allAnime, 2), [allAnime]);

  const renderHeader = useCallback(() => (
    <LinearGradient
      colors={["rgba(255,107,157,0.18)", "rgba(26,26,46,0)"]}
      style={styles.headerGradient}
    >
      <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSub}>{ct === "manga" ? "MANGA" : "ANIME"} GENRE</Text>
          <Text style={styles.headerTitle}>{genreName}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          activeOpacity={0.8}
        >
          <Ionicons name={viewMode === "grid" ? "list" : "grid"} size={18} color={Colors.dark.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>
          Top {genreName} {ct === "manga" ? "Manga" : "Anime"}
        </Text>
        {allAnime.length > 0 && (
          <Text style={styles.countText}>{allAnime.length}{hasMore ? "+" : ""}</Text>
        )}
      </View>

      {loading && (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
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
    </LinearGradient>
  ), [insets.top, ct, genreName, viewMode, loading, error, allAnime.length, hasMore, handleRefresh]);

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
          <ActivityIndicator size="small" color={Colors.dark.primary} />
        ) : (
          <Text style={styles.loadMoreText}>Load More</Text>
        )}
      </TouchableOpacity>
    );
  }, [hasMore, loading, error, allAnime.length, loadingMore, handleLoadMore]);

  return (
    <View style={styles.container}>
      {viewMode === "grid" ? (
        <FlatList
          data={loading ? [] : rows}
          keyExtractor={(_, i) => `row-${i}`}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          renderItem={({ item: row }) => (
            <View style={styles.gridRow}>
              {row.map((a) => <AnimeCard key={`${a.mal_id}`} anime={a} />)}
              {row.length < 2 && <View style={{ flex: 1 }} />}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          maxToRenderPerBatch={6}
          initialNumToRender={8}
          removeClippedSubviews={Platform.OS !== "web"}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.dark.primary} />}
          ListEmptyComponent={!loading && !error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No {ct} found for this genre</Text>
            </View>
          ) : null}
        />
      ) : (
        <FlatList
          data={loading ? [] : allAnime}
          keyExtractor={(item) => `${item.mal_id}`}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          renderItem={({ item, index }) => <AnimeCardWide anime={item} index={index} />}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          maxToRenderPerBatch={6}
          initialNumToRender={8}
          removeClippedSubviews={Platform.OS !== "web"}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.dark.primary} />}
        />
      )}

      <Pressable
        style={[styles.backBtn, { top: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}
        onPress={handleBack}
      >
        <Feather name="chevron-left" size={22} color={Colors.dark.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  headerGradient: { paddingBottom: 12 },
  headerContent: {
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, paddingLeft: 64,
  },
  headerLeft: { flex: 1 },
  headerSub: {
    color: Colors.dark.primary, fontSize: 10, fontFamily: "Inter_600SemiBold",
    letterSpacing: 2, marginBottom: 2,
  },
  headerTitle: { color: Colors.dark.text, fontSize: 26, fontFamily: "Inter_700Bold" },
  viewToggle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.dark.surface, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  sectionRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12,
  },
  sectionAccent: { width: 3, height: 16, backgroundColor: Colors.dark.primary, borderRadius: 2 },
  sectionTitle: { color: Colors.dark.text, fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  countText: {
    color: Colors.dark.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular",
  },
  skeletonGrid: {
    flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12,
  },
  gridRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 12 },
  errorContainer: { alignItems: "center", paddingVertical: 40, gap: 10 },
  errorTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  errorText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular" },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.dark.primaryLight, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.dark.primary,
  },
  retryText: { color: Colors.dark.primary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  backBtn: {
    position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(26,26,46,0.85)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  loadMoreBtn: {
    marginHorizontal: 16, marginVertical: 16, paddingVertical: 14,
    backgroundColor: Colors.dark.primaryLight, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.dark.primary,
    alignItems: "center", justifyContent: "center",
  },
  loadMoreText: { color: Colors.dark.primary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
