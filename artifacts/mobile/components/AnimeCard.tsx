import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { Anime } from "@/lib/jikan";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface Props {
  anime: Anime;
  rank?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimeCard({ anime, rank }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    router.push({ pathname: "/anime/[id]", params: { id: anime.mal_id } });
  }, [anime.mal_id]);

  const title = anime.title_english ?? anime.title;
  const imageUrl =
    anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url;

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
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
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {anime.episodes !== undefined && anime.episodes > 0 && (
          <Text style={styles.episodes}>{anime.episodes} eps</Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

interface WideProps {
  anime: Anime;
  index: number;
}

export function AnimeCardWide({ anime, index }: WideProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    router.push({ pathname: "/anime/[id]", params: { id: anime.mal_id } });
  }, [anime.mal_id]);

  const title = anime.title_english ?? anime.title;
  const imageUrl =
    anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url;

  return (
    <AnimatedPressable
      style={[styles.wideCard, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.wideImage}
        contentFit="cover"
        transition={300}
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
        </View>

        <Text style={styles.wideTitle} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.wideMeta}>
          {anime.type && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{anime.type}</Text>
            </View>
          )}
          {anime.episodes !== undefined && anime.episodes > 0 && (
            <Text style={styles.wideEpisodes}>{anime.episodes} eps</Text>
          )}
          {anime.status && (
            <Text style={styles.wideStatus} numberOfLines={1}>
              {anime.status}
            </Text>
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
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.dark.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  rankBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.dark.accent,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  scoreBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  scoreText: {
    color: Colors.dark.star,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  info: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 16,
  },
  episodes: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },

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
  wideImage: {
    width: 90,
    height: 130,
  },
  wideInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  wideRankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.dark.accentLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  rankCircleText: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  scoreTextWide: {
    color: Colors.dark.star,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  wideTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
    flex: 1,
    marginVertical: 4,
  },
  wideMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.dark.accentLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  tagText: {
    color: Colors.dark.accent,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  wideEpisodes: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  wideStatus: {
    color: Colors.dark.textTertiary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  genres: {
    color: Colors.dark.textTertiary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
