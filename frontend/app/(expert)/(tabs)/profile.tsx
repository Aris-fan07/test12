import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme, ThemeName } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function ExpertProfile() {
  const { user, signOut } = useAuth();
  const { colors, themeName, setTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const themes: { name: ThemeName; color: string }[] = [
    { name: "teal", color: "#0D9488" },
    { name: "rose", color: "#E11D48" },
    { name: "blue", color: "#2563EB" },
    { name: "purple", color: "#7C3AED" },
  ];

  const menu = [
    { id: "withdraw", label: "Tarik Pendapatan", icon: "cash-outline", onPress: () => router.push("/(expert)/withdraw") },
    { id: "hours", label: "Atur Jam Praktik", icon: "time-outline", onPress: () => router.push("/(expert)/hours") },
    { id: "help", label: "Pusat Bantuan", icon: "help-circle-outline", onPress: () => router.push("/(expert)/helpcenter") },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.onSurface, marginBottom: 16 }}>Profil</Text>
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          <View style={[s.av, { backgroundColor: colors.brandTertiary }]}>
            <Ionicons name="medkit" size={36} color={colors.brandPrimary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.onSurface, marginTop: 8 }}>{user?.full_name}</Text>
          <Text style={{ color: colors.brandPrimary, fontWeight: "600" }}>{user?.specialty}</Text>
          <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13 }}>{user?.email}</Text>
          <View style={[s.balance, { backgroundColor: colors.brandTertiary }]}>
            <Ionicons name="wallet" size={16} color={colors.brandPrimary} />
            <Text style={{ color: colors.brandPrimary, fontWeight: "800" }}>
              Rp {(user?.balance || 0).toLocaleString("id-ID")}
            </Text>
          </View>
        </View>

        <Text style={[s.section, { color: colors.onSurface }]}>Tema Aplikasi</Text>
        <View style={[s.themeRow, { backgroundColor: colors.surface }]}>
          {themes.map((t) => (
            <Pressable
              key={t.name} testID={`theme-${t.name}`}
              onPress={() => { setTheme(t.name); toast.show(`Tema ${t.name} aktif`); }}
              style={[s.themeChip, { backgroundColor: t.color, borderColor: themeName === t.name ? "#111827" : "transparent" }]}
            >
              {themeName === t.name && <Ionicons name="checkmark" size={18} color="#fff" />}
            </Pressable>
          ))}
        </View>

        <Text style={[s.section, { color: colors.onSurface }]}>Menu</Text>
        <View style={{ gap: 10 }}>
          <Pressable testID="menu-edit" onPress={() => router.push("/(expert)/edit-profile")} style={[s.item, { backgroundColor: colors.surface }]}>
            <View style={[s.icon, { backgroundColor: colors.brandTertiary }]}><Ionicons name="create-outline" size={20} color={colors.brandPrimary} /></View>
            <Text style={{ flex: 1, fontWeight: "600", color: colors.onSurface }}>Edit Profil</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceSecondary} />
          </Pressable>
          {menu.map((m) => (
            <Pressable key={m.id} testID={`menu-${m.id}`} onPress={m.onPress} style={[s.item, { backgroundColor: colors.surface }]}>
              <View style={[s.icon, { backgroundColor: colors.brandTertiary }]}><Ionicons name={m.icon as any} size={20} color={colors.brandPrimary} /></View>
              <Text style={{ flex: 1, fontWeight: "600", color: colors.onSurface }}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceSecondary} />
            </Pressable>
          ))}
          <Pressable testID="logout-button" onPress={async () => { await signOut(); toast.show("Sampai jumpa!"); }} style={[s.item, { backgroundColor: colors.error + "15" }]}>
            <View style={[s.icon, { backgroundColor: colors.error + "20" }]}><Ionicons name="log-out-outline" size={20} color={colors.error} /></View>
            <Text style={{ flex: 1, fontWeight: "700", color: colors.error }}>Keluar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card: { padding: 20, borderRadius: 24, alignItems: "center" },
  av: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  balance: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 10 },
  section: { fontSize: 14, fontWeight: "700", marginTop: 24, marginBottom: 12 },
  themeRow: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 20, justifyContent: "space-around" },
  themeChip: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
