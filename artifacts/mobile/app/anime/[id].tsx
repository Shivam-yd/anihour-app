import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import { fetchAnimeById } from "@/lib/jikan";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.42;

export default function AnimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  const { data: anime, isLoading, isError } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => fetchAnimeById(Number(id)),
    enabled: !!id,
  });

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleMAL = useCallback(async () => {
    if (anime?.url) {
      await WebBrowser.openBrowserAsync(anime.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: Colors.dark.background,
      });
    }
  }, [anime]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.dark.background }]}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
        <Pressable
          style={[styles.backBtn, { top: insets.top + (Platform.OS === "web" ? 67 : 12) }]}
          onPress={handleBack}
        >
          <Feather name="chevron-left" size={22} color={Colors.dark.text} />
        </Pressable>
      </View>
    );
  }

  if (isError || !anime) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.dark.background }]}>
        <Ionicons name="sad-outline" size={48} color={Colors.dark.textTertiary} />
        <Text style={styles.errorTitle}>Couldn't load this anime</Text>
        <Pressable style={styles.backBtnFull} onPress={handleBack}>
          <Feather name="arrow-left" size={18} color="#fff" />
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
        <Pressable
          style={[styles.backBtn, { top: insets.top + (Platform.OS === "web" ? 67 : 12) }]}
          onPress={handleBack}
        >
          <Feather name="chevron-left" size={22} color={Colors.dark.text} />
        </Pressable>
      </View>
    );
  }

  const title = anime.title_english ?? anime.title;
  const imageUrl = anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url;
  const synopsis = anime.synopsis ?? "";
  const truncatedSynopsis = synopsis.length > 250 ? synopsis.slice(0, 250) + "..." : synopsis;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }}
      >
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={["transparent", "rgba(10,10,15,0.7)", Colors.dark.background]}
            style={styles.heroGradient}
            locations={[0.3, 0.7, 1]}
          />

          <View style={[styles.heroContent, { paddingBottom: 20 }]}>
            {anime.score !== undefined && anime.score > 0 && (
              <View style={styles.scoreChip}>
                <Ionicons name="star" size={14} color={Colors.dark.star} />
                <Text style={styles.scoreChipText}>{anime.score.toFixed(1)}</Text>
                {anime.scored_by !== undefined && (
                  <Text style={styles.scoredBy}>({(anime.scored_by / 1000).toFixed(0)}K)</Text>
                )}
              </View>
            )}
            <Text style={styles.heroTitle}>{title}</Text>
            {anime.title !== title && (
              <Text style={styles.heroSubTitle}>{anime.title}</Text>
            )}
          </View>
        </View>

        <View style={styles.metaRow}>
          {anime.type && <MetaBadge label={anime.type} />}
          {anime.status && <MetaBadge label={anime.status} accent />}
          {anime.rating && <MetaBadge label={anime.rating} />}
        </View>

        <View style={styles.statsRow}>
          <StatBox icon="film" label="Episodes" value={anime.episodes?.toString() ?? "?"} />
          <StatBox icon="clock" label="Duration" value={anime.duration?.replace(" per ep", "") ?? "?"} />
          <StatBox icon="calendar" label="Year" value={anime.year?.toString() ?? (anime.aired?.from ? new Date(anime.aired.from).getFullYear().toString() : "?")} />
          {anime.rank !== undefined && <StatBox icon="bar-chart-2" label="Rank" value={`#${anime.rank}`} accent />}
        </View>

        {anime.genres && anime.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Genres</Text>
            <View style={styles.genreRow}>
              {anime.genres.map((g) => (
                <View key={g.mal_id} style={styles.genreChip}>
                  <Text style={styles.genreChipText}>{g.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {anime.studios && anime.studios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Studios</Text>
            <View style={styles.genreRow}>
              {anime.studios.map((s) => (
                <View key={s.mal_id} style={[styles.genreChip, styles.studioChip]}>
                  <Text style={[styles.genreChipText, styles.studioChipText]}>{s.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {synopsis ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Synopsis</Text>
            <Text style={styles.synopsis}>
              {showFullSynopsis ? synopsis : truncatedSynopsis}
            </Text>
            {synopsis.length > 250 && (
              <TouchableOpacity
                onPress={() => setShowFullSynopsis(!showFullSynopsis)}
                style={styles.readMore}
                activeOpacity={0.7}
              >
                <Text style={styles.readMoreText}>
                  {showFullSynopsis ? "Show less" : "Read more"}
                </Text>
                <Feather
                  name={showFullSynopsis ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={Colors.dark.accent}
                />
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {anime.url && (
          <TouchableOpacity
            style={styles.malButton}
            onPress={handleMAL}
            activeOpacity={0.85}
          >
            <Text style={styles.malButtonText}>View on MyAnimeList</Text>
            <Feather name="external-link" size={15} color="#fff" />
          </TouchableOpacity>
        )}
      </ScrollView>

      <Pressable
        style={[styles.backBtn, { top: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}
        onPress={handleBack}
      >
        <Feather name="chevron-left" size={22} color={Colors.dark.text} />
      </Pressable>
    </View>
  );
}

function MetaBadge({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={[styles.metaBadge, accent && styles.metaBadgeAccent]}>
      <Text style={[styles.metaBadgeText, accent && styles.metaBadgeTextAccent]}>{label}</Text>
    </View>
  );
}

function StatBox({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.statBox, accent && styles.statBoxAccent]}>
      <Feather name={icon as any} size={16} color={accent ? Colors.dark.accent : Colors.dark.accentCyan} />
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(10,10,15,0.75)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  backBtnFull: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HEADER_HEIGHT,
    position: "relative",
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
    height: "70%",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
  },
  scoreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  scoreChipText: {
    color: Colors.dark.star,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  scoredBy: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  heroTitle: {
    color: Colors.dark.text,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 32,
    textShadow: "0px 1px 4px rgba(0,0,0,0.8)",
  },
  heroSubTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  metaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: Colors.dark.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  metaBadgeAccent: {
    backgroundColor: Colors.dark.accentLight,
    borderColor: Colors.dark.accent,
  },
  metaBadgeText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  metaBadgeTextAccent: {
    color: Colors.dark.accent,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statBoxAccent: {
    backgroundColor: Colors.dark.accentLight,
    borderColor: Colors.dark.accent,
  },
  statValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  statValueAccent: {
    color: Colors.dark.accent,
  },
  statLabel: {
    color: Colors.dark.textTertiary,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  studioChip: {
    backgroundColor: "rgba(34,211,238,0.08)",
    borderColor: "rgba(34,211,238,0.3)",
  },
  genreChipText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  studioChipText: {
    color: Colors.dark.accentCyan,
  },
  synopsis: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  readMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  readMoreText: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  malButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.dark.accent,
  },
  malButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
