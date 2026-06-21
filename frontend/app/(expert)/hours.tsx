import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Switch, StyleSheet, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

const DAYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];

export default function Hours() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [hours, setHours] = useState<any>({});

  useEffect(() => {
    apiFetch("/api/users/me/hours", token).then((h) => {
      const init: any = {};
      DAYS.forEach(d => { init[d] = h?.[d] || { start: "09:00", end: "17:00", active: d !== "minggu" }; });
      setHours(init);
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await apiFetch("/api/users/me/hours", token, { method: "PUT", body: JSON.stringify({ hours }) });
      toast.show("Jam praktik tersimpan");
      router.back();
    } catch (e: any) { toast.show(e.message, "error"); }
  };

  const upd = (day: string, patch: any) => setHours((h: any) => ({ ...h, [day]: { ...h[day], ...patch } }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ padding: 6 }}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>Atur Jam Praktik</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 10 }}>
        {DAYS.map(d => (
          <View key={d} style={[s.row, { backgroundColor: colors.surface }]} testID={`day-${d}`}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: colors.onSurface, textTransform: "capitalize" }}>{d}</Text>
              {hours[d]?.active && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <TextInput
                    testID={`start-${d}`}
                    value={hours[d]?.start} onChangeText={v => upd(d, { start: v })}
                    style={[s.timeInp, { borderColor: colors.border, color: colors.onSurface }]}
                  />
                  <Text style={{ color: colors.onSurfaceSecondary }}>-</Text>
                  <TextInput
                    testID={`end-${d}`}
                    value={hours[d]?.end} onChangeText={v => upd(d, { end: v })}
                    style={[s.timeInp, { borderColor: colors.border, color: colors.onSurface }]}
                  />
                </View>
              )}
            </View>
            <Switch
              testID={`toggle-${d}`}
              value={!!hours[d]?.active}
              onValueChange={(v) => upd(d, { active: v })}
              trackColor={{ true: colors.brandPrimary, false: "#D1D5DB" }} thumbColor="#fff"
            />
          </View>
        ))}
        <Pressable testID="save-hours" onPress={save} style={[s.btn, { backgroundColor: colors.brandPrimary }]}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Simpan</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16 },
  timeInp: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, minWidth: 70 },
  btn: { marginTop: 16, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
});
