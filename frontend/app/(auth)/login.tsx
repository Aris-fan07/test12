import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

export default function Login() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      toast.show("Email & password wajib diisi", "error");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      toast.show("Selamat datang kembali!");
    } catch (e: any) {
      toast.show(e.message || "Login gagal", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.surface }]} edges={["top","bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={[s.logo, { backgroundColor: colors.brandTertiary }]}>
            <Ionicons name="heart" size={40} color={colors.brandPrimary} />
          </View>
          <Text style={[s.title, { color: colors.onSurface }]}>Rangkul</Text>
          <Text style={[s.subtitle, { color: colors.onSurfaceSecondary }]}>
            Ruang aman untuk hatimu
          </Text>

          <View style={s.form}>
            <Text style={[s.label, { color: colors.onSurface }]}>Email</Text>
            <TextInput
              testID="login-email-input"
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
              testID="login-password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={[s.input, { borderColor: colors.border, color: colors.onSurface }]}
            />
            <Pressable
              testID="login-submit-button"
              onPress={submit}
              disabled={loading}
              style={[s.btn, { backgroundColor: colors.brandPrimary, opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Masuk</Text>
              )}
            </Pressable>

            <Pressable
              testID="goto-register-button"
              onPress={() => router.push("/(auth)/register")}
              style={s.linkBtn}
            >
              <Text style={{ color: colors.onSurfaceSecondary }}>
                Belum punya akun?{" "}
                <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Daftar</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 40, flexGrow: 1 },
  logo: {
    width: 80, height: 80, borderRadius: 24, alignItems: "center",
    justifyContent: "center", alignSelf: "center", marginBottom: 16,
  },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 32 },
  form: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15,
  },
  btn: {
    borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 24,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkBtn: { alignItems: "center", marginTop: 20 },
});
