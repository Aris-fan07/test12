import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [peer, setPeer] = useState<any>(null);
  const ref = useRef<FlatList>(null);

  const load = async () => {
    try {
      const data = await apiFetch(`/api/messages/${id}`, token);
      setMsgs(data);
      setTimeout(() => ref.current?.scrollToEnd({ animated: false }), 50);
    } catch {/* */}
  };

  useEffect(() => {
    apiFetch(`/api/experts/${id}`, token).then(setPeer).catch(() => {});
    load();
    const t = setInterval(load, 3500);
    return () => clearInterval(t);
  }, [id]);

  const send = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    try {
      const m = await apiFetch("/api/messages", token, {
        method: "POST",
        body: JSON.stringify({ receiver_id: id, content }),
      });
      setMsgs((arr) => [...arr, m]);
      setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 50);
    } catch { setText(content); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={[s.header, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Pressable testID="back-button" onPress={() => router.back()} style={s.back}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <View style={[s.avatar, { backgroundColor: colors.brandTertiary }]}>
          <Ionicons name="person" size={20} color={colors.brandPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", color: colors.onSurface }}>{peer?.full_name || "Chat"}</Text>
          <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12 }}>{peer?.is_online ? "Online" : "Offline"}</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={ref}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 6 }}
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            return (
              <View
                style={[
                  s.bubble,
                  {
                    alignSelf: mine ? "flex-end" : "flex-start",
                    backgroundColor: mine ? colors.brandPrimary : colors.surface,
                  },
                ]}
              >
                <Text style={{ color: mine ? "#fff" : colors.onSurface, fontSize: 14 }}>{item.content}</Text>
              </View>
            );
          }}
        />
        <View style={[s.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            testID="chat-input"
            value={text}
            onChangeText={setText}
            placeholder="Tulis pesan..."
            placeholderTextColor="#9CA3AF"
            style={[s.input, { color: colors.onSurface, backgroundColor: colors.surfaceTertiary }]}
            multiline
          />
          <Pressable testID="chat-send-button" onPress={send} style={[s.sendBtn, { backgroundColor: colors.brandPrimary }]}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderBottomWidth: 1 },
  back: { padding: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "78%", padding: 12, borderRadius: 18 },
  inputRow: { flexDirection: "row", padding: 10, gap: 8, alignItems: "flex-end", borderTopWidth: 1 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
