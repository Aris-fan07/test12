import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function ExpertHome() {
  const { user, token, setUser } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<any>({ sesi_selesai: 0, balance: 0, pending: 0, accepted: 0 });
  const [next, setNext] = useState<any>(null);

  const load = async () => {
    try {
      const [st, accepted] = await Promise.all([
        apiFetch("/api/expert/stats", token),
        apiFetch("/api/appointments?status_filter=accepted", token),
      ]);
      setStats(st);
      setNext(accepted[0] || null);
    } catch { /* */ }
  };
  useFocusEffect(useCallback(() => { load(); }, [token]));

  const toggleOnline = async (v: boolean) => {
    try {
      const u = await apiFetch("/api/users/me/online", token, { method: "PATCH", body: JSON.stringify({ is_online: v }) });
      setUser(u);
      toast.show(v ? "Status: Aktif" : "Status: Offline");
    } catch (e: any) { toast.show(e.message, "error"); }
  };

  const completeSession = async () => {
    if (!next) return;
    try {
      await apiFetch(`/api/appointments/${next.id}/status`, token, { method: "PATCH", body: JSON.stringify({ status: "completed" }) });
      toast.show("Sesi ditandai selesai");
      load();
    } catch (e: any) { toast.show(e.message, "error"); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View style={s.header}>
          <View>
            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13 }}>Selamat datang,</Text>
            <Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: "800" }}>{user?.full_name}</Text>
            <Text style={{ color: colors.brandPrimary, fontSize: 12, fontWeight: "600" }}>{user?.specialty}</Text>
          </View>
        </View>

        <View style={[s.statusCard, { backgroundColor: colors.surface }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: 15 }}>Status Aktif</Text>
            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 4 }}>
              {user?.is_online ? "Klien dapat melihat dan memesan sesi Anda" : "Anda sedang offline"}
            </Text>
          </View>
          <Switch
            testID="online-toggle"
            value={!!user?.is_online}
            onValueChange={toggleOnline}
            trackColor={{ true: colors.brandPrimary, false: "#D1D5DB" }}
            thumbColor="#fff"
          />
        </View>

        <View style={s.statRow}>
          <View style={[s.statBox, { backgroundColor: colors.brandPrimary }]} testID="stat-sessions">
            <Ionicons name="checkmark-done" size={24} color="#fff" />
            <Text style={s.statVal}>{stats.sesi_selesai}</Text>
            <Text style={s.statLbl}>Sesi Selesai</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: colors.brandSecondary }]} testID="stat-balance">
            <Ionicons name="cash" size={24} color="#fff" />
            <Text style={s.statVal}>Rp {(stats.balance || 0).toLocaleString("id-ID")}</Text>
            <Text style={s.statLbl}>Pendapatan</Text>
          </View>
        </View>

        <Text style={[s.section, { color: colors.onSurface }]}>Sesi Berikutnya</Text>
        {next ? (
          <View style={[s.nextCard, { backgroundColor: colors.surface }]} testID="next-appointment">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={[s.av, { backgroundColor: colors.brandTertiary }]}>
                <Ionicons name="person" size={22} color={colors.brandPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: colors.onSurface }}>{next.patient_name}</Text>
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12 }}>{next.category}</Text>
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 4 }}>
                  {new Date(next.schedule_date).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <Pressable
                testID="start-session-button"
                onPress={() => {
                  if (next.method === "zoom") Linking.openURL("https://zoom.us/").catch(() => {});
                  else toast.show("Klien diberi notifikasi kedatangan");
                }}
                style={[s.actBtn, { backgroundColor: colors.brandPrimary }]}
              >
                <Ionicons name={next.method === "zoom" ? "videocam" : "checkmark-circle"} size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700" }}>{next.method === "zoom" ? "Mulai Zoom" : "Tandai Tiba"}</Text>
              </Pressable>
              <Pressable testID="complete-session-button" onPress={completeSession} style={[s.actBtn, { backgroundColor: colors.surfaceTertiary }]}>
                <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Selesai</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[s.nextCard, { backgroundColor: colors.surface, alignItems: "center" }]}>
            <Ionicons name="calendar-outline" size={36} color={colors.onSurfaceSecondary} />
            <Text style={{ color: colors.onSurfaceSecondary, marginTop: 8 }}>Belum ada sesi terjadwal</Text>
          </View>
        )}

        <Pressable onPress={() => router.push("/(expert)/(tabs)/schedule")} style={[s.linkBtn, { backgroundColor: colors.brandTertiary }]}>
          <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Lihat {stats.pending} permintaan baru</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.brandPrimary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { marginBottom: 20 },
  statusCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 20, marginBottom: 16 },
  statRow: { flexDirection: "row", gap: 12 },
  statBox: { flex: 1, padding: 16, borderRadius: 20, gap: 6 },
  statVal: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 4 },
  statLbl: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
  section: { fontSize: 15, fontWeight: "700", marginTop: 24, marginBottom: 12 },
  nextCard: { padding: 16, borderRadius: 20 },
  av: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  actBtn: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  linkBtn: { marginTop: 16, padding: 14, borderRadius: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
