import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";

interface Props {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.accent} />
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accent: {
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: Colors.dark.accent,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 24,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});
