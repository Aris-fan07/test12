import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function ExpertsList() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await apiFetch("/api/experts", token)); }
    catch { /* */ } finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, [token]));

  return (
    <SafeAreaView style={[s.c, { backgroundColor: colors.surfaceSecondary }]} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={s.back}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>
          Psikolog {category ? `· ${category}` : ""}
        </Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Pressable
            testID={`expert-${item.id}`}
            onPress={() => router.push({ pathname: "/(patient)/expert/[id]", params: { id: item.id, category: category || "Pribadi" } })}
            style={[s.card, { backgroundColor: colors.surface }]}
          >
            <View style={[s.avatar, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons name="person" size={26} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[s.name, { color: colors.onSurface }]}>{item.full_name}</Text>
                {item.is_online && <View style={s.dot} />}
              </View>
              <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12 }}>{item.specialty}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12 }}>{item.rating} · Rp {item.price_per_session.toLocaleString("id-ID")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceSecondary} />
          </Pressable>
        )}
        contentContainerStyle={{ padding: 24, paddingTop: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={{ padding: 48, alignItems: "center" }}>
            <Ionicons name="people-outline" size={48} color={colors.onSurfaceSecondary} />
            <Text style={{ color: colors.onSurfaceSecondary, marginTop: 12 }}>Belum ada psikolog terdaftar</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brandPrimary} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
  back: { padding: 6 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 4 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 20 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  name: { fontWeight: "700", fontSize: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
});
