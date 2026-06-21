import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "patient" | "expert";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string | null;
  points: number;
  balance: number;
  is_online: boolean;
  bio?: string | null;
  specialty?: string | null;
  price_per_session: number;
  rating: number;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (payload: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    specialty?: string;
    price_per_session?: number;
    city?: string;
  }) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "rangkul.token";
const USER_KEY = "rangkul.user";

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (t && u) {
          setToken(t);
          setUserState(JSON.parse(u));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = async (t: string, u: User) => {
    setToken(t);
    setUserState(u);
    await AsyncStorage.setItem(TOKEN_KEY, t);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Login gagal");
    }
    const data = await res.json();
    await persist(data.access_token, data.user);
    return data.user as User;
  };

  const signUp = async (payload: any) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registrasi gagal");
    }
    const data = await res.json();
    await persist(data.access_token, data.user);
    return data.user as User;
  };

  const signOut = async () => {
    setToken(null);
    setUserState(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  };

  const refreshUser = async () => {
    if (!token) return;
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const u = await res.json();
      setUserState(u);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    }
  };

  const setUser = (u: User) => {
    setUserState(u);
    AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isLoading, signIn, signUp, signOut, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export async function apiFetch(path: string, token: string | null, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}
