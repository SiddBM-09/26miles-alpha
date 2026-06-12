"use client";

import {
  ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer,
  type TooltipProps,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// Types passed from server
// ─────────────────────────────────────────────────────────────────────────────

export interface EquityPoint {
  date: string;
  is:   number | null;
  oos:  number | null;
}

export interface DrawdownPoint {
  date:     string;
  dd:       number;   // e.g. -7.3  (always ≤ 0)
  inSample: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  const [y, m] = d.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

function sparseTicks(data: { date: string }[], n = 6): string[] {
  if (data.length <= n) return data.map((d) => d.date);
  const step = Math.floor(data.length / n);
  return data.filter((_, i) => i % step === 0).map((d) => d.date);
}

// Shared axis/grid constants matching the design system
const TICK  = { fill: "#4D5562", fontSize: 10, fontFamily: "var(--font-mono)" };
const GRID  = "rgba(255,255,255,0.045)";
const CURSOR = { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 };

// ─────────────────────────────────────────────────────────────────────────────
// Equity curve tooltip
// ─────────────────────────────────────────────────────────────────────────────

function EquityTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const is  = payload.find((p) => p.dataKey === "is")?.value;
  const oos = payload.find((p) => p.dataKey === "oos")?.value;

  return (
    <div className="rounded border border-border bg-elevated/98 px-3 py-2 text-xs space-y-1.5 min-w-[140px]">
      <p className="font-mono font-medium text-text-primary border-b border-border pb-1.5 tracking-wide">
        {fmtDate(label as string)}
      </p>
      {is != null && (
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary font-mono">IS</span>
          <span className="font-mono tabular-nums text-text-tertiary">{(is as number).toFixed(1)}</span>
        </div>
      )}
      {oos != null && (
        <div className="flex justify-between gap-4">
          <span className="text-accent font-mono">OOS</span>
          <span className="font-mono tabular-nums text-accent">{(oos as number).toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Equity curve chart
// ─────────────────────────────────────────────────────────────────────────────

interface EquityCurveChartProps {
  data:           EquityPoint[];
  boundaryDate:   string | null;   // first OOS date; null if all IS
}

export function EquityCurveChart({ data, boundaryDate }: EquityCurveChartProps) {
  const ticks     = sparseTicks(data);
  const firstDate = data[0]?.date ?? "";
  const lastDate  = data[data.length - 1]?.date ?? "";

  const allValues = data.flatMap((d) => [d.is, d.oos]).filter((v): v is number => v != null);
  const yMin = Math.floor(Math.min(...allValues) / 5) * 5 - 2;
  const yMax = Math.ceil (Math.max(...allValues) / 5) * 5 + 2;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />

        {/* Background regions */}
        {boundaryDate ? (
          <>
            {/* IS region — very subtle dark wash */}
            <ReferenceArea
              x1={firstDate} x2={boundaryDate}
              fill="rgba(30,34,46,0.40)" fillOpacity={1}
              label={{
                value: "IN-SAMPLE", position: "insideTopLeft",
                fill: "#4D5562", fontSize: 9,
                fontFamily: "var(--font-mono)",
                fontWeight: 600, letterSpacing: 2, dx: 10, dy: 12,
              }}
            />
            {/* OOS region — faint accent wash, this is the hero */}
            <ReferenceArea
              x1={boundaryDate} x2={lastDate}
              fill="rgba(170,255,62,0.025)" fillOpacity={1}
              label={{
                value: "OUT-OF-SAMPLE", position: "insideTopLeft",
                fill: "#AAFF3E", fontSize: 9,
                fontFamily: "var(--font-mono)",
                fontWeight: 600, letterSpacing: 2, dx: 10, dy: 12,
              }}
            />
            {/* Divider: accent-tinted dashed vertical */}
            <ReferenceLine
              x={boundaryDate}
              stroke="rgba(170,255,62,0.35)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          </>
        ) : (
          <ReferenceArea
            x1={firstDate} x2={lastDate}
            fill="rgba(30,34,46,0.40)" fillOpacity={1}
            label={{
              value: "IN-SAMPLE", position: "insideTopLeft",
              fill: "#4D5562", fontSize: 9,
              fontFamily: "var(--font-mono)",
              fontWeight: 600, letterSpacing: 2, dx: 10, dy: 12,
            }}
          />
        )}

        {/* Baseline at 100 */}
        <ReferenceLine y={100} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />

        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={fmtDate}
          tick={TICK}
          axisLine={false} tickLine={false} tickMargin={8}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={TICK}
          axisLine={false} tickLine={false}
          width={36}
          tickFormatter={(v: number) => v.toFixed(0)}
        />
        <Tooltip content={<EquityTooltip />} cursor={CURSOR} />

        {/* IS line — muted, thin */}
        <Area
          dataKey="is"
          name="In-sample"
          stroke="#3D4251"
          strokeWidth={1}
          fill="rgba(85,93,112,0.04)"
          dot={false}
          activeDot={false}
          connectNulls={false}
          isAnimationActive={false}
        />

        {/* OOS line — accent, hero series */}
        <Area
          dataKey="oos"
          name="Out-of-sample"
          stroke="#AAFF3E"
          strokeWidth={1.5}
          fill="rgba(170,255,62,0.06)"
          dot={false}
          activeDot={{ r: 3, fill: "#AAFF3E", strokeWidth: 0 }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawdown tooltip
// ─────────────────────────────────────────────────────────────────────────────

function DrawdownTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const dd = payload[0]?.value as number;
  return (
    <div className="rounded border border-border bg-elevated/98 px-3 py-2 text-xs space-y-1 min-w-[130px]">
      <p className="font-mono font-medium text-text-primary border-b border-border pb-1.5 tracking-wide">
        {fmtDate(label as string)}
      </p>
      <div className="flex justify-between gap-4">
        <span className="text-text-tertiary font-mono">DD</span>
        <span className={`font-mono tabular-nums ${dd < -5 ? "text-loss" : dd < -2 ? "text-warn" : "text-text-secondary"}`}>
          {dd.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawdown / underwater chart
// ─────────────────────────────────────────────────────────────────────────────

interface DrawdownChartProps {
  data:         DrawdownPoint[];
  boundaryDate: string | null;
  minDD:        number;
}

export function DrawdownChart({ data, boundaryDate, minDD }: DrawdownChartProps) {
  const ticks     = sparseTicks(data);
  const firstDate = data[0]?.date ?? "";
  const lastDate  = data[data.length - 1]?.date ?? "";
  const yMin      = Math.floor(minDD / 5) * 5 - 2;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />

        {/* Background regions matching equity chart */}
        {boundaryDate ? (
          <>
            <ReferenceArea x1={firstDate} x2={boundaryDate} fill="rgba(30,34,46,0.30)" fillOpacity={1} />
            <ReferenceArea x1={boundaryDate} x2={lastDate}  fill="rgba(255,64,64,0.03)"  fillOpacity={1} />
            <ReferenceLine
              x={boundaryDate}
              stroke="rgba(170,255,62,0.35)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          </>
        ) : (
          <ReferenceArea x1={firstDate} x2={lastDate} fill="rgba(30,34,46,0.30)" fillOpacity={1} />
        )}

        {/* 0% baseline */}
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />

        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={fmtDate}
          tick={TICK}
          axisLine={false} tickLine={false} tickMargin={8}
        />
        <YAxis
          domain={[yMin, 0]}
          tick={TICK}
          axisLine={false} tickLine={false}
          width={36}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
        />
        <Tooltip content={<DrawdownTooltip />} cursor={CURSOR} />

        <Area
          dataKey="dd"
          stroke="#FF4040"
          strokeWidth={1.5}
          fill="rgba(255,64,64,0.10)"
          dot={false}
          activeDot={{ r: 3, fill: "#FF4040", strokeWidth: 0 }}
          isAnimationActive={false}
          baseValue={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
