import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import Colors from "@/constants/colors";

export function HeaderSearchButton() {
  return (
    <Pressable
      style={styles.button}
      onPress={() => router.push("/search")}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Open search"
    >
      <Feather name="search" size={19} color={Colors.dark.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primaryLight,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
});