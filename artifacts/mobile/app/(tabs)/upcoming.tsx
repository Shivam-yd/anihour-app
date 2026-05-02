import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useScrollToTop } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimeCard } from "@/components/AnimeCard";
import { ContentToggleBar } from "@/components/ContentToggleBar";
import { SkeletonCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";
import { fetchUpcoming, Anime } from "@/lib/jikan";
import { chunkArray } from "@/lib/utils";

export default function UpcomingScreen() {
  const insets = useSafeAreaInsets();
  const { contentType, isAdultMode } = useContentSettings();
  const isManga = contentType === "manga";
  const flatListRef = useRef<FlatList>(null);
  useScrollToTop(flatListRef);

  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: number, ct: typeof contentType, adult: boolean, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else if (p === 1) { setLoading(true); setError(false); }
    else setLoadingMore(true);

    try {
      const items = await fetchUpcoming(p, ct, adult);
      setAllAnime(prev => p === 1 ? items : [...prev, ...items]);
      setHasMore(items.length > 0);
    } catch {
      if (p === 1) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setAllAnime([]);
    setPage(1);
    setHasMore(true);
    setError(false);
    load(1, contentType, isAdultMode);
  }, [contentType, isAdultMode, load]);

  const handleLoadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    load(next, contentType, isAdultMode);
  }, [page, contentType, isAdultMode, load]);

  const handleRefresh = useCallback(() => {
    setAllAnime([]);
    setPage(1);
    setHasMore(true);
    load(1, contentType, isAdultMode, true);
  }, [contentType, isAdultMode, load]);

  const rows = chunkArray(allAnime, 2);

  const renderHeader = useCallback(() => (
    <View>
      <LinearGradient colors={["rgba(69,183,209,0.15)", "transparent"]} style={styles.headerGradient}>
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Upcoming {isManga ? "Manga" : "Anime"}</Text>
          <View style={styles.iconBox}>
            <Feather name="calendar" size={22} color={Colors.dark.accent} />
          </View>
        </View>
      </LinearGradient>

      <ContentToggleBar />

      <View style={styles.infoBar}>
        <Ionicons name="time-outline" size={14} color={Colors.dark.accent} />
        <Text style={styles.infoText}>
          {isManga ? "Not yet published — coming soon" : "Next season anime — coming soon"}
        </Text>
      </View>

      {loading && (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
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
    </View>
  ), [insets.top, isManga, loading, error, handleRefresh]);

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
          <ActivityIndicator size="small" color={Colors.dark.accent} />
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
        data={loading ? [] : rows}
        keyExtractor={(_, i) => `row-${i}`}
        ListHeaderComponent={renderHeader}
        renderItem={({ item: row }) => (
          <View style={styles.gridRow}>
            {row.map((a) => <AnimeCard key={a.mal_id} anime={a} />)}
            {row.length < 2 && <View style={{ flex: 1 }} />}
          </View>
        )}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={6}
        initialNumToRender={8}
        removeClippedSubviews={Platform.OS !== "web"}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.dark.accent} />}
        ListEmptyComponent={loading || error ? null : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No upcoming content found</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  headerGradient: { paddingBottom: 8 },
  headerContent: {
    paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerTitle: { color: Colors.dark.text, fontSize: 26, fontFamily: "Inter_700Bold" },
  iconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.dark.accentLight,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.dark.accent,
  },
  infoBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingBottom: 12 },
  infoText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  gridRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  errorContainer: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  errorTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  errorText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.dark.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.dark.accent,
  },
  retryText: { color: Colors.dark.accent, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  loadMoreBtn: {
    marginHorizontal: 16, marginVertical: 16, paddingVertical: 14,
    backgroundColor: Colors.dark.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.dark.accent,
    alignItems: "center", justifyContent: "center",
  },
  loadMoreText: { color: Colors.dark.accent, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
