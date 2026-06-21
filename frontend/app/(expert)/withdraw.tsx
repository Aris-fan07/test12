import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function Withdraw() {
  const { user, token, refreshUser } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("BCA");
  const [acc, setAcc] = useState("");

  const submit = async () => {
    try {
      await apiFetch("/api/withdrawals", token, { method: "POST", body: JSON.stringify({ amount: parseInt(amount || "0", 10), bank, account_no: acc }) });
      toast.show("Permintaan tarik dana diproses");
      await refreshUser();
      router.back();
    } catch (e: any) { toast.show(e.message, "error"); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSecondary }} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={{ padding: 6 }}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>Tarik Pendapatan</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={[s.balance, { backgroundColor: colors.brandPrimary }]}>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>Saldo Tersedia</Text>
          <Text style={{ color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 4 }}>Rp {(user?.balance || 0).toLocaleString("id-ID")}</Text>
        </View>
        <Text style={[s.lbl, { color: colors.onSurface }]}>Jumlah Penarikan</Text>
        <TextInput testID="withdraw-amount" value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="100000" placeholderTextColor="#9CA3AF" style={[s.inp, { borderColor: colors.border, color: colors.onSurface, backgroundColor: colors.surface }]} />
        <Text style={[s.lbl, { color: colors.onSurface }]}>Bank</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {["BCA", "Mandiri", "BNI", "BRI"].map((b) => (
            <Pressable key={b} testID={`bank-${b}`} onPress={() => setBank(b)} style={[s.chip, { borderColor: bank === b ? colors.brandPrimary : colors.border, backgroundColor: bank === b ? colors.brandTertiary : colors.surface }]}>
              <Text style={{ color: bank === b ? colors.brandPrimary : colors.onSurface, fontWeight: "600" }}>{b}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[s.lbl, { color: colors.onSurface }]}>Nomor Rekening</Text>
        <TextInput testID="withdraw-account" value={acc} onChangeText={setAcc} keyboardType="number-pad" placeholder="1234567890" placeholderTextColor="#9CA3AF" style={[s.inp, { borderColor: colors.border, color: colors.onSurface, backgroundColor: colors.surface }]} />
        <Pressable testID="withdraw-submit" onPress={submit} style={[s.btn, { backgroundColor: colors.brandPrimary }]}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Tarik Sekarang</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 4 },
  balance: { padding: 20, borderRadius: 24, marginBottom: 20 },
  lbl: { fontSize: 13, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  inp: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5 },
  btn: { marginTop: 28, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
});
