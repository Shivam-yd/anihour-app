import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
import { ContentToggleBar } from "@/components/ContentToggleBar";
import { SkeletonCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";
import { fetchSeasonNow, Anime } from "@/lib/jikan";
import { chunkArray } from "@/lib/utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
type ViewMode = "grid" | "list";

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month < 3) return "Winter";
  if (month < 6) return "Spring";
  if (month < 9) return "Summer";
  return "Fall";
}

function FeaturedHero({ anime, onPress }: { anime: Anime; onPress: () => void }) {
  const imageUrl = anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url;
  const title = anime.title_english ?? anime.title;
  return (
    <Pressable style={styles.heroCard} onPress={onPress}>
      <Image source={{ uri: imageUrl }} style={styles.heroImage} contentFit="cover" transition={500} />
      <LinearGradient
        colors={["transparent", "rgba(22,33,62,0.6)", Colors.dark.background]}
        style={styles.heroGradient}
        locations={[0.3, 0.65, 1]}
      />
      <View style={styles.heroInfo}>
        {anime.score !== undefined && anime.score > 0 && (
          <View style={styles.heroScore}>
            <Ionicons name="star" size={13} color={Colors.dark.star} />
            <Text style={styles.heroScoreText}>{anime.score.toFixed(1)}</Text>
          </View>
        )}
        <Text style={styles.heroTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.heroMeta}>
          {anime.type && (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{anime.type}</Text>
            </View>
          )}
          {(anime.episodes ?? anime.chapters) !== undefined && (
            <Text style={styles.heroEps}>
              {anime.episodes ? `${anime.episodes} eps` : anime.chapters ? `${anime.chapters} ch` : ""}
            </Text>
          )}
        </View>
        <Text style={styles.heroGenres} numberOfLines={1}>
          {anime.genres?.slice(0, 3).map((g) => g.name).join(" · ") ?? ""}
        </Text>
      </View>
      <View style={styles.heroPlayBtn}>
        <Ionicons name="information-circle" size={20} color="#fff" />
      </View>
    </Pressable>
  );
}

