import React, { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, FlatList, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function ExpertSchedule() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const [tab, setTab] = useState<"req" | "cal">("req");
  const [pending, setPending] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        apiFetch("/api/appointments?status_filter=pending", token),
        apiFetch("/api/appointments?status_filter=accepted", token),
      ]);
      setPending(p); setAccepted(a);
    } catch { /* */ } finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, [token]));

  const act = async (id: string, status: "accepted" | "rejected") => {
    try {
      await apiFetch(`/api/appointments/${id}/status`, token, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.show(status === "accepted" ? "Jadwal Diterima" : "Jadwal Ditolak");
      load();
    } catch (e: any) { toast.show(e.message, "error"); }
  };

  // Calendar: group accepted by date
  const grouped: Record<string, any[]> = {};
  accepted.forEach(a => {
    const key = new Date(a.schedule_date).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={[s.title, { color: colors.onSurface }]}>Jadwal & Permintaan</Text>
      </View>
      <View style={[s.segment, { backgroundColor: colors.surfaceTertiary }]}>
        {[
          { id: "req", label: `Permintaan${pending.length > 0 ? ` (${pending.length})` : ""}` },
          { id: "cal", label: "Kalender" },
        ].map((t) => (
          <Pressable
            key={t.id}
            testID={`tab-${t.id}`}
            onPress={() => setTab(t.id as any)}
            style={[s.segItem, { backgroundColor: tab === t.id ? colors.surface : "transparent" }]}
          >
            <Text style={{ color: tab === t.id ? colors.brandPrimary : colors.onSurfaceSecondary, fontWeight: "700" }}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "req" ? (
        <FlatList
          data={pending}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 24, paddingTop: 8 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brandPrimary} />}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: colors.surface }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={[s.av, { backgroundColor: colors.brandTertiary }]}>
                  <Ionicons name="person" size={20} color={colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: colors.onSurface }}>{item.patient_name}</Text>
                  <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12 }}>{item.category} · {item.method}</Text>
                  <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 4 }}>
                    {new Date(item.schedule_date).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <Text style={{ color: colors.brandPrimary, fontWeight: "800" }}>
                  Rp {item.total_price.toLocaleString("id-ID")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <Pressable testID={`reject-${item.id}`} onPress={() => act(item.id, "rejected")} style={[s.btn, { backgroundColor: colors.surfaceTertiary }]}>
                  <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Tolak</Text>
                </Pressable>
                <Pressable testID={`accept-${item.id}`} onPress={() => act(item.id, "accepted")} style={[s.btn, { backgroundColor: colors.brandPrimary }]}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Terima</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ padding: 48, alignItems: "center" }}>
              <Ionicons name="mail-open-outline" size={48} color={colors.onSurfaceSecondary} />
              <Text style={{ color: colors.onSurfaceSecondary, marginTop: 8 }}>Tidak ada permintaan baru</Text>
            </View>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brandPrimary} />}>
          {Object.keys(grouped).length === 0 ? (
            <View style={{ padding: 48, alignItems: "center" }}>
              <Ionicons name="calendar-outline" size={48} color={colors.onSurfaceSecondary} />
              <Text style={{ color: colors.onSurfaceSecondary, marginTop: 8 }}>Belum ada jadwal diterima</Text>
            </View>
          ) : Object.entries(grouped).map(([day, items]) => (
            <View key={day} style={{ marginBottom: 16 }}>
              <Text style={[s.day, { color: colors.onSurface }]}>{day}</Text>
              {items.map((it) => (
                <View key={it.id} style={[s.card, { backgroundColor: colors.surface, marginTop: 8 }]}>
                  <Text style={{ fontWeight: "700", color: colors.onSurface }}>{it.patient_name}</Text>
                  <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 2 }}>
                    {new Date(it.schedule_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · {it.method}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800" },
  segment: { flexDirection: "row", margin: 24, marginTop: 16, padding: 4, borderRadius: 999 },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  card: { padding: 16, borderRadius: 20 },
  av: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  day: { fontSize: 14, fontWeight: "800" },
});
