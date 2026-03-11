import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { AnimeCard, AnimeCardWide } from "@/components/AnimeCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { fetchSeasonNow, Anime } from "@/lib/jikan";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

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
          {anime.episodes !== undefined && anime.episodes > 0 && (
            <Text style={styles.heroEps}>{anime.episodes} episodes</Text>
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
  const [current, setCurrent] = useState(0);
  const featured = anime.slice(0, 5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (featured.length < 2) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % featured.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [featured.length]);

  if (featured.length === 0) return null;
  const item = featured[current];

  return (
    <View style={styles.heroContainer}>
      <FeaturedHero
        anime={item}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/anime/[id]", params: { id: item.mal_id } });
        }}
      />
      <View style={styles.dotRow}>
        {featured.map((_, i) => (
          <Pressable key={i} onPress={() => setCurrent(i)}>
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

  const { data: anime, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["season-now"],
    queryFn: () => fetchSeasonNow(1),
  });

  const season = getCurrentSeason();
  const year = new Date().getFullYear();

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={["rgba(255,107,157,0.18)", "rgba(26,26,46,0)"]}
        style={styles.headerGradient}
      >
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
          <View>
            <Text style={styles.brandText}>ANIHOUR</Text>
            <Text style={styles.headerTitle}>{season} {year}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={viewMode === "grid" ? "list" : "grid"}
              size={18}
              color={Colors.dark.primary}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!isLoading && !isError && anime && anime.length > 0 && (
        <HeroSlider anime={anime} />
      )}

      <View style={styles.sectionRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>Now Airing</Text>
      </View>

      {isLoading && (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
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

  const rows = anime ? chunkArray(anime, 2) : [];

  return (
    <View style={styles.container}>
      {viewMode === "grid" ? (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => `row-${i}`}
          ListHeaderComponent={renderHeader}
          renderItem={({ item: row }) => (
            <View style={styles.gridRow}>
              {row.map((a) => <AnimeCard key={a.mal_id} anime={a} />)}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.dark.primary} />
          }
        />
      ) : (
        <FlatList
          data={anime ?? []}
          keyExtractor={(item) => `${item.mal_id}`}
          ListHeaderComponent={renderHeader}
          renderItem={({ item, index }) => <AnimeCardWide anime={item} index={index} />}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.dark.primary} />
          }
          ListEmptyComponent={isLoading ? null : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No anime found</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerGradient: {
    paddingBottom: 4,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandText: {
    color: Colors.dark.primary,
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
  viewToggle: {
    width: 40,
    height: 40,
    backgroundColor: Colors.dark.primaryLight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  heroContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  heroCard: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "80%",
  },
  heroInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  heroScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 5,
  },
  heroScoreText: {
    color: Colors.dark.star,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  heroTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    lineHeight: 23,
    marginBottom: 6,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  heroBadge: {
    backgroundColor: Colors.dark.primaryLight,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  heroBadgeText: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  heroEps: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  heroGenres: {
    color: Colors.dark.secondary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    opacity: 0.9,
  },
  heroPlayBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.border,
  },
  dotActive: {
    backgroundColor: Colors.dark.primary,
    width: 18,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: Colors.dark.primary,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
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
