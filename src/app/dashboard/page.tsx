import Link from "next/link";
import { ArrowUpRight, MapPin, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RESEARCHERS } from "@/lib/mock/researchers";
import { STRATEGIES }  from "@/lib/mock/strategies";
import { getEarnings } from "@/lib/mock/earnings";
import { PageContainer } from "@/components/AppShell";
import { MetricCard }    from "@/components/ui/MetricCard";
import { MetricLabel }   from "@/components/ui/MetricLabel";
import { LifecycleBadge } from "@/components/ui/StatusBadge";
import { GLOSSARY } from "@/lib/glossary";
import { SectionHeading, SectionDivider } from "@/components/ui/SectionHeading";
import { EarningsChart, type EarningsChartPoint } from "@/components/dashboard/EarningsChart";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Mock session — hardcoded to r01 for prototype.
// All earnings, payouts, and allocated capital on this page are scoped
// exclusively to this researcher ID. No other researcher's monetary data
// is imported or rendered.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_USER_ID = "r01";

// ─────────────────────────────────────────────────────────────────────────────
// Data helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtINR(n: number, decimals = 1): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(decimals)}Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(decimals)}L`;
  if (n >= 1_000)       return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

function monthLabel(iso: string): string {
  const [y, m] = iso.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(m) - 1]} '${y.slice(2)}`;
}

interface StrategyRow {
  id: string;
  name: string;
  lifecycleState: string;
  oosSharp: number;
  allocatedINR: number;
  monthlyPnlINR: number;
  annualReturnPct: number;
  maxDrawdownPct: number;
}

