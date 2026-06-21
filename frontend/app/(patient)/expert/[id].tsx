import React, { useEffect, useState } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth, apiFetch } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useToast } from "@/src/components/Toast";

const TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "19:00"];
const PAYMENTS = [
  { group: "E-Wallet", items: [
    { id: "gopay", label: "GoPay", icon: "wallet" },
    { id: "ovo", label: "OVO", icon: "wallet" },
    { id: "dana", label: "DANA", icon: "wallet" },
    { id: "shopeepay", label: "ShopeePay", icon: "wallet" },
  ]},
  { group: "Virtual Account", items: [
    { id: "bca", label: "BCA Virtual Account", icon: "card" },
    { id: "mandiri", label: "Mandiri VA", icon: "card" },
    { id: "bni", label: "BNI VA", icon: "card" },
    { id: "bri", label: "BRI VA", icon: "card" },
  ]},
];

export default function ExpertDetail() {
  const { id, category } = useLocalSearchParams<{ id: string; category?: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [expert, setExpert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateIdx, setDateIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(0);
  const [method, setMethod] = useState<"zoom" | "clinic">("zoom");
  const [payment, setPayment] = useState<string>("gopay");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch(`/api/experts/${id}`, token).then((e) => { setExpert(e); }).finally(() => setLoading(false));
  }, [id]);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d;
  });

  const submit = async () => {
    if (!expert) return;
    setSubmitting(true);
    try {
      const sched = new Date(dates[dateIdx]);
      const [h, m] = TIMES[timeIdx].split(":").map(Number);
      sched.setHours(h, m, 0, 0);
      await apiFetch("/api/appointments", token, {
        method: "POST",
        body: JSON.stringify({
          expert_id: expert.id,
          category: category || "Pribadi",
          schedule_date: sched.toISOString(),
          method,
          total_price: expert.price_per_session,
          payment_method: payment,
        }),
      });
      setConfirmOpen(false);
      toast.show("Pembayaran Berhasil! Menunggu konfirmasi psikolog.");
      setTimeout(() => router.replace("/(patient)/(tabs)/schedule"), 600);
    } catch (e: any) {
      toast.show(e.message || "Gagal memesan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !expert) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  const paymentLabel = PAYMENTS.flatMap(g => g.items).find(p => p.id === payment)?.label || payment;

  return (
    <SafeAreaView style={[s.c, { backgroundColor: colors.surfaceSecondary }]} edges={["top"]}>
      <View style={s.header}>
        <Pressable testID="back-button" onPress={() => router.back()} style={s.back}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.title, { color: colors.onSurface }]}>Booking Sesi</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={[s.expert, { backgroundColor: colors.surface }]}>
          <View style={[s.avatar, { backgroundColor: colors.brandTertiary }]}>
            <Ionicons name="person" size={32} color={colors.brandPrimary} />
          </View>
          <Text style={[s.name, { color: colors.onSurface }]}>{expert.full_name}</Text>
          <Text style={{ color: colors.onSurfaceSecondary }}>{expert.specialty}</Text>
          <Text style={{ marginTop: 8, color: colors.brandPrimary, fontWeight: "800", fontSize: 18 }}>
            Rp {expert.price_per_session.toLocaleString("id-ID")} / sesi
          </Text>
        </View>

        <Text style={[s.sec, { color: colors.onSurface }]}>Pilih Tanggal</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
          {dates.map((d, i) => (
            <Pressable
              key={i}
              testID={`date-${i}`}
              onPress={() => setDateIdx(i)}
              style={[s.dateChip, { backgroundColor: dateIdx === i ? colors.brandPrimary : colors.surface }]}
            >
              <Text style={{ color: dateIdx === i ? "#fff" : colors.onSurfaceSecondary, fontSize: 11 }}>
                {d.toLocaleDateString("id-ID", { weekday: "short" })}
              </Text>
              <Text style={{ color: dateIdx === i ? "#fff" : colors.onSurface, fontWeight: "800", fontSize: 18, marginTop: 2 }}>
                {d.getDate()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[s.sec, { color: colors.onSurface }]}>Pilih Jam</Text>
        <View style={s.timeGrid}>
          {TIMES.map((t, i) => (
            <Pressable
              key={t}
              testID={`time-${i}`}
              onPress={() => setTimeIdx(i)}
              style={[
                s.timeChip,
                {
                  backgroundColor: timeIdx === i ? colors.brandPrimary : colors.surface,
                  borderColor: timeIdx === i ? colors.brandPrimary : colors.border,
                }
              ]}
            >
              <Text style={{ color: timeIdx === i ? "#fff" : colors.onSurface, fontWeight: "600" }}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[s.sec, { color: colors.onSurface }]}>Metode Konsultasi</Text>
        <View style={[s.segment, { backgroundColor: colors.surface }]}>
          {(["zoom", "clinic"] as const).map((m) => (
            <Pressable
              key={m}
              testID={`method-${m}`}
              onPress={() => setMethod(m)}
              style={[s.segItem, { backgroundColor: method === m ? colors.brandPrimary : "transparent" }]}
            >
              <Ionicons name={m === "zoom" ? "videocam" : "location"} size={18} color={method === m ? "#fff" : colors.onSurface} />
              <Text style={{ color: method === m ? "#fff" : colors.onSurface, fontWeight: "700" }}>
                {m === "zoom" ? "Online (Zoom)" : "Klinik"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[s.sec, { color: colors.onSurface }]}>Metode Pembayaran</Text>
        {PAYMENTS.map((grp) => (
          <View key={grp.group}>
            <Text style={[s.grpLbl, { color: colors.onSurfaceSecondary }]}>{grp.group}</Text>
            {grp.items.map((p) => (
              <Pressable
                key={p.id}
                testID={`payment-${p.id}`}
                onPress={() => setPayment(p.id)}
                style={[s.payRow, { backgroundColor: colors.surface, borderColor: payment === p.id ? colors.brandPrimary : colors.border }]}
              >
                <Ionicons name={p.icon as any} size={20} color={colors.brandPrimary} />
                <Text style={{ flex: 1, color: colors.onSurface, fontWeight: "600" }}>{p.label}</Text>
                <View style={[s.radio, { borderColor: payment === p.id ? colors.brandPrimary : colors.border }]}>
                  {payment === p.id && <View style={[s.radioDot, { backgroundColor: colors.brandPrimary }]} />}
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View>
          <Text style={{ color: colors.onSurfaceSecondary, fontSize: 11 }}>Total</Text>
          <Text style={{ color: colors.onSurface, fontWeight: "800", fontSize: 18 }}>
            Rp {expert.price_per_session.toLocaleString("id-ID")}
          </Text>
        </View>
        <Pressable
          testID="proceed-payment-button"
          onPress={() => setConfirmOpen(true)}
          style={[s.payBtn, { backgroundColor: colors.brandPrimary }]}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Lanjut Pembayaran</Text>
        </Pressable>
      </View>

      {/* Double confirmation modal */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={s.modalBg}>
          <View style={[s.modalCard, { backgroundColor: colors.surface }]} testID="confirm-modal">
            <Text style={[s.modalTitle, { color: colors.onSurface }]}>Konfirmasi Pemesanan</Text>
            <Text style={{ color: colors.onSurfaceSecondary, marginBottom: 16 }}>
              Periksa detail sebelum melanjutkan pembayaran.
            </Text>
            {[
              ["Psikolog", expert.full_name],
              ["Tanggal", dates[dateIdx].toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "short" })],
              ["Jam", TIMES[timeIdx]],
              ["Metode", method === "zoom" ? "Online (Zoom)" : "Klinik"],
              ["Pembayaran", paymentLabel],
            ].map(([k, v]) => (
              <View key={k} style={s.kv}>
                <Text style={{ color: colors.onSurfaceSecondary }}>{k}</Text>
                <Text style={{ color: colors.onSurface, fontWeight: "600", textAlign: "right", flex: 1, marginLeft: 12 }} numberOfLines={1}>{v}</Text>
              </View>
            ))}
            <View style={[s.kv, { borderTopWidth: 1, borderColor: colors.border, paddingTop: 12, marginTop: 8 }]}>
              <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Total</Text>
              <Text style={{ color: colors.brandPrimary, fontWeight: "800", fontSize: 16 }}>
                Rp {expert.price_per_session.toLocaleString("id-ID")}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
              <Pressable
                testID="cancel-confirm-button"
                onPress={() => setConfirmOpen(false)}
                style={[s.modalBtn, { backgroundColor: colors.surfaceTertiary }]}
              >
                <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Batal</Text>
              </Pressable>
              <Pressable
                testID="final-pay-button"
                disabled={submitting}
                onPress={submit}
                style={[s.modalBtn, { backgroundColor: colors.brandPrimary, opacity: submitting ? 0.7 : 1 }]}
              >
                {submitting ? <ActivityIndicator color="#fff" /> :
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Bayar Sekarang</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 4 },
  back: { padding: 6 },
  title: { fontSize: 18, fontWeight: "700" },
  expert: { padding: 20, borderRadius: 24, alignItems: "center", marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "700" },
  sec: { fontSize: 14, fontWeight: "700", marginTop: 20, marginBottom: 10 },
  dateChip: { width: 60, paddingVertical: 12, borderRadius: 16, alignItems: "center", marginRight: 10 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  segment: { flexDirection: "row", padding: 4, borderRadius: 999 },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  grpLbl: { fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 8 },
  payRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderTopWidth: 1, paddingBottom: 28,
  },
  payBtn: { paddingHorizontal: 22, paddingVertical: 14, borderRadius: 999 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modalCard: { padding: 22, borderRadius: 24 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  kv: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
});
