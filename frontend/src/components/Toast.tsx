import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastCtx {
  show: (message: string, kind?: ToastKind) => void;
}

const Ctx = createContext<ToastCtx | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((arr) => [...arr, { id, message, kind }]);
    setTimeout(() => {
      setToasts((arr) => arr.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <View pointerEvents="none" style={styles.host} testID="toast-host">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </View>
    </Ctx.Provider>
  );
}

function ToastItem({ message, kind }: Toast) {
  const fade = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [fade]);
  const bg = kind === "success" ? "#10B981" : kind === "error" ? "#EF4444" : "#0EA5E9";
  const icon = kind === "success" ? "checkmark-circle" : kind === "error" ? "alert-circle" : "information-circle";
  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity: fade }]} testID="toast-message">
      <Ionicons name={icon as any} size={18} color="#fff" />
      <Text style={styles.txt}>{message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be in ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: "absolute", top: 60, left: 0, right: 0, alignItems: "center", zIndex: 1000 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
    maxWidth: "90%",
  },
  txt: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
