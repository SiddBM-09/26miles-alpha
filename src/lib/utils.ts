import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as a signed percentage string, e.g. +12.3% */
export function fmtPct(n: number, decimals = 1): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(decimals)}%`;
}

/** Format a number with fixed decimals, no sign */
export function fmtNum(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

/** Format a large dollar amount, e.g. $1.2M */
export function fmtDollars(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)    return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
