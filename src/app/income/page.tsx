"use client";

import Link from "next/link";
import { ArrowRight, DollarSign, TrendingUp, Shield, Award } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer,
} from "recharts";
import { PageContainer } from "@/components/AppShell";
import { MetricLabel } from "@/components/ui/MetricLabel";
import { GLOSSARY } from "@/lib/glossary";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const HWM_CHART = [
  { month: "M1", nav: 100.0, hwm: 100.0 },
  { month: "M2", nav: 102.4, hwm: 102.4 },
  { month: "M3", nav: 101.3, hwm: 102.4 },
  { month: "M4", nav: 101.8, hwm: 102.4 },
  { month: "M5", nav: 103.1, hwm: 103.1 },
  { month: "M6", nav: 104.2, hwm: 104.2 },
  { month: "M7", nav: 103.6, hwm: 104.2 },
  { month: "M8", nav: 105.0, hwm: 105.0 },
];

// Worked example: ₹10 Cr AUM · ₹65K retainer · 18% perf share
const EXAMPLE_ROWS = [
  {
    month: "M1",
    event: "Strategy goes live",
    nav: "100.0",
    hwmLabel: "Baseline",
    hwmStatus: "baseline" as const,
    pl: "—",
    perfShare: "₹0",
    retainer: "₹65K",
    total: "₹65K",
  },
  {
    month: "M2",
    event: "Strong month +2.4%",
    nav: "102.4",
    hwmLabel: "▲ New high",
    hwmStatus: "above" as const,
    pl: "+₹24.0L",
    perfShare: "₹4.32L",
    retainer: "₹65K",
    total: "₹4.97L",
  },
  {
    month: "M3",
    event: "Drawdown −1.1%",
    nav: "101.3",
    hwmLabel: "Below HWM",
    hwmStatus: "below" as const,
    pl: "—",
    perfShare: "₹0",
    retainer: "₹65K",
    total: "₹65K",
  },
  {
    month: "M4",
    event: "Partial recovery +0.5%",
    nav: "101.8",
    hwmLabel: "Below HWM",
    hwmStatus: "below" as const,
    pl: "—",
    perfShare: "₹0",
    retainer: "₹65K",
    total: "₹65K",
  },
  {
    month: "M5",
    event: "New high +1.3%",
    nav: "103.1",
    hwmLabel: "▲ New high",
    hwmStatus: "above" as const,
    pl: "+₹7.0L above HWM",
    perfShare: "₹1.26L",
    retainer: "₹65K",
    total: "₹1.91L",
  },
];

const LEVEL_RANGES = [
  { level: "Analyst",   color: "text-text-secondary",   retainer: "₹15K – ₹22K / mo", share: "10%",     bonus: "₹25,000" },
  { level: "Associate", color: "text-accent",            retainer: "₹28K – ₹40K / mo", share: "12–15%",  bonus: "₹35,000" },
  { level: "Senior",    color: "text-profit",            retainer: "₹50K – ₹65K / mo", share: "16–18%",  bonus: "₹50,000" },
  { level: "Principal", color: "text-warn",              retainer: "₹75K – ₹1L / mo",  share: "18–20%",  bonus: "₹1,00,000" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HWM chart sub-components
// ─────────────────────────────────────────────────────────────────────────────

function HWMTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as { month: string; nav: number; hwm: number };
  const above = d.nav >= d.hwm - 0.01;
  return (
    <div className="rounded border border-border bg-elevated px-3 py-2 text-xs font-mono">
      <p className="text-text-secondary mb-1.5 font-medium">{d.month}</p>
      <p className="text-profit">NAV  {d.nav.toFixed(1)}</p>
      <p className="text-warn">HWM  {d.hwm.toFixed(1)}</p>
      <p className={cn("mt-1.5 pt-1.5 border-t border-border", above ? "text-profit" : "text-loss")}>
        {above ? "✓ Perf fee earned" : "✗ Below HWM — no fee"}
      </p>
    </div>
  );
}

function NavDot(props: any) {
  const { cx, cy, payload } = props;
  const below = (payload as { nav: number; hwm: number }).nav < payload.hwm - 0.01;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={below ? "#FF4040" : "#22D47A"}
      stroke="#0A0B0D"
      strokeWidth={1.5}
    />
  );
}

function HWMChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={HWM_CHART} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.045)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: "#4D5562", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[98.5, 106.5]}
          tickCount={5}
          tick={{ fontSize: 10, fill: "#4D5562", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v.toFixed(0)}
        />
        <ChartTooltip content={<HWMTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }} />

        {/* HWM — step function, warn dashed */}
        <Line
          type="stepAfter"
          dataKey="hwm"
          stroke="#F5A623"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          activeDot={false}
          name="HWM"
        />

        {/* NAV — smooth, colored dots per-point */}
        <Line
          type="monotone"
          dataKey="nav"
          stroke="#22D47A"
          strokeWidth={1.5}
          dot={<NavDot />}
          activeDot={{ r: 4, fill: "#22D47A", stroke: "#0A0B0D", strokeWidth: 1.5 }}
          name="NAV"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Income component card
// ─────────────────────────────────────────────────────────────────────────────

interface CardDef {
  num: string;
  Icon: React.ElementType;
  title: string;
  tooltip: string;
  description: string;
  detail: string;
  border: string;
  bg: string;
  iconCls: string;
  numCls: string;
}

const CARDS: CardDef[] = [
  {
    num: "01",
    Icon: DollarSign,
    title: "Base Retainer",
    tooltip:
      "A fixed monthly payment made by 26 Miles Capital while your strategy is active in the book — paid every month regardless of performance.",
    description:
      "The moment your strategy enters the book, 26 Miles begins paying you a fixed monthly retainer. This is unconditional — paid in full every month your strategy is active, whether that month was up or down.",
    detail: "₹15K – ₹1L / month · Level-dependent · Starts at go-live",
    border: "border-accent/20 hover:border-accent/40",
    bg: "bg-accent/5",
    iconCls: "bg-accent/10 border-accent/20 text-accent",
    numCls: "text-accent",
  },
  {
    num: "02",
    Icon: TrendingUp,
    title: "Performance Share",
    tooltip:
      "A percentage of the net profit your strategy generates on 26 Miles' allocated capital, paid monthly whenever NAV is above the high-water mark.",
    description:
      "When your strategy generates profit above its high-water mark, 26 Miles pays you a share of that profit. The rate is agreed at go-live and written into your contributor agreement.",
    detail: "10–20% of net P&L · Fixed rate · Paid monthly",
    border: "border-profit/20 hover:border-profit/40",
    bg: "bg-profit/5",
    iconCls: "bg-profit/10 border-profit/20 text-profit",
    numCls: "text-profit",
  },
  {
    num: "03",
    Icon: Shield,
    title: "High-Water Mark",
    tooltip:
      "The highest NAV your strategy has previously reached. A performance share is only paid on profit that genuinely exceeds this mark — you never earn twice on the same gain.",
    description:
      "If your strategy dips below a prior peak and then recovers, you earn a performance share only on the profit that is truly new — above the previous peak. The mark rises with each new high and never resets.",
    detail: "Carries forward indefinitely · Never resets · Applied per strategy",
    border: "border-warn/20 hover:border-warn/40",
    bg: "bg-warn/5",
    iconCls: "bg-warn/10 border-warn/20 text-warn",
    numCls: "text-warn",
  },
  {
    num: "04",
    Icon: Award,
    title: "Selection Bonus",
    tooltip:
      "A one-time payment made by 26 Miles Capital when your strategy passes validation and goes live with real capital for the first time.",
    description:
      "When your strategy clears the validation process and 26 Miles allocates real capital to it for the first time, you receive a one-time selection bonus — on top of and separate from your ongoing retainer and performance share.",
    detail: "₹25K – ₹1L · One-time · Paid at go-live",
    border: "border-accent/20 hover:border-accent/40",
    bg: "bg-accent/5",
    iconCls: "bg-accent/10 border-accent/20 text-accent",
    numCls: "text-accent",
  },
];

