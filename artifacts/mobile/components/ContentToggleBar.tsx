import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";

export function ContentToggleBar() {
  const { contentType, isAdultMode, toggleContentType, toggleAdultMode } = useContentSettings();
  const isAnime = contentType === "anime";

  return (
    <View style={styles.bar}>
      {/* Segmented Anime / Manga control */}
      <View style={styles.segmented}>
        <Pressable
          style={[styles.segment, styles.segmentLeft, isAnime && styles.segmentActiveAnime]}
          onPress={() => !isAnime && toggleContentType()}
        >
          <Text style={[styles.segmentText, isAnime && styles.segmentTextAnime]}>
            Anime
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={[styles.segment, styles.segmentRight, !isAnime && styles.segmentActiveManga]}
          onPress={() => isAnime && toggleContentType()}
        >
          <Text style={[styles.segmentText, !isAnime && styles.segmentTextManga]}>
            Manga
          </Text>
        </Pressable>
      </View>

      {/* 18+ toggle */}
      <Pressable
        style={[styles.adultBtn, isAdultMode && styles.adultBtnActive]}
        onPress={toggleAdultMode}
      >
        <Text style={[styles.adultText, isAdultMode && styles.adultTextActive]}>18+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  segment: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentLeft: {
    borderTopLeftRadius: 9,
    borderBottomLeftRadius: 9,
  },
  segmentRight: {
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
  },
  segmentActiveAnime: {
    backgroundColor: Colors.dark.primaryLight,
  },
  segmentActiveManga: {
    backgroundColor: Colors.dark.secondaryLight,
  },
  segmentText: {
    color: Colors.dark.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  segmentTextAnime: {
    color: Colors.dark.primary,
    fontFamily: "Inter_700Bold",
  },
  segmentTextManga: {
    color: Colors.dark.secondary,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    width: 1,
    backgroundColor: Colors.dark.border,
  },
  adultBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  adultBtnActive: {
    backgroundColor: "rgba(239,68,68,0.15)",
    borderColor: "#ef4444",
  },
  adultText: {
    color: Colors.dark.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  adultTextActive: {
    color: "#ef4444",
  },
});
