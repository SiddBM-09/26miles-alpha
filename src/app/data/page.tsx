"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, FlaskConical, ArrowRight, CheckCircle2, Lock, ShieldCheck,
  X, ChevronRight, Database, Table2, Info,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { PageContainer } from "@/components/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { MetricLabel } from "@/components/ui/MetricLabel";
import { GLOSSARY } from "@/lib/glossary";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AccessTier  = "Free" | "Verified" | "Allocated";
type Frequency   = "Tick" | "Daily" | "Monthly" | "Quarterly" | "Event";
type DataAsset   = "Equities" | "Derivatives" | "Macro" | "Corporate Events";

interface ColDef { name: string; type: string; description: string; }

type ChartSpec =
  | { kind: "line";  data: { x: string; v: number }[];           yLabel: string; color: string }
  | { kind: "area";  data: { x: string; v: number }[];           yLabel: string; color: string }
  | { kind: "bar";   data: { x: string; v: number; v2?: number }[]; yLabel: string; color: string; color2?: string; negativeColor?: string };

interface Dataset {
  id: string;
  name: string;
  assetClass: DataAsset;
  frequency: Frequency;
  tier: AccessTier;
  coverage: string;
  description: string;
  pointInTime: boolean;
  survivorshipFree: boolean;
  lastUpdated: string;
  recordCount: string;
  symbolCount: string;
  historySpan: string;
  updateCadence: string;
  columns: ColDef[];
  previewHeaders: string[];
  previewRows: (string | number)[][];
  chart: ChartSpec;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock datasets
// ─────────────────────────────────────────────────────────────────────────────

const DATASETS: Dataset[] = [
  {
    id: "nse-ohlcv",
    name: "NSE Equities OHLCV",
    assetClass: "Equities",
    frequency: "Daily",
    tier: "Free",
    coverage: "2005–present",
    description: "End-of-day price and volume for all NSE-listed equities. Adjusted for splits and dividends. Delivered point-in-time — the universe reflects constituents as of each historical date, not today's list. Includes delisted and merged securities.",
    pointInTime: true,
    survivorshipFree: true,
    lastUpdated: "2026-06-11",
    recordCount: "124M+",
    symbolCount: "5,200+",
    historySpan: "21 years",
    updateCadence: "EOD / T+1",
    columns: [
      { name: "date",         type: "date",    description: "Trading date (YYYY-MM-DD)" },
      { name: "symbol",       type: "string",  description: "NSE ticker symbol" },
      { name: "open",         type: "float",   description: "Opening price (INR)" },
      { name: "high",         type: "float",   description: "Intraday high (INR)" },
      { name: "low",          type: "float",   description: "Intraday low (INR)" },
      { name: "close",        type: "float",   description: "Closing price (INR)" },
      { name: "adj_close",    type: "float",   description: "Dividend and split-adjusted close" },
      { name: "volume",       type: "integer", description: "Total shares traded" },
      { name: "split_factor", type: "float",   description: "Cumulative split adjustment factor" },
      { name: "div_adj",      type: "float",   description: "Cumulative dividend adjustment factor" },
    ],
    previewHeaders: ["Date", "Symbol", "Open", "High", "Low", "Close", "Volume"],
    previewRows: [
      ["2024-05-15", "RELIANCE",  2891.00, 2934.75, 2879.50, 2921.40, "4,821,300"],
      ["2024-05-15", "INFY",      1432.50, 1451.00, 1428.75, 1445.20, "3,204,100"],
      ["2024-05-15", "HDFCBANK",  1589.25, 1612.00, 1578.50, 1604.80, "5,941,200"],
      ["2024-05-15", "TCS",       3871.00, 3905.50, 3862.75, 3891.30, "1,028,400"],
      ["2024-05-15", "ICICIBANK",  1108.75, 1124.00, 1103.50, 1118.60, "6,312,800"],
      ["2024-05-14", "RELIANCE",  2865.00, 2898.25, 2854.00, 2888.75, "3,942,100"],
      ["2024-05-14", "INFY",      1418.00, 1438.50, 1411.25, 1430.80, "2,817,600"],
      ["2024-05-14", "HDFCBANK",  1572.50, 1596.75, 1567.00, 1588.40, "4,726,900"],
      ["2024-05-14", "TCS",       3845.75, 3879.00, 3838.50, 3868.20, "978,300"],
      ["2024-05-14", "ICICIBANK",  1092.00, 1112.50, 1087.25, 1106.90, "5,089,700"],
    ],
    chart: {
      kind: "line",
      yLabel: "Close (₹)",
      color: "#3b82f6",
      data: [
        { x: "Jan", v: 2614 }, { x: "Feb", v: 2748 }, { x: "Mar", v: 2832 },
        { x: "Apr", v: 2801 }, { x: "May", v: 2921 }, { x: "Jun", v: 2968 },
        { x: "Jul", v: 3012 }, { x: "Aug", v: 2887 }, { x: "Sep", v: 2943 },
        { x: "Oct", v: 2796 }, { x: "Nov", v: 2851 }, { x: "Dec", v: 2908 },
      ],
    },
  },
  {
    id: "fo-chain",
    name: "F&O Chain",
    assetClass: "Derivatives",
    frequency: "Daily",
    tier: "Verified",
    coverage: "2010–present",
    description: "Full option and futures chain for NIFTY, BANKNIFTY, and all F&O-eligible stocks. Includes open interest, volume, implied volatility, and Greeks (Delta, Gamma, Theta, Vega) computed at EOD settlement. Expiry-level granularity across all active contracts.",
    pointInTime: true,
    survivorshipFree: false,
    lastUpdated: "2026-06-11",
    recordCount: "496M+",
    symbolCount: "190 underlyings",
    historySpan: "16 years",
    updateCadence: "EOD / T+1",
    columns: [
      { name: "date",        type: "date",    description: "Trading date" },
      { name: "symbol",      type: "string",  description: "Underlying NSE symbol" },
      { name: "expiry",      type: "date",    description: "Contract expiry date" },
      { name: "strike",      type: "float",   description: "Option strike price (INR)" },
      { name: "option_type", type: "string",  description: "CE (call) or PE (put)" },
      { name: "oi",          type: "integer", description: "Open interest (contracts)" },
      { name: "delta_oi",    type: "integer", description: "Change in OI from prior day" },
      { name: "iv",          type: "float",   description: "Implied volatility (annualised %)" },
      { name: "close",       type: "float",   description: "Settlement price (INR)" },
      { name: "delta",       type: "float",   description: "Option delta" },
      { name: "gamma",       type: "float",   description: "Option gamma" },
    ],
    previewHeaders: ["Date", "Symbol", "Expiry", "Strike", "Type", "OI", "Δ OI", "IV %", "Close"],
    previewRows: [
      ["2024-05-15", "NIFTY", "2024-05-30", 22000, "CE", "1,248,300", "+84,200", 12.4, 438.75],
      ["2024-05-15", "NIFTY", "2024-05-30", 22000, "PE", "986,400",  "-31,600", 13.1, 312.50],
      ["2024-05-15", "NIFTY", "2024-05-30", 22200, "CE", "892,100",  "+54,800", 11.8, 298.25],
      ["2024-05-15", "NIFTY", "2024-05-30", 22200, "PE", "1,102,600", "-18,900", 14.2, 481.00],
      ["2024-05-15", "NIFTY", "2024-05-30", 21800, "CE", "1,421,700", "+112,300", 10.9, 624.50],
      ["2024-05-15", "NIFTY", "2024-05-30", 21800, "PE", "748,200",  "-42,100", 12.7, 178.25],
      ["2024-05-15", "BANKNIFTY", "2024-05-29", 48000, "CE", "524,100", "+28,600", 14.6, 512.75],
      ["2024-05-15", "BANKNIFTY", "2024-05-29", 48000, "PE", "612,800", "-19,200", 15.8, 634.00],
      ["2024-05-15", "RELIANCE", "2024-05-30", 2900, "CE", "286,400", "+18,400", 16.2, 82.50],
      ["2024-05-15", "RELIANCE", "2024-05-30", 2900, "PE", "341,200", "-12,800", 17.1, 61.25],
    ],
    chart: {
      kind: "bar",
      yLabel: "OI (000s)",
      color: "#3b82f6",
      data: [
        { x: "21600 CE", v: 182 }, { x: "21800 CE", v: 1422 }, { x: "22000 CE", v: 1248 },
        { x: "22200 CE", v: 892 }, { x: "22400 CE", v: 641 },  { x: "22600 CE", v: 318 },
      ],
    },
  },
  {
    id: "nse-fundamentals",
    name: "NSE Fundamentals",
    assetClass: "Equities",
    frequency: "Quarterly",
    tier: "Verified",
    coverage: "2000–present (restated-safe)",
    description: "Quarterly financial statements for NSE-listed companies: P&L, balance sheet, and cash flow. Figures are tagged with the original filing date — numbers are never retroactively restated. Point-in-time filing dates prevent future data from leaking into historical backtests.",
    pointInTime: true,
    survivorshipFree: true,
    lastUpdated: "2026-05-31",
    recordCount: "2.6M+",
    symbolCount: "4,800+",
    historySpan: "26 years",
    updateCadence: "T+5 (filing)",
    columns: [
      { name: "filing_date", type: "date",    description: "Date the report was filed (point-in-time key)" },
      { name: "period_end",  type: "date",    description: "Reporting period end date" },
      { name: "symbol",      type: "string",  description: "NSE ticker" },
      { name: "period_type", type: "string",  description: "Q1 / Q2 / Q3 / Annual" },
      { name: "revenue",     type: "float",   description: "Net revenue (₹ Cr)" },
      { name: "ebitda",      type: "float",   description: "EBITDA (₹ Cr)" },
      { name: "pat",         type: "float",   description: "Profit after tax (₹ Cr)" },
      { name: "eps",         type: "float",   description: "Basic EPS (₹)" },
      { name: "de_ratio",    type: "float",   description: "Debt-to-equity ratio" },
      { name: "pe_ratio",    type: "float",   description: "Trailing P/E at filing date" },
    ],
    previewHeaders: ["Filing Date", "Symbol", "Period", "Revenue (₹Cr)", "EBITDA", "PAT", "EPS", "P/E"],
    previewRows: [
      ["2024-04-12", "TCS",       "Q4 FY24", "62,613", "19,842", "12,434", 33.64, 28.4],
      ["2024-04-19", "INFY",      "Q4 FY24", "37,923", "10,218",  "7,969", 19.27, 24.1],
      ["2024-04-20", "HDFCBANK",  "Q4 FY24", "89,164", "N/A",    "16,511", 21.74, 19.8],
      ["2024-04-24", "RELIANCE",  "Q4 FY24","239,826", "48,318", "18,951", 28.12, 26.7],
      ["2024-04-25", "WIPRO",     "Q4 FY24", "22,208",  "5,624",  "3,188", 6.10,  21.3],
      ["2024-01-10", "TCS",       "Q3 FY24", "60,583", "19,312", "11,947", 32.31, 29.1],
      ["2024-01-17", "INFY",      "Q3 FY24", "37,923",  "9,806",  "7,671", 18.54, 24.8],
      ["2024-01-16", "HDFCBANK",  "Q3 FY24", "81,742", "N/A",    "16,372", 21.54, 20.4],
      ["2024-01-18", "RELIANCE",  "Q3 FY24","236,147", "46,891", "17,265", 25.63, 27.2],
      ["2024-01-24", "WIPRO",     "Q3 FY24", "22,206",  "5,512",  "3,241",  6.20, 21.7],
    ],
    chart: {
      kind: "bar",
      yLabel: "PAT (₹ Cr)",
      color: "#10b981",
      data: [
        { x: "Q3'22", v: 9_926 }, { x: "Q4'22", v: 10_846 }, { x: "Q1'23", v: 11_074 },
        { x: "Q2'23", v: 11_342 }, { x: "Q3'23", v: 11_058 }, { x: "Q4'23", v: 11_392 },
        { x: "Q1'24", v: 11_738 }, { x: "Q2'24", v: 11_909 }, { x: "Q3'24", v: 11_947 },
        { x: "Q4'24", v: 12_434 },
      ],
    },
  },
  {
    id: "intraday-tick",
    name: "Intraday Tick — Large Cap",
    assetClass: "Equities",
    frequency: "Tick",
    tier: "Allocated",
    coverage: "2018–present",
    description: "Millisecond-resolution trade and quote (TAQ) data for the NSE Large Cap 100 universe. Includes bid/ask spread, trade size, and venue code. Partitioned by date and symbol for efficient sandbox access. Requires Allocated tier — strategy must be actively deployed by 26 Miles.",
    pointInTime: true,
    survivorshipFree: false,
    lastUpdated: "2026-06-11",
    recordCount: "82B+ ticks",
    symbolCount: "100 (Large Cap)",
    historySpan: "8 years",
    updateCadence: "Real-time T+0",
    columns: [
      { name: "timestamp",  type: "datetime", description: "UTC timestamp to millisecond precision" },
      { name: "symbol",     type: "string",   description: "NSE ticker" },
      { name: "price",      type: "float",    description: "Last traded price (INR)" },
      { name: "quantity",   type: "integer",  description: "Shares in this trade" },
      { name: "bid_price",  type: "float",    description: "Best bid at time of trade" },
      { name: "ask_price",  type: "float",    description: "Best ask at time of trade" },
      { name: "bid_size",   type: "integer",  description: "Shares available at best bid" },
      { name: "ask_size",   type: "integer",  description: "Shares available at best ask" },
      { name: "trade_type", type: "string",   description: "BUY / SELL / UNKNOWN as seen by exchange" },
    ],
    previewHeaders: ["Timestamp (IST)", "Symbol", "Price", "Qty", "Bid", "Ask", "Trade"],
    previewRows: [
      ["09:15:00.241", "HDFCBANK", 1604.80, 200, 1604.75, 1604.85, "BUY"],
      ["09:15:00.387", "HDFCBANK", 1604.75,  50, 1604.70, 1604.80, "SELL"],
      ["09:15:00.512", "HDFCBANK", 1604.90, 500, 1604.85, 1604.95, "BUY"],
      ["09:15:00.719", "HDFCBANK", 1605.00, 100, 1604.95, 1605.05, "BUY"],
      ["09:15:01.032", "HDFCBANK", 1604.95, 250, 1604.90, 1605.00, "SELL"],
      ["09:15:01.248", "HDFCBANK", 1605.10, 800, 1605.05, 1605.15, "BUY"],
      ["09:15:01.491", "HDFCBANK", 1605.05, 150, 1605.00, 1605.10, "SELL"],
      ["09:15:01.703", "HDFCBANK", 1605.20, 400, 1605.15, 1605.25, "BUY"],
      ["09:15:02.018", "HDFCBANK", 1605.15, 300, 1605.10, 1605.20, "SELL"],
      ["09:15:02.341", "HDFCBANK", 1605.25, 600, 1605.20, 1605.30, "BUY"],
    ],
    chart: {
      kind: "area",
      yLabel: "Price (₹)",
      color: "#3b82f6",
      data: [
        { x: "09:15", v: 1604.80 }, { x: "09:30", v: 1607.20 }, { x: "09:45", v: 1611.40 },
        { x: "10:00", v: 1608.90 }, { x: "10:15", v: 1613.50 }, { x: "10:30", v: 1610.20 },
        { x: "10:45", v: 1606.80 }, { x: "11:00", v: 1609.40 }, { x: "11:15", v: 1614.10 },
        { x: "11:30", v: 1612.60 }, { x: "12:00", v: 1608.30 }, { x: "12:30", v: 1611.90 },
        { x: "13:00", v: 1615.40 }, { x: "13:30", v: 1617.80 }, { x: "14:00", v: 1614.20 },
        { x: "14:30", v: 1619.50 }, { x: "15:00", v: 1616.80 }, { x: "15:30", v: 1618.40 },
      ],
    },
  },
  {
    id: "index-constituents",
    name: "Index Constituents & Weights",
    assetClass: "Equities",
    frequency: "Daily",
    tier: "Free",
    coverage: "2000–present",
    description: "Daily snapshot of constituent lists and free-float weights for NIFTY 50, NIFTY 500, sector indices, and the full NSE universe. Survivorship-free — includes securities removed from indices or delisted. Critical for avoiding look-ahead bias in factor research.",
    pointInTime: true,
    survivorshipFree: true,
    lastUpdated: "2026-06-11",
    recordCount: "2.1M+",
    symbolCount: "28 NSE indices",
    historySpan: "26 years",
    updateCadence: "EOD / rebalance",
    columns: [
      { name: "date",         type: "date",    description: "Snapshot date" },
      { name: "index_name",   type: "string",  description: "Index identifier (e.g. NIFTY50)" },
      { name: "symbol",       type: "string",  description: "Constituent NSE ticker" },
      { name: "weight",       type: "float",   description: "Free-float adjusted weight (%)" },
      { name: "market_cap",   type: "float",   description: "Free-float market cap (₹ Cr)" },
      { name: "sector",       type: "string",  description: "GICS-mapped sector" },
      { name: "added_date",   type: "date",    description: "Date added to index (null if founding)" },
      { name: "removed_date", type: "date",    description: "Date removed; null if still constituent" },
    ],
    previewHeaders: ["Date", "Index", "Symbol", "Weight %", "Mkt Cap (₹Cr)", "Sector"],
    previewRows: [
      ["2024-05-15", "NIFTY50", "RELIANCE",  9.82, "19,84,210", "Energy"],
      ["2024-05-15", "NIFTY50", "HDFCBANK",  8.91, "12,04,830", "Financials"],
      ["2024-05-15", "NIFTY50", "ICICIBANK", 7.14,  "7,89,640", "Financials"],
      ["2024-05-15", "NIFTY50", "INFY",      5.83,  "6,01,280", "IT"],
      ["2024-05-15", "NIFTY50", "TCS",       5.24,  "5,62,490", "IT"],
      ["2024-05-15", "NIFTY50", "LT",        4.37,  "3,98,740", "Industrials"],
      ["2024-05-15", "NIFTY50", "HINDUNILVR",3.81,  "3,62,110", "Consumer Staples"],
      ["2024-05-15", "NIFTY50", "BAJFINANCE", 3.42, "3,18,920", "Financials"],
      ["2024-05-15", "NIFTY50", "AXISBANK",  2.94,  "2,74,380", "Financials"],
      ["2024-05-15", "NIFTY50", "MARUTI",    2.61,  "2,48,910", "Consumer Discret."],
    ],
    chart: {
      kind: "line",
      yLabel: "Weight %",
      color: "#f59e0b",
      data: [
        { x: "Jan'23", v: 9.12 }, { x: "Apr'23", v: 9.34 }, { x: "Jul'23", v: 9.48 },
        { x: "Oct'23", v: 9.67 }, { x: "Jan'24", v: 9.71 }, { x: "Apr'24", v: 9.82 },
      ],
    },
  },
  {
    id: "corporate-actions",
    name: "Corporate Actions & Dividends",
    assetClass: "Corporate Events",
    frequency: "Event",
    tier: "Free",
    coverage: "1995–present",
    description: "Comprehensive corporate action events: dividends, splits, bonuses, rights issues, mergers, and demergers. Every event is tagged with ex-date, record date, and payment date to enable accurate return adjustment. Covers all securities ever listed on NSE/BSE.",
    pointInTime: true,
    survivorshipFree: true,
    lastUpdated: "2026-06-10",
    recordCount: "195K+ events",
    symbolCount: "7,200+",
    historySpan: "31 years",
    updateCadence: "T+1 (event)",
    columns: [
      { name: "ex_date",      type: "date",   description: "Ex-dividend / ex-date" },
      { name: "symbol",       type: "string", description: "NSE ticker" },
      { name: "action_type",  type: "string", description: "DIVIDEND / SPLIT / BONUS / RIGHTS / MERGER" },
      { name: "amount",       type: "float",  description: "Dividend per share (INR); null for non-cash events" },
      { name: "split_ratio",  type: "string", description: "e.g. 1:5 for a 1→5 split; null if not a split" },
      { name: "record_date",  type: "date",   description: "Date for record of entitlement" },
      { name: "payment_date", type: "date",   description: "Actual payment / credit date" },
    ],
    previewHeaders: ["Ex-Date", "Symbol", "Action", "Amount (₹)", "Split Ratio", "Pay Date"],
    previewRows: [
      ["2024-05-10", "RELIANCE",   "DIVIDEND", 10.00, "—",   "2024-05-31"],
      ["2024-04-25", "TCS",        "DIVIDEND", 28.00, "—",   "2024-05-15"],
      ["2024-04-19", "INFY",       "DIVIDEND", 21.00, "—",   "2024-05-06"],
      ["2024-03-21", "HDFCBANK",   "DIVIDEND",  2.00, "—",   "2024-04-09"],
      ["2024-02-14", "WIPRO",      "DIVIDEND",  1.00, "—",   "2024-03-01"],
      ["2023-10-11", "BAJFINANCE", "BONUS",      "—", "1:1", "—"],
      ["2023-09-04", "POLYCAB",    "SPLIT",      "—", "1:5", "—"],
      ["2023-08-17", "ASTRAL",     "SPLIT",      "—", "1:2", "—"],
      ["2023-06-09", "HAVELLS",    "DIVIDEND",  6.00, "—",   "2023-06-30"],
      ["2023-05-19", "TITAN",      "DIVIDEND", 10.00, "—",   "2023-06-07"],
    ],
    chart: {
      kind: "bar",
      yLabel: "Div / share (₹)",
      color: "#10b981",
      data: [
        { x: "FY19", v: 6 }, { x: "FY20", v: 6 }, { x: "FY21", v: 0 },
        { x: "FY22", v: 7 }, { x: "FY23", v: 8 }, { x: "FY24", v: 10 },
      ],
    },
  },
  {
    id: "fii-dii-flows",
    name: "FII / DII Flows",
    assetClass: "Equities",
    frequency: "Daily",
    tier: "Verified",
    coverage: "2008–present",
    description: "Daily net buy/sell activity for Foreign Institutional Investors (FII) and Domestic Institutional Investors (DII) in Indian equity and debt markets. Sourced from SEBI and NSDL disclosures. Broken out by market segment (cash, futures, options). Useful for sentiment and positioning overlays.",
    pointInTime: true,
    survivorshipFree: false,
    lastUpdated: "2026-06-11",
    recordCount: "12K+ days",
    symbolCount: "Market-level",
    historySpan: "18 years",
    updateCadence: "EOD / T+1",
    columns: [
      { name: "date",           type: "date",   description: "Trading date" },
      { name: "category",       type: "string", description: "FII or DII" },
      { name: "segment",        type: "string", description: "CASH / FUTURES / OPTIONS / DEBT" },
      { name: "gross_buy",      type: "float",  description: "Gross purchases (₹ Cr)" },
      { name: "gross_sell",     type: "float",  description: "Gross sales (₹ Cr)" },
      { name: "net_flow",       type: "float",  description: "Net (gross_buy − gross_sell), positive = net buyer" },
    ],
    previewHeaders: ["Date", "Category", "Segment", "Gross Buy (₹Cr)", "Gross Sell (₹Cr)", "Net (₹Cr)"],
    previewRows: [
      ["2024-05-15", "FII", "CASH",    "8,412",  "6,284", "+2,128"],
      ["2024-05-15", "DII", "CASH",    "5,918",  "6,843",   "−925"],
      ["2024-05-15", "FII", "FUTURES", "14,210", "13,840",  "+370"],
      ["2024-05-15", "FII", "OPTIONS", "38,421", "37,894",  "+527"],
      ["2024-05-14", "FII", "CASH",    "7,284",  "8,912", "−1,628"],
      ["2024-05-14", "DII", "CASH",    "7,218",  "5,914", "+1,304"],
      ["2024-05-13", "FII", "CASH",    "9,842",  "8,124", "+1,718"],
      ["2024-05-13", "DII", "CASH",    "5,412",  "7,284", "−1,872"],
      ["2024-05-10", "FII", "CASH",    "6,124",  "9,841", "−3,717"],
      ["2024-05-10", "DII", "CASH",    "9,284",  "6,118", "+3,166"],
    ],
    chart: {
      kind: "bar",
      yLabel: "Net flow (₹ Cr)",
      color: "#10b981",
      negativeColor: "#ef4444",
      data: [
        { x: "Jan", v: 4_214 }, { x: "Feb", v: -2_841 }, { x: "Mar", v: 1_928 },
        { x: "Apr", v: -4_102 }, { x: "May", v: 3_618 }, { x: "Jun", v: 2_241 },
        { x: "Jul", v: 6_184 }, { x: "Aug", v: -1_428 }, { x: "Sep", v: 3_912 },
        { x: "Oct", v: -8_421 }, { x: "Nov", v: 2_814 }, { x: "Dec", v: 4_128 },
      ],
    },
  },
  {
    id: "macro-indicators",
    name: "Sectoral & Macro Indicators",
    assetClass: "Macro",
    frequency: "Monthly",
    tier: "Free",
    coverage: "1991–present",
    description: "Monthly macro and sectoral indicators for India: CPI, WPI, IIP, PMI (Manufacturing & Services), RBI repo rate, forex reserves, bank credit growth, and 12 sectoral indices. Sourced from RBI, MOSPI, and Markit. Tagged with actual release dates for point-in-time use.",
    pointInTime: true,
    survivorshipFree: false,
    lastUpdated: "2026-06-05",
    recordCount: "58K+ data points",
    symbolCount: "42 indicators",
    historySpan: "35 years",
    updateCadence: "Monthly release",
    columns: [
      { name: "release_date", type: "date",    description: "Actual publication date (point-in-time key)" },
      { name: "reference_date", type: "date",  description: "Period the data describes" },
      { name: "indicator",    type: "string",  description: "Indicator name (e.g. CPI_HEADLINE)" },
      { name: "value",        type: "float",   description: "Reported value" },
      { name: "prior_value",  type: "float",   description: "Previously reported value (as of release date)" },
      { name: "estimate",     type: "float",   description: "Consensus estimate at time of release; null if unavailable" },
      { name: "unit",         type: "string",  description: "Unit of measure (%, ₹ Cr, index points, etc.)" },
      { name: "source",       type: "string",  description: "Data source (RBI, MOSPI, Markit, etc.)" },
    ],
    previewHeaders: ["Release Date", "Indicator", "Value", "Prior", "Estimate", "Unit"],
    previewRows: [
      ["2024-05-13", "CPI_HEADLINE",    4.83, 4.85, 4.80, "%"],
      ["2024-05-13", "CPI_CORE",        3.24, 3.31, 3.30, "%"],
      ["2024-05-10", "REPO_RATE",       6.50, 6.50, 6.50, "%"],
      ["2024-05-31", "IIP_YOY",         5.00, 5.45, 4.80, "%"],
      ["2024-05-02", "PMI_MANUFACTURING",58.8, 59.1, 58.5, "Index"],
      ["2024-05-03", "PMI_SERVICES",    60.2, 61.2, 60.0, "Index"],
      ["2024-05-10", "FOREX_RESERVES", 641.6, 637.9, "N/A", "USD Bn"],
      ["2024-04-30", "BANK_CREDIT_YOY", 19.6, 20.2, 19.8, "%"],
      ["2024-04-30", "WPI_HEADLINE",    0.53, 0.20, 0.50, "%"],
      ["2024-05-31", "FISCAL_DEFICIT",  5.63, 5.90, 5.70, "% of GDP"],
    ],
    chart: {
      kind: "line",
      yLabel: "% / Rate",
      color: "#f59e0b",
      data: [
        { x: "Jun'23", v: 4.81 }, { x: "Jul'23", v: 7.44 }, { x: "Aug'23", v: 6.83 },
        { x: "Sep'23", v: 5.02 }, { x: "Oct'23", v: 4.87 }, { x: "Nov'23", v: 5.55 },
        { x: "Dec'23", v: 5.69 }, { x: "Jan'24", v: 5.10 }, { x: "Feb'24", v: 5.09 },
        { x: "Mar'24", v: 4.85 }, { x: "Apr'24", v: 4.83 }, { x: "May'24", v: 4.75 },
      ],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

const TIER_META: Record<AccessTier, { label: string; icon: React.ElementType; cls: string }> = {
  Free:      { label: "Free",      icon: CheckCircle2, cls: "text-profit border-profit/20 bg-profit/10" },
  Verified:  { label: "Verified",  icon: ShieldCheck,  cls: "text-accent border-accent/20 bg-accent/10" },
  Allocated: { label: "Allocated", icon: Lock,         cls: "text-warn   border-warn/20   bg-warn/10"   },
};

function TierBadge({ tier }: { tier: AccessTier }) {
  const { label, icon: Icon, cls } = TIER_META[tier];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-medium border", cls)}>
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

const FREQ_COLORS: Record<Frequency, string> = {
  Tick:      "text-text-tertiary",
  Daily:     "text-text-secondary",
  Monthly:   "text-text-secondary",
  Quarterly: "text-text-secondary",
  Event:     "text-text-secondary",
};

const ASSET_COLORS: Record<DataAsset, string> = {
  Equities:          "bg-accent/10 text-accent border-accent/20",
  Derivatives:       "bg-warn/10 text-warn border-warn/20",
  Macro:             "bg-muted text-text-secondary border-border",
  "Corporate Events":"bg-profit/10 text-profit border-profit/20",
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-xl border border-accent/30 bg-elevated shadow-card-hover px-5 py-3 animate-fade-in">
      <FlaskConical className="h-4 w-4 text-accent flex-shrink-0" />
      <span className="text-sm text-text-primary">{message}</span>
      <button onClick={onClose} className="ml-1 text-text-tertiary hover:text-text-primary transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dataset chart
// ─────────────────────────────────────────────────────────────────────────────

const chartTooltipStyle = {
  contentStyle: { background: "#1a1d26", border: "1px solid #2a3042", borderRadius: 8, fontSize: 11 },
  labelStyle:   { color: "#8892a4" },
  itemStyle:    { color: "#e8eaf0" },
};

function DataChart({ spec }: { spec: ChartSpec }) {
  if (spec.kind === "line") {
    return (
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={spec.data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 10, fill: "#8892a4" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#8892a4" }} axisLine={false} tickLine={false} width={48}
            label={{ value: spec.yLabel, angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 9, fill: "#8892a4" } }} />
          <RTooltip {...chartTooltipStyle} />
          <Line dataKey="v" stroke={spec.color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (spec.kind === "area") {
    return (
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={spec.data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={spec.color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={spec.color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 10, fill: "#8892a4" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#8892a4" }} axisLine={false} tickLine={false} width={56}
            domain={["auto", "auto"]}
            label={{ value: spec.yLabel, angle: -90, position: "insideLeft", offset: 14, style: { fontSize: 9, fill: "#8892a4" } }} />
          <RTooltip {...chartTooltipStyle} />
          <Area dataKey="v" stroke={spec.color} strokeWidth={1.5} fill="url(#areaGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  // bar
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={spec.data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
        <XAxis dataKey="x" tick={{ fontSize: 10, fill: "#8892a4" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#8892a4" }} axisLine={false} tickLine={false} width={48}
          label={{ value: spec.yLabel, angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 9, fill: "#8892a4" } }} />
        <RTooltip {...chartTooltipStyle} />
        <Bar dataKey="v" radius={[2, 2, 0, 0]}>
          {spec.data.map((d, i) => (
            <Cell
              key={i}
              fill={spec.negativeColor && d.v < 0 ? spec.negativeColor : spec.color}
              opacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dataset list item
// ─────────────────────────────────────────────────────────────────────────────

function DatasetListItem({
  ds,
  selected,
  onClick,
}: {
  ds: Dataset;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 border-b border-border last:border-b-0 transition-colors group",
        selected ? "bg-elevated border-l-2 border-l-accent" : "hover:bg-elevated/50 border-l-2 border-l-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn(
            "text-sm font-medium truncate leading-snug",
            selected ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
          )}>
            {ds.name}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn(
              "text-2xs font-mono px-1.5 py-0.5 rounded border",
              ASSET_COLORS[ds.assetClass]
            )}>
              {ds.assetClass}
            </span>
            <span className={cn("text-2xs font-mono", FREQ_COLORS[ds.frequency])}>
              {ds.frequency}
            </span>
            <span className="text-2xs text-text-tertiary font-mono">{ds.coverage}</span>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <TierBadge tier={ds.tier} />
          {selected && <ChevronRight className="h-3 w-3 text-accent" />}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dataset detail panel
// ─────────────────────────────────────────────────────────────────────────────

function DatasetDetail({
  ds,
  onSandbox,
}: {
  ds: Dataset;
  onSandbox: () => void;
}) {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary tracking-tight">{ds.name}</h2>
            <p className="text-sm text-text-secondary mt-1 leading-relaxed max-w-xl">{ds.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <TierBadge tier={ds.tier} />
          </div>
        </div>

        {/* Meta badges row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <MetricLabel
              label="Point-in-time"
              tooltip={GLOSSARY.pointInTime}
              labelClassName={cn(
                "text-xs font-medium",
                ds.pointInTime ? "text-profit" : "text-text-tertiary"
              )}
            />
            {ds.pointInTime
              ? <CheckCircle2 className="h-3.5 w-3.5 text-profit" />
              : <X className="h-3.5 w-3.5 text-text-tertiary" />}
          </div>
          <span className="text-text-tertiary text-xs">·</span>
          <div className="flex items-center gap-1.5">
            <MetricLabel
              label="Survivorship-free"
              tooltip={GLOSSARY.survivorshipFree}
              labelClassName={cn(
                "text-xs font-medium",
                ds.survivorshipFree ? "text-profit" : "text-text-tertiary"
              )}
            />
            {ds.survivorshipFree
              ? <CheckCircle2 className="h-3.5 w-3.5 text-profit" />
              : <X className="h-3.5 w-3.5 text-text-tertiary" />}
          </div>
          <span className="text-text-tertiary text-xs">·</span>
          <span className="text-xs text-text-tertiary font-mono">
            Coverage: <span className="text-text-secondary">{ds.coverage}</span>
          </span>
          <span className="text-text-tertiary text-xs">·</span>
          <span className="text-xs text-text-tertiary font-mono">
            Updated: <span className="text-text-secondary">{ds.lastUpdated}</span>
          </span>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Records"       value={ds.recordCount}   tooltip="Total rows / data points in the dataset." />
        <MetricCard label="Symbols"       value={ds.symbolCount}   tooltip="Number of distinct securities or series covered." />
        <MetricCard label="History"       value={ds.historySpan}   tooltip="Length of historical data available." />
        <MetricCard label="Update cadence" value={ds.updateCadence} tooltip={GLOSSARY.updateCadence} />
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider mb-3">
          {ds.id === "fo-chain"        ? "NIFTY call OI by strike — 30 May 2024 expiry"
           : ds.id === "nse-ohlcv"    ? "RELIANCE close price — 12-month trailing"
           : ds.id === "nse-fundamentals" ? "TCS quarterly PAT (₹ Cr)"
           : ds.id === "intraday-tick" ? "HDFCBANK intraday price — 15 May 2024"
           : ds.id === "index-constituents" ? "RELIANCE weight in NIFTY 50"
           : ds.id === "corporate-actions"  ? "RELIANCE dividend per share by FY"
           : ds.id === "fii-dii-flows" ? "FII net equity cash flows — CY 2024 (₹ Cr)"
           : "India CPI headline — Jun 2023 to May 2024"}
        </p>
        <DataChart spec={ds.chart} />
      </div>

      {/* Data preview */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-elevated">
          <Table2 className="h-3.5 w-3.5 text-text-tertiary" />
          <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Data preview — sample rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                {ds.previewHeaders.map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-text-tertiary font-medium uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ds.previewRows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50 last:border-b-0 hover:bg-elevated/50 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 tabular-nums text-text-secondary whitespace-nowrap">
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schema */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-elevated">
          <Database className="h-3.5 w-3.5 text-text-tertiary" />
          <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Schema — column definitions</span>
        </div>
        <div className="divide-y divide-border/50">
          {ds.columns.map((col) => (
            <div key={col.name} className="flex items-baseline gap-4 px-4 py-2.5 hover:bg-elevated/40 transition-colors">
              <span className="font-mono text-xs text-accent w-32 flex-shrink-0">{col.name}</span>
              <span className="font-mono text-2xs text-text-tertiary w-16 flex-shrink-0">{col.type}</span>
              <span className="text-xs text-text-secondary">{col.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA row */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onSandbox}
          className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent/90 text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
        >
          <FlaskConical className="h-4 w-4" />
          Open in Sandbox
        </button>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-lg border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary px-4 py-2.5 text-sm font-medium transition-colors"
        >
          Use in a Strategy
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="flex-1" />
        <span className="text-2xs text-text-tertiary font-mono hidden sm:block">
          Access tier: <MetricLabel label={ds.tier} tooltip={GLOSSARY.accessTier} labelClassName="text-2xs font-mono text-text-secondary" />
        </span>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const ASSET_FILTERS: (DataAsset | "All")[] = ["All", "Equities", "Derivatives", "Macro", "Corporate Events"];
const TIER_FILTERS:  (AccessTier | "All")[] = ["All", "Free", "Verified", "Allocated"];

export default function DataPage() {
  const [selectedId, setSelectedId]   = useState<string>(DATASETS[0].id);
  const [search, setSearch]           = useState("");
  const [assetFilter, setAssetFilter] = useState<DataAsset | "All">("All");
  const [tierFilter, setTierFilter]   = useState<AccessTier | "All">("All");
  const [toast, setToast]             = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DATASETS.filter((d) => {
      if (assetFilter !== "All" && d.assetClass !== assetFilter) return false;
      if (tierFilter  !== "All" && d.tier       !== tierFilter)  return false;
      if (q && !d.name.toLowerCase().includes(q) && !d.assetClass.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, assetFilter, tierFilter]);

  const selected = DATASETS.find((d) => d.id === selectedId) ?? DATASETS[0];

  function openSandbox() {
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  }

  return (
    <PageContainer className="!py-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-5 w-5 text-accent" />
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Research Lab</h1>
          </div>
          <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
            Explore 26 Miles&apos; curated, point-in-time datasets. Research here, build your strategy, and submit.
            Your code runs on our servers — data stays in the sandbox, your logic stays private.
          </p>
        </div>
        <button
          onClick={openSandbox}
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent/90 text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
        >
          <FlaskConical className="h-4 w-4" />
          Open in Sandbox
        </button>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
        <Info className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-sm text-text-secondary leading-relaxed">
          All datasets are{" "}
          <MetricLabel label="point-in-time" tooltip={GLOSSARY.pointInTime} labelClassName="text-sm text-text-primary font-medium" />
          {" "}and where applicable{" "}
          <MetricLabel label="survivorship-free" tooltip={GLOSSARY.survivorshipFree} labelClassName="text-sm text-text-primary font-medium" />
          {" "}— so your backtests aren&apos;t biased by hindsight.
          <MetricLabel label="Access tier" tooltip={GLOSSARY.accessTier} labelClassName="text-sm text-text-secondary" />
          {" "}determines which datasets you can query.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* Left — catalog */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 rounded-xl border border-border bg-surface overflow-hidden">

          {/* Search bar */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                placeholder="Search datasets…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-elevated border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <span className="h-3.5 w-3.5 inline-flex items-center justify-center">
                {showFilters ? <X className="h-3 w-3" /> : <span className="text-xs">⊞</span>}
              </span>
              {showFilters ? "Hide filters" : "Filters"}
              {(assetFilter !== "All" || tierFilter !== "All") && (
                <span className="ml-1 h-4 w-4 rounded-full bg-accent text-white text-2xs flex items-center justify-center">
                  {(assetFilter !== "All" ? 1 : 0) + (tierFilter !== "All" ? 1 : 0)}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="space-y-2 pt-1">
                {/* Asset class */}
                <div>
                  <p className="text-2xs text-text-tertiary font-mono uppercase tracking-wider mb-1">Asset class</p>
                  <div className="flex flex-wrap gap-1">
                    {ASSET_FILTERS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setAssetFilter(f as DataAsset | "All")}
                        className={cn(
                          "px-2 py-0.5 rounded text-2xs font-mono border transition-colors",
                          assetFilter === f
                            ? "border-accent/40 bg-accent/10 text-accent"
                            : "border-border text-text-tertiary hover:text-text-secondary"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Tier */}
                <div>
                  <p className="text-2xs text-text-tertiary font-mono uppercase tracking-wider mb-1">Access tier</p>
                  <div className="flex flex-wrap gap-1">
                    {TIER_FILTERS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setTierFilter(f as AccessTier | "All")}
                        className={cn(
                          "px-2 py-0.5 rounded text-2xs font-mono border transition-colors",
                          tierFilter === f
                            ? "border-accent/40 bg-accent/10 text-accent"
                            : "border-border text-text-tertiary hover:text-text-secondary"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[600px] lg:max-h-[700px]">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Database className="h-6 w-6 text-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-text-tertiary">No datasets match your filters.</p>
                <button
                  onClick={() => { setSearch(""); setAssetFilter("All"); setTierFilter("All"); }}
                  className="mt-2 text-xs text-accent hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filtered.map((ds) => (
                <DatasetListItem
                  key={ds.id}
                  ds={ds}
                  selected={ds.id === selectedId}
                  onClick={() => setSelectedId(ds.id)}
                />
              ))
            )}
          </div>

          {/* Catalog footer */}
          <div className="px-4 py-2.5 border-t border-border bg-elevated">
            <p className="text-2xs text-text-tertiary font-mono">
              {filtered.length} of {DATASETS.length} datasets
            </p>
          </div>
        </div>

        {/* Right — detail */}
        <div className="flex-1 min-w-0 rounded-xl border border-border bg-surface p-5">
          <DatasetDetail ds={selected} onSandbox={openSandbox} />
        </div>

      </div>

      {/* ── How research works ── */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold text-text-primary mb-4">How research works here</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Explore datasets",
              body: "Browse the catalog and preview real schemas and sample data. Every dataset is documented with coverage, frequency, and update cadence.",
            },
            {
              step: "02",
              title: "Open the sandbox",
              body: "Your code runs on 26 Miles servers — data never leaves the environment. Query, analyse, and iterate. Your logic stays completely private.",
            },
            {
              step: "03",
              title: "Build and submit",
              body: "When your idea has an edge, submit it as a signal file, full code, or via the AI Strategy Maker. 26 Miles validates it and allocates capital if it passes.",
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex gap-4">
              <span className="font-mono text-2xl font-bold text-text-tertiary/40 flex-shrink-0 leading-none mt-0.5">
                {step}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs text-text-tertiary leading-relaxed flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0 mt-0.5" />
            All datasets are{" "}
            <MetricLabel label="point-in-time" tooltip={GLOSSARY.pointInTime} labelClassName="text-xs text-text-tertiary font-medium" />
            {" "}and where applicable{" "}
            <MetricLabel label="survivorship-free" tooltip={GLOSSARY.survivorshipFree} labelClassName="text-xs text-text-tertiary font-medium" />
            {" "}— so backtests reflect what was actually knowable at each date, not what we know today.
            This eliminates the two most common sources of backtest inflation.
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message="Sandbox launching… (demo — no real environment in prototype)"
          onClose={() => setToast(false)}
        />
      )}

    </PageContainer>
  );
}
