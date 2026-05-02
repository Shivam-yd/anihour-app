import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";
import { Anime } from "@/lib/jikan";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  anime: Anime;
  rank?: number;
}

export const AnimeCard = React.memo(function AnimeCard({ anime, rank }: Props) {
  const scale = useSharedValue(1);
  const { contentType } = useContentSettings();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    router.push({ pathname: "/anime/[id]", params: { id: anime.mal_id, contentType } });
  }, [anime.mal_id, contentType]);

  const title = anime.title_english ?? anime.title;
  const imageUrl = anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url;
  const count = anime.episodes ?? anime.chapters;
  const countLabel = anime.chapters !== undefined ? "ch" : "ep";

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={handlePress}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        recyclingKey={`card-${anime.mal_id}`}
      />
      <View style={styles.gradient} />

      {rank !== undefined && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      )}

      {anime.score !== undefined && anime.score > 0 && (
        <View style={styles.scoreBadge}>
          <Ionicons name="star" size={10} color={Colors.dark.star} />
          <Text style={styles.scoreText}>{anime.score.toFixed(1)}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {count !== undefined && count > 0 && (
          <Text style={styles.episodes}>{count} {countLabel}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
});

interface WideProps {
  anime: Anime;
  index: number;
}

export const AnimeCardWide = React.memo(function AnimeCardWide({ anime, index }: WideProps) {
  const scale = useSharedValue(1);
  const { contentType } = useContentSettings();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    router.push({ pathname: "/anime/[id]", params: { id: anime.mal_id, contentType } });
  }, [anime.mal_id, contentType]);

  const title = anime.title_english ?? anime.title;
  const imageUrl = anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url;
  const isManga = contentType === "manga";

  return (
    <AnimatedPressable
      style={[styles.wideCard, animatedStyle]}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={handlePress}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.wideImage}
        contentFit="cover"
        transition={200}
        recyclingKey={`wide-${anime.mal_id}`}
      />

      <View style={styles.wideInfo}>
        <View style={styles.wideRankRow}>
          <View style={styles.rankCircle}>
            <Text style={styles.rankCircleText}>{index + 1}</Text>
          </View>
          {anime.score !== undefined && anime.score > 0 && (
            <View style={styles.scoreRow}>
              <Ionicons name="star" size={12} color={Colors.dark.star} />
              <Text style={styles.scoreTextWide}>{anime.score.toFixed(1)}</Text>
            </View>
          )}
          {anime.type && (
            <View style={[styles.typePill, styles.typePillWide]}>
              <Text style={styles.typeText}>{anime.type}</Text>
            </View>
          )}
        </View>

        <Text style={styles.wideTitle} numberOfLines={2}>{title}</Text>

        <View style={styles.wideMeta}>
          {isManga ? (
            <>
              {anime.chapters !== undefined && anime.chapters > 0 && (
                <Text style={styles.wideEpisodes}>{anime.chapters} ch</Text>
              )}
              {anime.volumes !== undefined && anime.volumes > 0 && (
                <Text style={styles.wideEpisodes}>{anime.volumes} vol</Text>
              )}
            </>
          ) : (
            anime.episodes !== undefined && anime.episodes > 0 && (
              <Text style={styles.wideEpisodes}>{anime.episodes} eps</Text>
            )
          )}
        </View>

        {anime.genres && anime.genres.length > 0 && (
          <Text style={styles.genres} numberOfLines={1}>
            {anime.genres.slice(0, 3).map((g) => g.name).join(" · ")}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  image: { width: "100%", height: "100%" },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(22,33,62,0.85)",
  },
  rankBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.dark.primary,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rankText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  scoreBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(22,33,62,0.85)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  scoreText: { color: Colors.dark.star, fontSize: 11, fontFamily: "Inter_700Bold" },
  info: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10 },
  title: { color: Colors.dark.text, fontSize: 12, fontFamily: "Inter_600SemiBold", lineHeight: 17, marginBottom: 4 },
  episodes: { color: Colors.dark.textSecondary, fontSize: 10, fontFamily: "Inter_400Regular" },

  wideCard: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    overflow: "hidden",
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  wideImage: { width: 90, height: 130 },
  wideInfo: { flex: 1, padding: 12, justifyContent: "space-between" },
  wideRankRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.dark.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  rankCircleText: { color: Colors.dark.primary, fontSize: 11, fontFamily: "Inter_700Bold" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  scoreTextWide: { color: Colors.dark.star, fontSize: 13, fontFamily: "Inter_700Bold" },
  typePillWide: { marginLeft: "auto" },
  wideTitle: {
    color: Colors.dark.text, fontSize: 15, fontFamily: "Inter_600SemiBold",
    lineHeight: 20, flex: 1, marginVertical: 4,
  },
  wideMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  wideEpisodes: { color: Colors.dark.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" },
  genres: { color: Colors.dark.secondary, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, opacity: 0.9 },
});
