import Link from "next/link";
import { ArrowRight, Lock, BarChart2, CheckCircle2, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { STRATEGIES } from "@/lib/mock/strategies";
import { RESEARCHERS } from "@/lib/mock/researchers";
import { LifecycleBadge, CheckBadge } from "@/components/ui/StatusBadge";
import { MetricLabel } from "@/components/ui/MetricLabel";
import { GLOSSARY } from "@/lib/glossary";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const top5 = STRATEGIES
  .filter((s) => s.lifecycleState === "live")
  .sort((a, b) => b.oosSharp - a.oosSharp)
  .slice(0, 5);

// ─────────────────────────────────────────────────────────────────────────────
// Hero validation card — the platform's "specimen"
// ─────────────────────────────────────────────────────────────────────────────

function HeroValidationCard() {
  const bars = [62, 71, 68, 80, 76, 84, 79, 90, 88, 96, 92, 100];

  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0 font-mono">
      <div className="bg-surface border border-border rounded-lg overflow-hidden">

        {/* Terminal-style title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-elevated">
          <div className="flex items-center gap-3">
            {/* Terminal dots — decorative */}
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-loss/60" />
              <span className="h-2 w-2 rounded-full bg-warn/60" />
              <span className="h-2 w-2 rounded-full bg-profit/60" />
            </div>
            <span className="text-2xs text-text-tertiary uppercase tracking-widest">
              validation_report.json
            </span>
          </div>
          <LifecycleBadge state="live" />
        </div>

        {/* Strategy name row */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-text-tertiary uppercase tracking-widest mb-0.5">strategy</p>
          <p className="text-sm font-semibold text-text-primary">Nifty Vol Surface Arb</p>
        </div>

        {/* Metric grid — 2×2 */}
        <div className="grid grid-cols-2 border-b border-border">
          {([
            { label: "OOS Sharpe",   tooltip: GLOSSARY.sharpeRatio, value: "1.84",  sub: "out-of-sample",  color: "text-profit" },
            { label: "Max Drawdown", tooltip: GLOSSARY.drawdown,    value: "−7.3%", sub: "since inception", color: "text-loss"   },
            { label: "Capacity",     tooltip: GLOSSARY.capacity,    value: "$8.5M", sub: "est. AUM ceiling",color: "text-text-primary" },
            { label: "Turnover",     tooltip: GLOSSARY.turnover,    value: "2.1×",  sub: "per day",         color: "text-text-primary" },
          ]).map(({ label, tooltip, value, sub, color }, i) => (
            <div
              key={label}
              className={cn(
                "px-4 py-3",
                i % 2 === 0 ? "border-r border-border" : "",
                i < 2      ? "border-b border-border"  : "",
              )}
            >
              <MetricLabel
                label={label}
                tooltip={tooltip}
                labelClassName="text-2xs text-text-tertiary uppercase tracking-wider"
              />
              <p className={cn("text-lg font-semibold tabular-nums mt-1 leading-none", color)}>
                {value}
              </p>
              <p className="text-2xs text-text-tertiary mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Checks row */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-elevated/50">
          <CheckBadge status="pass" label="Overfitting" />
          <CheckBadge status="pass" label="Data Leakage" />
          <CheckBadge status="pass" label="Walk-Forward" />
        </div>

        {/* Equity sparkline */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xs text-text-tertiary uppercase tracking-wider">Equity curve — OOS, 12 mo</p>
            <span className="text-2xs text-profit tabular-nums">+18.4% YTD</span>
          </div>
          <div className="flex items-end gap-0.5 h-8">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-accent/25 rounded-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-2xs text-text-tertiary">Jun '25</span>
            <span className="text-2xs text-text-tertiary">Jun '26</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">

      {/* Hairline grid — terminal/data aesthetic */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "48px 48px",
        }}
      />

      {/* Vignette — fades the grid at edges */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-canvas/0 via-canvas/0 to-canvas" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-canvas via-canvas/0 to-canvas" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

          {/* Left — copy */}
          <div className="flex-1 text-center lg:text-left">

            {/* Status ticker — terminal mono label */}
            <div className="inline-flex items-center gap-2 rounded border border-border bg-elevated px-2.5 py-1 mb-8">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-profit opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-profit" />
              </span>
              <span className="font-mono text-2xs text-text-secondary uppercase tracking-widest">
                $47.2M AUM · 9 strategies live
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary leading-[1.08] mb-5">
              Turn your alpha
              <br />
              into income.
            </h1>

            <p className="text-base text-text-secondary leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
              Upload a strategy. We validate it with rigorous out-of-sample
              testing, walk-forward analysis, and overfitting checks.
              Strategies that pass get 26 Miles' own capital behind them —
              and you earn a performance share of every rupee of P&amp;L.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-12">
              <Link href="/submit" className="btn-primary">
                Submit a Strategy
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/leaderboard" className="btn-ghost">
                View Leaderboard
              </Link>
            </div>

            {/* Proof stats — mono table */}
            <div className="inline-grid grid-cols-3 gap-px border border-border rounded-lg overflow-hidden bg-border">
              {[
                { value: "248",   label: "Strategies reviewed" },
                { value: "1.47",  label: "Avg OOS Sharpe" },
                { value: "₹3.2L", label: "Avg monthly payout" },
              ].map(({ value, label }) => (
                <div key={label} className="bg-surface px-4 py-3 text-center lg:text-left">
                  <div className="font-mono text-lg font-semibold text-text-primary tabular-nums">{value}</div>
                  <div className="text-2xs text-text-tertiary mt-0.5 leading-snug">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — card */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <HeroValidationCard />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How it works — three steps
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    title: "Submit your strategy",
    body: "Upload your signal logic, a backtest, and supporting code. We timestamp everything on receipt — establishing your IP provenance before any review begins.",
    detail: "Python · R · Julia · Signal files · AI builder",
  },
  {
    num: "02",
    title: "We validate it",
    body: "Our quant team runs walk-forward stability tests, deflated Sharpe, probability of backtest overfitting, data-leakage audit, and capacity estimation.",
    detail: "4–6 weeks · Full written report · Resubmission allowed",
  },
  {
    num: "03",
    title: "You earn",
    body: "Strategies that pass go live with 26 Miles' own capital. You receive a monthly retainer from day one, plus a performance share tracked against a transparent HWM.",
    detail: "Monthly payouts · HWM tracked · No lock-in",
  },
];

function HowItWorks() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">

        <div className="mb-12">
          <p className="label-caps-accent mb-3">Process</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
            From signal to income in three steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
          {STEPS.map(({ num, title, body, detail }, i) => (
            <div
              key={num}
              className="relative bg-surface p-8 flex flex-col gap-4"
            >
              {/* Step connector on desktop */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:flex absolute top-8 -right-3 z-10 h-5 w-5 items-center justify-center rounded bg-elevated border border-border">
                  <ChevronRight className="h-3 w-3 text-text-tertiary" />
                </div>
              )}

              {/* Number + rule */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-semibold text-accent tabular-nums">{num}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed flex-1">{body}</p>

              <p className="font-mono text-2xs text-text-tertiary pt-3 border-t border-border leading-relaxed">
                {detail}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IP + Payouts — two-column trust section
// ─────────────────────────────────────────────────────────────────────────────

function TrustSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden border border-border">

          {/* IP Protection */}
          <div className="bg-surface p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-elevated border border-border">
                <Lock className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Your IP stays yours.</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              You retain full ownership of every strategy you submit.
              We never redistribute your code, signals, or methodology to
              third parties. Submission is timestamp-anchored — the
              receipt hash establishes provenance before any reviewer
              sees your work.
            </p>
            <ul className="space-y-2">
              {[
                "Encrypted at rest and in transit",
                "Timestamped receipt on every submission",
                "NDA-backed review process",
                "Withdraw at any time",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <CheckCircle2 className="h-3.5 w-3.5 text-profit flex-shrink-0" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Transparent payouts */}
          <div className="bg-surface p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-elevated border border-border">
                <BarChart2 className="h-4 w-4 text-profit" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Payouts with no black boxes.</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every payout is calculated against a published high-water
              mark. You see the same P&amp;L attribution we do — daily
              strategy NAV, allocated AUM, and your exact fee accrual —
              from a live dashboard updated each evening.
            </p>

            {/* Sample statement — data table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-3 py-2 bg-elevated border-b border-border">
                <span className="th">Sample monthly statement — May '26</span>
              </div>
              {[
                { label: "Monthly retainer",      value: "₹65,000",   highlight: false },
                { label: "Live P&L",               value: "+₹4.82L",   highlight: false },
                { label: "Performance share (18%)", value: "₹86,760",   highlight: false },
                { label: "Total payout",           value: "₹1,51,760", highlight: true  },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 border-b border-border last:border-b-0 text-sm",
                    highlight && "bg-profit/[0.05]"
                  )}
                >
                  <span className={highlight ? "text-text-primary font-medium" : "text-text-secondary"}>
                    {label}
                  </span>
                  <span className={cn(
                    "font-mono tabular-nums",
                    highlight ? "text-profit font-semibold" : "text-text-primary"
                  )}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live strategies leaderboard strip
// ─────────────────────────────────────────────────────────────────────────────

function LeaderboardStrip() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">

        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="label-caps-accent mb-3">Live strategies</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
              26 Miles capital deployed, ranked by OOS Sharpe.
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Backtests are shown for context only. They carry zero ranking weight.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="flex-shrink-0 hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Full leaderboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">

          {/* Header */}
          <div className="hidden sm:grid grid-cols-[2rem_1fr_7rem_6rem_6rem_6rem_7rem] gap-x-4 px-4 py-2.5 bg-elevated border-b border-border">
            {([
              { h: "#" },
              { h: "Strategy" },
              { h: "Asset class" },
              { h: "OOS Sharpe",  tooltip: GLOSSARY.sharpeRatio },
              { h: "Backtest",    tooltip: GLOSSARY.inSample    },
              { h: "Max DD",      tooltip: GLOSSARY.drawdown    },
              { h: "State",       tooltip: GLOSSARY.lifecycleState },
            ] as { h: string; tooltip?: string }[]).map(({ h, tooltip }) => (
              <span key={h} className="th">
                {tooltip
                  ? <MetricLabel label={h} tooltip={tooltip} labelClassName="th" />
                  : h}
              </span>
            ))}
          </div>

          {top5.map((s, i) => {
            const owner = RESEARCHERS.find((r) => r.id === s.ownerId);
            const sharpeUp = s.oosSharp >= 1.2;
            return (
              <Link
                key={s.id}
                href={`/strategy/${s.id}`}
                className="group block border-b border-border last:border-b-0 hover:bg-elevated/70 transition-colors"
              >
                {/* Mobile */}
                <div className="sm:hidden px-4 py-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xs text-text-tertiary w-4 tabular-nums">{i + 1}</span>
                      <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{s.name}</span>
                    </div>
                    <LifecycleBadge state={s.lifecycleState} />
                  </div>
                  <div className="flex items-center gap-4 pl-6">
                    <span className="text-xs text-text-tertiary">{s.assetClass}</span>
                    <span className={cn("font-mono text-sm tabular-nums", sharpeUp ? "text-profit" : "text-text-primary")}>
                      {s.oosSharp.toFixed(2)} SR
                    </span>
                    <span className="font-mono text-sm tabular-nums text-loss">
                      {s.maxDrawdownPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-[2rem_1fr_7rem_6rem_6rem_6rem_7rem] gap-x-4 items-center px-4 py-3">
                  <span className="font-mono text-xs text-text-tertiary tabular-nums">{i + 1}</span>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                      {s.name}
                    </p>
                    <p className="font-mono text-2xs text-text-tertiary mt-0.5 truncate">
                      {owner?.handle ?? "—"}
                    </p>
                  </div>

                  <span className="text-xs text-text-secondary truncate">{s.assetClass}</span>

                  <div className="flex items-center gap-1.5">
                    {sharpeUp
                      ? <TrendingUp   className="h-3 w-3 text-profit flex-shrink-0" />
                      : <TrendingDown className="h-3 w-3 text-loss   flex-shrink-0" />}
                    <span className={cn(
                      "font-mono text-sm tabular-nums font-medium",
                      sharpeUp ? "text-profit" : "text-loss"
                    )}>
                      {s.oosSharp.toFixed(2)}
                    </span>
                  </div>

                  <span className="font-mono text-sm tabular-nums text-text-tertiary">
                    {s.backtestSharpe.toFixed(2)}
                  </span>

                  <span className="font-mono text-sm tabular-nums text-loss">
                    {s.maxDrawdownPct.toFixed(1)}%
                  </span>

                  <LifecycleBadge state={s.lifecycleState} />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="font-mono text-2xs text-text-tertiary">
            OOS Sharpe — true out-of-sample only · RF = 6% p.a.
          </p>
          <Link
            href="/leaderboard"
            className="sm:hidden inline-flex items-center gap-1 text-sm text-accent font-medium"
          >
            Full leaderboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-lg border border-border bg-surface overflow-hidden">

          {/* Accent hairline at top edge */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

          <div className="px-8 py-14 sm:px-14 flex flex-col sm:flex-row items-center justify-between gap-10">

            <div className="text-center sm:text-left max-w-xl">
              <p className="label-caps-accent mb-4">Start here</p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight mb-3">
                If you have edge, we have capital.
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                We accept strategies in any Indian-equity or F&amp;O market.
                No minimum track record required — just a coherent signal,
                a clean backtest, and a credible hypothesis.
              </p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-2 mt-5">
                {["Nifty &amp; Bank Nifty F&O", "NSE equities — any cap", "Multi-asset overlays"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 font-mono text-2xs text-text-tertiary">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center sm:items-end gap-3">
              <Link href="/submit" className="btn-primary px-6 py-3">
                Submit a Strategy
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="font-mono text-2xs text-text-tertiary">
                Free to submit · IP protected · No exclusivity
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <TrustSection />
      <LeaderboardStrip />
      <FinalCTA />
    </>
  );
}
