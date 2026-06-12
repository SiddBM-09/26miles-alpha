import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Surfaces — use CSS variables; swapped by .light class ──────────
        canvas:    "rgb(var(--canvas)   / <alpha-value>)",
        surface:   "rgb(var(--surface)  / <alpha-value>)",
        elevated:  "rgb(var(--elevated) / <alpha-value>)",
        // border is a complete rgba value so no alpha-value wrapper needed
        border:    "var(--border)",
        muted:     "rgb(var(--muted)    / <alpha-value>)",

        // ── Text on accent background (always near-black — works in both themes) ──
        // IMPORTANT: use text-on-accent, NOT text-canvas, on any bg-accent element
        "on-accent": "#0A0B0D",

        // ── Text hierarchy ─────────────────────────────────────────────────
        "text-primary":   "rgb(var(--text-primary)   / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        "text-tertiary":  "rgb(var(--text-tertiary)  / <alpha-value>)",

        // ── Accent ─────────────────────────────────────────────────────────
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          dim:     "rgb(var(--accent) / 0.10)",
        },

        // ── Semantic ───────────────────────────────────────────────────────
        profit: {
          DEFAULT: "rgb(var(--profit) / <alpha-value>)",
          muted:   "rgb(var(--profit) / 0.10)",
        },
        loss: {
          DEFAULT: "rgb(var(--loss) / <alpha-value>)",
          muted:   "rgb(var(--loss)   / 0.10)",
        },
        warn: {
          DEFAULT: "rgb(var(--warn) / <alpha-value>)",
          muted:   "rgb(var(--warn)   / 0.10)",
        },
      },

      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      fontSize: {
        "2xs": ["0.625rem",  { lineHeight: "0.875rem" }],
        xs:    ["0.75rem",   { lineHeight: "1rem"     }],
        sm:    ["0.8125rem", { lineHeight: "1.125rem" }],
        base:  ["0.875rem",  { lineHeight: "1.25rem"  }],
        md:    ["1rem",      { lineHeight: "1.5rem"   }],
        lg:    ["1.125rem",  { lineHeight: "1.625rem" }],
        xl:    ["1.25rem",   { lineHeight: "1.75rem"  }],
        "2xl": ["1.5rem",    { lineHeight: "2rem"     }],
        "3xl": ["1.875rem",  { lineHeight: "2.25rem"  }],
        "4xl": ["2.25rem",   { lineHeight: "2.5rem"   }],
      },

      borderRadius: {
        none:    "0",
        sm:      "2px",
        DEFAULT: "4px",
        md:      "5px",
        lg:      "6px",
        xl:      "8px",
        "2xl":   "10px",
        full:    "9999px",
      },

      boxShadow: {
        none:         "none",
        sm:           "0 1px 2px rgba(0,0,0,0.4)",
        card:         "none",
        "card-hover": "none",
        // Accent glow — uses CSS variable so adapts per theme
        glow:         "0 0 0 1px rgb(var(--accent) / 0.30), 0 0 24px rgb(var(--accent) / 0.08)",
        "glow-sm":    "0 0 0 1px rgb(var(--accent) / 0.20)",
        inset:        "inset 0 1px 0 rgba(255,255,255,0.04)",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        shimmer:   "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
