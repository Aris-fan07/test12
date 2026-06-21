import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/contexts/ThemeContext";

const RESULTS = [
  { id: "1", title: "Kecemasan Umum (GAD-7)", level: "Ringan", date: "12 Mei 2026", color: "#10B981" },
  { id: "2", title: "Depresi (PHQ-9)", level: "Sedang", date: "5 Mei 2026", color: "#F59E0B" },
  { id: "3", title: "Stres Kerja", level: "Tinggi", date: "28 Apr 2026", color: "#EF4444" },
];

export default function Assessment() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>Hasil Assessment</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {RESULTS.map((r) => (
          <View key={r.id} style={[s.card, { backgroundColor: colors.surface }]} testID={`result-${r.id}`}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: colors.onSurface }}>{r.title}</Text>
              <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 4 }}>{r.date}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: r.color + "20" }]}>
              <Text style={{ color: r.color, fontWeight: "700" }}>{r.level}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 4 },
  card: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 20 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
});
