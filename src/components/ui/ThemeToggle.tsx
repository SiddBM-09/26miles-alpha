"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center rounded p-1.5",
        "text-text-tertiary hover:text-text-primary hover:bg-elevated/60",
        "transition-colors",
        className
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark"
        ? <Sun  className="h-4 w-4" strokeWidth={1.75} />
        : <Moon className="h-4 w-4" strokeWidth={1.75} />
      }
    </button>
  );
}
