import type { LifecycleState } from "@/components/ui/StatusBadge";
import type { CheckStatus } from "@/components/ui/StatusBadge";
import { generateEquityCurve, maxDrawdown, sharpeFromCurve, type EquityPoint } from "./equityCurves";

export type AssetClass =
  | "Nifty F&O"
  | "Bank Nifty F&O"
  | "NSE Large Cap"
  | "NSE Mid Cap"
  | "NSE Small Cap"
  | "Multi-Asset";

export interface ValidationChecks {
  overfitting:   CheckStatus;   // deflated Sharpe / PBO
  dataLeakage:   CheckStatus;
  walkForward:   CheckStatus;
  capacityTest:  CheckStatus;
}

export interface Strategy {
  id: string;
  name: string;
  ownerId: string;               // links to Researcher.id
  assetClass: AssetClass;
  description: string;
  tags: string[];

  // Key metrics
  oosSharp: number;              // out-of-sample Sharpe (hero metric)
  backtestSharpe: number;        // in-sample (de-emphasised)
  maxDrawdownPct: number;        // negative, e.g. -7.3
  annualReturnPct: number;       // OOS annualised net return %
  capacityUSDM: number;          // estimated capacity, USD millions
  turnoverPerDay: number;        // average daily turnover ratio
  correlationToBook: number;     // -1 to 1
  betaToNifty: number;

  // Validation
  checks: ValidationChecks;
  deflatedSharpe: number;        // Sharpe after PBO/overfitting adjustment
  pboScore: number;              // Probability of Backtest Overfitting, 0–1 (lower = better)

  // Lifecycle
  lifecycleState: LifecycleState;
  submittedDate: string;
  liveDate: string | null;
  retiredDate: string | null;

  // Curve segments
  equityCurve: EquityPoint[];    // full series
  isBars: number;
  oosBars: number;
}

// ── Helper: build strategy with auto-computed curve stats ────────────────────

function makeStrategy(
  partial: Omit<Strategy, "equityCurve" | "maxDrawdownPct" | "oosSharp" | "backtestSharpe"> & {
    seed: number;
    isBars: number;
    oosBars: number;
    targetAnnualReturn: number;
    targetAnnualVol: number;
    startYYYYMM?: string;
    backtestSharpe?: number;   // override if desired
  }
): Strategy {
  const curve = generateEquityCurve(
    partial.seed,
    partial.isBars,
    partial.oosBars,
    partial.targetAnnualReturn,
    partial.targetAnnualVol,
    partial.startYYYYMM ?? "2022-07"
  );

  const isCurve  = curve.filter((p) => p.inSample);
  const oosCurve = curve.filter((p) => !p.inSample);

  const oosSharp   = sharpeFromCurve(oosCurve);
  const isSharpe   = sharpeFromCurve(isCurve);
  const drawdown   = maxDrawdown(curve);

  return {
    ...partial,
    equityCurve: curve,
    maxDrawdownPct: drawdown,
    oosSharp,
    backtestSharpe: partial.backtestSharpe ?? Math.round((isSharpe + 0.5 + Math.random() * 0.4) * 100) / 100,
  };
}

// ── 20 Strategies ─────────────────────────────────────────────────────────────

