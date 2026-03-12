import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimeCardWide } from "@/components/AnimeCard";
import { ContentToggleBar } from "@/components/ContentToggleBar";
import { SearchBar } from "@/components/SearchBar";
import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";
import { searchAnime, Anime } from "@/lib/jikan";

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

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);
  const { contentType, isAdultMode } = useContentSettings();
  const isManga = contentType === "manga";

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) return;
    Keyboard.dismiss();
    setIsLoading(true);
    setError(false);
    setHasSearched(true);
    try {
      const data = await searchAnime(q.trim(), 1, contentType, isAdultMode);
      setResults(data);
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [contentType, isAdultMode]);

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setError(false);
  }, []);

  const handleSuggestion = useCallback((s: string) => {
    setQuery(s);
    handleSearch(s);
  }, [handleSearch]);

  const suggestions = isManga ? MANGA_SUGGESTIONS : SUGGESTIONS;

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.brandText}>ANIHOUR</Text>
          <Text style={styles.headerTitle}>Search {isManga ? "Manga" : "Anime"}</Text>
        </View>
        <View style={styles.searchIcon}>
          <Feather name="search" size={20} color={Colors.dark.primary} />
        </View>
      </View>

      <ContentToggleBar />

      <View style={styles.searchBarRow}>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={handleClear}
            placeholder={`Search ${isManga ? "manga" : "anime"}...`}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch(query)} activeOpacity={0.8}>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {!hasSearched && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsLabel}>Popular Searches</Text>
          <View style={styles.chips}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => handleSuggestion(s)} activeOpacity={0.7}>
                <Feather name="trending-up" size={11} color={Colors.dark.primary} />
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isLoading && (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={Colors.dark.primary} size="large" />
          <Text style={styles.stateText}>Searching...</Text>
        </View>
      )}

      {error && (
        <View style={styles.stateContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.stateTitle}>Something went wrong</Text>
          <Text style={styles.stateText}>Check your connection and try again</Text>
        </View>
      )}

      {hasSearched && !isLoading && !error && results.length === 0 && (
        <View style={styles.stateContainer}>
          <Feather name="search" size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.stateTitle}>No results</Text>
          <Text style={styles.stateText}>Try a different search term</Text>
        </View>
      )}

      {hasSearched && !isLoading && results.length > 0 && (
        <View style={styles.resultsRow}>
          <View style={styles.resultsBadge}>
            <Text style={styles.resultsBadgeText}>{results.length}</Text>
          </View>
          <Text style={styles.resultsText}>results for "{query}"</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading || !hasSearched || error ? [] : results}
        keyExtractor={(item) => `${item.mal_id}`}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => <AnimeCardWide anime={item} index={index} />}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  brandText: { color: Colors.dark.primary, fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 3, marginBottom: 2 },
  headerTitle: { color: Colors.dark.text, fontSize: 26, fontFamily: "Inter_700Bold" },
  searchIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.dark.primaryLight,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.dark.primary,
  },
  searchBarRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 4 },
  searchBarWrapper: { flex: 1 },
  searchButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.dark.primary, alignItems: "center", justifyContent: "center" },
  suggestions: { marginTop: 16 },
  suggestionsLabel: { color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.dark.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.border },
  chipText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
  stateContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  stateTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  stateText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  resultsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, marginBottom: 4 },
  resultsBadge: { backgroundColor: Colors.dark.primaryLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.dark.primary },
  resultsBadgeText: { color: Colors.dark.primary, fontSize: 12, fontFamily: "Inter_700Bold" },
  resultsText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
});
