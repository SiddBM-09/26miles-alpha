import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { STRATEGIES, getStrategy, type Strategy } from "@/lib/mock/strategies";
import { RESEARCHERS } from "@/lib/mock/researchers";
import { sharpeFromCurve, maxDrawdown } from "@/lib/mock/equityCurves";
import type { EquityPoint as RawPoint } from "@/lib/mock/equityCurves";
import { PageContainer } from "@/components/AppShell";
import { CheckBadge, LifecycleBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { MetricLabel } from "@/components/ui/MetricLabel";
import { SectionDivider } from "@/components/ui/SectionHeading";
import { GLOSSARY } from "@/lib/glossary";
import {
  EquityCurveChart, DrawdownChart,
  type EquityPoint, type DrawdownPoint,
} from "@/components/strategy/StrategyCharts";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Static params for pre-rendering
// ─────────────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return STRATEGIES.map((s) => ({ id: s.id }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived data helpers (all server-side)
// ─────────────────────────────────────────────────────────────────────────────

function annualisedReturn(curve: RawPoint[]): number {
  if (curve.length < 2) return 0;
  const total = curve[curve.length - 1].value / curve[0].value - 1;
  const years = curve.length / 12;
  return Math.round(((1 + total) ** (1 / years) - 1) * 1000) / 10;
}

function buildEquityChartData(curve: RawPoint[]): {
  equityData: EquityPoint[];
  boundaryDate: string | null;
} {
  const boundaryIdx = curve.findIndex((p) => !p.inSample);
  const boundaryDate = boundaryIdx > 0 ? curve[boundaryIdx].date : null;

  const equityData: EquityPoint[] = curve.map((p, i) => ({
    date: p.date,
    // IS line extends one step into OOS for visual continuity
    is:   p.inSample || (boundaryIdx > 0 && i === boundaryIdx) ? p.value : null,
    // OOS line starts from last IS point
    oos:  !p.inSample || (boundaryIdx > 0 && i === boundaryIdx - 1) ? p.value : null,
  }));

  return { equityData, boundaryDate };
}

function buildDrawdownData(curve: RawPoint[]): {
  drawdownData: DrawdownPoint[];
  minDD: number;
} {
  let peak = 0;
  const drawdownData: DrawdownPoint[] = curve.map((p) => {
    if (p.value > peak) peak = p.value;
    const dd = peak > 0 ? Math.round(((p.value - peak) / peak) * 1000) / 10 : 0;
    return { date: p.date, dd, inSample: p.inSample };
  });
  const minDD = Math.min(...drawdownData.map((d) => d.dd));
  return { drawdownData, minDD };
}

// Walk-forward sub-period Sharpes from OOS portion
function walkForwardSharpes(curve: RawPoint[]): number[] {
  const oos = curve.filter((p) => !p.inSample);
  if (oos.length < 3) return [];
  const third = Math.floor(oos.length / 3);
  return [
    sharpeFromCurve(oos.slice(0, third)),
    sharpeFromCurve(oos.slice(third, 2 * third)),
    sharpeFromCurve(oos.slice(2 * third)),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviewer summary generator
// ─────────────────────────────────────────────────────────────────────────────

function reviewerSummary(s: Strategy, wfSharpes: number[]): string {
  const {
    oosSharp, backtestSharpe, deflatedSharpe, pboScore, checks,
    capacityUSDM, turnoverPerDay, correlationToBook, oosBars, lifecycleState,
  } = s;

  if (oosBars === 0) {
    return `This strategy is currently in in-sample development with no out-of-sample data available. The backtest Sharpe of ${backtestSharpe.toFixed(2)} will be re-evaluated once a minimum of six out-of-sample months have been collected. Submit additional live-signal files to advance to the paper-trading assessment phase.`;
  }

  const retention   = backtestSharpe > 0 ? Math.round((oosSharp / backtestSharpe) * 100) : 0;
  const retentionAdj =
    retention >= 85 ? "highly consistent with" :
    retention >= 65 ? "materially consistent with" :
    retention >= 45 ? "lower than, though within the typical range for," :
                      "materially below";

  const wfStr = wfSharpes.length === 3
    ? `Walk-forward analysis across three equal sub-periods (Sharpe ${wfSharpes.map((v) => v.toFixed(2)).join(" / ")}) ${
        checks.walkForward === "pass"   ? "confirms regime stability throughout the OOS window"  :
        checks.walkForward === "warn"   ? "shows moderate sub-period sensitivity requiring monitoring" :
                                          "reveals significant sub-period instability that warrants further investigation"
      }.`
    : "";

  const overfitStr =
    pboScore <= 0.15 && deflatedSharpe > 1.0
      ? `A deflated Sharpe of ${deflatedSharpe.toFixed(2)} and PBO score of ${Math.round(pboScore * 100)}% provide strong statistical evidence that the in-sample performance is not a product of data-mining bias.`
      : pboScore <= 0.30
      ? `A deflated Sharpe of ${deflatedSharpe.toFixed(2)} and PBO score of ${Math.round(pboScore * 100)}% are broadly consistent with a genuine signal, though mild in-sample optimism cannot be fully excluded.`
      : `A deflated Sharpe of ${deflatedSharpe.toFixed(2)} and PBO score of ${Math.round(pboScore * 100)}% warrant caution — the probability of backtest overfitting is non-trivial and should be addressed before scaling allocation.`;

  const leakageStr =
    checks.dataLeakage === "pass"
      ? "The data pipeline has been audited clean — no look-ahead bias or split-adjustment artefacts were detected."
      : checks.dataLeakage === "warn"
      ? "A minor data-handling flag was noted in the pipeline; this should be resolved before live allocation."
      : "A data leakage issue was identified and must be corrected before this strategy can progress.";

  const corrAdj =
    Math.abs(correlationToBook) <= 0.15
      ? "adds meaningful diversification to the existing book"
      : Math.abs(correlationToBook) <= 0.35
      ? "is moderately correlated with existing positions and should be sized accordingly"
      : "carries material book correlation — careful position sizing is required to control concentration risk";

  const verdicts: Partial<Record<typeof lifecycleState, string>> = {
    live:       "The strategy is currently live with real capital allocated.",
    paper:      "Recommendation: continue the paper-trading phase and collect additional OOS months before scaling allocation.",
    incubation: "Recommendation: additional development is required before OOS validation can commence.",
    decaying:   "Recent OOS performance has deteriorated; ongoing allocation is under review by the risk committee.",
    retired:    "The strategy has been retired from the active book.",
  };

  return [
    `This strategy demonstrates ${oosSharp >= 1.5 ? "strong" : oosSharp >= 1.0 ? "moderate" : "limited"} out-of-sample performance, achieving an annualised Sharpe of ${oosSharp.toFixed(2)} (OOS, RF = 6%) against a backtest estimate of ${backtestSharpe.toFixed(2)} — a Sharpe retention of ${retention}%, ${retentionAdj} the in-sample figure.`,
    wfStr,
    overfitStr,
    leakageStr,
    `Capacity is estimated at $${capacityUSDM.toFixed(1)}M with daily turnover of ${turnoverPerDay.toFixed(1)}× — both within viable parameters for the allocated universe.`,
    `At ${correlationToBook.toFixed(2)} correlation to book, this strategy ${corrAdj}.`,
    verdicts[lifecycleState] ?? "",
  ].filter(Boolean).join("  ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-5" aria-label="Breadcrumb">
      <Link href="/leaderboard" className="hover:text-text-secondary transition-colors">Strategies</Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-text-secondary truncate max-w-[200px]">{name}</span>
    </nav>
  );
}

function StrategyHeader({ s, ownerHandle }: { s: Strategy; ownerHandle: string }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{s.name}</h1>
          <p className="text-sm text-text-secondary mt-1.5 leading-relaxed max-w-2xl">
            {s.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {s.tags.map((t) => (
              <span key={t} className="rounded px-1.5 py-0.5 text-2xs font-mono bg-muted text-text-tertiary border border-border">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <LifecycleBadge state={s.lifecycleState} />
          <span className="text-2xs text-text-tertiary font-mono">{s.assetClass}</span>
        </div>
      </div>

      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-tertiary font-mono border-t border-border pt-4">
        <span>
          Owner{" "}
          <Link href="/dashboard" className="text-accent hover:underline">@{ownerHandle}</Link>
        </span>
        <span>Submitted {new Date(s.submittedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
        {s.liveDate && (
          <span>
            Live since{" "}
            <span className="text-profit">{new Date(s.liveDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
          </span>
        )}
        {s.retiredDate && (
          <span>
            Retired{" "}
            <span className="text-loss">{new Date(s.retiredDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
          </span>
        )}
        <span className="text-text-tertiary/60">{s.id.toUpperCase()}</span>
      </div>
    </div>
  );
}

// Check cards — detailed strip
const CHECK_META = {
  overfitting:  { label: "Overfitting",  desc: "Deflated Sharpe & PBO",   tooltip: GLOSSARY.overfitting  },
  dataLeakage:  { label: "Data Leakage", desc: "Look-ahead & split audit", tooltip: GLOSSARY.dataLeakage  },
  walkForward:  { label: "Walk-forward", desc: "Sub-period stability",      tooltip: GLOSSARY.walkForward  },
  capacityTest: { label: "Capacity",     desc: "AUM ceiling & turnover",   tooltip: GLOSSARY.capacity     },
} as const;

function ChecksStrip({ s }: { s: Strategy }) {
  const items = [
    {
      key:    "overfitting"  as const,
      status: s.checks.overfitting,
      detail: `Defl. Sharpe ${s.deflatedSharpe.toFixed(2)} · PBO ${Math.round(s.pboScore * 100)}%`,
    },
    {
      key:    "dataLeakage"  as const,
      status: s.checks.dataLeakage,
      detail: s.checks.dataLeakage === "pass" ? "No artefacts found" :
              s.checks.dataLeakage === "warn" ? "Minor flag — see report" : "Issue identified",
    },
    {
      key:    "walkForward"  as const,
      status: s.checks.walkForward,
      detail: s.checks.walkForward === "pass" ? "All sub-periods stable" :
              s.checks.walkForward === "warn" ? "Moderate regime sensitivity" : "Instability detected",
    },
    {
      key:    "capacityTest" as const,
      status: s.checks.capacityTest,
      detail: `$${s.capacityUSDM.toFixed(1)}M ceiling · ${s.turnoverPerDay.toFixed(1)}×/day`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ key, status, detail }) => {
        const meta = CHECK_META[key];
        const borderColor =
          status === "pass" ? "border-profit/20 hover:border-profit/40" :
          status === "warn" ? "border-warn/20 hover:border-warn/40"     : "border-loss/20 hover:border-loss/40";
        const bgColor =
          status === "pass" ? "bg-profit/5"  :
          status === "warn" ? "bg-warn/5"    : "bg-loss/5";

        return (
          <div key={key} className={cn(
            "rounded-lg border p-4 flex flex-col gap-2.5 transition-colors",
            bgColor, borderColor
          )}>
            <div className="flex items-center gap-2">
              <CheckBadge status={status} />
              <MetricLabel label={meta.label} tooltip={meta.tooltip} labelClassName="text-xs text-text-secondary font-medium" />
            </div>
            <div>
              <p className="text-2xs text-text-tertiary font-mono">{meta.desc}</p>
              <p className="text-xs text-text-secondary mt-0.5">{detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Lifecycle timeline
const LIFECYCLE_ORDER = ["incubation", "paper", "live", "decaying", "retired"] as const;
const LIFECYCLE_LABELS: Record<string, string> = {
  incubation: "Incubation",
  paper:      "Paper / Fwd-test",
  live:       "Live",
  decaying:   "Decaying",
  retired:    "Retired",
};

function LifecycleTimeline({ s }: { s: Strategy }) {
  const currentIdx = LIFECYCLE_ORDER.indexOf(s.lifecycleState as any);

  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      {LIFECYCLE_ORDER.map((state, i) => {
        const passed  = i < currentIdx;
        const current = i === currentIdx;
        const future  = i > currentIdx;

        return (
          <div key={state} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "h-2 w-2 rounded-full transition-colors",
                current ? "bg-accent ring-2 ring-accent/30" :
                passed  ? "bg-profit/60" : "bg-border"
              )} />
              <span className={cn(
                "text-2xs font-mono whitespace-nowrap",
                current ? "text-accent font-medium" :
                passed  ? "text-text-tertiary" : "text-text-tertiary/40"
              )}>
                {LIFECYCLE_LABELS[state]}
              </span>
            </div>
            {i < LIFECYCLE_ORDER.length - 1 && (
              <div className={cn(
                "h-px w-8 sm:w-14 mx-1 mb-4 flex-shrink-0",
                i < currentIdx ? "bg-profit/30" : "bg-border/40"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Muted IS metric card
function ISMetricCard({ label, value, unit, tooltip }: { label: string; value: string; unit?: string; tooltip?: string }) {
  return (
    <div className="rounded border border-border/50 bg-surface/50 px-3 py-2.5 flex flex-col gap-0.5">
      {tooltip ? (
        <MetricLabel label={label} tooltip={tooltip} labelClassName="text-2xs text-text-tertiary uppercase tracking-wider font-mono" />
      ) : (
        <span className="text-2xs text-text-tertiary uppercase tracking-wider font-mono">{label}</span>
      )}
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-base tabular-nums text-text-tertiary">{value}</span>
        {unit && <span className="text-2xs text-text-tertiary font-mono">{unit}</span>}
      </div>
    </div>
  );
}

// Risk row in the capacity table
function RiskRow({
  label, value, sub, color = "neutral", tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: "positive" | "negative" | "neutral";
  tooltip?: string;
}) {
  const textColor =
    color === "positive" ? "text-profit" :
    color === "negative" ? "text-loss"   : "text-text-primary";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
      {tooltip ? (
        <MetricLabel label={label} tooltip={tooltip} labelClassName="text-sm text-text-secondary" />
      ) : (
        <span className="text-sm text-text-secondary">{label}</span>
      )}
      <div className="text-right">
        <span className={cn("font-mono text-sm tabular-nums font-medium", textColor)}>{value}</span>
        {sub && <span className="text-2xs text-text-tertiary font-mono ml-1.5">{sub}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> };

export default async function StrategyPage({ params }: Props) {
  const { id } = await params;
  const s = getStrategy(id);
  if (!s) notFound();

  const owner = RESEARCHERS.find((r) => r.id === s.ownerId);

  // Curve segments
  const isCurve  = s.equityCurve.filter((p) => p.inSample);
  const oosCurve = s.equityCurve.filter((p) => !p.inSample);
  const hasOOS   = oosCurve.length > 0;

  // IS stats
  const isSharpe     = sharpeFromCurve(isCurve);
  const isMaxDD      = maxDrawdown(isCurve);
  const isAnnReturn  = annualisedReturn(isCurve);
  const oosAnnReturn = hasOOS ? annualisedReturn(oosCurve) : null;

  // OOS walk-forward sub-periods
  const wfSharpes = walkForwardSharpes(s.equityCurve);

  // Chart data (serialisable)
  const { equityData, boundaryDate } = buildEquityChartData(s.equityCurve);
  const { drawdownData, minDD }       = buildDrawdownData(s.equityCurve);

  // Sharpe retention %
  const retention = isSharpe > 0 ? Math.round((s.oosSharp / isSharpe) * 100) : null;

  // Reviewer summary
  const summary = reviewerSummary(s, wfSharpes);

  // OOS max DD (for hero)
  const oosMaxDD = hasOOS ? maxDrawdown(oosCurve) : s.maxDrawdownPct;

  return (
    <PageContainer className="space-y-8 max-w-6xl">
      <Breadcrumb name={s.name} />

      {/* Header */}
      <StrategyHeader s={s} ownerHandle={owner?.handle ?? "unknown"} />

      {/* Lifecycle timeline */}
      <div className="card px-5 py-4">
        <LifecycleTimeline s={s} />
      </div>

      {/* Checks */}
      <ChecksStrip s={s} />

      <SectionDivider />

      {/* Equity curve chart */}
      <section className="card p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Equity Curve</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Normalised to 100 at inception · Monthly bars
              {hasOOS
                ? " · Grey = in-sample · Green = out-of-sample"
                : " · In-sample only — OOS pending"}
            </p>
          </div>
          {hasOOS && (
            <div className="flex items-center gap-4 text-xs font-mono flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-5 rounded-sm bg-text-tertiary/40 inline-block" />
                <span className="text-text-tertiary">In-sample</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-5 rounded-sm bg-profit/50 inline-block" />
                <span className="text-profit">Out-of-sample</span>
              </span>
            </div>
          )}
        </div>
        <div className="h-72">
          <EquityCurveChart data={equityData} boundaryDate={boundaryDate} />
        </div>
      </section>

      {/* Drawdown chart */}
      <section className="card p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              <MetricLabel label="Drawdown" tooltip={GLOSSARY.drawdown} labelClassName="text-base font-semibold text-text-primary" />
              {" "}/ Underwater
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Running drawdown from prior peak · Max {s.maxDrawdownPct.toFixed(1)}%
            </p>
          </div>
          <span className={cn(
            "text-sm font-mono tabular-nums font-medium flex-shrink-0",
            s.maxDrawdownPct < -15 ? "text-loss" :
            s.maxDrawdownPct < -8  ? "text-warn" : "text-text-primary"
          )}>
            {s.maxDrawdownPct.toFixed(1)}% peak DD
          </span>
        </div>
        <div className="h-44">
          <DrawdownChart data={drawdownData} boundaryDate={boundaryDate} minDD={minDD} />
        </div>
      </section>

      <SectionDivider />

      {/* Metrics — OOS hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-text-primary">Performance Metrics</h2>
          <span className="text-2xs font-mono text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5">
            OOS / Live — ranked
          </span>
        </div>

        {hasOOS ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              label="OOS Sharpe"
              tooltip={GLOSSARY.sharpeRatio}
              value={s.oosSharp.toFixed(2)}
              trend={s.oosSharp >= 1.0 ? "up" : "down"}
              annotation="out-of-sample, RF 6%"
              className="lg:col-span-1"
            />
            <MetricCard
              label="Max Drawdown"
              tooltip={GLOSSARY.drawdown}
              value={`${oosMaxDD.toFixed(1)}%`}
              trend="down"
              annotation="OOS period"
            />
            <MetricCard
              label="OOS Return"
              tooltip={GLOSSARY.oos}
              value={`${oosAnnReturn != null ? (oosAnnReturn > 0 ? "+" : "") + oosAnnReturn.toFixed(1) : "—"}%`}
              trend={oosAnnReturn != null && oosAnnReturn > 0 ? "up" : "down"}
              annotation="annualised net"
            />
            <MetricCard
              label="Deflated Sharpe"
              tooltip={GLOSSARY.overfitting}
              value={s.deflatedSharpe.toFixed(2)}
              trend={s.deflatedSharpe >= 1.0 ? "up" : "down"}
              annotation="PBO-adjusted"
            />
            <MetricCard
              label="PBO Score"
              tooltip={GLOSSARY.overfitting}
              value={`${Math.round(s.pboScore * 100)}%`}
              trend={s.pboScore <= 0.20 ? "up" : "down"}
              subValue={s.pboScore <= 0.20 ? "Low — good" : s.pboScore <= 0.40 ? "Moderate" : "High — concern"}
              annotation="lower is better"
            />
            {retention != null && (
              <MetricCard
                label="Sharpe Retention"
                tooltip={GLOSSARY.sharpeRatio}
                value={`${retention}%`}
                trend={retention >= 65 ? "up" : "down"}
                subValue={`${isSharpe.toFixed(2)} → ${s.oosSharp.toFixed(2)}`}
                annotation="IS → OOS"
              />
            )}
          </div>
        ) : (
          <div className="card p-6 flex items-center gap-3 text-sm text-text-secondary">
            <AlertTriangle className="h-4 w-4 text-warn flex-shrink-0" />
            No out-of-sample data yet. OOS metrics will appear once the strategy exits incubation.
          </div>
        )}

        {/* Walk-forward sub-periods */}
        {wfSharpes.length === 3 && (
          <div className="card px-5 py-4">
            <p className="text-2xs text-text-tertiary uppercase tracking-wider font-mono mb-3">
              <MetricLabel label="Walk-forward" tooltip={GLOSSARY.walkForward} labelClassName="text-2xs text-text-tertiary uppercase tracking-wider font-mono" />
              {" "}— 3 equal OOS sub-periods
            </p>
            <div className="grid grid-cols-3 divide-x divide-border">
              {wfSharpes.map((sh, i) => (
                <div key={i} className="px-4 first:pl-0 last:pr-0 flex flex-col gap-0.5">
                  <span className="text-2xs text-text-tertiary font-mono">Period {i + 1}</span>
                  <div className="flex items-center gap-1.5">
                    {sh >= 0.5
                      ? <TrendingUp   className="h-3.5 w-3.5 text-profit" />
                      : <TrendingDown className="h-3.5 w-3.5 text-loss"   />
                    }
                    <span className={cn(
                      "font-mono text-lg font-semibold tabular-nums",
                      sh >= 1.0  ? "text-profit" :
                      sh >= 0.5  ? "text-text-primary" : "text-loss"
                    )}>
                      {sh.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-2xs text-text-tertiary">Sharpe (annualised)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IS reference — visually muted */}
        <div>
          <p className="text-2xs text-text-tertiary uppercase tracking-wider font-mono mb-2.5 flex items-center gap-2">
            <span className="h-px w-6 bg-border inline-block" />
            In-sample (backtest reference only — not used for ranking)
            <span className="h-px flex-1 bg-border inline-block" />
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 opacity-55">
            <ISMetricCard label="IS Sharpe"  tooltip={GLOSSARY.inSample}   value={isSharpe.toFixed(2)} />
            <ISMetricCard label="IS Max DD"  tooltip={GLOSSARY.drawdown}   value={`${isMaxDD.toFixed(1)}%`} />
            <ISMetricCard label="IS Return"  tooltip={GLOSSARY.inSample}   value={`${isAnnReturn > 0 ? "+" : ""}${isAnnReturn.toFixed(1)}%`} unit="ann." />
            <ISMetricCard label="IS Months"  value={String(isCurve.length)} />
            <ISMetricCard label="IS Period"  value={`${isCurve[0]?.date ?? "—"}`} unit="start" />
            <ISMetricCard label="Backtest"   tooltip={GLOSSARY.inSample}   value={s.backtestSharpe.toFixed(2)} unit="Sharpe" />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Capacity, risk & correlation */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-elevated border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Capacity &amp; Turnover</h2>
          </div>
          <div className="px-5 divide-y divide-border">
            <RiskRow label="Estimated capacity" tooltip={GLOSSARY.capacity}  value={`$${s.capacityUSDM.toFixed(1)}M`} color="neutral" />
            <RiskRow label="Daily turnover"     tooltip={GLOSSARY.turnover}  value={`${s.turnoverPerDay.toFixed(2)}×`} sub="per day" />
            <RiskRow label="Capacity check"     value={s.checks.capacityTest.toUpperCase()} color={s.checks.capacityTest === "pass" ? "positive" : s.checks.capacityTest === "warn" ? "neutral" : "negative"} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-elevated border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Portfolio Risk</h2>
          </div>
          <div className="px-5 divide-y divide-border">
            <RiskRow
              label="Correlation to book"
              tooltip={GLOSSARY.correlationToBook}
              value={s.correlationToBook.toFixed(2)}
              color={Math.abs(s.correlationToBook) <= 0.20 ? "positive" : Math.abs(s.correlationToBook) >= 0.50 ? "negative" : "neutral"}
            />
            <RiskRow
              label="Beta to Nifty"
              value={s.betaToNifty.toFixed(2)}
              color={Math.abs(s.betaToNifty) <= 0.15 ? "positive" : "neutral"}
            />
            <RiskRow label="Max drawdown (full)" tooltip={GLOSSARY.drawdown} value={`${s.maxDrawdownPct.toFixed(1)}%`} color="negative" />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Reviewer summary */}
      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-text-primary">Validator Summary</h2>
          <span className="text-2xs font-mono text-text-tertiary flex-shrink-0">
            Auto-generated · 26 Miles Quant Desk
          </span>
        </div>
        <p className="text-sm text-text-secondary leading-[1.85] max-w-3xl">{summary}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border">
          {([
            { status: s.checks.overfitting,  label: "Overfitting",  tooltip: GLOSSARY.overfitting  },
            { status: s.checks.dataLeakage,  label: "Data Leakage", tooltip: GLOSSARY.dataLeakage  },
            { status: s.checks.walkForward,  label: "Walk-forward", tooltip: GLOSSARY.walkForward  },
            { status: s.checks.capacityTest, label: "Capacity",     tooltip: GLOSSARY.capacity     },
          ] as { status: "pass" | "warn" | "fail"; label: string; tooltip: string }[]).map(({ status, label, tooltip }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <CheckBadge status={status} />
              <MetricLabel label={label} tooltip={tooltip} labelClassName="text-xs text-text-secondary" />
            </span>
          ))}
        </div>
      </section>

    </PageContainer>
  );
}
