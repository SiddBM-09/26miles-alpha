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
        // ── Surfaces — near-black, cool-tinted charcoal ──────────────────────
        canvas:   "#0A0B0D",   // page background
        surface:  "#14161A",   // card / panel
        elevated: "#1C1F26",   // active / hover surface
        border:   "rgba(255,255,255,0.07)",  // hairline: white @ 7% opacity
        muted:    "#252830",   // disabled / placeholder bg

        // ── Text hierarchy ───────────────────────────────────────────────────
        "text-primary":   "#E6E8EB",
        "text-secondary": "#8A9099",
        "text-tertiary":  "#4D5562",

        // ── Accent — electric lime (signal / tournament energy) ───────────
        // Use sparingly: interactive states, CTAs, active indicators only.
        // Text ON accent background must be text-canvas (dark), not white.
        accent: {
          DEFAULT: "#AAFF3E",
          dim:     "rgba(170,255,62,0.10)",
        },

        // ── Semantic — positive PnL / pass checks ────────────────────────
        profit: {
          DEFAULT: "#22D47A",
          muted:   "rgba(34,212,122,0.10)",
        },

        // ── Semantic — risk / drawdown / failed checks ────────────────────
        loss: {
          DEFAULT: "#FF4040",
          muted:   "rgba(255,64,64,0.10)",
        },

        // ── Semantic — warnings ───────────────────────────────────────────
        warn: {
          DEFAULT: "#F5A623",
          muted:   "rgba(245,166,35,0.10)",
        },
      },

      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      fontSize: {
        // Tight scale — data-dense UI
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

      // ── Tight corners — institutional, not consumer ───────────────────────
      borderRadius: {
        none:    "0",
        sm:      "2px",
        DEFAULT: "4px",   // badges, inputs, small elements
        md:      "5px",
        lg:      "6px",   // cards, panels — standard surface
        xl:      "8px",   // modals, large containers
        "2xl":   "10px",  // maximum — use rarely
        full:    "9999px",
      },

      // ── Shadows — hairline borders carry elevation; avoid shadows ─────────
      boxShadow: {
        none:        "none",
        sm:          "0 1px 2px rgba(0,0,0,0.5)",
        card:        "none",
        "card-hover":"none",
        // Accent glow — only for focus rings and CTA emphasis
        glow:        "0 0 0 1px rgba(170,255,62,0.30), 0 0 24px rgba(170,255,62,0.08)",
        "glow-sm":   "0 0 0 1px rgba(170,255,62,0.20)",
        // Inset highlight — subtle top-edge light for elevated surfaces
        inset:       "inset 0 1px 0 rgba(255,255,255,0.04)",
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
