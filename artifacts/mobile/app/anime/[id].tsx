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

  const backBtn = (
    <Pressable
      style={[styles.backBtn, { top: Platform.OS === "web" ? insets.top + 67 : insets.top + 12 }]}
      onPress={handleBack}
    >
      <Feather name="chevron-left" size={22} color={Colors.dark.text} />
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
        {backBtn}
      </View>
    );
  }

  if (isError || !anime) {
    return (
      <View style={styles.centered}>
        <Ionicons name="sad-outline" size={48} color={Colors.dark.textTertiary} />
        <Text style={styles.errorTitle}>Couldn't load this anime</Text>
        <TouchableOpacity style={styles.backBtnFull} onPress={handleBack} activeOpacity={0.85}>
          <Feather name="arrow-left" size={18} color="#fff" />
          <Text style={styles.backBtnFullText}>Go Back</Text>
        </TouchableOpacity>
        {backBtn}
      </View>
    );
  }

  const title = anime.title_english ?? anime.title;
  const imageUrl = anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url;
  const synopsis = anime.synopsis ?? "";
  const truncatedSynopsis = synopsis.length > 280 ? synopsis.slice(0, 280) + "..." : synopsis;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }}
      >
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} contentFit="cover" transition={400} />
          <LinearGradient
            colors={["transparent", "rgba(26,26,46,0.6)", Colors.dark.background]}
            style={styles.heroGradient}
            locations={[0.3, 0.65, 1]}
          />
          <View style={styles.heroContent}>
            {anime.score !== undefined && anime.score > 0 && (
              <View style={styles.scoreRow}>
                <Ionicons name="star" size={14} color={Colors.dark.star} />
                <Text style={styles.scoreText}>{anime.score.toFixed(1)}</Text>
                {anime.scored_by !== undefined && (
                  <Text style={styles.scoredBy}>({(anime.scored_by / 1000).toFixed(0)}K ratings)</Text>
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
          {anime.type && <MetaBadge label={anime.type} color="primary" />}
          {anime.status && <MetaBadge label={anime.status} color="secondary" />}
          {anime.rating && <MetaBadge label={anime.rating.split(" - ")[0]} color="accent" />}
        </View>

        <View style={styles.statsRow}>
          <StatBox icon="film" label="Episodes" value={anime.episodes?.toString() ?? "?"} color="primary" />
          <StatBox icon="clock" label="Duration" value={anime.duration?.replace(" per ep", "") ?? "?"} color="secondary" />
          <StatBox
            icon="calendar"
            label="Year"
            value={anime.year?.toString() ?? (anime.aired?.from ? new Date(anime.aired.from).getFullYear().toString() : "?")}
            color="accent"
          />
          {anime.rank !== undefined && (
            <StatBox icon="bar-chart-2" label="Rank" value={`#${anime.rank}`} color="warning" />
          )}
        </View>

        {anime.genres && anime.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Genres</Text>
            <View style={styles.tagRow}>
              {anime.genres.map((g) => (
                <View key={g.mal_id} style={styles.genreTag}>
                  <Text style={styles.genreTagText}>{g.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {anime.studios && anime.studios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Studios</Text>
            <View style={styles.tagRow}>
              {anime.studios.map((s) => (
                <View key={s.mal_id} style={styles.studioTag}>
                  <Text style={styles.studioTagText}>{s.name}</Text>
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
            {synopsis.length > 280 && (
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
                  color={Colors.dark.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {anime.popularity !== undefined && (
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color={Colors.dark.secondary} />
            <Text style={styles.infoText}>
              Popularity: #{anime.popularity}
            </Text>
          </View>
        )}

        {anime.members !== undefined && (
          <View style={styles.infoRow}>
            <Ionicons name="bookmark-outline" size={16} color={Colors.dark.accent} />
            <Text style={styles.infoText}>
              {(anime.members / 1000).toFixed(0)}K members on MyAnimeList
            </Text>
          </View>
        )}

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

      {backBtn}
    </View>
  );
}

function MetaBadge({ label, color }: { label: string; color: "primary" | "secondary" | "accent" }) {
  const c = {
    primary: { bg: Colors.dark.primaryLight, border: Colors.dark.primary, text: Colors.dark.primary },
    secondary: { bg: Colors.dark.secondaryLight, border: Colors.dark.secondary, text: Colors.dark.secondary },
    accent: { bg: Colors.dark.accentLight, border: Colors.dark.accent, text: Colors.dark.accent },
  }[color];
  return (
    <View style={[styles.metaBadge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.metaBadgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

function StatBox({ icon, label, value, color }: { icon: string; label: string; value: string; color: "primary" | "secondary" | "accent" | "warning" }) {
  const c = {
    primary: Colors.dark.primary,
    secondary: Colors.dark.secondary,
    accent: Colors.dark.accent,
    warning: Colors.dark.warning,
  }[color];
  return (
    <View style={styles.statBox}>
      <Feather name={icon as any} size={16} color={c} />
      <Text style={[styles.statValue, { color: c }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.background,
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
    backgroundColor: "rgba(26,26,46,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  backBtnFull: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  backBtnFullText: {
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
    height: "75%",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    paddingBottom: 20,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  scoreText: {
    color: Colors.dark.star,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  scoredBy: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  heroTitle: {
    color: Colors.dark.text,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 32,
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
    borderRadius: 6,
    borderWidth: 1,
  },
  metaBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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
  statValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    color: Colors.dark.textTertiary,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.dark.primaryLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  genreTagText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  studioTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.dark.secondaryLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  studioTagText: {
    color: Colors.dark.secondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
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
    color: Colors.dark.primary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  infoText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
    backgroundColor: Colors.dark.primary,
  },
  malButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
