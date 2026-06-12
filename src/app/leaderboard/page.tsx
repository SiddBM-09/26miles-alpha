"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown, Info, ArrowUpRight } from "lucide-react";
import { RESEARCHERS, type ResearcherLevel } from "@/lib/mock/researchers";
import { STRATEGIES } from "@/lib/mock/strategies";
import { PageContainer } from "@/components/AppShell";
import { MetricLabel } from "@/components/ui/MetricLabel";
import { GLOSSARY } from "@/lib/glossary";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Mock session — r01 is the logged-in user.
// Only this researcher's row is clickable; others are display-only.
// No other researcher's earnings, payouts, or allocated capital are shown.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_USER_ID = "r01";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = "alphaScore" | "liveCount" | "bestOosSharp" | "joinedDate";
type SortDir = "asc" | "desc";

// ─────────────────────────────────────────────────────────────────────────────
// Data derivation
// ─────────────────────────────────────────────────────────────────────────────

/** Seeded LCG — deterministic per-researcher sparkline */
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function alphaHistory(currentScore: number, seed: number, n = 12): number[] {
  const rand = lcg(seed * 31 + 7);
  const pts = [currentScore];
  for (let i = 1; i < n; i++) {
    const prev = pts[0];
    const delta = (rand() - 0.54) * 5;
    pts.unshift(Math.max(20, Math.min(99.5, prev - delta)));
  }
  return pts;
}

interface LeaderboardRow {
  id: string;
  handle: string;
  displayName: string;
  city: string;
  country: string;
  level: ResearcherLevel;
  alphaScore: number;
  alphaHistory: number[];
  joinedDate: string;
  liveCount: number;
  totalStrategies: number;
  bestOosSharp: number; // best OOS Sharpe among live strategies; 0 if none
}

const ROWS: LeaderboardRow[] = RESEARCHERS.map((r, idx) => {
  const liveStrategies = STRATEGIES.filter(
    (s) => s.ownerId === r.id && s.lifecycleState === "live"
  );
  const liveCount = liveStrategies.length;
  const bestOosSharp = liveStrategies.length > 0
    ? Math.max(...liveStrategies.map((s) => s.oosSharp))
    : 0;

  return {
    id: r.id,
    handle: r.handle,
    displayName: r.displayName,
    city: r.city,
    country: r.country,
    level: r.level,
    alphaScore: r.alphaScore,
    alphaHistory: alphaHistory(r.alphaScore, idx * 17 + 3),
    joinedDate: r.joinedDate,
    liveCount,
    totalStrategies: r.totalStrategies,
    bestOosSharp,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<ResearcherLevel, string> = {
  Analyst:   "bg-muted text-text-secondary border-border",
  Associate: "bg-accent/10 text-accent border-accent/20",
  Senior:    "bg-profit/10 text-profit border-profit/20",
  Principal: "bg-warn/10 text-warn border-warn/20",
};

function LevelBadge({ level }: { level: ResearcherLevel }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium border whitespace-nowrap",
      LEVEL_STYLES[level]
    )}>
      {level}
    </span>
  );
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const W = 72;
  const H = 22;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trend = values[values.length - 1] >= values[0];

  const last  = pts[pts.length - 1].split(",");
  const first = pts[0].split(",");
  const fill  = `M ${pts.join(" L ")} L ${last[0]},${H} L ${first[0]},${H} Z`;
  const line  = `M ${pts.join(" L ")}`;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden
    >
      <path d={fill} fill={trend ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"} />
      <path
        d={line}
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        stroke={trend ? "#10b981" : "#ef4444"}
      />
      <circle
        cx={parseFloat(last[0])}
        cy={parseFloat(last[1])}
        r="2"
        fill={trend ? "#10b981" : "#ef4444"}
      />
    </svg>
  );
}

