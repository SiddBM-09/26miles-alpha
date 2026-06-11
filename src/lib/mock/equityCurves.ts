/**
 * Deterministic pseudo-random equity curve generator.
 * Uses a seeded LCG so curves are stable across hot-reloads.
 */

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export interface EquityPoint {
  date: string;       // "YYYY-MM"
  value: number;      // normalised to 100 at inception
  inSample: boolean;
}

/**
 * Generate a realistic monthly equity curve.
 *
 * @param seed          Deterministic seed (use strategy index)
 * @param isBars        Number of in-sample months
 * @param oosBars       Number of out-of-sample months
 * @param annualReturn  Target annualised return (e.g. 0.18 = 18%)
 * @param annualVol     Target annualised volatility (e.g. 0.12 = 12%)
 * @param startYYYYMM   e.g. "2022-07" — first IS bar
 */
export function generateEquityCurve(
  seed: number,
  isBars: number,
  oosBars: number,
  annualReturn: number,
  annualVol: number,
  startYYYYMM = "2022-07"
): EquityPoint[] {
  const rand = lcg(seed);
  const monthlyMu  = annualReturn / 12;
  const monthlySig = annualVol / Math.sqrt(12);

  // Parse start date
  const [sy, sm] = startYYYYMM.split("-").map(Number);

  const total = isBars + oosBars;
  const points: EquityPoint[] = [];
  let value = 100;

  for (let i = 0; i < total; i++) {
    // Box-Muller for approximately normal returns
    const u1 = rand() || 1e-10;
    const u2 = rand();
    const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const ret = monthlyMu + monthlySig * z;
    value *= 1 + ret;

    // Advance month
    const totalMonths = sy * 12 + (sm - 1) + i;
    const yr  = Math.floor(totalMonths / 12);
    const mo  = (totalMonths % 12) + 1;
    const date = `${yr}-${String(mo).padStart(2, "0")}`;

    points.push({ date, value: Math.round(value * 100) / 100, inSample: i < isBars });
  }

  return points;
}

/** Compute max drawdown from an equity curve */
export function maxDrawdown(points: EquityPoint[]): number {
  let peak = -Infinity;
  let maxDD = 0;
  for (const p of points) {
    if (p.value > peak) peak = p.value;
    const dd = (p.value - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return Math.round(maxDD * 1000) / 10; // e.g. -7.3 (%)
}

/** Compute annualised Sharpe from monthly returns (rf = 6% annual for India) */
export function sharpeFromCurve(points: EquityPoint[]): number {
  if (points.length < 2) return 0;
  const returns: number[] = [];
  for (let i = 1; i < points.length; i++) {
    returns.push(points[i].value / points[i - 1].value - 1);
  }
  const rf = 0.06 / 12;
  const excessReturns = returns.map((r) => r - rf);
  const mean = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
  const variance =
    excessReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / excessReturns.length;
  return Math.round((mean / Math.sqrt(variance)) * Math.sqrt(12) * 100) / 100;
}
