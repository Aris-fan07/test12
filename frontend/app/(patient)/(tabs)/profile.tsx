import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme, ThemeName } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function PatientProfile() {
  const { user, signOut } = useAuth();
  const { colors, themeName, setTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const menu = [
    { id: "edit", label: "Edit Profil", icon: "create-outline", onPress: () => router.push("/(patient)/edit-profile") },
    { id: "journal", label: "Daily Journal", icon: "book-outline", onPress: () => router.push("/(patient)/journal") },
    { id: "assessment", label: "Hasil Assessment", icon: "clipboard-outline", onPress: () => router.push("/(patient)/assessment") },
    { id: "help", label: "Pusat Bantuan", icon: "help-circle-outline", onPress: () => router.push("/(patient)/helpcenter") },
  ];

  const themes: { name: ThemeName; color: string }[] = [
    { name: "teal", color: "#0D9488" },
    { name: "rose", color: "#E11D48" },
    { name: "blue", color: "#2563EB" },
    { name: "purple", color: "#7C3AED" },
  ];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.surfaceSecondary }]} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text style={[s.title, { color: colors.onSurface }]}>Profil</Text>

        <View style={[s.profileCard, { backgroundColor: colors.surface }]}>
          <View style={[s.avatar, { backgroundColor: colors.brandTertiary }]}>
            <Ionicons name="person" size={36} color={colors.brandPrimary} />
          </View>
          <Text style={[s.name, { color: colors.onSurface }]}>{user?.full_name}</Text>
          <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13 }}>{user?.email}</Text>
          <View style={[s.pointBadge, { backgroundColor: colors.brandTertiary }]}>
            <Ionicons name="ribbon" size={14} color={colors.brandPrimary} />
            <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>{user?.points || 0} Poin</Text>
          </View>
        </View>

        <Text style={[s.section, { color: colors.onSurface }]}>Tema Aplikasi</Text>
        <View style={[s.themeRow, { backgroundColor: colors.surface }]}>
          {themes.map((t) => (
            <Pressable
              key={t.name}
              testID={`theme-${t.name}`}
              onPress={() => { setTheme(t.name); toast.show(`Tema ${t.name} aktif`); }}
              style={[
                s.themeChip,
                { backgroundColor: t.color, borderColor: themeName === t.name ? "#111827" : "transparent" }
              ]}
            >
              {themeName === t.name && <Ionicons name="checkmark" size={18} color="#fff" />}
            </Pressable>
          ))}
        </View>

        <Text style={[s.section, { color: colors.onSurface }]}>Menu</Text>
        <View style={{ gap: 10 }}>
          {menu.map((m) => (
            <Pressable
              key={m.id}
              testID={`menu-${m.id}`}
              onPress={m.onPress}
              style={[s.menuItem, { backgroundColor: colors.surface }]}
            >
              <View style={[s.menuIcon, { backgroundColor: colors.brandTertiary }]}>
                <Ionicons name={m.icon as any} size={20} color={colors.brandPrimary} />
              </View>
              <Text style={{ flex: 1, fontWeight: "600", color: colors.onSurface }}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceSecondary} />
            </Pressable>
          ))}
          <Pressable
            testID="logout-button"
            onPress={async () => { await signOut(); toast.show("Sampai jumpa lagi!"); }}
            style={[s.menuItem, { backgroundColor: colors.error + "15" }]}
          >
            <View style={[s.menuIcon, { backgroundColor: colors.error + "20" }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <Text style={{ flex: 1, fontWeight: "700", color: colors.error }}>Keluar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 16 },
  profileCard: { padding: 20, borderRadius: 24, alignItems: "center", gap: 6, marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  pointBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 6 },
  section: { fontSize: 14, fontWeight: "700", marginTop: 24, marginBottom: 12 },
  themeRow: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 20, justifyContent: "space-around" },
  themeChip: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18 },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
