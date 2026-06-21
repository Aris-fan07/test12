import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function HelpCenter() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>Pusat Bantuan</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="chatbubble-ellipses" size={32} color={colors.brandPrimary} />
          <Text style={{ fontWeight: "800", color: colors.onSurface, marginTop: 12, fontSize: 16 }}>Hubungi Admin</Text>
          <Text style={{ color: colors.onSurfaceSecondary, textAlign: "center", marginTop: 6 }}>
            Tim kami siap membantu 24/7. Email: bantuan@rangkul.id
          </Text>
          <Pressable testID="contact-admin-button" style={[s.btn, { backgroundColor: colors.brandPrimary }]}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Mulai Chat dengan Admin</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 4 },
  card: { padding: 24, borderRadius: 24, alignItems: "center" },
  btn: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999 },
});
