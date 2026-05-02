import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimeCardWide } from "@/components/AnimeCard";
import { ContentToggleBar } from "@/components/ContentToggleBar";
import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";
import { searchAnime, Anime, GENRE_MAP } from "@/lib/jikan";

const GENRE_COLORS = [
  Colors.dark.primary, Colors.dark.secondary, Colors.dark.accent,
  "#ffa726", "#66bb6a", "#ab47bc", "#ef5350", "#26c6da",
  "#8d6e63", "#78909c", "#5c6bc0", "#42a5f5",
];

const GENRES = Object.entries(GENRE_MAP).map(([, { id, label }], i) => ({
  id, label,
  color: GENRE_COLORS[i % GENRE_COLORS.length],
}));

const SUGGESTIONS = [
  "Naruto", "One Piece", "Attack on Titan", "Demon Slayer",
  "Fullmetal Alchemist", "Death Note", "Dragon Ball", "My Hero Academia",
  "Hunter x Hunter", "Sword Art Online", "Tokyo Ghoul", "Re:Zero",
];

const MANGA_SUGGESTIONS = [
  "Berserk", "One Piece", "Vagabond", "Vinland Saga",
  "Fullmetal Alchemist", "Death Note", "Dragon Ball", "Jujutsu Kaisen",
  "Chainsaw Man", "Bleach", "Naruto", "Demon Slayer",
];

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { key: "airing",    mangaKey: "publishing", label: "Ongoing" },
  { key: "complete",  mangaKey: "complete",   label: "Completed" },
  { key: "upcoming",  mangaKey: "hiatus",     label: "Upcoming" },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const currentQueryRef = useRef("");
  const inputRef = useRef<TextInput>(null);
  const { contentType, isAdultMode } = useContentSettings();
  const isManga = contentType === "manga";
  const suggestions = isManga ? MANGA_SUGGESTIONS : SUGGESTIONS;

  useEffect(() => {
    setResults([]);
    setHasSearched(false);
    setError(false);
    setQuery("");
    setPage(1);
    setHasMore(false);
    setSelectedStatus(undefined);
  }, [contentType, isAdultMode]);

  const doSearch = useCallback(async (q: string, p: number, status: string | undefined) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (p === 1) {
      Keyboard.dismiss();
      setIsLoading(true);
      setError(false);
      setHasSearched(true);
      currentQueryRef.current = trimmed;
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await searchAnime(trimmed, p, contentType, isAdultMode, status);
      if (p === 1) setResults(data);
      else setResults(prev => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
      setPage(p);
    } catch {
      if (p === 1) { setError(true); setResults([]); }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [contentType, isAdultMode]);

  const handleSearch = useCallback((q: string) => doSearch(q, 1, selectedStatus), [doSearch, selectedStatus]);
  const handleLoadMore = useCallback(() => doSearch(currentQueryRef.current, page + 1, selectedStatus), [doSearch, page, selectedStatus]);

  const handleStatusToggle = useCallback((key: string) => {
    const next = selectedStatus === key ? undefined : key;
    setSelectedStatus(next);
    if (currentQueryRef.current) doSearch(currentQueryRef.current, 1, next);
  }, [selectedStatus, doSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  const handleGenre = useCallback((genreId: number, genreName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/genre/[id]", params: { id: genreId.toString(), name: genreName, contentType } });
  }, [contentType]);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 12;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.headerTitle}>Search {isManga ? "Manga" : "Anime"}</Text>
          </View>
          <View style={styles.searchIcon}>
            <Feather name="search" size={20} color={Colors.dark.primary} />
          </View>
        </View>

        <ContentToggleBar />

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Feather name="search" size={16} color={Colors.dark.primary} style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${isManga ? "manga" : "anime"}...`}
              placeholderTextColor={Colors.dark.textTertiary}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(query)}
              autoCorrect={false}
              autoCapitalize="none"
              blurOnSubmit={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={10} activeOpacity={0.7}>
                <Feather name="x-circle" size={16} color={Colors.dark.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch(query)} activeOpacity={0.8}>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Simple status pills */}
        <View style={styles.statusRow}>
          {STATUS_FILTERS.map((f) => {
            const key = isManga ? f.mangaKey : f.key;
            const active = selectedStatus === key;
            return (
              <TouchableOpacity
                key={f.label}
                style={[styles.statusChip, active && styles.statusChipActive]}
                onPress={() => handleStatusToggle(key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {!hasSearched ? (
        <ScrollView
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.suggestionsLabel}>Popular Searches</Text>
          <View style={styles.chips}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => { setQuery(s); handleSearch(s); }} activeOpacity={0.7}>
                <Feather name="trending-up" size={11} color={Colors.dark.primary} />
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.genreSectionHeader}>
            <View style={[styles.genreAccent, { backgroundColor: "#f7971e" }]} />
            <Text style={styles.genreSectionTitle}>Browse by Season</Text>
          </View>
          <TouchableOpacity style={styles.archiveCard} onPress={() => router.push("/seasons")} activeOpacity={0.85}>
            <View style={styles.archiveCardInner}>
              <View style={styles.archiveIconRow}>
                {["#4ecdc4","#a8e063","#f7971e","#e05c00"].map(c => (
                  <View key={c} style={[styles.archiveSeasonDot, { backgroundColor: c }]} />
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.archiveCardTitle}>Season Archive</Text>
                <Text style={styles.archiveCardSub}>Browse anime by season from 2000 to now</Text>
              </View>
              <Feather name="chevron-right" size={20} color={Colors.dark.textTertiary} />
            </View>
          </TouchableOpacity>

          <View style={styles.genreSectionHeader}>
            <View style={styles.genreAccent} />
            <Text style={styles.genreSectionTitle}>Browse by Genre</Text>
          </View>
          <View style={styles.genreGrid}>
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.genreChip, { borderColor: g.color }]}
                onPress={() => handleGenre(g.id, g.label)}
                activeOpacity={0.75}
              >
                <View style={[styles.genreChipDot, { backgroundColor: g.color }]} />
                <Text style={[styles.genreChipText, { color: g.color }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={Colors.dark.primary} size="large" />
          <Text style={styles.stateText}>Searching...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.stateTitle}>Something went wrong</Text>
          <Text style={styles.stateText}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => doSearch(currentQueryRef.current, 1, selectedStatus)} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.stateBox}>
          <Feather name="search" size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.stateTitle}>No results</Text>
          <Text style={styles.stateText}>Try a different search term</Text>
        </View>
      ) : (
        <>
          <View style={styles.resultsRow}>
            <View style={styles.resultsBadge}>
              <Text style={styles.resultsBadgeText}>{results.length}{hasMore ? "+" : ""}</Text>
            </View>
            <Text style={styles.resultsText}>results for "{currentQueryRef.current}"</Text>
          </View>
          <FlatList
            data={results}
            keyExtractor={(item) => `${item.mal_id}`}
            renderItem={({ item, index }) => <AnimeCardWide anime={item} index={index} />}
            contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            windowSize={5}
            maxToRenderPerBatch={6}
            initialNumToRender={8}
            removeClippedSubviews={Platform.OS !== "web"}
            ListFooterComponent={
              hasMore ? (
                <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} disabled={loadingMore} activeOpacity={0.8}>
                  {loadingMore
                    ? <ActivityIndicator size="small" color={Colors.dark.primary} />
                    : <Text style={styles.loadMoreText}>Load More</Text>}
                </TouchableOpacity>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 16, paddingBottom: 4, backgroundColor: Colors.dark.background },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerTitle: { color: Colors.dark.text, fontSize: 26, fontFamily: "Inter_700Bold" },
  searchIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.dark.primaryLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.dark.primary,
  },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 10 },
  inputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.dark.surface, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderWidth: 1, borderColor: Colors.dark.border, gap: 8,
  },
  inputIcon: { flexShrink: 0 },
  input: { flex: 1, color: Colors.dark.text, fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 0 },
  searchBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.dark.primary, alignItems: "center", justifyContent: "center",
  },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  statusChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
  },
  statusChipActive: { backgroundColor: Colors.dark.primaryLight, borderColor: Colors.dark.primary },
  statusChipText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_500Medium" },
  statusChipTextActive: { color: Colors.dark.primary, fontFamily: "Inter_600SemiBold" },
  suggestionsScroll: { flex: 1 },
  suggestionsContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  suggestionsLabel: {
    color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_600SemiBold",
    marginBottom: 12, letterSpacing: 1, textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.dark.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.border,
  },
  chipText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
  stateBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 80 },
  stateTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  stateText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  resultsRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  resultsBadge: {
    backgroundColor: Colors.dark.primaryLight, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.dark.primary,
  },
  resultsBadgeText: { color: Colors.dark.primary, fontSize: 12, fontFamily: "Inter_700Bold" },
  resultsText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
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
  genreSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24, marginBottom: 12 },
  genreAccent: { width: 3, height: 16, backgroundColor: Colors.dark.primary, borderRadius: 2 },
  genreSectionTitle: { color: Colors.dark.text, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.dark.surface, borderRadius: 20, borderWidth: 1.5,
  },
  genreChipDot: { width: 7, height: 7, borderRadius: 4 },
  genreChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  archiveCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.dark.border, overflow: "hidden",
  },
  archiveCardInner: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  archiveIconRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  archiveSeasonDot: { width: 12, height: 12, borderRadius: 6 },
  archiveCardTitle: { color: Colors.dark.text, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  archiveCardSub: { color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
