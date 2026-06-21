import React, { useEffect, useState } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

const CATEGORIES = [
  { id: "pribadi", label: "Pribadi", icon: "person", color: "#0D9488" },
  { id: "pasangan", label: "Pasangan", icon: "heart", color: "#E11D48" },
  { id: "karir", label: "Karir", icon: "briefcase", color: "#2563EB" },
  { id: "nearby", label: "Cari Terdekat", icon: "location", color: "#7C3AED" },
];

const PROMOS = [
  { id: "1", title: "Diskon 30% Sesi Pertama", subtitle: "Konsultasi pertamamu lebih hemat", color: "#0D9488" },
  { id: "2", title: "Webinar Mindfulness", subtitle: "Gratis untuk member Rangkul", color: "#7C3AED" },
  { id: "3", title: "Daily Journal Tips", subtitle: "Mulai catat moodmu hari ini", color: "#E11D48" },
];

export default function PatientHome() {
  const { user, token, refreshUser } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [savingMood, setSavingMood] = useState(false);

  useEffect(() => { refreshUser(); }, []);

  const saveMood = async (m: "happy" | "neutral" | "sad") => {
    setMood(m);
    setSavingMood(true);
    try {
      await apiFetch("/api/moods", token, {
        method: "POST",
        body: JSON.stringify({ mood: m }),
      });
      toast.show("Mood tersimpan. Terima kasih sudah berbagi 💚");
    } catch (e: any) {
      toast.show(e.message || "Gagal menyimpan mood", "error");
    } finally {
      setSavingMood(false);
    }
  };

  const navCategory = (id: string) => {
    if (id === "nearby") router.push("/(patient)/nearby");
    else router.push({ pathname: "/(patient)/experts", params: { category: id } });
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.surfaceSecondary }]} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.avatar, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons name="person" size={22} color={colors.brandPrimary} />
            </View>
            <View>
              <Text style={[s.greet, { color: colors.onSurfaceSecondary }]}>Halo,</Text>
              <Text style={[s.name, { color: colors.onSurface }]} numberOfLines={1}>
                {user?.full_name || "Sahabat"}
              </Text>
            </View>
          </View>
          <Pressable testID="notification-bell" style={[s.bell, { backgroundColor: colors.surface }]}>
            <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        {/* Points card */}
        <View style={[s.pointsCard, { backgroundColor: colors.brandPrimary }]} testID="points-card">
          <View style={{ flex: 1 }}>
            <Text style={s.pointsLabel}>Poin Rangkul</Text>
            <Text style={s.pointsValue}>{user?.points ?? 0}</Text>
          </View>
          <Ionicons name="ribbon" size={48} color="rgba(255,255,255,0.4)" />
        </View>

        {/* Mood tracker */}
        <Text style={[s.sectionTitle, { color: colors.onSurface }]}>Bagaimana perasaanmu hari ini?</Text>
        <View style={s.moodRow}>
          {[
            { id: "happy", icon: "happy", label: "Senang" },
            { id: "neutral", icon: "ellipse-outline", label: "Biasa" },
            { id: "sad", icon: "sad", label: "Sedih" },
          ].map((m) => (
            <Pressable
              key={m.id}
              testID={`mood-${m.id}`}
              disabled={savingMood}
              onPress={() => saveMood(m.id as any)}
              style={[
                s.moodChip,
                {
                  backgroundColor: mood === m.id ? colors.brandPrimary : colors.surface,
                  borderColor: mood === m.id ? colors.brandPrimary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={m.icon as any}
                size={28}
                color={mood === m.id ? "#fff" : colors.onSurface}
              />
              <Text style={{ color: mood === m.id ? "#fff" : colors.onSurface, fontWeight: "600", marginTop: 4 }}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Services */}
        <Text style={[s.sectionTitle, { color: colors.onSurface }]}>Layanan</Text>
        <View style={s.grid}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.id}
              testID={`service-${c.id}`}
              onPress={() => navCategory(c.id)}
              style={[s.gridItem, { backgroundColor: colors.surface }]}
            >
              <View style={[s.gridIcon, { backgroundColor: c.color + "20" }]}>
                <Ionicons name={c.icon as any} size={26} color={c.color} />
              </View>
              <Text style={[s.gridLabel, { color: colors.onSurface }]}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Promo carousel */}
        <Text style={[s.sectionTitle, { color: colors.onSurface }]}>Promo & Info</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 24 }}
          style={{ marginHorizontal: -24, paddingHorizontal: 24 }}
        >
          {PROMOS.map((p) => (
            <View key={p.id} style={[s.promo, { backgroundColor: p.color }]}>
              <Text style={s.promoTitle}>{p.title}</Text>
              <Text style={s.promoSub}>{p.subtitle}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  greet: { fontSize: 13 },
  name: { fontSize: 18, fontWeight: "700" },
  bell: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  pointsCard: {
    flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 24, marginBottom: 24,
  },
  pointsLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  pointsValue: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 4 },
  moodRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  moodChip: {
    flex: 1, paddingVertical: 16, borderRadius: 20, borderWidth: 1.5,
    alignItems: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  gridItem: {
    width: "47%", padding: 16, borderRadius: 20, gap: 10,
  },
  gridIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  gridLabel: { fontSize: 14, fontWeight: "700" },
  promo: { width: 240, padding: 18, borderRadius: 20, minHeight: 110, justifyContent: "center" },
  promoTitle: { color: "#fff", fontWeight: "800", fontSize: 16, marginBottom: 6 },
  promoSub: { color: "rgba(255,255,255,0.9)", fontSize: 13 },
});