export const STRATEGIES: Strategy[] = [
  // ── Live strategies (high performers) ──────────────────────────────────────
  makeStrategy({
    id: "s01",
    name: "Nifty Vol Surface Arb",
    ownerId: "r01",
    assetClass: "Nifty F&O",
    description: "Exploits mispricings in the Nifty options implied-vol surface by trading calendar spreads and skew reversions. Delta-neutral throughout.",
    tags: ["options", "vol-arb", "delta-neutral", "calendar-spread"],
    capacityUSDM: 8.5,
    turnoverPerDay: 2.1,
    correlationToBook: 0.08,
    betaToNifty: 0.04,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "pass", capacityTest: "pass" },
    deflatedSharpe: 1.61,
    pboScore: 0.09,
    lifecycleState: "live",
    submittedDate: "2022-09-01",
    liveDate: "2023-03-15",
    retiredDate: null,
    annualReturnPct: 18.4,
    seed: 101, isBars: 30, oosBars: 15, targetAnnualReturn: 0.184, targetAnnualVol: 0.10,
    startYYYYMM: "2022-07",
  }),

  makeStrategy({
    id: "s02",
    name: "Cross-Sectional Momentum",
    ownerId: "r01",
    assetClass: "NSE Large Cap",
    description: "12-1 price momentum factor on Nifty 200. Long top quintile, short bottom quintile. Weekly rebalance, equal-weighted.",
    tags: ["momentum", "factor", "long-short", "equity"],
    capacityUSDM: 22.0,
    turnoverPerDay: 0.22,
    correlationToBook: 0.31,
    betaToNifty: 0.12,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "pass", capacityTest: "pass" },
    deflatedSharpe: 1.44,
    pboScore: 0.12,
    lifecycleState: "live",
    submittedDate: "2022-10-14",
    liveDate: "2023-05-01",
    retiredDate: null,
    annualReturnPct: 15.8,
    seed: 202, isBars: 32, oosBars: 13, targetAnnualReturn: 0.158, targetAnnualVol: 0.09,
    startYYYYMM: "2022-07",
  }),

  makeStrategy({
    id: "s03",
    name: "BankNifty Overnight Carry",
    ownerId: "r01",
    assetClass: "Bank Nifty F&O",
    description: "Captures the systematic overnight carry in Bank Nifty futures by exploiting the persistent open-auction premium vs. prior close.",
    tags: ["carry", "overnight", "futures", "bank-nifty"],
    capacityUSDM: 5.2,
    turnoverPerDay: 1.0,
    correlationToBook: 0.14,
    betaToNifty: 0.21,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "warn", capacityTest: "pass" },
    deflatedSharpe: 1.18,
    pboScore: 0.18,
    lifecycleState: "live",
    submittedDate: "2023-01-20",
    liveDate: "2023-09-10",
    retiredDate: null,
    annualReturnPct: 13.2,
    seed: 303, isBars: 24, oosBars: 9, targetAnnualReturn: 0.132, targetAnnualVol: 0.08,
    startYYYYMM: "2023-01",
  }),

  makeStrategy({
    id: "s04",
    name: "Options Flow Imbalance",
    ownerId: "r02",
    assetClass: "NSE Large Cap",
    description: "Predicts next-day equity direction using net delta demand imbalance from options market. Long/short NSE 100 single stocks.",
    tags: ["options-flow", "microstructure", "signal", "equity"],
    capacityUSDM: 12.0,
    turnoverPerDay: 0.48,
    correlationToBook: 0.22,
    betaToNifty: 0.18,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "pass", capacityTest: "pass" },
    deflatedSharpe: 1.52,
    pboScore: 0.11,
    lifecycleState: "live",
    submittedDate: "2022-12-05",
    liveDate: "2023-06-20",
    retiredDate: null,
    annualReturnPct: 16.9,
    seed: 404, isBars: 28, oosBars: 14, targetAnnualReturn: 0.169, targetAnnualVol: 0.10,
    startYYYYMM: "2022-10",
  }),

  makeStrategy({
    id: "s05",
    name: "Microstructure Alpha v2",
    ownerId: "r02",
    assetClass: "NSE Mid Cap",
    description: "High-frequency order-book imbalance signal on NSE mid-cap names. 15-min holding periods, fully intraday.",
    tags: ["microstructure", "order-book", "intraday", "mid-cap"],
    capacityUSDM: 3.8,
    turnoverPerDay: 4.2,
    correlationToBook: 0.05,
    betaToNifty: -0.03,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "pass", capacityTest: "warn" },
    deflatedSharpe: 1.38,
    pboScore: 0.14,
    lifecycleState: "live",
    submittedDate: "2023-03-11",
    liveDate: "2023-10-01",
    retiredDate: null,
    annualReturnPct: 14.5,
    seed: 505, isBars: 22, oosBars: 10, targetAnnualReturn: 0.145, targetAnnualVol: 0.09,
    startYYYYMM: "2023-03",
  }),

  makeStrategy({
    id: "s06",
    name: "Nifty Stat-Arb Basket",
    ownerId: "r03",
    assetClass: "NSE Large Cap",
    description: "Cointegrated pairs across BFSI and IT sectors. Uses Kalman filter for dynamic hedge ratios. Mean-reversion on 2-sigma z-score.",
    tags: ["stat-arb", "pairs", "cointegration", "BFSI", "IT"],
    capacityUSDM: 15.0,
    turnoverPerDay: 0.35,
    correlationToBook: -0.04,
    betaToNifty: 0.06,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "pass", capacityTest: "pass" },
    deflatedSharpe: 1.29,
    pboScore: 0.16,
    lifecycleState: "live",
    submittedDate: "2023-02-08",
    liveDate: "2023-11-01",
    retiredDate: null,
    annualReturnPct: 12.7,
    seed: 606, isBars: 26, oosBars: 8, targetAnnualReturn: 0.127, targetAnnualVol: 0.08,
    startYYYYMM: "2023-02",
  }),

  makeStrategy({
    id: "s07",
    name: "BankNifty Delta Carry",
    ownerId: "r04",
    assetClass: "Bank Nifty F&O",
    description: "Systematic theta harvesting on Bank Nifty weekly strangles, with dynamic delta-hedging triggered by 0.3-delta breach.",
    tags: ["theta", "carry", "strangle", "bank-nifty", "weekly"],
    capacityUSDM: 6.5,
    turnoverPerDay: 1.8,
    correlationToBook: 0.10,
    betaToNifty: 0.07,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "warn", capacityTest: "pass" },
    deflatedSharpe: 1.15,
    pboScore: 0.21,
    lifecycleState: "live",
    submittedDate: "2023-04-17",
    liveDate: "2023-12-01",
    retiredDate: null,
    annualReturnPct: 12.1,
    seed: 707, isBars: 20, oosBars: 7, targetAnnualReturn: 0.121, targetAnnualVol: 0.08,
    startYYYYMM: "2023-04",
  }),

  makeStrategy({
    id: "s08",
    name: "Quality-Momentum Composite",
    ownerId: "r05",
    assetClass: "NSE Mid Cap",
    description: "Multi-factor long-only on Nifty Midcap 150. Composite score: 40% quality (ROE, ROCE), 40% momentum (6-1), 20% low-vol.",
    tags: ["multi-factor", "quality", "momentum", "mid-cap", "long-only"],
    capacityUSDM: 18.0,
    turnoverPerDay: 0.08,
    correlationToBook: 0.44,
    betaToNifty: 0.68,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "pass", capacityTest: "pass" },
    deflatedSharpe: 1.10,
    pboScore: 0.19,
    lifecycleState: "live",
    submittedDate: "2023-05-22",
    liveDate: "2024-01-15",
    retiredDate: null,
    annualReturnPct: 11.8,
    seed: 808, isBars: 18, oosBars: 6, targetAnnualReturn: 0.118, targetAnnualVol: 0.10,
    startYYYYMM: "2023-05",
  }),

  makeStrategy({
    id: "s09",
    name: "FII Flow Contrarian",
    ownerId: "r06",
    assetClass: "NSE Large Cap",
    description: "L/S equity strategy that fades extreme FII selling episodes in Nifty 50 constituents. Holds 5–8 days. Sector-neutral.",
    tags: ["contrarian", "FII-flow", "mean-reversion", "large-cap"],
    capacityUSDM: 10.0,
    turnoverPerDay: 0.20,
    correlationToBook: 0.17,
    betaToNifty: 0.09,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "pass", capacityTest: "pass" },
    deflatedSharpe: 1.07,
    pboScore: 0.22,
    lifecycleState: "live",
    submittedDate: "2023-06-30",
    liveDate: "2024-02-01",
    retiredDate: null,
    annualReturnPct: 11.2,
    seed: 909, isBars: 18, oosBars: 5, targetAnnualReturn: 0.112, targetAnnualVol: 0.09,
    startYYYYMM: "2023-06",
  }),

  // ── Paper / Forward-test ────────────────────────────────────────────────────
  makeStrategy({
    id: "s10",
    name: "News Sentiment L/S",
    ownerId: "r07",
    assetClass: "NSE Large Cap",
    description: "NLP-derived sentiment scores from BSE filings and news. Daily rebalance, long positive-sentiment surprises, short negative.",
    tags: ["NLP", "sentiment", "news", "long-short"],
    capacityUSDM: 9.0,
    turnoverPerDay: 0.30,
    correlationToBook: 0.20,
    betaToNifty: 0.14,
    checks: { overfitting: "warn", dataLeakage: "pass", walkForward: "warn", capacityTest: "pass" },
    deflatedSharpe: 0.94,
    pboScore: 0.27,
    lifecycleState: "paper",
    submittedDate: "2023-10-05",
    liveDate: null,
    retiredDate: null,
    annualReturnPct: 9.8,
    seed: 1010, isBars: 24, oosBars: 4, targetAnnualReturn: 0.098, targetAnnualVol: 0.10,
    startYYYYMM: "2023-07",
  }),

  makeStrategy({
    id: "s11",
    name: "Overnight Gap Reversion",
    ownerId: "r08",
    assetClass: "NSE Large Cap",
    description: "Fades overnight price gaps exceeding 1.5% in Nifty 200 stocks. Enters at open, closes 90 minutes into the session.",
    tags: ["mean-reversion", "overnight-gap", "intraday", "open-auction"],
    capacityUSDM: 4.5,
    turnoverPerDay: 1.0,
    correlationToBook: -0.08,
    betaToNifty: -0.05,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "warn", capacityTest: "pass" },
    deflatedSharpe: 0.88,
    pboScore: 0.30,
    lifecycleState: "paper",
    submittedDate: "2023-12-01",
    liveDate: null,
    retiredDate: null,
    annualReturnPct: 9.1,
    seed: 1111, isBars: 20, oosBars: 4, targetAnnualReturn: 0.091, targetAnnualVol: 0.09,
    startYYYYMM: "2023-09",
  }),

  makeStrategy({
    id: "s12",
    name: "Cash-Futures Roll Carry",
    ownerId: "r09",
    assetClass: "Nifty F&O",
    description: "Captures the basis between Nifty cash and near-month futures. Holds the long cash / short futures position until 5 days before expiry.",
    tags: ["cash-futures", "carry", "basis", "arbitrage"],
    capacityUSDM: 30.0,
    turnoverPerDay: 0.05,
    correlationToBook: 0.02,
    betaToNifty: -0.01,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "warn", capacityTest: "pass" },
    deflatedSharpe: 0.82,
    pboScore: 0.33,
    lifecycleState: "paper",
    submittedDate: "2024-01-20",
    liveDate: null,
    retiredDate: null,
    annualReturnPct: 8.4,
    seed: 1212, isBars: 18, oosBars: 3, targetAnnualReturn: 0.084, targetAnnualVol: 0.07,
    startYYYYMM: "2023-10",
  }),

  // ── Decaying ────────────────────────────────────────────────────────────────
  makeStrategy({
    id: "s13",
    name: "Nifty Roll-Down Carry v1",
    ownerId: "r04",
    assetClass: "Nifty F&O",
    description: "Original version of the roll-down carry trade. Capacity constraints are being hit; live Sharpe has degraded over the past two quarters.",
    tags: ["carry", "futures", "roll", "decaying"],
    capacityUSDM: 4.0,
    turnoverPerDay: 0.9,
    correlationToBook: 0.12,
    betaToNifty: 0.08,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "fail", capacityTest: "warn" },
    deflatedSharpe: 0.71,
    pboScore: 0.38,
    lifecycleState: "decaying",
    submittedDate: "2022-08-10",
    liveDate: "2023-02-01",
    retiredDate: null,
    annualReturnPct: 6.2,
    seed: 1313, isBars: 30, oosBars: 12, targetAnnualReturn: 0.062, targetAnnualVol: 0.12,
    startYYYYMM: "2022-07",
  }),

  makeStrategy({
    id: "s14",
    name: "Sector Rotation — Macro",
    ownerId: "r06",
    assetClass: "Multi-Asset",
    description: "Trades sector ETF pairs (IT vs. BFSI, Pharma vs. Auto) driven by macro regime signals. Performance has lagged since RBI policy shift.",
    tags: ["sector-rotation", "macro", "ETF", "long-short"],
    capacityUSDM: 14.0,
    turnoverPerDay: 0.12,
    correlationToBook: 0.35,
    betaToNifty: 0.28,
    checks: { overfitting: "warn", dataLeakage: "pass", walkForward: "fail", capacityTest: "pass" },
    deflatedSharpe: 0.63,
    pboScore: 0.41,
    lifecycleState: "decaying",
    submittedDate: "2022-11-20",
    liveDate: "2023-06-01",
    retiredDate: null,
    annualReturnPct: 5.4,
    seed: 1414, isBars: 28, oosBars: 12, targetAnnualReturn: 0.054, targetAnnualVol: 0.13,
    startYYYYMM: "2022-07",
  }),

  // ── Incubation ──────────────────────────────────────────────────────────────
  makeStrategy({
    id: "s15",
    name: "Implied-Realised Vol Spread",
    ownerId: "r10",
    assetClass: "Nifty F&O",
    description: "Vega-neutral strategy that buys realised vol when IV-RV spread exceeds 2 standard deviations. Still in IS development.",
    tags: ["vol-spread", "vega-neutral", "options", "incubation"],
    capacityUSDM: 5.0,
    turnoverPerDay: 0.60,
    correlationToBook: 0.03,
    betaToNifty: 0.02,
    checks: { overfitting: "warn", dataLeakage: "pass", walkForward: "warn", capacityTest: "pass" },
    deflatedSharpe: 0.78,
    pboScore: 0.35,
    lifecycleState: "incubation",
    submittedDate: "2024-03-01",
    liveDate: null,
    retiredDate: null,
    annualReturnPct: 8.0,
    seed: 1515, isBars: 15, oosBars: 0, targetAnnualReturn: 0.08, targetAnnualVol: 0.09,
    startYYYYMM: "2023-10",
  }),

  makeStrategy({
    id: "s16",
    name: "PCR Directional Signal",
    ownerId: "r11",
    assetClass: "Bank Nifty F&O",
    description: "Trades Bank Nifty futures directionally based on extreme put-call ratio readings. 2-day mean-reversion framework.",
    tags: ["PCR", "options-flow", "futures", "mean-reversion"],
    capacityUSDM: 3.0,
    turnoverPerDay: 0.50,
    correlationToBook: 0.16,
    betaToNifty: 0.22,
    checks: { overfitting: "warn", dataLeakage: "warn", walkForward: "warn", capacityTest: "pass" },
    deflatedSharpe: 0.65,
    pboScore: 0.44,
    lifecycleState: "incubation",
    submittedDate: "2024-04-28",
    liveDate: null,
    retiredDate: null,
    annualReturnPct: 7.1,
    seed: 1616, isBars: 12, oosBars: 0, targetAnnualReturn: 0.071, targetAnnualVol: 0.11,
    startYYYYMM: "2024-01",
  }),

  makeStrategy({
    id: "s17",
    name: "ESG Quality Tilt",
    ownerId: "r12",
    assetClass: "NSE Large Cap",
    description: "Long-only smart-beta. Overweights Nifty 200 stocks with high ESG scores and low realised vol. Monthly rebalance.",
    tags: ["ESG", "quality", "low-vol", "smart-beta", "long-only"],
    capacityUSDM: 40.0,
    turnoverPerDay: 0.04,
    correlationToBook: 0.62,
    betaToNifty: 0.82,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "warn", capacityTest: "pass" },
    deflatedSharpe: 0.60,
    pboScore: 0.39,
    lifecycleState: "incubation",
    submittedDate: "2024-07-15",
    liveDate: null,
    retiredDate: null,
    annualReturnPct: 6.8,
    seed: 1717, isBars: 6, oosBars: 0, targetAnnualReturn: 0.068, targetAnnualVol: 0.12,
    startYYYYMM: "2024-07",
  }),

  // ── Retired ─────────────────────────────────────────────────────────────────
  makeStrategy({
    id: "s18",
    name: "Nifty 50 Short Vol v1",
    ownerId: "r01",
    assetClass: "Nifty F&O",
    description: "Early short-vol strategy retired after August 2024 spike in India VIX caused peak drawdown to exceed fund risk limits.",
    tags: ["short-vol", "options", "retired"],
    capacityUSDM: 7.0,
    turnoverPerDay: 1.5,
    correlationToBook: 0.09,
    betaToNifty: 0.03,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "fail", capacityTest: "pass" },
    deflatedSharpe: 0.44,
    pboScore: 0.55,
    lifecycleState: "retired",
    submittedDate: "2022-04-01",
    liveDate: "2022-10-01",
    retiredDate: "2024-08-15",
    annualReturnPct: 4.2,
    seed: 1818, isBars: 18, oosBars: 18, targetAnnualReturn: 0.042, targetAnnualVol: 0.14,
    startYYYYMM: "2022-01",
  }),

  makeStrategy({
    id: "s19",
    name: "Small Cap Momentum v1",
    ownerId: "r03",
    assetClass: "NSE Small Cap",
    description: "Pure 6-1 price momentum on NSE Small Cap 250. Retired due to persistent illiquidity costs eroding returns post-2023.",
    tags: ["momentum", "small-cap", "retired"],
    capacityUSDM: 2.0,
    turnoverPerDay: 0.18,
    correlationToBook: 0.48,
    betaToNifty: 0.74,
    checks: { overfitting: "warn", dataLeakage: "pass", walkForward: "fail", capacityTest: "fail" },
    deflatedSharpe: 0.38,
    pboScore: 0.58,
    lifecycleState: "retired",
    submittedDate: "2022-06-15",
    liveDate: "2023-01-01",
    retiredDate: "2024-06-30",
    annualReturnPct: 3.8,
    seed: 1919, isBars: 18, oosBars: 16, targetAnnualReturn: 0.038, targetAnnualVol: 0.18,
    startYYYYMM: "2022-06",
  }),

  makeStrategy({
    id: "s20",
    name: "Macro FX Carry Overlay",
    ownerId: "r06",
    assetClass: "Multi-Asset",
    description: "USD/INR carry overlay on an equity book. Retired after SEBI tightened currency derivative position limits in Q1 2025.",
    tags: ["FX", "carry", "macro", "overlay", "retired"],
    capacityUSDM: 8.0,
    turnoverPerDay: 0.10,
    correlationToBook: 0.28,
    betaToNifty: 0.16,
    checks: { overfitting: "pass", dataLeakage: "pass", walkForward: "warn", capacityTest: "fail" },
    deflatedSharpe: 0.51,
    pboScore: 0.48,
    lifecycleState: "retired",
    submittedDate: "2022-12-10",
    liveDate: "2023-07-01",
    retiredDate: "2025-02-28",
    annualReturnPct: 5.1,
    seed: 2020, isBars: 24, oosBars: 14, targetAnnualReturn: 0.051, targetAnnualVol: 0.11,
    startYYYYMM: "2022-07",
  }),
];

/** Look up a single strategy by id */
export function getStrategy(id: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.id === id);
}

/** Get all strategies belonging to a researcher */
export function getStrategiesByOwner(ownerId: string): Strategy[] {
  return STRATEGIES.filter((s) => s.ownerId === ownerId);
}
