import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeName = "teal" | "rose" | "blue" | "purple";

export interface ThemeColors {
  brand: string;
  brandPrimary: string;
  brandSecondary: string;
  brandTertiary: string;
  onBrandPrimary: string;
  onBrandTertiary: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  onSurface: string;
  onSurfaceSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const THEMES: Record<ThemeName, ThemeColors> = {
  teal: {
    brand: "#0D9488",
    brandPrimary: "#0F766E",
    brandSecondary: "#115E59",
    brandTertiary: "#CCFBF1",
    onBrandPrimary: "#FFFFFF",
    onBrandTertiary: "#0F766E",
    surface: "#FFFFFF",
    surfaceSecondary: "#F9FAFB",
    surfaceTertiary: "#F3F4F6",
    onSurface: "#111827",
    onSurfaceSecondary: "#4B5563",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#0EA5E9",
  },
  rose: {
    brand: "#E11D48",
    brandPrimary: "#BE123C",
    brandSecondary: "#9F1239",
    brandTertiary: "#FFE4E6",
    onBrandPrimary: "#FFFFFF",
    onBrandTertiary: "#BE123C",
    surface: "#FFFFFF",
    surfaceSecondary: "#FFF1F2",
    surfaceTertiary: "#F3F4F6",
    onSurface: "#111827",
    onSurfaceSecondary: "#4B5563",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#0EA5E9",
  },
  blue: {
    brand: "#2563EB",
    brandPrimary: "#1D4ED8",
    brandSecondary: "#1E40AF",
    brandTertiary: "#DBEAFE",
    onBrandPrimary: "#FFFFFF",
    onBrandTertiary: "#1D4ED8",
    surface: "#FFFFFF",
    surfaceSecondary: "#EFF6FF",
    surfaceTertiary: "#F3F4F6",
    onSurface: "#111827",
    onSurfaceSecondary: "#4B5563",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#0EA5E9",
  },
  purple: {
    brand: "#7C3AED",
    brandPrimary: "#6D28D9",
    brandSecondary: "#5B21B6",
    brandTertiary: "#EDE9FE",
    onBrandPrimary: "#FFFFFF",
    onBrandTertiary: "#6D28D9",
    surface: "#FFFFFF",
    surfaceSecondary: "#F5F3FF",
    surfaceTertiary: "#F3F4F6",
    onSurface: "#111827",
    onSurfaceSecondary: "#4B5563",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#0EA5E9",
  },
};

interface ThemeContextValue {
  themeName: ThemeName;
  colors: ThemeColors;
  setTheme: (n: ThemeName) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const KEY = "rangkul.theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setName] = useState<ThemeName>("teal");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v && THEMES[v as ThemeName]) setName(v as ThemeName);
    });
  }, []);

  const setTheme = async (n: ThemeName) => {
    setName(n);
    await AsyncStorage.setItem(KEY, n);
  };

  return (
    <ThemeContext.Provider value={{ themeName, colors: THEMES[themeName], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
