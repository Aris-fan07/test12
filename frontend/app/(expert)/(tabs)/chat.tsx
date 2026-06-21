// Reuse same chat list, just navigate to expert chat thread route
import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function ExpertChat() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); try { setData(await apiFetch("/api/chats", token)); } catch {/* */} finally { setLoading(false); } };
  useFocusEffect(useCallback(() => { load(); }, [token]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.onSurface }}>Pesan</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(it) => it.peer_id}
        contentContainerStyle={{ padding: 24, paddingTop: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brandPrimary} />}
        renderItem={({ item }) => (
          <Pressable
            testID={`chat-${item.peer_id}`}
            onPress={() => router.push(`/(expert)/chat/${item.peer_id}`)}
            style={[s.row, { backgroundColor: colors.surface }]}
          >
            <View style={[s.avatar, { backgroundColor: colors.brandTertiary }]}><Ionicons name="person" size={22} color={colors.brandPrimary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: colors.onSurface }}>{item.peer_name}</Text>
              <Text numberOfLines={1} style={{ color: colors.onSurfaceSecondary, fontSize: 13 }}>{item.last_message}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceSecondary} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ padding: 48, alignItems: "center" }}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.onSurfaceSecondary} />
            <Text style={{ color: colors.onSurfaceSecondary, marginTop: 8 }}>Belum ada percakapan</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
