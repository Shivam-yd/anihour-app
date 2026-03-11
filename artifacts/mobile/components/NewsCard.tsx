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
import { NewsArticle } from "@/lib/jikan";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  article: NewsArticle;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(article.date)}</Text>
          <View style={styles.dot} />
          <Text style={styles.author} numberOfLines={1}>{article.author_username}</Text>
        </View>

        <Text style={styles.title} numberOfLines={3}>{article.title}</Text>

        {article.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={2}>{article.excerpt}</Text>
        ) : null}

        <View style={styles.footer}>
          {article.comments > 0 && (
            <View style={styles.commentsRow}>
              <Feather name="message-circle" size={12} color={Colors.dark.textTertiary} />
              <Text style={styles.commentsText}>{article.comments}</Text>
            </View>
          )}
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
    height: 120,
  },
  imagePlaceholder: {
    width: 100,
    height: 120,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  date: {
    color: Colors.dark.primary,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark.textTertiary,
  },
  author: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    marginTop: 4,
  },
  excerpt: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    marginTop: 3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  commentsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentsText: {
    color: Colors.dark.textTertiary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
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
