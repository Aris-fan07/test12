import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, UserRole } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function Register() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("patient");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password || !name) {
      toast.show("Mohon lengkapi semua field", "error");
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: email.trim().toLowerCase(),
        password,
        full_name: name.trim(),
        role,
        specialty: role === "expert" ? specialty || "Psikolog Klinis" : undefined,
        price_per_session: role === "expert" ? parseInt(price || "150000", 10) : undefined,
      });
      toast.show("Akun berhasil dibuat!");
    } catch (e: any) {
      toast.show(e.message || "Registrasi gagal", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.surface }]} edges={["top","bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Pressable testID="back-button" onPress={() => router.back()} style={s.back}>
            <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
          </Pressable>
          <Text style={[s.title, { color: colors.onSurface }]}>Buat Akun Rangkul</Text>
          <Text style={[s.subtitle, { color: colors.onSurfaceSecondary }]}>
            Pilih peranmu untuk memulai
          </Text>

          <View style={s.roleRow}>
            {(["patient","expert"] as UserRole[]).map((r) => (
              <Pressable
                key={r}
                testID={`role-${r}-button`}
                onPress={() => setRole(r)}
                style={[
                  s.roleCard,
                  {
                    borderColor: role === r ? colors.brandPrimary : colors.border,
                    backgroundColor: role === r ? colors.brandTertiary : colors.surfaceSecondary,
                  },
                ]}
              >
                <Ionicons
                  name={r === "patient" ? "person" : "medkit"}
                  size={24}
                  color={role === r ? colors.brandPrimary : colors.onSurfaceSecondary}
                />
                <Text style={[
                  s.roleText,
                  { color: role === r ? colors.brandPrimary : colors.onSurfaceSecondary }
                ]}>
                  {r === "patient" ? "Saya Klien" : "Saya Psikolog"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={s.form}>
            <Text style={[s.label, { color: colors.onSurface }]}>Nama Lengkap</Text>
            <TextInput
              testID="register-name-input"
              value={name}
              onChangeText={setName}
              placeholder="Nama lengkap"
              placeholderTextColor="#9CA3AF"
              style={[s.input, { borderColor: colors.border, color: colors.onSurface }]}
            />
            <Text style={[s.label, { color: colors.onSurface }]}>Email</Text>
            <TextInput
              testID="register-email-input"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
              style={[s.input, { borderColor: colors.border, color: colors.onSurface }]}
            />
            <Text style={[s.label, { color: colors.onSurface }]}>Password</Text>
            <TextInput
              testID="register-password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="Minimal 6 karakter"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={[s.input, { borderColor: colors.border, color: colors.onSurface }]}
            />
            {role === "expert" && (
              <>
                <Text style={[s.label, { color: colors.onSurface }]}>Spesialisasi</Text>
                <TextInput
                  testID="register-specialty-input"
                  value={specialty}
                  onChangeText={setSpecialty}
                  placeholder="cth. Psikolog Klinis"
                  placeholderTextColor="#9CA3AF"
                  style={[s.input, { borderColor: colors.border, color: colors.onSurface }]}
                />
                <Text style={[s.label, { color: colors.onSurface }]}>Tarif per Sesi (Rp)</Text>
                <TextInput
                  testID="register-price-input"
                  value={price}
                  onChangeText={setPrice}
                  placeholder="150000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  style={[s.input, { borderColor: colors.border, color: colors.onSurface }]}
                />
              </>
            )}

            <Pressable
              testID="register-submit-button"
              onPress={submit}
              disabled={loading}
              style={[s.btn, { backgroundColor: colors.brandPrimary, opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Daftar</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 8, flexGrow: 1, paddingBottom: 40 },
  back: { padding: 6, marginBottom: 4, alignSelf: "flex-start" },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  roleCard: {
    flex: 1, padding: 16, borderRadius: 16, borderWidth: 1.5,
    alignItems: "center", gap: 8,
  },
  roleText: { fontWeight: "700", fontSize: 13 },
  form: { gap: 4 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15,
  },
  btn: { borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
