"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  DARK_CHART_COLORS,
  LIGHT_CHART_COLORS,
  type ChartColors,
} from "@/lib/chart-theme";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme:  Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:  "dark",
  toggle: () => {},
});

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("26miles_theme") as Theme | null);
    const initial: Theme = saved === "light" ? "light" : "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("26miles_theme", next);
      applyTheme(next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useChartColors(): ChartColors {
  const { theme } = useTheme();
  return theme === "light" ? LIGHT_CHART_COLORS : DARK_CHART_COLORS;
}
