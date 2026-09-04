import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { HeaderSearchButton } from "@/components/HeaderSearchButton";
import { fetchLatestEpisodes, LatestEpisode } from "@/lib/jikan";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 8;
const GRID_PADDING = 10;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * 1.42;

function formatReleaseTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (sameDay) return `Today · ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;

  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} · ${time}`;
}

function LatestEpisodeCard({ item }: { item: LatestEpisode }) {
  const title = item.media.title_english ?? item.media.title;
  const imageUrl = item.media.images?.jpg?.large_image_url ?? item.media.images?.jpg?.image_url;

  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({
          pathname: "/anime/[id]",
          params: { id: item.media.mal_id, contentType: "anime" },
        });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}, episode ${item.episode}`}
    >
      <View style={styles.posterWrap}>
        <Image source={{ uri: imageUrl }} style={styles.poster} contentFit="cover" transition={250} />
        <LinearGradient
          colors={["transparent", "rgba(26,26,46,0.96)"]}
          style={styles.posterGradient}
        />
        <View style={styles.episodeBadge}>
          <Text style={styles.episodeText}>EP {item.episode}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
      </View>
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={11} color={Colors.dark.secondary} />
        <Text style={styles.timeText} numberOfLines={1}>{formatReleaseTime(item.airingAt)}</Text>
      </View>
    </Pressable>
  );
}

export default function LatestScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<LatestEpisode[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [paginationError, setPaginationError] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(async (nextPage: number, isRefresh = false) => {
    const requestId = ++requestRef.current;
    if (isRefresh) setRefreshing(true);
    else if (nextPage === 1) {
      setLoading(true);
      setError(false);
    } else {
      setLoadingMore(true);
      setPaginationError(false);
    }

    try {
      const result = await fetchLatestEpisodes(nextPage);
      if (requestId !== requestRef.current) return;
      setItems((previous) => nextPage === 1 ? result.items : [...previous, ...result.items]);
      setPage(nextPage);
      setHasMore(result.hasNext);
      setError(false);
      setPaginationError(false);
    } catch {
      if (requestId === requestRef.current) {
        if (nextPage === 1) setError(true);
        else setPaginationError(true);
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleRefresh = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setPaginationError(false);
    load(1, true);
  }, [load]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) load(page + 1);
  }, [hasMore, loadingMore, load, page]);

  const topPadding = insets.top + 12;

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : items}
        numColumns={3}
        keyExtractor={(item) => `${item.id}`}
        columnWrapperStyle={styles.column}
        renderItem={({ item }) => <LatestEpisodeCard item={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={12}
        initialNumToRender={12}
        removeClippedSubviews={Platform.OS !== "web"}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.dark.primary} />
        }
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topPadding }]}>
            <LinearGradient
              colors={["rgba(255,107,157,0.18)", "rgba(26,26,46,0)"]}
              style={styles.headerGradient}
            >
              <View style={styles.headerTopRow}>
                <View>
                  <Text style={styles.eyebrow}>EPISODE TRACKER</Text>
                  <Text style={styles.headerTitle}>Latest</Text>
                  <Text style={styles.headerSubtitle}>Fresh releases, newest first</Text>
                </View>
                <View style={styles.headerActions}>
                  <HeaderSearchButton />
                  <View style={styles.iconBox}>
                    <Ionicons name="flash" size={22} color={Colors.dark.primary} />
                  </View>
                </View>
              </View>
            </LinearGradient>
            {!loading && !error && items.length > 0 && (
              <View style={styles.sectionRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>New episodes</Text>
                <Text style={styles.sectionHint}>Last 14 days</Text>
              </View>
            )}
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
                <Text style={styles.stateText}>Checking the latest releases...</Text>
              </View>
            )}
            {error && (
              <View style={styles.stateBox}>
                <Ionicons name="cloud-offline-outline" size={44} color={Colors.dark.textTertiary} />
                <Text style={styles.stateTitle}>Couldn’t load releases</Text>
                <Text style={styles.stateText}>Check your connection and try again</Text>
                <Pressable style={styles.retryButton} onPress={() => load(1)}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          hasMore && !loading && !error && items.length > 0 ? (
            paginationError ? (
              <View style={styles.paginationError}>
                <Text style={styles.paginationErrorText}>Couldn’t load older releases</Text>
                <Pressable style={styles.paginationRetry} onPress={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={Colors.dark.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>Retry</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <ActivityIndicator size="small" color={Colors.dark.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Load older releases</Text>
                )}
              </Pressable>
            )
          ) : null
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.stateBox}>
              <Ionicons name="sparkles-outline" size={44} color={Colors.dark.textTertiary} />
              <Text style={styles.stateTitle}>No recent releases</Text>
              <Text style={styles.stateText}>New episodes will appear here as they air.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  listContent: { paddingHorizontal: GRID_PADDING },
  header: { marginHorizontal: -GRID_PADDING },
  headerGradient: { paddingHorizontal: 16, paddingBottom: 18 },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrow: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: { color: Colors.dark.text, fontSize: 30, fontFamily: "Inter_700Bold" },
  headerSubtitle: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.primaryLight,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: Colors.dark.primary },
  sectionTitle: { color: Colors.dark.text, fontSize: 17, fontFamily: "Inter_700Bold", flex: 1 },
  sectionHint: { color: Colors.dark.textTertiary, fontSize: 11, fontFamily: "Inter_400Regular" },
  column: { gap: GRID_GAP, marginBottom: GRID_GAP },
  card: {
    width: CARD_WIDTH,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  posterWrap: { width: "100%", height: CARD_IMAGE_HEIGHT, position: "relative", backgroundColor: Colors.dark.surfaceElevated },
  poster: { width: "100%", height: "100%" },
  posterGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "58%" },
  episodeBadge: {
    position: "absolute",
    top: 7,
    left: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: Colors.dark.primary,
  },
  episodeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.4 },
  cardTitle: {
    position: "absolute",
    left: 7,
    right: 7,
    bottom: 7,
    color: Colors.dark.text,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_600SemiBold",
  },
  timeRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
  },
  timeText: { flex: 1, color: Colors.dark.textSecondary, fontSize: 9, fontFamily: "Inter_400Regular" },
  loadingBox: { alignItems: "center", paddingVertical: 36, gap: 10 },
  stateBox: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 10 },
  stateTitle: { color: Colors.dark.text, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  stateText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryButton: {
    marginTop: 2,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  retryText: { color: Colors.dark.primary, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    marginTop: 8,
    marginBottom: 10,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  loadMoreText: { color: Colors.dark.primary, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  paginationError: { alignItems: "center", gap: 8, marginHorizontal: 6, marginTop: 8, marginBottom: 10 },
  paginationErrorText: { color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" },
  paginationRetry: {
    minWidth: 90,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
});