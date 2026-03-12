import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useContentSettings } from "@/lib/content-settings";

export function ContentToggleBar() {
  const { contentType, isAdultMode, toggleContentType, toggleAdultMode } = useContentSettings();

  const isAnime = contentType === "anime";

  return (
    <View style={styles.bar}>
      <View style={styles.typeToggle}>
        <Pressable
          style={[styles.typeBtn, isAnime && styles.typeBtnActive]}
          onPress={() => !isAnime && toggleContentType()}
        >
          <Text style={[styles.typeBtnText, isAnime && styles.typeBtnTextActive]}>
            📺 Anime
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeBtn, !isAnime && styles.typeBtnActiveManga]}
          onPress={() => isAnime && toggleContentType()}
        >
          <Text style={[styles.typeBtnText, !isAnime && styles.typeBtnTextActiveManga]}>
            📚 Manga
          </Text>
        </Pressable>
      </View>

      <View style={styles.adultToggle}>
        <Feather
          name="eye"
          size={13}
          color={isAdultMode ? Colors.dark.warning : Colors.dark.textTertiary}
        />
        <Text style={[styles.adultLabel, isAdultMode && { color: Colors.dark.warning }]}>
          18+
        </Text>
        <Switch
          value={isAdultMode}
          onValueChange={toggleAdultMode}
          trackColor={{ false: Colors.dark.border, true: Colors.dark.warning }}
          thumbColor={isAdultMode ? "#fff" : Colors.dark.textTertiary}
          ios_backgroundColor={Colors.dark.border}
          style={styles.switch}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  typeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  typeBtnActive: {
    backgroundColor: Colors.dark.primaryLight,
  },
  typeBtnActiveManga: {
    backgroundColor: Colors.dark.secondaryLight,
  },
  typeBtnText: {
    color: Colors.dark.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  typeBtnTextActive: {
    color: Colors.dark.primary,
    fontFamily: "Inter_600SemiBold",
  },
  typeBtnTextActiveManga: {
    color: Colors.dark.secondary,
    fontFamily: "Inter_600SemiBold",
  },
  adultToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adultLabel: {
    color: Colors.dark.textTertiary,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});