function ComponentCard({ card }: { card: CardDef }) {
  const { Icon } = card;
  return (
    <div className={cn(
      "rounded-lg border p-6 flex flex-col gap-5 transition-colors",
      card.bg, card.border
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border",
          card.iconCls
        )}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <span className={cn("font-mono text-3xl font-bold leading-none select-none opacity-20", card.numCls)}>
          {card.num}
        </span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-text-primary">
          <MetricLabel label={card.title} tooltip={card.tooltip} />
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">{card.description}</p>
      </div>

      <p className="text-2xs font-mono text-text-tertiary pt-3 border-t border-border/40 leading-relaxed">
        {card.detail}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function IncomePage() {
  return (
    <PageContainer className="space-y-14 max-w-5xl">

      {/* ── Hero ── */}
      <section className="space-y-6 pt-4">
        <div>
          <p className="text-xs font-mono text-accent uppercase tracking-widest mb-3">Income structure</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary leading-tight mb-4">
            How you earn from<br className="hidden sm:block" /> 26 Miles Capital.
          </h1>
          <p className="text-md text-text-secondary leading-relaxed max-w-2xl">
            26 Miles Capital is the sole allocator of capital on this platform. We evaluate
            your strategies, invest our own capital, and pay you directly every month.
            There are no outside investors, no crowdfunding, and no copy-trading.
            Your income comes entirely from 26 Miles.
          </p>
        </div>

        {/* Quick-stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
          {([
            { label: "Base retainer",     tooltip: GLOSSARY.retainer,         value: "₹15K – ₹1L", sub: "per month, while active"   },
            { label: "Performance share", tooltip: GLOSSARY.performanceShare,  value: "10 – 20%",    sub: "of net P&L above HWM"      },
            { label: "Selection bonus",   tooltip: GLOSSARY.selectionBonus,    value: "₹25K – ₹1L", sub: "one-time, paid at go-live"  },
          ] as { label: string; tooltip: string; value: string; sub: string }[]).map(({ label, tooltip, value, sub }) => (
            <div key={label} className="bg-surface px-6 py-5">
              <MetricLabel label={label} tooltip={tooltip} labelClassName="text-2xs font-mono text-text-tertiary uppercase tracking-wider" />
              <p className="font-mono text-xl font-semibold text-text-primary tabular-nums mt-1">{value}</p>
              <p className="text-2xs text-text-tertiary mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Four components ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Four ways you earn
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Every component is paid directly by 26 Miles — not by investors, not by fund subscribers.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CARDS.map((card) => (
            <ComponentCard key={card.num} card={card} />
          ))}
        </div>
      </section>

      {/* ── High-Water Mark deep dive ── */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left: explanation */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary tracking-tight">
                <MetricLabel
                  label="High-Water Mark"
                  tooltip="The highest NAV your strategy has previously reached. Performance fees only accrue on profit above this mark."
                  labelClassName="text-xl font-semibold text-text-primary"
                />
                {" "}in practice
              </h2>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                The chart below shows 8 months of strategy NAV against its high-water mark.
                Green dots indicate months where a performance share was earned. Red dots
                indicate months below the HWM — retainer only.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs font-mono">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-profit inline-block" />
                <span className="text-text-secondary">NAV (perf fee earned)</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-loss inline-block" />
                <span className="text-text-secondary">NAV (below HWM)</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-6 bg-warn inline-block" style={{ borderTop: "2px dashed #F5A623", height: 0 }} />
                <span className="text-text-secondary">HWM</span>
              </span>
            </div>

            {/* Key rule callout */}
            <div className="rounded-lg border border-warn/20 bg-warn/5 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-warn">The core rule</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                A performance share is paid only when NAV sets a new all-time high.
                Recovery from a drawdown earns only on the portion <em>above</em> the prior peak —
                never on recouped losses. The HWM never resets downward.
              </p>
            </div>
          </div>

          {/* Right: chart */}
          <div className="w-full lg:w-96 flex-shrink-0 card p-4">
            <HWMChart />
            <p className="text-2xs text-text-tertiary font-mono mt-2 text-center">
              NAV vs HWM · 8-month illustration · Hover for detail
            </p>
          </div>
        </div>
      </section>

      {/* ── Worked example ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Worked example</h2>
          <p className="text-sm text-text-secondary mt-1">
            A Senior-level researcher with one live strategy. 26 Miles pays all amounts below.
          </p>
        </div>

        {/* Assumptions */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["Allocated AUM", "₹10 Crore (26 Miles' capital)"],
            ["Monthly retainer", "₹65,000"],
            ["Performance share", "18% of net P&L above HWM"],
            ["Selection bonus", "₹50,000 (one-time, paid at go-live)"],
          ].map(([k, v]) => (
            <div key={k} className="text-xs font-mono">
              <span className="text-text-tertiary">{k}: </span>
              <span className="text-text-primary">{v}</span>
            </div>
          ))}
        </div>

        {/* Selection bonus callout */}
        <div className="flex items-center gap-4 rounded-lg border border-accent/20 bg-accent/5 px-5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
            <Award className="h-4.5 w-4.5 text-accent" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              <MetricLabel
                label="Selection Bonus"
                tooltip="One-time payment from 26 Miles when your strategy passes validation and is allocated real capital."
                labelClassName="text-sm font-semibold text-text-primary"
              />
              {" "}&mdash; ₹50,000 paid at go-live
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Paid once by 26 Miles the month your strategy first goes live. Does not repeat.
            </p>
          </div>
          <span className="ml-auto font-mono text-lg font-semibold text-accent tabular-nums flex-shrink-0">
            +₹50K
          </span>
        </div>

        {/* Monthly table */}
        <div className="border border-border rounded-lg overflow-hidden">

          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-[4rem_1fr_5rem_5rem_8rem_6rem_5rem_6rem] gap-x-3 px-5 py-2.5 bg-elevated border-b border-border">
            {[
              "Month",
              "Event",
              "NAV",
              "vs HWM",
              "Strategy P&L",
              "Perf share",
              "Retainer",
              "Your total",
            ].map((h) => (
              <span key={h} className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {EXAMPLE_ROWS.map((row) => {
            const isAbove  = row.hwmStatus === "above";
            const isBelow  = row.hwmStatus === "below";

            return (
              <div
                key={row.month}
                className={cn(
                  "border-b border-border last:border-b-0",
                  isAbove && "bg-profit/[0.04]",
                  isBelow && "bg-loss/[0.03]",
                )}
              >
                {/* Mobile */}
                <div className="sm:hidden px-4 py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-text-tertiary w-6">{row.month}</span>
                      <span className="text-sm font-medium text-text-primary">{row.event}</span>
                    </div>
                    <span className={cn(
                      "font-mono text-sm font-semibold tabular-nums",
                      isAbove ? "text-profit" : "text-text-primary"
                    )}>{row.total}</span>
                  </div>
                  <div className="flex items-center gap-4 pl-8 text-xs font-mono text-text-tertiary">
                    <span className={isBelow ? "text-loss" : ""}>{row.hwmLabel}</span>
                    <span className="text-text-secondary">ret. {row.retainer}</span>
                    {isAbove && <span className="text-profit">perf {row.perfShare}</span>}
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden sm:grid sm:grid-cols-[4rem_1fr_5rem_5rem_8rem_6rem_5rem_6rem] gap-x-3 items-center px-5 py-3">
                  <span className="font-mono text-xs text-text-tertiary tabular-nums">{row.month}</span>

                  <span className="text-sm text-text-secondary leading-snug">{row.event}</span>

                  <span className="font-mono text-xs tabular-nums text-text-primary">{row.nav}</span>

                  <span className={cn(
                    "text-xs font-mono tabular-nums",
                    isAbove  ? "text-profit" :
                    isBelow  ? "text-loss"   : "text-text-tertiary"
                  )}>
                    {row.hwmLabel}
                  </span>

                  <span className="text-xs font-mono tabular-nums text-text-secondary leading-snug">
                    {row.pl}
                  </span>

                  <span className={cn(
                    "font-mono text-xs tabular-nums font-medium",
                    isAbove ? "text-profit" : "text-text-tertiary"
                  )}>
                    {row.perfShare}
                  </span>

                  <span className="font-mono text-xs tabular-nums text-text-secondary">
                    {row.retainer}
                  </span>

                  <span className={cn(
                    "font-mono text-sm tabular-nums font-semibold",
                    isAbove ? "text-profit" : "text-text-primary"
                  )}>
                    {row.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-2xs font-mono text-text-tertiary">
          <span><span className="inline-block h-2 w-2 rounded-sm bg-profit/20 mr-1" />Green row — performance share paid above HWM</span>
          <span><span className="inline-block h-2 w-2 rounded-sm bg-loss/20 mr-1" />Muted row — below HWM, retainer only</span>
          <span>M5: perf fee on new profit only — (103.1 − 102.4) / 100 × ₹10 Cr = ₹7.0L, share = ₹1.26L</span>
        </div>
      </section>

      {/* ── Ranges by level ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Ranges by level</h2>
          <p className="text-sm text-text-secondary mt-1">
            Rates are confirmed in your contributor agreement at go-live and reviewed on level-up.
          </p>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
          {/* Header */}
          <div className="grid grid-cols-[6rem_1fr_6rem_8rem] sm:grid-cols-[8rem_1fr_8rem_10rem] gap-x-4 px-5 py-2.5 bg-elevated border-b border-border">
            {([
              { h: "Level",            tooltip: undefined },
              { h: "Monthly retainer", tooltip: GLOSSARY.retainer },
              { h: "Perf share",       tooltip: GLOSSARY.performanceShare },
              { h: "Selection bonus",  tooltip: GLOSSARY.selectionBonus },
            ] as { h: string; tooltip?: string }[]).map(({ h, tooltip }) => (
              <span key={h} className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">
                {tooltip
                  ? <MetricLabel label={h} tooltip={tooltip} labelClassName="text-2xs font-mono text-text-tertiary uppercase tracking-wider" />
                  : h}
              </span>
            ))}
          </div>

          {LEVEL_RANGES.map((row, i) => (
            <div
              key={row.level}
              className={cn(
                "grid grid-cols-[6rem_1fr_6rem_8rem] sm:grid-cols-[8rem_1fr_8rem_10rem] gap-x-4 items-center px-5 py-2.5",
                "border-b border-border last:border-b-0",
                i % 2 === 0 ? "bg-surface" : "bg-elevated/30",
              )}
            >
              <span className={cn("text-sm font-semibold", row.color)}>{row.level}</span>
              <span className="font-mono text-sm tabular-nums text-text-primary">{row.retainer}</span>
              <span className="font-mono text-sm tabular-nums text-text-primary">{row.share}</span>
              <span className="font-mono text-sm tabular-nums text-text-primary">{row.bonus}</span>
            </div>
          ))}
          </div>
        </div>

        <p className="text-2xs text-text-tertiary font-mono">
          Level is assigned at first go-live and reviewed when additional strategies go live or Alpha Score crosses a tier threshold.
        </p>
      </section>

      {/* ── Plain-language summary ── */}
      <section className="card p-7 space-y-4">
        <h2 className="text-base font-semibold text-text-primary">Summary — in plain language</h2>
        <div className="space-y-3">
          {[
            {
              label: <MetricLabel label="Base Retainer" tooltip="A fixed monthly payment from 26 Miles while your strategy is in the book." labelClassName="font-medium text-text-primary" />,
              body: "You receive a fixed monthly payment from 26 Miles Capital every month your strategy is active. No performance required.",
            },
            {
              label: <MetricLabel label="Performance Share" tooltip="Your cut of the net profit the strategy earns on 26 Miles' capital — only when NAV is above the HWM." labelClassName="font-medium text-text-primary" />,
              body: "When your strategy earns money above its prior peak, 26 Miles pays you a percentage of that profit. This is on top of your retainer.",
            },
            {
              label: <MetricLabel label="High-Water Mark" tooltip="The highest NAV previously reached. Perf share only accrues on genuinely new profit above this level." labelClassName="font-medium text-text-primary" />,
              body: "If the strategy dips and then recovers, you earn only on the profit that exceeds the previous peak. You are never paid twice for the same gain.",
            },
            {
              label: <MetricLabel label="Selection Bonus" tooltip="A one-time payment from 26 Miles Capital when your strategy first goes live with real capital." labelClassName="font-medium text-text-primary" />,
              body: "When 26 Miles first allocates real capital to your strategy, you receive a one-time bonus. It is paid once, at the moment of go-live.",
            },
          ].map(({ label, body }, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-border last:border-b-0">
              <div className="w-40 flex-shrink-0 text-sm">{label}</div>
              <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative rounded-2xl border border-accent/20 bg-surface overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
        <div className="relative px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-text-primary tracking-tight mb-1">
              If you have edge, we have capital.
            </h2>
            <p className="text-sm text-text-secondary max-w-lg">
              Submit your strategy today. 26 Miles handles validation, capital allocation,
              and pays you directly — no investors to pitch, no fund structure to navigate.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center sm:items-end gap-2">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-semibold
                         bg-accent hover:bg-accent/90 text-canvas transition-colors whitespace-nowrap"
            >
              Submit a Strategy
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-2xs text-text-tertiary font-mono">Free to submit · IP protected · No exclusivity</p>
          </div>
        </div>
      </section>

    </PageContainer>
  );
}
