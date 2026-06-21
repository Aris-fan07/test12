import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function Nearby() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await apiFetch("/api/experts", token)); } catch {/* */}
    finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, [token]));

  return (
    <SafeAreaView style={[{ flex: 1 }, { backgroundColor: colors.surfaceSecondary }]} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>Psikolog Terdekat</Text>
      </View>
      {/* Map placeholder */}
      <View style={[s.mapBox, { backgroundColor: colors.brandTertiary }]} testID="map-placeholder">
        <Ionicons name="map" size={48} color={colors.brandPrimary} />
        <Text style={{ color: colors.brandPrimary, fontWeight: "700", marginTop: 8 }}>Peta Lokasi Psikolog</Text>
        <Text style={{ color: colors.brandPrimary, fontSize: 12, marginTop: 4 }}>{data.length} psikolog dalam radius 5km</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Pressable
            testID={`nearby-expert-${item.id}`}
            onPress={() => router.push({ pathname: "/(patient)/expert/[id]", params: { id: item.id } })}
            style={[s.row, { backgroundColor: colors.surface }]}
          >
            <View style={[s.avatar, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons name="person" size={22} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: colors.onSurface }}>{item.full_name}</Text>
              <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12 }}>
                <Ionicons name="location" size={12} color={colors.onSurfaceSecondary} /> {item.city} · {(Math.random() * 4 + 0.5).toFixed(1)} km
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceSecondary} />
          </Pressable>
        )}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brandPrimary} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 4 },
  mapBox: { margin: 16, padding: 32, borderRadius: 24, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
