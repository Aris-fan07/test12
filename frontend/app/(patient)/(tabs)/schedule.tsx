import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function PatientSchedule() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/appointments", token);
      setData(res);
    } catch (e: any) {
      toast.show(e.message || "Gagal memuat jadwal", "error");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [token]));

  const renderItem = ({ item }: any) => (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={s.row}>
        <View style={[s.avatar, { backgroundColor: colors.brandTertiary }]}>
          <Ionicons name="person" size={22} color={colors.brandPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.name, { color: colors.onSurface }]}>{item.expert_name}</Text>
          <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12 }}>{item.category}</Text>
        </View>
        <View style={[s.badge, {
          backgroundColor:
            item.status === "accepted" ? colors.success + "20" :
            item.status === "pending" ? colors.warning + "20" :
            item.status === "rejected" ? colors.error + "20" :
            colors.brandTertiary
        }]}>
          <Text style={{
            color:
              item.status === "accepted" ? colors.success :
              item.status === "pending" ? colors.warning :
              item.status === "rejected" ? colors.error :
              colors.brandPrimary,
            fontSize: 11, fontWeight: "700"
          }}>
            {item.status === "accepted" ? "Diterima" :
              item.status === "pending" ? "Menunggu" :
              item.status === "rejected" ? "Ditolak" : "Selesai"}
          </Text>
        </View>
      </View>
      <View style={[s.row, { marginTop: 12 }]}>
        <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceSecondary} />
        <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13 }}>
          {new Date(item.schedule_date).toLocaleString("id-ID", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </Text>
      </View>
      <View style={[s.row, { marginTop: 6 }]}>
        <Ionicons name={item.method === "zoom" ? "videocam-outline" : "location-outline"} size={16} color={colors.onSurfaceSecondary} />
        <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13, textTransform: "capitalize" }}>
          {item.method === "zoom" ? "Konsultasi Online (Zoom)" : "Kunjungan Klinik"}
        </Text>
      </View>

      {item.status === "accepted" && (
        <Pressable
          testID={`action-${item.id}`}
          onPress={() => {
            if (item.method === "zoom") {
              Linking.openURL("https://zoom.us/").catch(() => toast.show("Tidak dapat membuka Zoom", "error"));
            } else {
              router.push(`/(patient)/route/${item.expert_id}`);
            }
          }}
          style={[s.actionBtn, { backgroundColor: colors.brandPrimary }]}
        >
          <Ionicons
            name={item.method === "zoom" ? "videocam" : "map"}
            size={18} color="#fff"
          />
          <Text style={s.actionTxt}>
            {item.method === "zoom" ? "Join Zoom" : "Lihat Rute Map"}
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.surfaceSecondary }]} edges={["top"]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.onSurface }]}>Jadwal Konsultasi</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 24, paddingTop: 8, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={56} color={colors.onSurfaceSecondary} />
            <Text style={{ color: colors.onSurfaceSecondary, marginTop: 12, textAlign: "center" }}>
              Belum ada jadwal konsultasi.{"\n"}Yuk, mulai cari psikolog!
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brandPrimary} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: "800" },
  card: { padding: 16, borderRadius: 20, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  actionBtn: {
    marginTop: 14, paddingVertical: 12, borderRadius: 999,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  actionTxt: { color: "#fff", fontWeight: "700" },
  empty: { padding: 48, alignItems: "center" },
});
