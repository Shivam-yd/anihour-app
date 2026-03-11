import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

function ShimmerBox({
  width,
  height,
  borderRadius = 8,
  style = {},
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: Colors.dark.surfaceElevated,
        },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <ShimmerBox width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={12} />
    </View>
  );
}

export function SkeletonWideCard() {
  return (
    <View style={styles.wideCard}>
      <ShimmerBox width={90} height={130} borderRadius={0} />
      <View style={styles.wideInfo}>
        <ShimmerBox width="60%" height={14} />
        <ShimmerBox width="90%" height={16} style={{ marginTop: 10 }} />
        <ShimmerBox width="70%" height={14} style={{ marginTop: 6 }} />
        <ShimmerBox width="40%" height={12} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
  },
  wideCard: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    overflow: "hidden",
    marginHorizontal: 16,
    marginVertical: 5,
    height: 130,
  },
  wideInfo: {
    flex: 1,
    padding: 12,
    gap: 0,
  },
});
