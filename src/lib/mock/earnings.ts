/**
 * Earnings records per researcher.
 * All figures in INR (₹). Retainer is monthly fixed payment.
 * Performance share is % of net P&L on allocated strategies.
 * HWM is the cumulative performance-fee high-water mark — a new performance
 * payout only triggers when the strategy NAV exceeds its prior HWM.
 */

export interface MonthlyPayout {
  month: string;          // "YYYY-MM"
  retainer: number;       // INR
  performanceFee: number; // INR (0 if below HWM)
  total: number;          // retainer + performanceFee
  note?: string;          // e.g. "Strategy s01 above HWM"
}

export interface EarningsRecord {
  researcherId: string;
  retainerMonthly: number;   // current fixed monthly retainer, INR
  performanceSharePct: number; // % of strategy net P&L due to researcher
  allocatedAUM_INR: number;   // current total capital allocated, INR
  hwmNAV: number;             // current high-water-mark NAV (normalised, starts 100)
  currentNAV: number;         // latest strategy composite NAV
  ytdEarnings: number;        // calendar-year-to-date total, INR
  allTimeEarnings: number;    // since joining, INR
  monthlyPayouts: MonthlyPayout[];  // last 12 months (most recent last)
}

// ── Helper: generate 12 months of payouts ──────────────────────────────────

function payouts(
  startMonth: string,   // "YYYY-MM" of first payout in window
  retainer: number,
  perfFees: number[]    // 12 performance-fee values
): MonthlyPayout[] {
  const [sy, sm] = startMonth.split("-").map(Number);
  return perfFees.map((perf, i) => {
    const totalMonths = sy * 12 + (sm - 1) + i;
    const yr = Math.floor(totalMonths / 12);
    const mo = (totalMonths % 12) + 1;
    const month = `${yr}-${String(mo).padStart(2, "0")}`;
    return {
      month,
      retainer,
      performanceFee: perf,
      total: retainer + perf,
    };
  });
}

