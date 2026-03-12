import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";

export function ContentToggleBar() {
  const { contentType, isAdultMode, toggleContentType, toggleAdultMode } = useContentSettings();
  const isAnime = contentType === "anime";

  return (
    <View style={styles.bar}>
      {/* Anime / Manga segmented pill */}
      <View style={styles.segmented}>
        <View style={[styles.segmentedIndicator, !isAnime && styles.segmentedIndicatorRight]} />
        <Pressable style={styles.segment} onPress={() => !isAnime && toggleContentType()}>
          <Text style={[styles.segmentText, isAnime && styles.segmentTextActive]}>
            Anime
          </Text>
        </Pressable>
        <Pressable style={styles.segment} onPress={() => isAnime && toggleContentType()}>
          <Text style={[styles.segmentText, !isAnime && styles.segmentTextActiveManga]}>
            Manga
          </Text>
        </Pressable>
      </View>

      {/* 18+ toggle button */}
      <Pressable
        style={[styles.adultBtn, isAdultMode && styles.adultBtnActive]}
        onPress={toggleAdultMode}
      >
        <Text style={[styles.adultText, isAdultMode && styles.adultTextActive]}>
          18+
        </Text>
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
    padding: 3,
    position: "relative",
    alignItems: "center",
  },
  segmentedIndicator: {
    position: "absolute",
    left: 3,
    top: 3,
    bottom: 3,
    width: "50%",
    backgroundColor: Colors.dark.primaryLight,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  segmentedIndicatorRight: {
    left: undefined,
    right: 3,
    backgroundColor: Colors.dark.secondaryLight,
    borderColor: Colors.dark.secondary,
  },
  segment: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 7,
    alignItems: "center",
    zIndex: 1,
  },
  segmentText: {
    color: Colors.dark.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  segmentTextActive: {
    color: Colors.dark.primary,
    fontFamily: "Inter_600SemiBold",
  },
  segmentTextActiveManga: {
    color: Colors.dark.secondary,
    fontFamily: "Inter_600SemiBold",
  },
  adultBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  adultBtnActive: {
    backgroundColor: "rgba(255,107,107,0.15)",
    borderColor: "#ff6b6b",
  },
  adultText: {
    color: Colors.dark.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  adultTextActive: {
    color: "#ff6b6b",
  },
});
