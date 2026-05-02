import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

type SeasonName = "winter" | "spring" | "summer" | "fall";

const SEASONS: { key: SeasonName; label: string; icon: string; color: string }[] = [
  { key: "winter", label: "Winter", icon: "snow", color: "#4ecdc4" },
  { key: "spring", label: "Spring", icon: "leaf", color: "#a8e063" },
  { key: "summer", label: "Summer", icon: "sunny", color: "#f7971e" },
  { key: "fall", label: "Fall", icon: "leaf", color: "#e05c00" },
];

function getCurrentYear() {
  return new Date().getFullYear();
}

function getYears(): number[] {
  const current = getCurrentYear();
  const years: number[] = [];
  for (let y = current; y >= 2000; y--) years.push(y);
  return years;
}

const YearRow = React.memo(function YearRow({ year }: { year: number }) {
  return (
    <View style={styles.yearBlock}>
      <Text style={styles.yearLabel}>{year}</Text>
      <View style={styles.seasonRow}>
        {SEASONS.map((s) => (
          <Pressable
            key={s.key}
            style={[styles.seasonCard, { borderTopColor: s.color }]}
            onPress={() =>
              router.push({
                pathname: "/seasons/[year]/[season]",
                params: { year: year.toString(), season: s.key },
              })
            }
          >
            <Ionicons name={s.icon as any} size={22} color={s.color} style={{ marginBottom: 6 }} />
            <Text style={[styles.seasonLabel, { color: s.color }]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

export default function SeasonsIndexScreen() {
  const insets = useSafeAreaInsets();
  const years = getYears();

  return (
    <View style={styles.container}>
      <FlatList
        data={years}
        keyExtractor={(y) => y.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        windowSize={5}
        maxToRenderPerBatch={8}
        initialNumToRender={10}
        removeClippedSubviews={Platform.OS !== "web"}
        ListHeaderComponent={() => (
          <View style={[styles.header, { paddingTop: Platform.OS === "web" ? insets.top + 72 : insets.top + 16 }]}>
            <View style={styles.breadcrumb}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
                <Feather name="chevron-left" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
              <Text style={styles.breadcrumbText}>Browse</Text>
            </View>
            <Text style={styles.pageTitle}>Season Archive</Text>
            <Text style={styles.pageSubtitle}>Browse every anime season from 2000 to {getCurrentYear()}</Text>
            <View style={styles.divider} />
          </View>
        )}
        renderItem={({ item: year }) => <YearRow year={year} />}
        ItemSeparatorComponent={() => <View style={styles.yearDivider} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  breadcrumb: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
    alignItems: "center", justifyContent: "center",
  },
  breadcrumbText: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_500Medium" },
  pageTitle: { color: Colors.dark.text, fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pageSubtitle: { color: Colors.dark.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  divider: { height: 1, backgroundColor: Colors.dark.border, marginBottom: 8 },
  yearBlock: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  yearLabel: { color: Colors.dark.primary, fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 10 },
  seasonRow: { flexDirection: "row", gap: 8 },
  seasonCard: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1, borderColor: Colors.dark.border,
    borderTopWidth: 3,
    alignItems: "center",
  },
  seasonLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  yearDivider: { height: 1, backgroundColor: Colors.dark.border, marginHorizontal: 16, opacity: 0.4, marginTop: 8 },
});
