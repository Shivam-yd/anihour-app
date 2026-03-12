import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { NewsItem } from "@/lib/jikan";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  article: NewsItem;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

const BADGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  AIRING: { bg: Colors.dark.primaryLight, border: Colors.dark.primary, text: Colors.dark.primary },
  NEW: { bg: Colors.dark.secondaryLight, border: Colors.dark.secondary, text: Colors.dark.secondary },
  TRENDING: { bg: Colors.dark.warningLight, border: Colors.dark.warning, text: Colors.dark.warning },
};

export function NewsCard({ article }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(async () => {
    if (article.url) {
      await WebBrowser.openBrowserAsync(article.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: Colors.dark.background,
      });
    }
  }, [article.url]);

  const imageUrl = article.images?.jpg?.image_url;
  const badgeStyle = article.badge ? (BADGE_COLORS[article.badge] ?? BADGE_COLORS.AIRING) : null;

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={handlePress}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={300} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Feather name="file-text" size={28} color={Colors.dark.textTertiary} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.topRow}>
          {badgeStyle && article.badge ? (
            <View style={[styles.badge, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
              <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{article.badge}</Text>
            </View>
          ) : null}
          <Text style={styles.date}>{formatDate(article.date)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={3}>{article.title}</Text>

        {article.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={2}>{article.excerpt}</Text>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.readMore}>
            <Text style={styles.readMoreText}>Read more</Text>
            <Feather name="external-link" size={12} color={Colors.dark.secondary} />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    overflow: "hidden",
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  image: {
    width: 100,
    height: 130,
  },
  imagePlaceholder: {
    width: 100,
    height: 130,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  date: {
    color: Colors.dark.textTertiary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  title: {
    color: Colors.dark.text,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    marginBottom: 4,
  },
  excerpt: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  readMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readMoreText: {
    color: Colors.dark.secondary,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
