import Link from "next/link";
import { ArrowRight, Lock, BarChart2, ChevronRight, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
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
// Hero
// ─────────────────────────────────────────────────────────────────────────────

function HeroValidationCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      {/* Glow behind card */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-accent/20 via-transparent to-profit/10 blur-xl opacity-60" />

      <div className="relative bg-surface border border-border rounded-xl overflow-hidden shadow-card">
        {/* Card header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <p className="text-xs text-text-tertiary font-mono uppercase tracking-wider">Validation Report</p>
            <p className="text-sm font-medium text-text-primary mt-0.5">Nifty Vol Surface Arb</p>
          </div>
          <LifecycleBadge state="live" />
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-2 divide-x divide-y divide-border">
          {([
            { label: "OOS Sharpe",   tooltip: GLOSSARY.sharpeRatio, value: "1.84",  sub: "out-of-sample",   up: true  },
            { label: "Max Drawdown", tooltip: GLOSSARY.drawdown,    value: "−7.3%", sub: "since inception",  up: false },
            { label: "Capacity",     tooltip: GLOSSARY.capacity,    value: "$8.5M", sub: "est. AUM ceiling", up: null  },
            { label: "Turnover",     tooltip: GLOSSARY.turnover,    value: "2.1×",  sub: "per day",          up: null  },
          ] as { label: string; tooltip: string; value: string; sub: string; up: boolean | null }[]).map(({ label, tooltip, value, sub, up }) => (
            <div key={label} className="px-4 py-3">
              <MetricLabel label={label} tooltip={tooltip} labelClassName="text-2xs text-text-tertiary uppercase tracking-wider font-mono" />
              <p className={cn(
                "font-mono text-lg font-semibold tabular-nums mt-0.5",
                up === true  ? "text-profit" :
                up === false ? "text-loss"   : "text-text-primary"
              )}>
                {value}
              </p>
              <p className="text-2xs text-text-tertiary mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Checks row */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-elevated/40">
          <CheckBadge status="pass" label="Overfitting" />
          <CheckBadge status="pass" label="Data Leakage" />
          <CheckBadge status="pass" label="Walk-Forward" />
        </div>

        {/* Tiny equity sparkline bars */}
        <div className="px-4 pb-4 pt-1">
          <p className="text-2xs text-text-tertiary font-mono mb-2">Equity curve — last 12 mo (OOS)</p>
          <div className="flex items-end gap-0.5 h-10">
            {[62,71,68,80,76,84,79,90,88,96,92,100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-accent/30"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-2xs text-text-tertiary font-mono">Jun '25</span>
            <span className="text-2xs text-profit font-mono">+18.4% YTD</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Radial vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left — copy */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs text-accent font-mono mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              $47.2M AUM live across 9 strategies
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight text-text-primary leading-[1.1] mb-5">
              Turn your alpha
              <br />
              into income.
            </h1>

            <p className="text-md text-text-secondary leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
              Upload a strategy. We validate it with rigorous out-of-sample
              testing, walk-forward analysis, and overfitting checks.
              Strategies that pass get 26 Miles' own capital behind them —
              and you earn a performance share of every rupee of P&amp;L.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-12">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-medium bg-accent hover:bg-accent/90 text-white transition-colors shadow-glow"
              >
                Submit a Strategy
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-medium border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary transition-colors"
              >
                View Leaderboard
              </Link>
            </div>

            {/* Proof stats */}
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto lg:mx-0">
              {[
                { value: "248",  label: "Strategies reviewed" },
                { value: "1.47", label: "Avg live Sharpe (OOS)" },
                { value: "₹3.2L",label: "Avg monthly payout" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <div className="font-mono text-xl font-semibold text-text-primary tabular-nums">{value}</div>
                  <div className="text-2xs text-text-tertiary mt-0.5 leading-snug">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — validation card preview */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <HeroValidationCard />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How it works
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    title: "Submit your strategy",
    body: "Upload your signal logic, a backtest, and any supporting code. We timestamp everything on receipt — establishing your IP provenance before any review begins.",
    detail: "Python / R / Julia accepted · Backtest artefacts · Signal description",
  },
  {
    num: "02",
    title: "We validate it",
    body: "Our quant team runs a battery of OOS tests: walk-forward stability, deflated Sharpe, probability of backtest overfitting, data-leakage audit, and capacity estimation.",
    detail: "Typically 4–6 weeks · Full written report · Resubmission allowed",
  },
  {
    num: "03",
    title: "You earn",
    body: "Strategies that pass go live with 26 Miles' own capital. You receive a fixed monthly retainer from day one, plus a performance share of live P&L tracked against a transparent high-water mark.",
    detail: "Monthly payouts · High-water mark tracked · No lock-in",
  },
];

function HowItWorks() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-xl mb-12">
          <p className="text-xs font-mono text-accent uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
            From signal to income in three steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-border rounded-xl overflow-hidden">
          {STEPS.map(({ num, title, body, detail }, i) => (
            <div
              key={num}
              className={cn(
                "relative p-8 flex flex-col gap-4",
                i < STEPS.length - 1 && "border-b lg:border-b-0 lg:border-r border-border"
              )}
            >
              {/* Connector arrow on desktop */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-elevated border border-border">
                  <ChevronRight className="h-3 w-3 text-text-tertiary" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-semibold text-border select-none">{num}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <h3 className="text-base font-semibold text-text-primary">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed flex-1">{body}</p>

              <p className="text-2xs font-mono text-text-tertiary pt-2 border-t border-border/60 leading-relaxed">
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
// Trust: IP protection + transparent payouts
// ─────────────────────────────────────────────────────────────────────────────

function TrustSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* IP Protection */}
          <div className="bg-surface border border-border rounded-xl p-8 flex flex-col gap-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Your IP stays yours.</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                You retain full ownership of every strategy you submit.
                We never redistribute your code, signals, or methodology to
                third parties. Submission is timestamp-anchored — the
                receipt hash establishes provenance before any reviewer
                sees your work.
              </p>
            </div>
            <ul className="space-y-2.5">
              {[
                "Encrypted at rest and in transit",
                "Timestamped receipt on every submission",
                "NDA-backed review process",
                "You can withdraw at any time",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-profit flex-shrink-0" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Transparent payouts */}
          <div className="bg-surface border border-border rounded-xl p-8 flex flex-col gap-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-profit/10 border border-profit/20">
              <BarChart2 className="h-5 w-5 text-profit" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Payouts with no black boxes.</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Every payout is calculated against a published high-water
                mark. You see the same P&amp;L attribution we do — daily
                strategy NAV, allocated AUM, and your exact fee accrual —
                from a live dashboard that updates each evening.
              </p>
            </div>

            {/* Mock payout breakdown */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-elevated border-b border-border">
                <span className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">
                  Sample monthly statement
                </span>
              </div>
              {[
                { label: "Monthly retainer",     value: "₹65,000",  dim: false },
                { label: "Live P&L (May '26)",    value: "+₹4.82L",  dim: false },
                { label: "Performance share (18%)", value: "₹86,760", dim: false },
                { label: "Total payout",          value: "₹1,51,760", dim: false, strong: true },
              ].map(({ label, value, strong }) => (
                <div key={label} className={cn(
                  "flex items-center justify-between px-4 py-2.5 border-b border-border last:border-b-0 text-sm",
                  strong ? "bg-profit/5" : ""
                )}>
                  <span className={strong ? "text-text-primary font-medium" : "text-text-secondary"}>
                    {label}
                  </span>
                  <span className={cn(
                    "font-mono tabular-nums",
                    strong ? "text-profit font-semibold" : "text-text-primary"
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
// Top-5 leaderboard strip
// ─────────────────────────────────────────────────────────────────────────────

function LeaderboardStrip() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-mono text-accent uppercase tracking-widest mb-3">Leaderboard</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
              Live strategies with 26 Miles' capital deployed.
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-lg">
              Ranked by out-of-sample Sharpe — the only metric that matters.
              Backtests are shown for context, never for ranking.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="flex-shrink-0 hidden sm:inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
          >
            Full leaderboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Table */}
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[2rem_1fr_7rem_6rem_6rem_6rem_7rem] gap-x-4 px-5 py-2.5 bg-elevated border-b border-border">
            {([
              { h: "#",           tooltip: undefined },
              { h: "Strategy",    tooltip: undefined },
              { h: "Asset class", tooltip: undefined },
              { h: "OOS Sharpe",  tooltip: GLOSSARY.sharpeRatio },
              { h: "Backtest",    tooltip: GLOSSARY.inSample },
              { h: "Max DD",      tooltip: GLOSSARY.drawdown },
              { h: "State",       tooltip: GLOSSARY.lifecycleState },
            ] as { h: string; tooltip?: string }[]).map(({ h, tooltip }) => (
              <span key={h} className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">
                {tooltip
                  ? <MetricLabel label={h} tooltip={tooltip} labelClassName="text-2xs font-mono text-text-tertiary uppercase tracking-wider" />
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
                className="group block border-b border-border last:border-b-0 hover:bg-elevated/60 transition-colors"
              >
                {/* Mobile layout */}
                <div className="sm:hidden px-4 py-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-text-tertiary w-4">{i + 1}</span>
                      <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{s.name}</span>
                    </div>
                    <LifecycleBadge state={s.lifecycleState} />
                  </div>
                  <div className="flex items-center gap-4 pl-6">
                    <span className="text-xs text-text-tertiary">{s.assetClass}</span>
                    <span className={cn("font-mono text-sm tabular-nums", sharpeUp ? "text-profit" : "text-text-primary")}>
                      {s.oosSharp.toFixed(2)} Sharpe
                    </span>
                    <span className="font-mono text-sm tabular-nums text-loss">
                      {s.maxDrawdownPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid grid-cols-[2rem_1fr_7rem_6rem_6rem_6rem_7rem] gap-x-4 items-center px-5 py-3.5">
                  <span className="font-mono text-sm text-text-tertiary tabular-nums">{i + 1}</span>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                      {s.name}
                    </p>
                    <p className="text-2xs text-text-tertiary mt-0.5 truncate">
                      {owner?.handle ?? "—"}
                    </p>
                  </div>

                  <span className="text-xs text-text-secondary truncate">{s.assetClass}</span>

                  <div className="flex items-center gap-1">
                    {sharpeUp
                      ? <TrendingUp className="h-3 w-3 text-profit flex-shrink-0" />
                      : <TrendingDown className="h-3 w-3 text-loss flex-shrink-0" />
                    }
                    <span className={cn("font-mono text-sm tabular-nums font-medium", sharpeUp ? "text-profit" : "text-loss")}>
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
          <p className="text-xs text-text-tertiary font-mono">
            OOS Sharpe computed on true out-of-sample data only · RF = 6% per annum
          </p>
          <Link
            href="/leaderboard"
            className="sm:hidden inline-flex items-center gap-1.5 text-sm text-accent font-medium"
          >
            Full leaderboard <ArrowRight className="h-4 w-4" />
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
        <div className="relative rounded-2xl border border-accent/20 bg-surface overflow-hidden">
          {/* Background accent wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />

          <div className="relative px-8 py-14 sm:px-14 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="text-center sm:text-left max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight mb-3">
                If you have edge, we have capital.
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                We accept strategies in any Indian-equity or F&amp;O market.
                No minimum track record required — just a coherent signal,
                a clean backtest, and a credible hypothesis.
              </p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 mt-5">
                {[
                  "Nifty &amp; Bank Nifty F&O",
                  "NSE equities — any cap",
                  "Multi-asset overlays",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-xs text-text-tertiary font-mono">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center sm:items-end gap-3">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold bg-accent hover:bg-accent/90 text-white transition-colors shadow-glow whitespace-nowrap"
              >
                Submit a Strategy
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-2xs text-text-tertiary font-mono text-center sm:text-right">
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
