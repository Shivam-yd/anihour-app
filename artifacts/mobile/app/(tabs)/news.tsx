import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { NewsCard } from "@/components/NewsCard";
import { SkeletonWideCard } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { fetchAnimeNews, NewsItem } from "@/lib/jikan";

export default function NewsScreen() {
  const insets = useSafeAreaInsets();

  const { data: articles, isLoading, isError, refetch, isRefetching } = useQuery<NewsItem[]>({
    queryKey: ["anime-news"],
    queryFn: () => fetchAnimeNews(),
    staleTime: 10 * 60 * 1000,
  });

  const renderHeader = useCallback(() => (
    <LinearGradient
      colors={["rgba(255,167,38,0.13)", "transparent"]}
      style={styles.headerGradient}
    >
      <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Anime News</Text>
        </View>
        <View style={styles.rssBox}>
          <Feather name="rss" size={20} color={Colors.dark.warning} />
        </View>
      </View>
    </LinearGradient>
  ), [insets.top]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.skeletonList}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonWideCard key={i} />)}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.errorTitle}>Failed to load news</Text>
          <Text style={styles.errorText}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={articles ?? []}
        keyExtractor={(item, index) => `news-${item.mal_id}-${index}`}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <NewsCard article={item} />}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={6}
        initialNumToRender={8}
        removeClippedSubviews={Platform.OS !== "web"}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.dark.warning} />
        }
        ListEmptyComponent={
          <View style={styles.errorContainer}>
            <Feather name="inbox" size={48} color={Colors.dark.textTertiary} />
            <Text style={styles.errorText}>No news articles found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerGradient: { paddingBottom: 12 },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  rssBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.warningLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.warning,
  },
  skeletonList: { paddingTop: 8 },
  errorContainer: {
    flex: 1,
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
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.warning,
  },
  retryText: { color: Colors.dark.warning, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
