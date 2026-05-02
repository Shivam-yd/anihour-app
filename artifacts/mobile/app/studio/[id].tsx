import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { fetchStudioAnimeHasNext, Anime } from "@/lib/jikan";

const CARD_COLS = 3;

const StudioAnimeCard = React.memo(function StudioAnimeCard({ anime }: { anime: Anime }) {
  const imageUrl = anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url;
  const title = anime.title_english ?? anime.title;
  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({ pathname: "/anime/[id]", params: { id: anime.mal_id, contentType: "anime" } })
      }
    >
      <Image source={{ uri: imageUrl }} style={styles.cardImage} contentFit="cover" transition={300} />
      <LinearGradient
        colors={["transparent", "rgba(26,26,46,0.95)"]}
        style={styles.cardGradient}
      />
      {anime.score !== undefined && anime.score > 0 && (
        <View style={styles.scoreBadge}>
          <Ionicons name="star" size={8} color={Colors.dark.star} />
          <Text style={styles.scoreText}>{anime.score.toFixed(1)}</Text>
        </View>
      )}
      <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
    </Pressable>
  );
});

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

export default function StudioScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState(1);
  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: number) => {
    if (p === 1) { setLoading(true); setError(false); }
    else setLoadingMore(true);
    try {
      const result = await fetchStudioAnimeHasNext(Number(id), p);
      setAllAnime((prev) => p === 1 ? result.items : [...prev, ...result.items]);
      setHasNext(result.hasNext);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [id]);

  React.useEffect(() => { load(1); }, [load]);

  const rows = chunkArray(allAnime, CARD_COLS);
  const studioName = name ?? "Studio";

  const avgScore =
    allAnime.length > 0
      ? (allAnime.filter((a) => (a.score ?? 0) > 0).reduce((s, a) => s + (a.score ?? 0), 0) /
          Math.max(1, allAnime.filter((a) => (a.score ?? 0) > 0).length)).toFixed(1)
      : "—";

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(_, i) => `row-${i}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        windowSize={5}
        maxToRenderPerBatch={6}
        initialNumToRender={9}
        removeClippedSubviews={Platform.OS !== "web"}
        ListHeaderComponent={() => (
          <View>
            <LinearGradient
              colors={["rgba(78,205,196,0.18)", "transparent"]}
              style={[styles.header, { paddingTop: Platform.OS === "web" ? insets.top + 72 : insets.top + 16 }]}
            >
              <View style={styles.breadcrumb}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
                  <Feather name="chevron-left" size={22} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.breadcrumbText}>Studio</Text>
              </View>

              <View style={styles.studioHero}>
                <View style={styles.studioIconBox}>
                  <Ionicons name="film" size={32} color={Colors.dark.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studioName}>{studioName}</Text>
                  <Text style={styles.studioSub}>Anime Production Studio</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{allAnime.length}{hasNext ? "+" : ""}</Text>
                  <Text style={styles.statLabel}>Anime Titles</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{avgScore}</Text>
                  <Text style={styles.statLabel}>Avg. Score</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>All Anime by {studioName}</Text>
            </View>

            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.dark.secondary} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}

            {error && (
              <View style={styles.centered}>
                <Ionicons name="cloud-offline-outline" size={48} color={Colors.dark.textTertiary} />
                <Text style={styles.errorText}>Failed to load</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => { setPage(1); load(1); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        renderItem={({ item: row }) => (
          <View style={styles.gridRow}>
            {row.map((a) => <StudioAnimeCard key={a.mal_id} anime={a} />)}
            {row.length < CARD_COLS &&
              Array.from({ length: CARD_COLS - row.length }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.cardPlaceholder} />
              ))}
          </View>
        )}
        ListFooterComponent={() =>
          hasNext && !loading && !error ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              activeOpacity={0.8}
              onPress={() => {
                const next = page + 1;
                setPage(next);
                load(next);
              }}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={Colors.dark.secondary} />
              ) : (
                <Text style={styles.loadMoreText}>Load More</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>No anime found for this studio</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const CARD_W = (require("react-native").Dimensions.get("window").width - 48) / CARD_COLS;
const CARD_H = CARD_W * 1.55;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  breadcrumb: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
    alignItems: "center", justifyContent: "center",
  },
  breadcrumbText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_500Medium" },
  studioHero: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  studioIconBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.dark.secondaryLight,
    borderWidth: 1, borderColor: Colors.dark.secondary,
    alignItems: "center", justifyContent: "center",
  },
  studioName: { color: Colors.dark.text, fontSize: 22, fontFamily: "Inter_700Bold", flexShrink: 1 },
  studioSub: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  statsRow: {
    flexDirection: "row", backgroundColor: Colors.dark.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.border, padding: 16,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { color: Colors.dark.secondary, fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  statDivider: { width: 1, backgroundColor: Colors.dark.border, marginHorizontal: 8 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  sectionAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: Colors.dark.secondary },
  sectionTitle: { color: Colors.dark.text, fontSize: 17, fontFamily: "Inter_700Bold" },
  gridRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  card: {
    width: CARD_W, height: CARD_H,
    borderRadius: 10, overflow: "hidden",
    backgroundColor: Colors.dark.surface,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  cardPlaceholder: { width: CARD_W, height: CARD_H },
  cardImage: { width: "100%", height: "100%" },
  cardGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "55%" },
  scoreBadge: {
    position: "absolute", top: 5, right: 5,
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "rgba(22,33,62,0.85)", borderRadius: 5,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  scoreText: { color: Colors.dark.star, fontSize: 9, fontFamily: "Inter_700Bold" },
  cardTitle: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 6, color: Colors.dark.text, fontSize: 10, fontFamily: "Inter_600SemiBold", lineHeight: 14,
  },
  centered: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  loadingText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular" },
  errorText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.dark.secondaryLight, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.dark.secondary,
  },
  retryText: { color: Colors.dark.secondary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  loadMoreBtn: {
    marginHorizontal: 16, marginVertical: 16, paddingVertical: 14,
    backgroundColor: Colors.dark.secondaryLight, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.dark.secondary,
    alignItems: "center", justifyContent: "center",
  },
  loadMoreText: { color: Colors.dark.secondary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