function HeroSlider({ anime }: { anime: Anime[] }) {
  const featured = useMemo(() => anime.slice(0, 5), [anime]);
  const flatListRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (featured.length < 2) return;
    timerRef.current = setInterval(() => {
      const next = (currentRef.current + 1) % featured.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      currentRef.current = next;
      setCurrent(next);
    }, 4000);
  }, [featured.length]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      currentRef.current = idx;
      setCurrent(idx);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  }), []);

  if (featured.length === 0) return null;

  return (
    <View style={styles.heroContainer}>
      <FlatList
        ref={flatListRef}
        data={featured}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `hero-${item.mal_id}`}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH }}>
            <View style={{ marginHorizontal: 16 }}>
              <FeaturedHero
                anime={item}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: "/anime/[id]", params: { id: item.mal_id } });
                }}
              />
            </View>
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onScrollBeginDrag={() => { if (timerRef.current) clearInterval(timerRef.current); }}
        onMomentumScrollEnd={startTimer}
      />
      <View style={styles.dotRow}>
        {featured.map((_, i) => (
          <Pressable key={i} onPress={() => {
            flatListRef.current?.scrollToIndex({ index: i, animated: true });
            currentRef.current = i;
            setCurrent(i);
          }}>
            <View style={[styles.dot, i === current && styles.dotActive]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function SeasonScreen() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { contentType, isAdultMode } = useContentSettings();
  const flatListRef = useRef<FlatList>(null);
  useScrollToTop(flatListRef);

  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const heroAnime = useRef<Anime[]>([]);

  const load = useCallback(async (
    p: number,
    ct: typeof contentType,
    adult: boolean,
    refresh = false
  ) => {
    if (refresh) setIsRefreshing(true);
    else if (p === 1) { setLoading(true); setError(false); }
    else setLoadingMore(true);

    try {
      const { items, hasNext } = await fetchSeasonNow(p, ct, adult);
      if (p === 1) {
        heroAnime.current = items.slice(0, 5);
        setAllAnime(items);
      } else {
        setAllAnime(prev => [...prev, ...items]);
      }
      setHasMore(hasNext);
      setPage(p);
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
    heroAnime.current = [];
    load(1, contentType, isAdultMode);
  }, [contentType, isAdultMode, load]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    load(page + 1, contentType, isAdultMode);
  }, [loadingMore, hasMore, page, contentType, isAdultMode, load]);

  const handleRefresh = useCallback(() => {
    setAllAnime([]);
    setPage(1);
    setHasMore(true);
    heroAnime.current = [];
    load(1, contentType, isAdultMode, true);
  }, [contentType, isAdultMode, load]);

  const season = getCurrentSeason();
  const year = new Date().getFullYear();
  const isManga = contentType === "manga";
  const sectionTitle = isManga ? "Publishing Now" : "Now Airing";
  const headerTitle = isManga
    ? isAdultMode ? "Adult Manga" : "Manga"
    : isAdultMode ? "Adult Anime" : `${season} ${year}`;

  const renderHeader = useCallback(() => (
    <View>
      <LinearGradient
        colors={["rgba(255,107,157,0.18)", "rgba(26,26,46,0)"]}
        style={styles.headerGradient}
      >
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandA}>Ani</Text>
              <Text style={styles.brandB}>Hour</Text>
            </View>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(v => v === "grid" ? "list" : "grid")}
            activeOpacity={0.8}
          >
            <Ionicons name={viewMode === "grid" ? "list" : "grid"} size={18} color={Colors.dark.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.archiveBtn}
          onPress={() => router.push("/seasons")}
          activeOpacity={0.8}
        >
          <Feather name="archive" size={13} color={Colors.dark.accent} />
          <Text style={styles.archiveBtnText}>Browse Season Archive</Text>
          <Feather name="chevron-right" size={13} color={Colors.dark.textTertiary} />
        </TouchableOpacity>
      </LinearGradient>

      <ContentToggleBar />

      {!loading && !error && allAnime.length > 0 && (
        <HeroSlider anime={heroAnime.current} />
      )}

      <View style={styles.sectionRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      </View>
      <View style={{ height: 4 }} />

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
    </View>
  ), [insets.top, viewMode, headerTitle, sectionTitle, loading, error, allAnime.length, handleRefresh]);

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

  const gridAnime = useMemo(() => allAnime.slice(5), [allAnime]);
  const rows = useMemo(() => chunkArray(gridAnime, 2), [gridAnime]);

  return (
    <View style={styles.container}>
      {viewMode === "grid" ? (
        <FlatList
          ref={flatListRef}
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
        />
      ) : (
        <FlatList
          ref={flatListRef}
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
          ListEmptyComponent={loading ? null : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No content found</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  headerGradient: { paddingBottom: 10 },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 2 },
  brandA: { color: Colors.dark.primary, fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  brandB: { color: Colors.dark.text, fontSize: 15, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  headerTitle: { color: Colors.dark.text, fontSize: 26, fontFamily: "Inter_700Bold" },
  viewToggle: {
    width: 40, height: 40, backgroundColor: Colors.dark.primaryLight,
    borderRadius: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.dark.primary,
  },
  archiveBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 16, marginBottom: 2,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: Colors.dark.accentLight,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.dark.accent,
    alignSelf: "flex-start",
  },
  archiveBtnText: { color: Colors.dark.accent, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  heroContainer: { marginBottom: 16 },
  heroCard: {
    height: 220, borderRadius: 16, overflow: "hidden",
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
  },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "80%" },
  heroInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 },
  heroScore: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 5 },
  heroScoreText: { color: Colors.dark.star, fontSize: 13, fontFamily: "Inter_700Bold" },
  heroTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_700Bold", lineHeight: 23, marginBottom: 6 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  heroBadge: {
    backgroundColor: Colors.dark.primaryLight, borderRadius: 5,
    paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: Colors.dark.primary,
  },
  heroBadgeText: { color: Colors.dark.primary, fontSize: 10, fontFamily: "Inter_600SemiBold" },
  heroEps: { color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" },
  heroGenres: { color: Colors.dark.secondary, fontSize: 11, fontFamily: "Inter_400Regular", opacity: 0.9 },
  heroPlayBtn: {
    position: "absolute", top: 12, right: 12, width: 36, height: 36,
    borderRadius: 18, backgroundColor: Colors.dark.primaryLight,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.dark.primary,
  },
  dotRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.dark.border },
  dotActive: { backgroundColor: Colors.dark.primary, width: 18 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 },
  sectionAccent: { width: 4, height: 22, borderRadius: 2, backgroundColor: Colors.dark.primary },
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_700Bold" },
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  gridRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  errorContainer: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  errorTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  errorText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.dark.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.dark.primary,
  },
  retryText: { color: Colors.dark.primary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  loadMoreBtn: {
    marginHorizontal: 16, marginVertical: 16, paddingVertical: 14,
    backgroundColor: Colors.dark.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.dark.primary,
    alignItems: "center", justifyContent: "center",
  },
  loadMoreText: { color: Colors.dark.primary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
