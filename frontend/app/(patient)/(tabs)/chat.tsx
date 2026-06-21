import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function ChatList() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/chats", token);
      setData(res);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, [token]));

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.surfaceSecondary }]} edges={["top"]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.onSurface }]}>Pesan</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(it) => it.peer_id}
        renderItem={({ item }) => (
          <Pressable
            testID={`chat-${item.peer_id}`}
            onPress={() => router.push(`/(patient)/chat/${item.peer_id}`)}
            style={[s.row, { backgroundColor: colors.surface }]}
          >
            <View style={[s.avatar, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons name="person" size={22} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.name, { color: colors.onSurface }]} numberOfLines={1}>{item.peer_name}</Text>
              <Text numberOfLines={1} style={{ color: colors.onSurfaceSecondary, fontSize: 13 }}>
                {item.last_message}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceSecondary} />
          </Pressable>
        )}
        contentContainerStyle={{ padding: 24, paddingTop: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="chatbubbles-outline" size={56} color={colors.onSurfaceSecondary} />
            <Text style={{ color: colors.onSurfaceSecondary, marginTop: 12, textAlign: "center" }}>
              Belum ada percakapan
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
  header: { paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  name: { fontWeight: "700", fontSize: 15 },
  empty: { padding: 48, alignItems: "center" },
});
