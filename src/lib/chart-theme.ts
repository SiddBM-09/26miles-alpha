// Chart color constants for dark and light themes.
// Only hex/rgba strings — no Tailwind classes or CSS variables,
// because Recharts props take literal color values.

export interface ChartColors {
  tick:             { fill: string; fontSize: number; fontFamily: string };
  grid:             string;
  cursor:           { stroke: string; strokeWidth: number };
  accent:           string;
  accentFill:       string;       // area fill under OOS / cumulative line
  accentBoundary:   string;       // IS/OOS divider line
  accentRegion:     string;       // OOS reference area tint
  profit:           string;
  loss:             string;
  warn:             string;
  muted:            string;
  is:               string;       // IS equity line
  isFill:           string;       // IS area fill
  isRegion:         string;       // IS reference area tint
  ddFill:           string;       // drawdown underwater fill
  retainerBar:      string;       // earnings chart retainer bar fill
  hwmLine:          string;       // HWM dashed line (warn-tinted)
  hwmMarker:        string;       // HWM milestone reference line
  hwmMarkerLabel:   string;       // HWM milestone label text
  cursorBar:        string;       // bar chart cursor fill
  tooltipBg:        string;
  tooltipBorder:    string;
  tooltipLabel:     string;
  tooltipItem:      string;
}

export const DARK_CHART_COLORS: ChartColors = {
  tick:           { fill: "#4D5562", fontSize: 10, fontFamily: "var(--font-mono)" },
  grid:           "rgba(255,255,255,0.045)",
  cursor:         { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 },
  accent:         "#AAFF3E",
  accentFill:     "rgba(170,255,62,0.06)",
  accentBoundary: "rgba(170,255,62,0.35)",
  accentRegion:   "rgba(170,255,62,0.025)",
  profit:         "#22D47A",
  loss:           "#FF4040",
  warn:           "#F5A623",
  muted:          "#252830",
  is:             "#3D4251",
  isFill:         "rgba(85,93,112,0.04)",
  isRegion:       "rgba(30,34,46,0.40)",
  ddFill:         "rgba(255,64,64,0.10)",
  retainerBar:    "#252830",
  hwmLine:        "#F5A623",
  hwmMarker:      "rgba(170,255,62,0.50)",
  hwmMarkerLabel: "rgba(170,255,62,0.70)",
  cursorBar:      "rgba(170,255,62,0.04)",
  tooltipBg:      "#1C1F26",
  tooltipBorder:  "rgba(255,255,255,0.07)",
  tooltipLabel:   "#4D5562",
  tooltipItem:    "#E6E8EB",
};

export const LIGHT_CHART_COLORS: ChartColors = {
  tick:           { fill: "#475569", fontSize: 10, fontFamily: "var(--font-mono)" },
  grid:           "rgba(0,0,0,0.06)",
  cursor:         { stroke: "rgba(0,0,0,0.07)", strokeWidth: 1 },
  accent:         "#5CB800",
  accentFill:     "rgba(92,184,0,0.08)",
  accentBoundary: "rgba(92,184,0,0.40)",
  accentRegion:   "rgba(92,184,0,0.04)",
  profit:         "#0B8C4A",
  loss:           "#CC2929",
  warn:           "#A86000",
  muted:          "#DDE1EC",
  is:             "#B8C2D0",
  isFill:         "rgba(180,190,205,0.08)",
  isRegion:       "rgba(215,220,232,0.70)",
  ddFill:         "rgba(204,41,41,0.10)",
  retainerBar:    "#DDE1EC",
  hwmLine:        "#A86000",
  hwmMarker:      "rgba(92,184,0,0.50)",
  hwmMarkerLabel: "rgba(60,130,0,0.80)",
  cursorBar:      "rgba(92,184,0,0.06)",
  tooltipBg:      "#FFFFFF",
  tooltipBorder:  "rgba(0,0,0,0.08)",
  tooltipLabel:   "#475569",
  tooltipItem:    "#0D1117",
};
