import React, { useCallback, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, FlatList, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function Journal() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    try { setItems(await apiFetch("/api/journals", token)); } catch {/* */}
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const save = async () => {
    if (!content.trim()) return;
    try {
      await apiFetch("/api/journals", token, { method: "POST", body: JSON.stringify({ content }) });
      toast.show("Journal tersimpan");
      setContent(""); load();
    } catch (e: any) { toast.show(e.message || "Gagal menyimpan", "error"); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>Daily Journal</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[s.composer, { backgroundColor: colors.surface }]}>
          <TextInput
            testID="journal-input"
            value={content}
            onChangeText={setContent}
            placeholder="Apa yang kamu rasakan hari ini..."
            placeholderTextColor="#9CA3AF"
            multiline
            style={{ minHeight: 80, color: colors.onSurface, fontSize: 14, padding: 8 }}
          />
          <Pressable testID="journal-save-button" onPress={save} style={[s.btn, { backgroundColor: colors.brandPrimary }]}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Simpan</Text>
          </Pressable>
        </View>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.onSurface, fontSize: 14 }}>{item.content}</Text>
              <Text style={{ color: colors.onSurfaceSecondary, fontSize: 11, marginTop: 6 }}>
                {new Date(item.created_at).toLocaleString("id-ID")}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: "center" }}>
              <Ionicons name="book-outline" size={40} color={colors.onSurfaceSecondary} />
              <Text style={{ color: colors.onSurfaceSecondary, marginTop: 8 }}>Belum ada catatan</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 4 },
  composer: { margin: 16, padding: 12, borderRadius: 20, gap: 10 },
  btn: { paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  card: { padding: 14, borderRadius: 16 },
});