export const EARNINGS: EarningsRecord[] = [
  // r01 — Arjun Krishnamurthy: 3 live strategies, Principal
  {
    researcherId: "r01",
    retainerMonthly: 80_000,
    performanceSharePct: 20,
    allocatedAUM_INR: 39_50_00_000,   // ₹39.5 Cr across 3 strategies
    hwmNAV: 143.8,
    currentNAV: 148.2,
    ytdEarnings: 9_42_000,
    allTimeEarnings: 54_80_000,
    monthlyPayouts: payouts("2025-06", 80_000, [
      1_24_000, 98_000, 1_42_000, 87_000, 1_31_000, 1_55_000,
      1_18_000, 1_62_000, 1_08_000, 1_47_000, 1_35_000, 1_52_000,
    ]),
  },

  // r02 — Priya Meenakshi: 2 live strategies, Senior
  {
    researcherId: "r02",
    retainerMonthly: 65_000,
    performanceSharePct: 18,
    allocatedAUM_INR: 26_50_00_000,   // ₹26.5 Cr
    hwmNAV: 138.4,
    currentNAV: 141.6,
    ytdEarnings: 7_21_000,
    allTimeEarnings: 38_60_000,
    monthlyPayouts: payouts("2025-06", 65_000, [
      98_000, 74_000, 1_12_000, 68_000, 1_04_000, 1_21_000,
      88_000, 1_15_000, 81_000, 1_09_000, 97_000, 1_18_000,
    ]),
  },

  // r03 — Rahul Sundaresan: 1 live strategy, Senior
  {
    researcherId: "r03",
    retainerMonthly: 55_000,
    performanceSharePct: 17,
    allocatedAUM_INR: 12_50_00_000,   // ₹12.5 Cr
    hwmNAV: 132.1,
    currentNAV: 134.8,
    ytdEarnings: 4_88_000,
    allTimeEarnings: 24_30_000,
    monthlyPayouts: payouts("2025-06", 55_000, [
      62_000, 48_000, 73_000, 0, 58_000, 81_000,
      52_000, 76_000, 44_000, 69_000, 60_000, 74_000,
    ]),
  },

  // r04 — Vikram Bhatia: 1 live, 1 decaying, Senior
  {
    researcherId: "r04",
    retainerMonthly: 50_000,
    performanceSharePct: 16,
    allocatedAUM_INR: 8_80_00_000,    // ₹8.8 Cr
    hwmNAV: 128.7,
    currentNAV: 127.4,
    ytdEarnings: 3_12_000,
    allTimeEarnings: 18_90_000,
    monthlyPayouts: payouts("2025-06", 50_000, [
      42_000, 0, 58_000, 0, 36_000, 64_000,
      0, 48_000, 0, 53_000, 41_000, 0,     // HWM breaches cause zero months
    ]),
  },

  // r05 — Deepa Nair: 1 live strategy, Associate
  {
    researcherId: "r05",
    retainerMonthly: 40_000,
    performanceSharePct: 15,
    allocatedAUM_INR: 9_00_00_000,    // ₹9 Cr
    hwmNAV: 125.3,
    currentNAV: 126.9,
    ytdEarnings: 2_48_000,
    allTimeEarnings: 11_40_000,
    monthlyPayouts: payouts("2025-06", 40_000, [
      28_000, 35_000, 0, 42_000, 31_000, 48_000,
      0, 38_000, 45_000, 0, 36_000, 52_000,
    ]),
  },

  // r06 — Saurabh Gupta: 1 live, 1 decaying, 1 retired, Associate
  {
    researcherId: "r06",
    retainerMonthly: 38_000,
    performanceSharePct: 15,
    allocatedAUM_INR: 6_20_00_000,    // ₹6.2 Cr (decaying reduces allocation)
    hwmNAV: 122.4,
    currentNAV: 121.1,
    ytdEarnings: 1_82_000,
    allTimeEarnings: 15_70_000,
    monthlyPayouts: payouts("2025-06", 38_000, [
      18_000, 0, 24_000, 0, 0, 31_000,
      0, 22_000, 0, 0, 28_000, 0,
    ]),
  },

  // r07 — Ananya Rao: paper only, Associate
  {
    researcherId: "r07",
    retainerMonthly: 28_000,
    performanceSharePct: 12,
    allocatedAUM_INR: 0,
    hwmNAV: 100.0,
    currentNAV: 100.0,
    ytdEarnings: 3_36_000,            // retainer only (12 × 28k)
    allTimeEarnings: 5_60_000,
    monthlyPayouts: payouts("2025-06", 28_000, [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  },

  // r08 — Karthik Iyer: paper only, Analyst
  {
    researcherId: "r08",
    retainerMonthly: 22_000,
    performanceSharePct: 10,
    allocatedAUM_INR: 0,
    hwmNAV: 100.0,
    currentNAV: 100.0,
    ytdEarnings: 1_98_000,
    allTimeEarnings: 3_08_000,
    monthlyPayouts: payouts("2025-06", 22_000, [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  },

  // r09 — Neha Kapoor: paper only, Analyst
  {
    researcherId: "r09",
    retainerMonthly: 20_000,
    performanceSharePct: 10,
    allocatedAUM_INR: 0,
    hwmNAV: 100.0,
    currentNAV: 100.0,
    ytdEarnings: 1_40_000,
    allTimeEarnings: 2_40_000,
    monthlyPayouts: payouts("2025-06", 20_000, [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  },

  // r10 — Rohan Malhotra: incubation, Analyst
  {
    researcherId: "r10",
    retainerMonthly: 18_000,
    performanceSharePct: 10,
    allocatedAUM_INR: 0,
    hwmNAV: 100.0,
    currentNAV: 100.0,
    ytdEarnings: 1_08_000,
    allTimeEarnings: 1_62_000,
    monthlyPayouts: payouts("2025-06", 18_000, [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  },

  // r11 — Suresh Pillai: incubation, Analyst
  {
    researcherId: "r11",
    retainerMonthly: 16_000,
    performanceSharePct: 10,
    allocatedAUM_INR: 0,
    hwmNAV: 100.0,
    currentNAV: 100.0,
    ytdEarnings: 96_000,
    allTimeEarnings: 1_28_000,
    monthlyPayouts: payouts("2025-06", 16_000, [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  },

  // r12 — Tanvi Sharma: incubation, Analyst
  {
    researcherId: "r12",
    retainerMonthly: 15_000,
    performanceSharePct: 10,
    allocatedAUM_INR: 0,
    hwmNAV: 100.0,
    currentNAV: 100.0,
    ytdEarnings: 60_000,
    allTimeEarnings: 60_000,
    monthlyPayouts: payouts("2025-06", 15_000, [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  },
];

export function getEarnings(researcherId: string): EarningsRecord | undefined {
  return EARNINGS.find((e) => e.researcherId === researcherId);
}
