import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimeCard } from "@/components/AnimeCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { fetchSeasonArchiveHasNext, Anime } from "@/lib/jikan";
import { chunkArray } from "@/lib/utils";

const SEASON_META: Record<string, { color: string; icon: string }> = {
  winter: { color: "#4ecdc4", icon: "snow" },
  spring: { color: "#a8e063", icon: "leaf" },
  summer: { color: "#f7971e", icon: "sunny" },
  fall: { color: "#e05c00", icon: "leaf" },
};

export default function SeasonDetailScreen() {
  const { year, season } = useLocalSearchParams<{ year: string; season: string }>();
  const insets = useSafeAreaInsets();
  const seasonYear = Number(year);
  const validSeason = season === "winter" || season === "spring" || season === "summer" || season === "fall";
  const validRoute = Number.isInteger(seasonYear) && seasonYear >= 2000 && seasonYear <= new Date().getFullYear() && validSeason;

  const [page, setPage] = useState(1);
  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(
    async (p: number) => {
      const requestId = ++requestRef.current;
      if (p === 1) { setLoading(true); setError(false); }
      else setLoadingMore(true);
      try {
        const result = await fetchSeasonArchiveHasNext(seasonYear, season!, p);
        if (requestId !== requestRef.current) return;
        setAllAnime((prev) => (p === 1 ? result.items : [...prev, ...result.items]));
        setHasNext(result.hasNext);
        setPage(p);
      } catch {
        if (requestId === requestRef.current) setError(true);
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [season, seasonYear]
  );

  useEffect(() => {
    requestRef.current += 1;
    setAllAnime([]);
    setPage(1);
    setHasNext(true);
    if (!validRoute) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    load(1);
  }, [load, validRoute]);

  const meta = SEASON_META[season ?? "winter"] ?? { color: Colors.dark.primary, icon: "calendar" };
  const seasonLabel = season ? season.charAt(0).toUpperCase() + season.slice(1) : "Season";
  const rows = chunkArray(allAnime, 2);

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(_, i) => `row-${i}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        windowSize={5}
        maxToRenderPerBatch={6}
        initialNumToRender={8}
        removeClippedSubviews={Platform.OS !== "web"}
        ListHeaderComponent={() => (
          <View>
            <LinearGradient
              colors={[`${meta.color}28`, "transparent"]}
              style={[styles.header, { paddingTop: Platform.OS === "web" ? insets.top + 72 : insets.top + 16 }]}
            >
              <View style={styles.breadcrumb}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
                  <Feather name="chevron-left" size={22} color={Colors.dark.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/seasons")} activeOpacity={0.8}>
                  <Text style={styles.breadcrumbLink}>Season Archive</Text>
                </TouchableOpacity>
                <Feather name="chevron-right" size={14} color={Colors.dark.textTertiary} />
                <Text style={styles.breadcrumbText}>{year}</Text>
              </View>

              <View style={styles.titleRow}>
                <Ionicons name={meta.icon as any} size={32} color={meta.color} style={{ marginRight: 12 }} />
                <View>
                  <Text style={[styles.pageTitle, { color: meta.color }]}>{seasonLabel}</Text>
                  <Text style={styles.pageSubtitle}>{year} • {allAnime.length}{hasNext ? "+" : ""} anime</Text>
                </View>
              </View>

              <View style={styles.seasonSwitcher}>
                {(["winter", "spring", "summer", "fall"] as const).map((s) => {
                  const isActive = s === season;
                  const sm = SEASON_META[s];
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.seasonBtn,
                        isActive && { backgroundColor: sm.color + "22", borderColor: sm.color },
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        if (!isActive) {
                          router.replace({
                            pathname: "/seasons/[year]/[season]",
                            params: { year: year ?? "", season: s },
                          });
                        }
                      }}
                    >
                      <Ionicons
                        name={sm.icon as any}
                        size={13}
                        color={isActive ? sm.color : Colors.dark.textTertiary}
                      />
                      <Text style={[styles.seasonBtnText, isActive && { color: sm.color }]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: meta.color }]} />
              <Text style={styles.sectionTitle}>{seasonLabel} {year} Anime</Text>
            </View>

            {loading && (
              <View style={styles.skeletonGrid}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </View>
            )}

            {error && (
              <View style={styles.centered}>
                <Ionicons name="cloud-offline-outline" size={48} color={Colors.dark.textTertiary} />
                <Text style={styles.errorText}>Failed to load this season</Text>
                <TouchableOpacity
                  style={[styles.retryBtn, { borderColor: meta.color }]}
                  onPress={() => { setPage(1); load(1); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.retryText, { color: meta.color }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        renderItem={({ item: row }) => (
          <View style={styles.gridRow}>
            {row.map((a) => <AnimeCard key={`${a.mal_id}`} anime={a} />)}
            {row.length < 2 && <View style={styles.cardPlaceholder} />}
          </View>
        )}
        ListFooterComponent={() =>
          hasNext && !loading && !error ? (
            <TouchableOpacity
              style={[styles.loadMoreBtn, { borderColor: meta.color }]}
              activeOpacity={0.8}
              onPress={() => {
                if (!loadingMore) load(page + 1);
              }}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={meta.color} />
              ) : (
                <Text style={[styles.loadMoreText, { color: meta.color }]}>Load More</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>No anime found for this season</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const CARD_PLACEHOLDER_W = (Dimensions.get("window").width - 48) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  breadcrumb: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 20 },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
    alignItems: "center", justifyContent: "center",
  },
  breadcrumbLink: { color: Colors.dark.primary, fontSize: 13, fontFamily: "Inter_500Medium" },
  breadcrumbText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
  titleRow: { flexDirection: "row", alignItems: "center" },
  pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  pageSubtitle: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  seasonSwitcher: {
    flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap",
  },
  seasonBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
  },
  seasonBtnText: {
    color: Colors.dark.textTertiary, fontSize: 13, fontFamily: "Inter_500Medium",
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  sectionAccent: { width: 4, height: 20, borderRadius: 2 },
  sectionTitle: { color: Colors.dark.text, fontSize: 17, fontFamily: "Inter_700Bold" },
  gridRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  cardPlaceholder: { width: CARD_PLACEHOLDER_W },
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  centered: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  errorText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.dark.surface, borderRadius: 10, borderWidth: 1,
  },
  retryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  loadMoreBtn: {
    marginHorizontal: 16, marginVertical: 16, paddingVertical: 14,
    backgroundColor: Colors.dark.surface, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  loadMoreText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