function buildStrategyRows(ownerId: string, totalAUM: number): StrategyRow[] {
  const all   = STRATEGIES.filter((s) => s.ownerId === ownerId);
  const live  = all.filter((s) => s.lifecycleState === "live");
  const totalCapacity = live.reduce((sum, s) => sum + s.capacityUSDM, 0);

  return all.map((s) => {
    const isLive = s.lifecycleState === "live";
    const allocatedINR =
      isLive && totalCapacity > 0
        ? Math.round((s.capacityUSDM / totalCapacity) * totalAUM)
        : 0;

    let monthlyPnlINR = 0;
    if (isLive && allocatedINR > 0) {
      const oos = s.equityCurve.filter((p) => !p.inSample);
      if (oos.length >= 2) {
        const ret = oos[oos.length - 1].value / oos[oos.length - 2].value - 1;
        monthlyPnlINR = Math.round(ret * allocatedINR);
      }
    }

    return {
      id:              s.id,
      name:            s.name,
      lifecycleState:  s.lifecycleState,
      oosSharp:        s.oosSharp,
      allocatedINR,
      monthlyPnlINR,
      annualReturnPct: s.annualReturnPct,
      maxDrawdownPct:  s.maxDrawdownPct,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function HWMStatusCard({
  currentNAV,
  hwmNAV,
}: {
  currentNAV: number;
  hwmNAV: number;
}) {
  const above = currentNAV >= hwmNAV;
  const pct   = ((currentNAV - hwmNAV) / hwmNAV) * 100;

  return (
    <div className={cn(
      "card p-4 flex flex-col gap-1 transition-colors",
      above ? "hover:border-profit/20" : "hover:border-loss/20"
    )}>
      <div className="flex items-center justify-between">
        <MetricLabel
          label="HWM Status"
          tooltip={GLOSSARY.hwm}
          labelClassName="text-xs text-text-secondary uppercase tracking-wider font-medium"
        />
        {above
          ? <TrendingUp  className="h-3.5 w-3.5 text-profit" strokeWidth={2} />
          : <TrendingDown className="h-3.5 w-3.5 text-loss"  strokeWidth={2} />
        }
      </div>

      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          above ? "text-profit" : "text-loss"
        )}>
          {above ? "Above" : "Below"}
        </span>
      </div>

      <span className={cn(
        "text-xs font-mono tabular-nums",
        above ? "text-profit" : "text-loss"
      )}>
        {above ? "+" : ""}{pct.toFixed(2)}% vs mark
      </span>

      <span className="text-2xs text-text-tertiary mt-0.5 font-mono tabular-nums">
        NAV {currentNAV.toFixed(1)} · HWM {hwmNAV.toFixed(1)}
      </span>
    </div>
  );
}

function StrategyTable({ rows }: { rows: StrategyRow[] }) {
  const live = rows.filter((r) => r.lifecycleState === "live");
  const rest = rows.filter((r) => r.lifecycleState !== "live");
  const ordered = [...live, ...rest];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_8rem_6rem_8rem_8rem] gap-x-4 px-5 py-2.5 bg-elevated border-b border-border">
        {([
          { h: "Strategy",  tooltip: undefined },
          { h: "State",     tooltip: GLOSSARY.lifecycleState },
          { h: "OOS Sharpe",tooltip: GLOSSARY.sharpeRatio },
          { h: "Allocated", tooltip: undefined },
          { h: "This month",tooltip: undefined },
        ] as { h: string; tooltip?: string }[]).map(({ h, tooltip }) => (
          <span key={h} className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">
            {tooltip
              ? <MetricLabel label={h} tooltip={tooltip} labelClassName="text-2xs font-mono text-text-tertiary uppercase tracking-wider" />
              : h}
          </span>
        ))}
      </div>

      {ordered.map((row) => {
        const sharpeColor =
          row.oosSharp >= 1.5 ? "text-profit" :
          row.oosSharp >= 1.0 ? "text-text-primary" :
          row.oosSharp > 0    ? "text-warn" : "text-text-tertiary";

        const pnlColor =
          row.monthlyPnlINR > 0 ? "text-profit" :
          row.monthlyPnlINR < 0 ? "text-loss"   : "text-text-tertiary";

        const PnlIcon =
          row.monthlyPnlINR > 0 ? TrendingUp :
          row.monthlyPnlINR < 0 ? TrendingDown : Minus;

        return (
          <Link
            key={row.id}
            href={`/strategy/${row.id}`}
            className="group block border-b border-border last:border-b-0 hover:bg-elevated/60 transition-colors"
          >
            {/* Mobile */}
            <div className="sm:hidden px-4 py-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                  {row.name}
                </span>
                <LifecycleBadge state={row.lifecycleState as any} />
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className={sharpeColor}>Sharpe {row.oosSharp.toFixed(2)}</span>
                {row.allocatedINR > 0 && (
                  <span className="text-text-secondary">{fmtINR(row.allocatedINR)}</span>
                )}
                {row.monthlyPnlINR !== 0 && (
                  <span className={pnlColor}>{row.monthlyPnlINR > 0 ? "+" : ""}{fmtINR(row.monthlyPnlINR)}</span>
                )}
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_8rem_6rem_8rem_8rem] gap-x-4 items-center px-5 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                    {row.name}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </div>

              <LifecycleBadge state={row.lifecycleState as any} />

              <span className={cn("font-mono text-sm tabular-nums font-medium", sharpeColor)}>
                {row.oosSharp > 0 ? row.oosSharp.toFixed(2) : "—"}
              </span>

              <span className={cn(
                "font-mono text-sm tabular-nums",
                row.allocatedINR > 0 ? "text-text-primary" : "text-text-tertiary"
              )}>
                {row.allocatedINR > 0 ? fmtINR(row.allocatedINR) : "—"}
              </span>

              <div className="flex items-center gap-1.5">
                {row.monthlyPnlINR !== 0 && (
                  <PnlIcon className={cn("h-3.5 w-3.5 flex-shrink-0", pnlColor)} strokeWidth={2} />
                )}
                <span className={cn("font-mono text-sm tabular-nums", pnlColor)}>
                  {row.monthlyPnlINR === 0
                    ? "—"
                    : `${row.monthlyPnlINR > 0 ? "+" : ""}${fmtINR(Math.abs(row.monthlyPnlINR))}`
                  }
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const researcher = RESEARCHERS.find((r) => r.id === MOCK_USER_ID)!;
  // getEarnings scopes to the session user's record only — never returns
  // another researcher's payouts, allocated capital, or earnings.
  const earnings   = getEarnings(MOCK_USER_ID)!;
  const stratRows  = buildStrategyRows(MOCK_USER_ID, earnings.allocatedAUM_INR);

  // This month = last payout entry
  const thisMonth  = earnings.monthlyPayouts[earnings.monthlyPayouts.length - 1];
  const prevMonth  = earnings.monthlyPayouts[earnings.monthlyPayouts.length - 2];
  const momChange  = thisMonth.total - prevMonth.total;

  // Chart data — cumulative rolling sum
  let running = 0;
  const chartData: EarningsChartPoint[] = earnings.monthlyPayouts.map((p) => {
    running += p.total;
    return {
      monthLabel: monthLabel(p.month),
      month:      p.month,
      retainer:   p.retainer,
      perfFee:    p.performanceFee,
      cumulative: running,
    };
  });

  // HWM milestone: pick the month with the largest single month-on-month gain
  // in the cumulative line — a proxy for when the HWM was raised
  let hwmMonth = chartData[0].month;
  let maxJump  = 0;
  for (let i = 1; i < chartData.length; i++) {
    const jump = chartData[i].perfFee;
    if (jump > maxJump) { maxJump = jump; hwmMonth = chartData[i].month; }
  }

  // Totals
  const totalLiveCapital = earnings.allocatedAUM_INR;
  const hwmAbove         = earnings.currentNAV >= earnings.hwmNAV;
  const hwmPct           = ((earnings.currentNAV - earnings.hwmNAV) / earnings.hwmNAV) * 100;

  return (
    <PageContainer className="space-y-8">

      {/* Prototype banner */}
      <div className="flex items-center gap-2 rounded border border-border bg-elevated/60 px-3 py-2 text-xs text-text-tertiary font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
        Prototype · Viewing as{" "}
        <span className="text-text-secondary font-medium">@{researcher.handle}</span>
      </div>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 font-mono text-lg font-semibold text-accent select-none">
            {researcher.handle.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-text-primary tracking-tight">
                @{researcher.handle}
              </h1>
              <span className={cn(
                "inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium border",
                researcher.level === "Principal" ? "bg-warn/10 text-warn border-warn/20"  :
                researcher.level === "Senior"    ? "bg-profit/10 text-profit border-profit/20" :
                "bg-accent/10 text-accent border-accent/20"
              )}>
                {researcher.level}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">{researcher.displayName}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />{researcher.city}, {researcher.country}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {new Date(researcher.joinedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </span>
              <span className="font-mono">
                Alpha Score{" "}
                <span className="text-profit font-medium">{researcher.alphaScore.toFixed(1)}</span>
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/submit"
          className="flex-shrink-0 self-start inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary transition-colors"
        >
          + Submit strategy
        </Link>
      </div>

      <SectionDivider />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="All-time earnings"
          value={fmtINR(earnings.allTimeEarnings)}
          subValue={`${fmtINR(earnings.ytdEarnings)} YTD`}
          trend="up"
          annotation="retainer + performance"
        />

        <MetricCard
          label="This month"
          value={fmtINR(thisMonth.total)}
          subValue={`${momChange >= 0 ? "+" : ""}${fmtINR(momChange)} vs last mo`}
          trend={momChange >= 0 ? "up" : "down"}
          annotation={monthLabel(thisMonth.month)}
        />

        <MetricCard
          label="Live capital"
          value={fmtINR(totalLiveCapital)}
          subValue={`${stratRows.filter((r) => r.lifecycleState === "live").length} strategies`}
          trend="up"
          annotation="allocated AUM"
        />

        <HWMStatusCard
          currentNAV={earnings.currentNAV}
          hwmNAV={earnings.hwmNAV}
        />
      </div>

      {/* Earnings chart */}
      <section className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <SectionHeading
            level="section"
            title="Earnings — trailing 12 months"
            subtitle="Stacked: retainer (base) + performance fee. Line: cumulative total."
          />
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-text-tertiary font-mono">Perf fee gate</p>
            <p className={cn(
              "text-sm font-mono font-medium tabular-nums mt-0.5",
              hwmAbove ? "text-profit" : "text-loss"
            )}>
              {hwmAbove ? "Open" : "Closed"}
            </p>
            <p className="text-2xs text-text-tertiary font-mono mt-0.5">
              NAV {earnings.currentNAV.toFixed(1)} vs HWM {earnings.hwmNAV.toFixed(1)}
            </p>
          </div>
        </div>

        <EarningsChart
          data={chartData}
          retainerMonthly={earnings.retainerMonthly}
          hwmMonth={hwmMonth}
          hwmLabel={`NAV ${earnings.hwmNAV.toFixed(1)} → ${earnings.currentNAV.toFixed(1)}`}
        />

        <p className="text-2xs text-text-tertiary font-mono leading-relaxed">
          Performance fees are only paid when strategy composite NAV exceeds its prior
          high-water mark (HWM {earnings.hwmNAV.toFixed(1)}).
          The dashed vertical marks the month the HWM was last raised.
        </p>
      </section>

      {/* Strategies table */}
      <section className="space-y-3">
        <SectionHeading
          level="section"
          title="Strategies"
          subtitle="OOS Sharpe and P&L figures use live and out-of-sample data only."
          action={
            <span className="text-2xs font-mono text-text-tertiary">
              {stratRows.filter((r) => r.lifecycleState === "live").length} live ·{" "}
              {stratRows.length} total
            </span>
          }
        />

        <StrategyTable rows={stratRows} />

        <p className="text-2xs text-text-tertiary font-mono">
          OOS Sharpe: annualised, RF = 6%. Monthly P&amp;L: last completed bar × allocated AUM.
          Click any row to view the full validation report.
        </p>
      </section>

    </PageContainer>
  );
}
