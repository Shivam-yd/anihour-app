import { Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";

export function ContentToggleBar() {
  const { contentType, toggleContentType } = useContentSettings();
  const isAnime = contentType === "anime";

  return (
    <View style={styles.bar}>
      <View style={styles.segmented}>
        <Pressable
          style={[styles.segment, isAnime && styles.segmentActiveAnime]}
          onPress={() => !isAnime && toggleContentType()}
        >
          <Text style={[styles.segmentText, isAnime && styles.segmentTextAnime]}>
            Anime
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={[styles.segment, !isAnime && styles.segmentActiveManga]}
          onPress={() => isAnime && toggleContentType()}
        >
          <Text style={[styles.segmentText, !isAnime && styles.segmentTextManga]}>
            Manga
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
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
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
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
});
