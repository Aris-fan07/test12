import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function Route() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>Rute ke Klinik</Text>
      </View>
      <View style={[s.box, { backgroundColor: colors.brandTertiary }]} testID="map-route-placeholder">
        <Ionicons name="navigate" size={64} color={colors.brandPrimary} />
        <Text style={{ color: colors.brandPrimary, fontWeight: "800", marginTop: 12 }}>Rute Disiapkan</Text>
        <Text style={{ color: colors.brandPrimary, marginTop: 4 }}>Jl. Sudirman No. 123, Jakarta</Text>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 4 },
  box: { margin: 16, padding: 48, borderRadius: 24, alignItems: "center" },
});
