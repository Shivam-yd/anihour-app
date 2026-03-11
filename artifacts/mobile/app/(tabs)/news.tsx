import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { NewsCard } from "@/components/NewsCard";
import Colors from "@/constants/colors";
import { fetchAnimeNews } from "@/lib/jikan";

export default function NewsScreen() {
  const insets = useSafeAreaInsets();

  const { data: articles, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["anime-news"],
    queryFn: () => fetchAnimeNews(1),
  });

  const renderHeader = () => (
    <LinearGradient
      colors={["rgba(255,215,0,0.10)", "transparent"]}
      style={styles.headerGradient}
    >
      <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}>
        <View>
          <Text style={styles.headerEyebrow}>LATEST</Text>
          <Text style={styles.headerTitle}>Anime News</Text>
        </View>
        <View style={styles.newsIcon}>
          <Feather name="rss" size={20} color={Colors.dark.star} />
        </View>
      </View>
    </LinearGradient>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingSkeletons}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
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
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={articles ?? []}
        keyExtractor={(item) => `${item.mal_id}`}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <NewsCard article={item} />}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? insets.bottom + 84 : insets.bottom + 90,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.dark.star}
          />
        }
        ListEmptyComponent={
          <View style={styles.errorContainer}>
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
  headerGradient: {
    paddingBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerEyebrow: {
    color: Colors.dark.star,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  newsIcon: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,215,0,0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  loadingSkeletons: {
    paddingTop: 8,
    gap: 10,
    paddingHorizontal: 16,
  },
  skeletonCard: {
    height: 120,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
  },
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
});
