import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
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
import { useQuery } from "@tanstack/react-query";

import { AnimeCard, AnimeCardWide } from "@/components/AnimeCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { fetchAnimeByGenre, type ContentType } from "@/lib/jikan";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

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

  const { data: anime = [], isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ["genre", genreId, ct],
    queryFn: () => fetchAnimeByGenre(genreId, 1, ct),
    enabled: !!id,
  });

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const rows = useMemo(() => chunkArray(anime, 2), [anime]);

  const renderHeader = useCallback(() => {
    return (
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
          <Text style={styles.sectionTitle}>Top {genreName} {ct === "manga" ? "Manga" : "Anime"}</Text>
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
      </LinearGradient>
    );
  }, [insets.top, ct, genreName, viewMode, isLoading, isError]);

  return (
    <View style={styles.container}>
      {viewMode === "grid" ? (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => `row-${i}`}
          ListHeaderComponent={renderHeader}
          renderItem={({ item: row }) => (
            <View style={styles.gridRow}>
              {row.map((a) => <AnimeCard key={`${a.mal_id}`} anime={a} />)}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          maxToRenderPerBatch={6}
          initialNumToRender={8}
          removeClippedSubviews={Platform.OS !== "web"}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.dark.primary} />}
          ListEmptyComponent={!isLoading ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No {ct} found for this genre</Text>
            </View>
          ) : null}
        />
      ) : (
        <FlatList
          data={anime}
          keyExtractor={(item) => `${item.mal_id}`}
          ListHeaderComponent={renderHeader}
          renderItem={({ item, index }) => <AnimeCardWide anime={item} index={index} />}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          maxToRenderPerBatch={6}
          initialNumToRender={8}
          removeClippedSubviews={Platform.OS !== "web"}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.dark.primary} />}
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
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  sectionAccent: { width: 3, height: 16, backgroundColor: Colors.dark.primary, borderRadius: 2 },
  sectionTitle: { color: Colors.dark.text, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  skeletonGrid: {
    flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12,
  },
  gridRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 12 },
  errorContainer: { alignItems: "center", paddingVertical: 40, gap: 10 },
  errorTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  errorText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular" },
  backBtn: {
    position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(26,26,46,0.85)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.dark.border,
  },
});
