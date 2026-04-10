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
import {
  fetchAnimeById,
  fetchMangaById,
  fetchRecommendations,
  fetchCharacters,
  type Character,
  type Anime,
  type ContentType,
} from "@/lib/jikan";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.42;
const CHAR_CARD_W = 88;

export default function AnimeDetailScreen() {
  const { id, contentType } = useLocalSearchParams<{ id: string; contentType?: string }>();
  const insets = useSafeAreaInsets();
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const isManga = contentType === "manga";
  const ct: ContentType = isManga ? "manga" : "anime";

  const { data: anime, isLoading, isError } = useQuery({
    queryKey: ["detail", id, contentType],
    queryFn: () => isManga ? fetchMangaById(Number(id)) : fetchAnimeById(Number(id)),
    enabled: !!id,
  });

  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["characters", id, contentType],
    queryFn: () => fetchCharacters(Number(id), ct),
    enabled: !!id && !!anime,
  });

  const { data: recommendations = [] } = useQuery<Anime[]>({
    queryKey: ["recommendations", id, contentType],
    queryFn: () => fetchRecommendations(Number(id), ct),
    enabled: !!id && !!anime,
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

  const handleRecommendation = useCallback((rec: Anime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/anime/[id]", params: { id: rec.mal_id.toString(), contentType } });
  }, [contentType]);

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
        <Text style={styles.errorTitle}>Couldn't load details</Text>
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
  const startDate = isManga ? anime.published?.from : anime.aired?.from;
  const startYear = startDate ? new Date(startDate).getFullYear().toString() : "?";

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }}
      >
        {/* Hero image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} contentFit="cover" transition={400} />
          <LinearGradient
            colors={["transparent", "rgba(26,26,46,0.6)", Colors.dark.background]}
            style={styles.heroGradient}
            locations={[0.3, 0.65, 1]}
          />
          <View style={styles.heroContent}>
            {isManga && (
              <View style={styles.mangaBadge}>
                <Text style={styles.mangaBadgeText}>MANGA</Text>
              </View>
            )}
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

        {/* Meta badges */}
        <View style={styles.metaRow}>
          {anime.type && <MetaBadge label={anime.type} color="primary" />}
          {anime.status && <MetaBadge label={anime.status} color="secondary" />}
          {!isManga && anime.rating && <MetaBadge label={anime.rating.split(" - ")[0]} color="accent" />}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {isManga ? (
            <>
              <StatBox icon="book-open" label="Chapters" value={anime.chapters?.toString() ?? "?"} color="primary" />
              <StatBox icon="layers" label="Volumes" value={anime.volumes?.toString() ?? "?"} color="secondary" />
              <StatBox icon="calendar" label="Year" value={startYear} color="accent" />
              {anime.rank !== undefined && (
                <StatBox icon="bar-chart-2" label="Rank" value={`#${anime.rank}`} color="warning" />
              )}
            </>
          ) : (
            <>
              <StatBox icon="film" label="Episodes" value={anime.episodes?.toString() ?? "?"} color="primary" />
              <StatBox icon="clock" label="Duration" value={anime.duration?.replace(" per ep", "") ?? "?"} color="secondary" />
              <StatBox icon="calendar" label="Year" value={anime.year?.toString() ?? startYear} color="accent" />
              {anime.rank !== undefined && (
                <StatBox icon="bar-chart-2" label="Rank" value={`#${anime.rank}`} color="warning" />
              )}
            </>
          )}
        </View>

        {/* Genres */}
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

        {/* Studios (anime) or Authors (manga) */}
        {isManga ? (
          anime.authors && anime.authors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Authors</Text>
              <View style={styles.tagRow}>
                {anime.authors.map((a) => (
                  <View key={a.mal_id} style={styles.studioTag}>
                    <Text style={styles.studioTagText}>{a.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )
        ) : (
          anime.studios && anime.studios.length > 0 && (
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
          )
        )}

        {/* Synopsis */}
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

        {/* Characters */}
        {characters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Characters</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
            >
              {characters.map((c) => (
                <View key={c.character.mal_id} style={styles.charCard}>
                  <Image
                    source={{ uri: c.character.images?.jpg?.image_url }}
                    style={styles.charImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.charRoleBadge}>
                    <Text style={styles.charRoleText}>{c.role === "Main" ? "Main" : "Sub"}</Text>
                  </View>
                  <Text style={styles.charName} numberOfLines={2}>{c.character.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popularity & members */}
        {anime.popularity !== undefined && (
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color={Colors.dark.secondary} />
            <Text style={styles.infoText}>Popularity: #{anime.popularity}</Text>
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
          <TouchableOpacity style={styles.malButton} onPress={handleMAL} activeOpacity={0.85}>
            <Text style={styles.malButtonText}>
              View on {isManga ? "MangaList" : "MyAnimeList"}
            </Text>
            <Feather name="external-link" size={15} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.recHeader}>
              <View style={styles.recAccent} />
              <Text style={styles.recTitle}>You May Also Like</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
            >
              {recommendations.map((rec) => {
                const recImg = rec.images?.jpg?.large_image_url ?? rec.images?.jpg?.image_url;
                const recTitle = rec.title_english ?? rec.title;
                return (
                  <TouchableOpacity
                    key={rec.mal_id}
                    style={styles.recCard}
                    onPress={() => handleRecommendation(rec)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: recImg }}
                      style={styles.recImage}
                      contentFit="cover"
                      transition={200}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(26,26,46,0.92)"]}
                      style={styles.recGradient}
                    />
                    {rec.score !== undefined && rec.score > 0 && (
                      <View style={styles.recScore}>
                        <Ionicons name="star" size={9} color={Colors.dark.star} />
                        <Text style={styles.recScoreText}>{rec.score.toFixed(1)}</Text>
                      </View>
                    )}
                    <Text style={styles.recName} numberOfLines={2}>{recTitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
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
  container: { flex: 1, backgroundColor: Colors.dark.background },
  centered: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.dark.background, gap: 12,
  },
  loadingText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular" },
  errorTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  backBtn: {
    position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(26,26,46,0.85)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  backBtnFull: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.dark.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, marginTop: 8,
  },
  backBtnFullText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  heroContainer: { width: SCREEN_WIDTH, height: HEADER_HEIGHT, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "75%" },
  heroContent: { position: "absolute", bottom: 0, left: 16, right: 16, paddingBottom: 20 },
  mangaBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.dark.secondaryLight,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.dark.secondary, marginBottom: 8,
  },
  mangaBadgeText: { color: Colors.dark.secondary, fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  scoreText: { color: Colors.dark.star, fontSize: 16, fontFamily: "Inter_700Bold" },
  scoredBy: { color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" },
  heroTitle: { color: Colors.dark.text, fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 32 },
  heroSubTitle: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 3 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  metaBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  metaBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  statBox: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: 12,
    paddingVertical: 12, alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  statValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statLabel: { color: Colors.dark.textTertiary, fontSize: 10, fontFamily: "Inter_400Regular" },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: {
    color: Colors.dark.textSecondary, fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase",
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  genreTag: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.dark.primaryLight, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.dark.primary,
  },
  genreTagText: { color: Colors.dark.primary, fontSize: 12, fontFamily: "Inter_500Medium" },
  studioTag: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.dark.secondaryLight, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.dark.secondary,
  },
  studioTagText: { color: Colors.dark.secondary, fontSize: 12, fontFamily: "Inter_500Medium" },
  synopsis: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  readMore: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  readMoreText: { color: Colors.dark.primary, fontSize: 13, fontFamily: "Inter_500Medium" },
  hScroll: { paddingRight: 16 },
  // Characters
  charCard: { width: CHAR_CARD_W, marginRight: 10, alignItems: "center" },
  charImage: { width: CHAR_CARD_W, height: CHAR_CARD_W * 1.3, borderRadius: 10, backgroundColor: Colors.dark.surface },
  charRoleBadge: {
    position: "absolute", top: 6, right: 4,
    backgroundColor: "rgba(26,26,46,0.85)",
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
  },
  charRoleText: { color: Colors.dark.primary, fontSize: 8, fontFamily: "Inter_600SemiBold" },
  charName: {
    color: Colors.dark.textSecondary, fontSize: 10, fontFamily: "Inter_400Regular",
    marginTop: 5, textAlign: "center", lineHeight: 14,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  infoText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
  malButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginHorizontal: 16, marginTop: 24, paddingVertical: 14,
    borderRadius: 14, backgroundColor: Colors.dark.primary,
  },
  malButtonText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  // Recommendations
  recHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  recAccent: { width: 3, height: 16, backgroundColor: Colors.dark.primary, borderRadius: 2 },
  recTitle: { color: Colors.dark.text, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  recCard: { width: 120, marginRight: 10, borderRadius: 10, overflow: "hidden", backgroundColor: Colors.dark.surface },
  recImage: { width: 120, height: 170 },
  recGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80 },
  recScore: {
    position: "absolute", top: 6, right: 6,
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "rgba(26,26,46,0.85)", borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
  },
  recScoreText: { color: Colors.dark.star, fontSize: 9, fontFamily: "Inter_700Bold" },
  recName: {
    position: "absolute", bottom: 6, left: 6, right: 6,
    color: Colors.dark.text, fontSize: 10, fontFamily: "Inter_500Medium", lineHeight: 14,
  },
});
