import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { ShimmerBox } from "@/components/SkeletonCard";
import Colors from "@/constants/colors";
import { isSafeUrl } from "@/lib/utils";
import {
  fetchAnimeById,
  fetchMangaById,
  fetchRecommendations,
  type Anime,
  type ContentType,
  type Recommendation,
} from "@/lib/jikan";

const STREAMING_COLORS: Record<string, { bg: string; text: string }> = {
  crunchyroll: { bg: "#f47521", text: "#fff" },
  funimation: { bg: "#410099", text: "#fff" },
  netflix: { bg: "#e50914", text: "#fff" },
  hidive: { bg: "#00adef", text: "#fff" },
  "amazon prime video": { bg: "#00a8e0", text: "#fff" },
  "disney+": { bg: "#113ccf", text: "#fff" },
  hulu: { bg: "#1ce783", text: "#000" },
  "anime digital network": { bg: "#1a96f0", text: "#fff" },
  default: { bg: Colors.dark.surface, text: Colors.dark.textSecondary },
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.42;

export default function AnimeDetailScreen() {
  const { id, contentType } = useLocalSearchParams<{ id: string; contentType?: string }>();
  const insets = useSafeAreaInsets();
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const isManga = contentType === "manga";
  const ct: ContentType = isManga ? "manga" : "anime";

  const { data: anime, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["detail", id, contentType],
    queryFn: async () => {
      const result = isManga ? await fetchMangaById(Number(id)) : await fetchAnimeById(Number(id));
      if (!result) throw new Error("No data returned for id=" + id);
      return result;
    },
    enabled: !!id,
    retry: 2,
    retryDelay: 1500,
  });

  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["recommendations", id, contentType],
    queryFn: () => fetchRecommendations(Number(id), ct),
    enabled: !!id && !!anime,
  });

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleMAL = useCallback(async () => {
    if (anime?.url && isSafeUrl(anime.url)) {
      await WebBrowser.openBrowserAsync(anime.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: Colors.dark.background,
      });
    }
  }, [anime]);

  const handleRecommendation = useCallback((rec: Recommendation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/anime/[id]", params: { id: rec.entry.mal_id.toString(), contentType } });
  }, [contentType]);

  const handleGenreTap = useCallback((genreId: number, genreName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/genre/[id]", params: { id: genreId.toString(), name: genreName, contentType } });
  }, [contentType]);

  const handleStudioTap = useCallback((studioId: number, studioName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/studio/[id]", params: { id: studioId.toString(), name: studioName } });
  }, []);

  const handleShare = useCallback(async () => {
    if (!anime) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shareTitle = anime.title_english ?? anime.title;
    const url = anime.url ?? `https://anilist.co/${isManga ? "manga" : "anime"}/${id}`;
    try {
      await Share.share({
        title: shareTitle,
        message: `Check out "${shareTitle}" on AniList: ${url}`,
        url,
      });
    } catch (_) {}
  }, [anime, id, isManga]);

  const topOffset = Platform.OS === "web" ? insets.top + 67 : insets.top + 12;

  const backBtn = (
    <Pressable
      style={[styles.backBtn, { top: topOffset }]}
      onPress={handleBack}
    >
      <Feather name="chevron-left" size={22} color={Colors.dark.text} />
    </Pressable>
  );

  const shareBtn = (
    <Pressable
      style={[styles.shareBtn, { top: topOffset }]}
      onPress={handleShare}
    >
      <Feather name="share-2" size={18} color={Colors.dark.text} />
    </Pressable>
  );

  if (isLoading || isFetching) {
    return (
      <View style={[styles.container, { paddingTop: topOffset }]}>
        <ShimmerBox width="100%" height={HEADER_HEIGHT} borderRadius={0} />
        <View style={styles.skeletonBody}>
          <ShimmerBox width="70%" height={14} borderRadius={6} />
          <ShimmerBox width="90%" height={28} borderRadius={8} style={{ marginTop: 6 }} />
          <View style={styles.skeletonBadgeRow}>
            {[80, 100, 70].map((w, i) => <ShimmerBox key={i} width={w} height={28} borderRadius={6} />)}
          </View>
          <View style={styles.skeletonStatsRow}>
            {[1, 2, 3, 4].map((i) => <ShimmerBox key={i} width={72} height={64} borderRadius={12} />)}
          </View>
          <ShimmerBox width="100%" height={80} borderRadius={8} style={{ marginTop: 20 }} />
          <ShimmerBox width="100%" height={60} borderRadius={8} style={{ marginTop: 12 }} />
        </View>
        {backBtn}
      </View>
    );
  }

  if (isError || !anime) {
    const errMsg = error instanceof Error ? error.message : String(error ?? "unknown");
    console.error("[AnimeDetail] load failed id=" + id, errMsg);
    return (
      <View style={styles.centered}>
        <Ionicons name="sad-outline" size={48} color={Colors.dark.textTertiary} />
        <Text style={styles.errorTitle}>Couldn't load details</Text>
        <Text style={styles.errorSub}>{errMsg}</Text>
        <View style={styles.errorBtnRow}>
          <TouchableOpacity style={styles.retryBtnFull} onPress={() => refetch()} activeOpacity={0.85}>
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.backBtnFullText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtnFull} onPress={handleBack} activeOpacity={0.85}>
            <Feather name="arrow-left" size={16} color="#fff" />
            <Text style={styles.backBtnFullText}>Go Back</Text>
          </TouchableOpacity>
        </View>
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

        {/* Genres — tappable to browse by genre */}
        {anime.genres && anime.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Genres</Text>
            <View style={styles.tagRow}>
              {anime.genres.map((g) => (
                <TouchableOpacity
                  key={g.mal_id}
                  style={styles.genreTag}
                  onPress={() => handleGenreTap(g.mal_id, g.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.genreTagText}>{g.name}</Text>
                </TouchableOpacity>
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
                  <TouchableOpacity
                    key={s.mal_id}
                    style={[styles.studioTag, styles.studioTagTappable]}
                    onPress={() => handleStudioTap(s.mal_id, s.name)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="film-outline" size={11} color={Colors.dark.secondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.studioTagText, { color: Colors.dark.secondary }]}>{s.name}</Text>
                  </TouchableOpacity>
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

        {/* Official Trailer */}
        {!isManga && (() => {
          const ytId =
            anime.trailer?.youtube_id ||
            anime.trailer?.embed_url?.match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1] ||
            null;
          const thumbUrl = ytId
            ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
            : null;
          const ytUrl = ytId
            ? `https://www.youtube.com/watch?v=${ytId}`
            : `https://www.youtube.com/results?search_query=${encodeURIComponent((anime.title_english ?? anime.title) + " anime trailer")}`;
          return (
            <View style={styles.section}>
              <View style={styles.trailerHeader}>
                <Ionicons name="film-outline" size={16} color={Colors.dark.accent} />
                <Text style={styles.sectionLabel}>Official Trailer</Text>
              </View>
              {thumbUrl ? (
                <TouchableOpacity
                  style={styles.trailerThumb}
                  activeOpacity={0.88}
                  onPress={() =>
                    WebBrowser.openBrowserAsync(ytUrl, {
                      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
                      toolbarColor: "#0f0f0f",
                    })
                  }
                >
                  <Image
                    source={{ uri: thumbUrl }}
                    style={styles.trailerImage}
                    contentFit="cover"
                    transition={300}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.55)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.trailerPlayBtn}>
                    <Ionicons name="logo-youtube" size={40} color="#ff0000" />
                  </View>
                  <View style={styles.trailerLabel}>
                    <Text style={styles.trailerLabelText}>Watch on YouTube</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.trailerUnavailable}
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(ytUrl)}
                >
                  <Ionicons name="videocam-off-outline" size={28} color={Colors.dark.textTertiary} />
                  <Text style={styles.trailerUnavailableTitle}>No trailer on file</Text>
                  <Text style={styles.trailerUnavailableSub}>Tap to search on YouTube</Text>
                  <View style={styles.trailerSearchBtn}>
                    <Ionicons name="logo-youtube" size={14} color="#ff0000" />
                    <Text style={styles.trailerSearchBtnText}>Search YouTube</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}

        {/* Broadcast schedule (anime only) */}
        {!isManga && anime.broadcast?.string && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Broadcast</Text>
            <View style={styles.broadcastRow}>
              <Ionicons name="time-outline" size={15} color={Colors.dark.accent} />
              <Text style={styles.broadcastText}>{anime.broadcast.string}</Text>
            </View>
          </View>
        )}

        {/* Streaming platforms */}
        {!isManga && anime.streaming && anime.streaming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Available On</Text>
            <View style={styles.streamingRow}>
              {anime.streaming.map((s) => {
                const key = s.name.toLowerCase();
                const colors = STREAMING_COLORS[key] ?? STREAMING_COLORS.default;
                return (
                  <TouchableOpacity
                    key={s.name}
                    style={[styles.streamBadge, { backgroundColor: colors.bg }]}
                    onPress={() => isSafeUrl(s.url) && Linking.openURL(s.url)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play-circle" size={12} color={colors.text} />
                    <Text style={[styles.streamBadgeText, { color: colors.text }]}>{s.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
              {(anime.members / 1000).toFixed(0)}K members on AniList
            </Text>
          </View>
        )}

        {anime.url && (
          <TouchableOpacity style={styles.malButton} onPress={handleMAL} activeOpacity={0.85}>
            <Text style={styles.malButtonText}>
              View on AniList
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
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              {recommendations.map((rec) => {
                const { entry, votes } = rec;
                const recImg = entry.images?.jpg?.large_image_url ?? entry.images?.jpg?.image_url;
                const recTitle = entry.title_english ?? entry.title;
                return (
                  <TouchableOpacity
                    key={entry.mal_id}
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
                    {entry.score !== undefined && entry.score > 0 && (
                      <View style={styles.recScore}>
                        <Ionicons name="star" size={9} color={Colors.dark.star} />
                        <Text style={styles.recScoreText}>{entry.score.toFixed(1)}</Text>
                      </View>
                    )}
                    {votes > 0 && (
                      <View style={styles.recVotes}>
                        <Ionicons name="heart" size={8} color={Colors.dark.primary} />
                        <Text style={styles.recVotesText}>{votes}</Text>
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
      {shareBtn}
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
  skeletonBody: { paddingHorizontal: 16, paddingTop: 16, gap: 0 },
  skeletonBadgeRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  skeletonStatsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  errorTitle: { color: Colors.dark.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  errorSub: { color: Colors.dark.textTertiary, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
  errorBtnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  retryBtnFull: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.dark.secondary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12,
  },
  backBtn: {
    position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(26,26,46,0.85)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  shareBtn: {
    position: "absolute", right: 16, width: 40, height: 40, borderRadius: 20,
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
    flexDirection: "row", alignItems: "center",
  },
  studioTagTappable: { borderStyle: "solid" },
  studioTagText: { color: Colors.dark.secondary, fontSize: 12, fontFamily: "Inter_500Medium" },
  synopsis: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  readMore: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  readMoreText: { color: Colors.dark.primary, fontSize: 13, fontFamily: "Inter_500Medium" },
  hScroll: { paddingRight: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  infoText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
  broadcastRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  broadcastText: { color: Colors.dark.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
  streamingRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  streamBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  streamBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  trailerHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  trailerThumb: {
    width: "100%", height: 200, borderRadius: 14,
    overflow: "hidden", backgroundColor: "#0f0f0f",
    borderWidth: 1, borderColor: Colors.dark.border,
    alignItems: "center", justifyContent: "center",
  },
  trailerImage: { width: "100%", height: "100%" },
  trailerPlayBtn: {
    position: "absolute",
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
  },
  trailerLabel: {
    position: "absolute", bottom: 10, left: 0, right: 0, alignItems: "center",
  },
  trailerLabelText: {
    color: "rgba(255,255,255,0.9)", fontSize: 12, fontFamily: "Inter_500Medium",
    backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  trailerUnavailable: {
    width: "100%", paddingVertical: 28, borderRadius: 14,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1, borderColor: Colors.dark.border,
    alignItems: "center", gap: 6,
  },
  trailerUnavailableTitle: { color: Colors.dark.text, fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  trailerUnavailableSub: { color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" },
  trailerSearchBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 8, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(255,0,0,0.1)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,0,0,0.3)",
  },
  trailerSearchBtnText: { color: "#ff4444", fontSize: 13, fontFamily: "Inter_600SemiBold" },
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
  recVotes: {
    position: "absolute", top: 6, left: 6,
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "rgba(26,26,46,0.85)", borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
  },
  recVotesText: { color: Colors.dark.primary, fontSize: 9, fontFamily: "Inter_700Bold" },
  recName: {
    position: "absolute", bottom: 6, left: 6, right: 6,
    color: Colors.dark.text, fontSize: 10, fontFamily: "Inter_500Medium", lineHeight: 14,
  },
});
