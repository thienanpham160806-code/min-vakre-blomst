"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import type { ThemeId } from "./types";

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  note: string;
  isDark?: boolean;
  swatches: {
    canvas: string;
    surface: string;
    accent: string;
    botanical: string;
    ink: string;
  };
};

export const DEFAULT_THEME: ThemeId = "ivory";
export const THEME_STORAGE_KEY = "mvb-theme";
export const MOTION_STORAGE_KEY = "mvb-reduced-motion";

export const THEMES: ThemeDefinition[] = [
  {
    id: "ivory",
    name: "Giấy ngà",
    note: "Giấy thủ công ngà ấm, xanh lá trầm và hồng đất",
    swatches: {
      canvas: "#f7f1e5",
      surface: "#fffcf6",
      accent: "#a84a5a",
      botanical: "#5b795c",
      ink: "#352824",
    },
  },
  {
    id: "morning",
    name: "Vườn sớm",
    note: "Sương mai dịu mát, lá non và nắng ấm đầu ngày",
    swatches: {
      canvas: "#f0f5ed",
      surface: "#fcfef9",
      accent: "#3f6e4d",
      botanical: "#7a9e77",
      ink: "#233027",
    },
  },
  {
    id: "terracotta",
    name: "Hồng đất",
    note: "Cánh hoa ép khô, đất nung dịu và sắc kem ấm",
    swatches: {
      canvas: "#f9efeb",
      surface: "#fffaf7",
      accent: "#b24c58",
      botanical: "#7d8868",
      ink: "#3a2526",
    },
  },
  {
    id: "rain",
    name: "Xanh mưa",
    note: "Sổ tay ngày mưa, xanh xám êm và mực tím khói",
    swatches: {
      canvas: "#eef3f5",
      surface: "#fafcfd",
      accent: "#3a657a",
      botanical: "#6b8c87",
      ink: "#223039",
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    note: "Hương oải hương nhẹ, giấy kem tím và lá bạc hà",
    swatches: {
      canvas: "#f5f0f9",
      surface: "#fdfbff",
      accent: "#6e5194",
      botanical: "#668470",
      ink: "#2e243a",
    },
  },
  {
    id: "night",
    name: "Vườn đêm",
    note: "Khu vườn dưới ánh trăng, giấy trầm và hồng phai",
    isDark: true,
    swatches: {
      canvas: "#1b1e29",
      surface: "#252938",
      accent: "#e28ba1",
      botanical: "#84aa89",
      ink: "#f3ece3",
    },
  },
];

export const THEME_IDS = new Set<ThemeId>(THEMES.map((t) => t.id));

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return Boolean(value && THEME_IDS.has(value as ThemeId));
}

export type MotionPreference = "system" | "reduce";

type ThemeContextValue = {
  theme: ThemeId;
  preview: ThemeId | null;
  activeTheme: ThemeId;
  motion: MotionPreference;
  setPreview: (id: ThemeId | null) => void;
  applyTheme: (id: ThemeId) => void;
  resetTheme: () => void;
  setMotion: (pref: MotionPreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  preview: null,
  activeTheme: DEFAULT_THEME,
  motion: "system",
  setPreview: () => {},
  applyTheme: () => {},
  resetTheme: () => {},
  setMotion: () => {},
});

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function readStoredMotion(): MotionPreference {
  if (typeof window === "undefined") return "system";
  try {
    return window.localStorage.getItem(MOTION_STORAGE_KEY) === "reduce" ? "reduce" : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(readStoredTheme);
  const [preview, setPreview] = useState<ThemeId | null>(null);
  const [motion, setMotionState] = useState<MotionPreference>(readStoredMotion);

  const activeTheme = preview ?? theme;

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", activeTheme);
    if (motion === "reduce") root.setAttribute("data-reduced-motion", "reduce");
    else root.removeAttribute("data-reduced-motion");
  }, [activeTheme, motion]);

  const applyTheme = useCallback((id: ThemeId) => {
    setTheme(id);
    setPreview(null);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  }, []);

  const resetTheme = useCallback(() => {
    applyTheme(DEFAULT_THEME);
  }, [applyTheme]);

  const setMotion = useCallback((pref: MotionPreference) => {
    setMotionState(pref);
    try {
      if (pref === "reduce") window.localStorage.setItem(MOTION_STORAGE_KEY, "reduce");
      else window.localStorage.removeItem(MOTION_STORAGE_KEY);
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preview,
      activeTheme,
      motion,
      setPreview,
      applyTheme,
      resetTheme,
      setMotion,
    }),
    [theme, preview, activeTheme, motion, applyTheme, resetTheme, setMotion],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
