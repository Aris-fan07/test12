import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function EditProfile() {
  const { token, user, setUser } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState(user?.full_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [city, setCity] = useState(user?.city || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const u = await apiFetch("/api/users/me", token, {
        method: "PATCH",
        body: JSON.stringify({ full_name: name, bio, city }),
      });
      setUser(u);
      toast.show("Profil tersimpan");
      router.back();
    } catch (e: any) { toast.show(e.message || "Gagal menyimpan", "error"); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>Edit Profil</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 6 }}>
        <Text style={[s.lbl, { color: colors.onSurface }]}>Nama Lengkap</Text>
        <TextInput testID="edit-name" value={name} onChangeText={setName} style={[s.inp, { borderColor: colors.border, color: colors.onSurface, backgroundColor: colors.surface }]} />
        <Text style={[s.lbl, { color: colors.onSurface }]}>Kota</Text>
        <TextInput testID="edit-city" value={city} onChangeText={setCity} style={[s.inp, { borderColor: colors.border, color: colors.onSurface, backgroundColor: colors.surface }]} />
        <Text style={[s.lbl, { color: colors.onSurface }]}>Bio</Text>
        <TextInput testID="edit-bio" value={bio} onChangeText={setBio} multiline style={[s.inp, { borderColor: colors.border, color: colors.onSurface, backgroundColor: colors.surface, minHeight: 90 }]} />
        <Pressable testID="save-profile-button" disabled={saving} onPress={save} style={[s.btn, { backgroundColor: colors.brandPrimary, opacity: saving ? 0.7 : 1 }]}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Simpan</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 4 },
  lbl: { fontSize: 13, fontWeight: "600", marginTop: 12 },
  inp: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  btn: { marginTop: 24, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
});
