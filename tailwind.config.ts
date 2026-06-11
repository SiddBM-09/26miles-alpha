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
        // Base palette — near-black ground, layered surfaces
        canvas:   "#0a0b0d",   // page background
        surface:  "#111318",   // card / panel
        elevated: "#181c23",   // hover / active surface
        border:   "#1f2430",   // subtle dividers
        muted:    "#2a3042",   // disabled / placeholder bg

        // Text hierarchy
        "text-primary":   "#e8eaf0",
        "text-secondary": "#8b91a0",
        "text-tertiary":  "#555d70",

        // Accent — electric blue for active/positive
        accent: {
          DEFAULT: "#3b82f6",  // blue-500
          dim:     "#1d4ed8",  // blue-700 (muted variant)
          glow:    "#60a5fa",  // blue-400 (highlights)
        },

        // Semantic — positive P&L / pass
        profit: {
          DEFAULT: "#10b981",  // emerald-500
          muted:   "#064e3b",  // emerald bg tint
        },

        // Semantic — risk / drawdown / fail
        loss: {
          DEFAULT: "#ef4444",  // red-500
          muted:   "#450a0a",  // red bg tint
        },

        // Semantic — warning
        warn: {
          DEFAULT: "#f59e0b",  // amber-500
          muted:   "#451a03",  // amber bg tint
        },
      },

      fontFamily: {
        sans:  ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono:  ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      fontSize: {
        // Tight scale for data-dense UI
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs:    ["0.75rem",  { lineHeight: "1rem"     }],
        sm:    ["0.8125rem",{ lineHeight: "1.125rem" }],
        base:  ["0.875rem", { lineHeight: "1.25rem"  }],
        md:    ["1rem",     { lineHeight: "1.5rem"   }],
        lg:    ["1.125rem", { lineHeight: "1.625rem" }],
        xl:    ["1.25rem",  { lineHeight: "1.75rem"  }],
        "2xl": ["1.5rem",   { lineHeight: "2rem"     }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem"  }],
      },

      borderRadius: {
        sm:  "0.25rem",
        DEFAULT: "0.375rem",
        md:  "0.5rem",
        lg:  "0.75rem",
        xl:  "1rem",
      },

      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.25)",
        glow: "0 0 20px rgba(59,130,246,0.15)",
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
        "fade-in": "fade-in 0.2s ease-out",
        shimmer:   "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