function AlphaBar({ score }: { score: number }) {
  const color =
    score >= 85 ? "bg-profit"  :
    score >= 65 ? "bg-accent"  :
    score >= 45 ? "bg-warn"    : "bg-loss";

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="font-mono text-sm tabular-nums font-medium text-text-primary w-10 text-right flex-shrink-0">
        {score.toFixed(1)}
      </span>
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden max-w-[72px]">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

const RANK_MEDAL: Record<number, string> = {
  1: "text-warn font-bold",
  2: "text-text-secondary font-bold",
  3: "text-[#cd7f32] font-bold",
};

// ─────────────────────────────────────────────────────────────────────────────
// Sort header button
// ─────────────────────────────────────────────────────────────────────────────

function SortButton({
  col, label, current, dir, onSort, className, tooltip,
}: {
  col: SortKey;
  label: string;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
  tooltip?: string;
}) {
  const active = current === col;
  const Icon = active ? (dir === "desc" ? ChevronDown : ChevronUp) : ChevronsUpDown;
  const labelCls = cn(
    "text-2xs font-mono uppercase tracking-wider",
    active ? "text-accent" : "text-text-tertiary"
  );
  return (
    <button
      onClick={() => onSort(col)}
      className={cn(
        "flex items-center gap-1 text-2xs font-mono uppercase tracking-wider transition-colors select-none group",
        active ? "text-accent" : "text-text-tertiary hover:text-text-secondary",
        className
      )}
      aria-sort={active ? (dir === "desc" ? "descending" : "ascending") : "none"}
    >
      {tooltip
        ? <MetricLabel label={label} tooltip={tooltip} labelClassName={labelCls} />
        : label}
      <Icon className={cn("h-3 w-3 flex-shrink-0", active ? "text-accent" : "text-text-tertiary group-hover:text-text-secondary")} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row wrapper — own row is a link; others are non-interactive display only
// ─────────────────────────────────────────────────────────────────────────────

function RowWrapper({
  isOwn,
  children,
}: {
  isOwn: boolean;
  children: React.ReactNode;
}) {
  if (isOwn) {
    return (
      <Link
        href="/dashboard"
        className="group block border-b border-border last:border-b-0 hover:bg-elevated/60 transition-colors"
      >
        {children}
      </Link>
    );
  }
  return (
    <div className="border-b border-border last:border-b-0">
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [sortKey, setSortKey] = useState<SortKey>("alphaScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    return [...ROWS].sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      if (sortKey === "alphaScore")   return mul * (a.alphaScore - b.alphaScore);
      if (sortKey === "liveCount")    return mul * (a.liveCount - b.liveCount);
      if (sortKey === "bestOosSharp") return mul * (a.bestOosSharp - b.bestOosSharp);
      if (sortKey === "joinedDate")   return mul * a.joinedDate.localeCompare(b.joinedDate);
      return 0;
    });
  }, [sortKey, sortDir]);

  // Stable medal rank always by alpha score desc
  const defaultRank = useMemo(() => {
    const byScore = [...ROWS].sort((a, b) => b.alphaScore - a.alphaScore);
    return Object.fromEntries(byScore.map((r, i) => [r.id, i + 1]));
  }, []);

  return (
    <PageContainer className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Researcher Leaderboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {ROWS.length} researchers · {ROWS.reduce((n, r) => n + r.liveCount, 0)} live strategies
          </p>
        </div>

        {/* Mobile sort selector */}
        <div className="flex sm:hidden items-center gap-2">
          <span className="text-xs text-text-tertiary font-mono">Sort:</span>
          {(["alphaScore", "liveCount", "bestOosSharp"] as SortKey[]).map((k) => {
            const labels: Record<string, string> = {
              alphaScore: "Alpha", liveCount: "Live", bestOosSharp: "OOS Sharpe",
            };
            return (
              <button
                key={k}
                onClick={() => handleSort(k)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-mono border transition-colors",
                  sortKey === k
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border text-text-tertiary hover:text-text-secondary"
                )}
              >
                {labels[k]}
              </button>
            );
          })}
        </div>
      </div>

      {/* OOS-only methodology disclaimer */}
      <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
        <Info className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <span className="font-medium text-text-primary">Rankings are based on live and out-of-sample performance only.</span>
          <span className="text-text-secondary">
            {" "}The Alpha Score aggregates OOS Sharpe, walk-forward stability, drawdown management, and capital deployed.
            In-sample backtest metrics are excluded from all rankings — they carry no predictive weight in our model.
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">

        {/* Desktop header */}
        <div className="hidden md:grid md:grid-cols-[2.5rem_1fr_6rem_11rem_5rem_5rem_7rem] gap-x-4 items-center px-5 py-3 bg-elevated border-b border-border">
          <span className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">#</span>

          <SortButton col="alphaScore" label="Researcher" current={sortKey} dir={sortDir} onSort={handleSort} />

          <span className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">
            <MetricLabel label="Level" tooltip={GLOSSARY.lifecycleState} labelClassName="text-2xs font-mono text-text-tertiary uppercase tracking-wider" />
          </span>

          <SortButton col="alphaScore" label="Alpha Score" tooltip={GLOSSARY.alphaScore} current={sortKey} dir={sortDir} onSort={handleSort} />

          <span className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">
            12-mo trend
          </span>

          <SortButton col="liveCount" label="Live" current={sortKey} dir={sortDir} onSort={handleSort} />

          <SortButton col="bestOosSharp" label="OOS Sharpe" tooltip={GLOSSARY.sharpeRatio} current={sortKey} dir={sortDir} onSort={handleSort} />
        </div>

        {sorted.map((row, i) => {
          const rank  = defaultRank[row.id];
          const isOwn = row.id === MOCK_USER_ID;

          const sharpeColor =
            row.bestOosSharp >= 1.5 ? "text-profit" :
            row.bestOosSharp >= 1.0 ? "text-text-primary" :
            row.bestOosSharp >  0   ? "text-warn" : "text-text-tertiary";

          return (
            <RowWrapper key={row.id} isOwn={isOwn}>
              {/* ── Mobile layout ── */}
              <div className="md:hidden px-4 py-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                      "font-mono text-sm tabular-nums w-6 text-center flex-shrink-0",
                      RANK_MEDAL[rank] ?? "text-text-tertiary"
                    )}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-sm font-medium transition-colors",
                          isOwn ? "text-text-primary group-hover:text-accent" : "text-text-primary"
                        )}>
                          @{row.handle}
                        </span>
                        {isOwn && (
                          <span className="text-2xs font-mono text-accent border border-accent/20 rounded px-1 py-0.5">you</span>
                        )}
                        <LevelBadge level={row.level} />
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5">{row.city}</p>
                    </div>
                  </div>
                  <Sparkline values={row.alphaHistory} />
                </div>
                <div className="flex items-center gap-4 pl-9">
                  <AlphaBar score={row.alphaScore} />
                  <span className="text-xs text-text-secondary font-mono">
                    {row.liveCount} live
                  </span>
                  {row.bestOosSharp > 0 && (
                    <span className={cn("text-xs font-mono tabular-nums", sharpeColor)}>
                      SR {row.bestOosSharp.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Desktop layout ── */}
              <div className="hidden md:grid md:grid-cols-[2.5rem_1fr_6rem_11rem_5rem_5rem_7rem] gap-x-4 items-center px-5 py-3.5">

                {/* Rank */}
                <span className={cn(
                  "font-mono text-sm tabular-nums text-center",
                  RANK_MEDAL[rank] ?? "text-text-tertiary"
                )}>
                  {i + 1}
                </span>

                {/* Researcher */}
                <div className="min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-sm font-medium truncate transition-colors",
                      isOwn ? "text-text-primary group-hover:text-accent" : "text-text-primary"
                    )}>
                      @{row.handle}
                    </span>
                    {isOwn && (
                      <span className="text-2xs font-mono text-accent border border-accent/20 rounded px-1 py-0.5 flex-shrink-0">you</span>
                    )}
                    {isOwn && (
                      <ArrowUpRight className="h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-2xs text-text-tertiary truncate">
                    {row.displayName} · {row.city}
                  </span>
                </div>

                {/* Level */}
                <div>
                  <LevelBadge level={row.level} />
                </div>

                {/* Alpha Score + bar */}
                <AlphaBar score={row.alphaScore} />

                {/* Sparkline */}
                <Sparkline values={row.alphaHistory} />

                {/* Live count */}
                <div className="flex flex-col gap-0.5">
                  <span className={cn(
                    "font-mono text-sm tabular-nums font-medium",
                    row.liveCount > 0 ? "text-profit" : "text-text-tertiary"
                  )}>
                    {row.liveCount}
                  </span>
                  <span className="text-2xs text-text-tertiary">
                    of {row.totalStrategies}
                  </span>
                </div>

                {/* Best OOS Sharpe (live strategies only) */}
                <span className={cn("font-mono text-sm tabular-nums", sharpeColor)}>
                  {row.bestOosSharp > 0 ? row.bestOosSharp.toFixed(2) : "—"}
                </span>

              </div>
            </RowWrapper>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-2xs text-text-tertiary font-mono leading-relaxed max-w-xl">
        Alpha Score is a composite of OOS Sharpe ratio, walk-forward stability score, max drawdown
        management, and live strategies deployed. Backtest metrics carry zero weight.
        OOS Sharpe shown: best live strategy (annualised, RF = 6%). Scores update nightly after market close.
      </p>

    </PageContainer>
  );
}
