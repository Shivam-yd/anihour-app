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
import { SearchBar } from "@/components/SearchBar";
import Colors from "@/constants/colors";
import { searchAnime, Anime } from "@/lib/jikan";

const SUGGESTIONS = [
  "Naruto", "One Piece", "Attack on Titan", "Demon Slayer",
  "Fullmetal Alchemist", "Death Note", "Dragon Ball", "My Hero Academia",
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) return;
    Keyboard.dismiss();
    setIsLoading(true);
    setError(false);
    setHasSearched(true);
    try {
      const data = await searchAnime(q.trim());
      setResults(data);
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
      <Text style={styles.headerTitle}>Search</Text>
      <View style={styles.searchBarRow}>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={handleClear}
            placeholder="Search anime..."
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => handleSearch(query)}
          activeOpacity={0.8}
        >
          <Feather name="search" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {!hasSearched && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsLabel}>Popular Searches</Text>
          <View style={styles.chips}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.chip}
                onPress={() => handleSuggestion(s)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.dark.accent} size="large" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {error && (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyText}>Check your connection and try again</Text>
        </View>
      )}

      {hasSearched && !isLoading && !error && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>Try a different search term</Text>
        </View>
      )}

      {hasSearched && !isLoading && results.length > 0 && (
        <Text style={styles.resultsCount}>{results.length} results for "{query}"</Text>
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
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  searchBarRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchBarWrapper: {
    flex: 1,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestions: {
    marginTop: 20,
  },
  suggestionsLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chipText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  loadingContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  resultsCount: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 12,
    marginBottom: 4,
  },
});
