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

const TICK_STYLE = { fill: "#555d70", fontSize: 11, fontFamily: "Inter, system-ui, sans-serif" };
const GRID_COLOR = "#1f2430";

// ─────────────────────────────────────────────────────────────────────────────
// Equity curve tooltip
// ─────────────────────────────────────────────────────────────────────────────

function EquityTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const is  = payload.find((p) => p.dataKey === "is")?.value;
  const oos = payload.find((p) => p.dataKey === "oos")?.value;

  return (
    <div className="rounded-lg border border-border bg-elevated/95 backdrop-blur-sm px-3.5 py-2.5 shadow-card text-xs space-y-1.5 min-w-[140px]">
      <p className="font-medium text-text-primary border-b border-border pb-1.5">{fmtDate(label as string)}</p>
      {is  != null && (
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary">In-sample</span>
          <span className="font-mono tabular-nums text-text-secondary">{(is as number).toFixed(1)}</span>
        </div>
      )}
      {oos != null && (
        <div className="flex justify-between gap-4">
          <span className="text-profit">Out-of-sample</span>
          <span className="font-mono tabular-nums text-profit">{(oos as number).toFixed(1)}</span>
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
  const ticks   = sparseTicks(data);
  const firstDate = data[0]?.date ?? "";
  const lastDate  = data[data.length - 1]?.date ?? "";

  const allValues = data.flatMap((d) => [d.is, d.oos]).filter((v): v is number => v != null);
  const yMin = Math.floor(Math.min(...allValues) / 5) * 5 - 2;
  const yMax = Math.ceil (Math.max(...allValues) / 5) * 5 + 2;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="0" />

        {/* Background regions */}
        {boundaryDate ? (
          <>
            <ReferenceArea
              x1={firstDate} x2={boundaryDate}
              fill="rgba(42,48,66,0.28)" fillOpacity={1}
              label={{
                value: "IN-SAMPLE", position: "insideTopLeft",
                fill: "#555d70", fontSize: 10,
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 600, letterSpacing: 1, dx: 10, dy: 10,
              }}
            />
            <ReferenceArea
              x1={boundaryDate} x2={lastDate}
              fill="rgba(16,185,129,0.04)" fillOpacity={1}
              label={{
                value: "OUT-OF-SAMPLE", position: "insideTopLeft",
                fill: "#10b981", fontSize: 10,
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 600, letterSpacing: 1, dx: 10, dy: 10,
              }}
            />
            <ReferenceLine
              x={boundaryDate}
              stroke="#3b82f6" strokeOpacity={0.4}
              strokeWidth={1.5} strokeDasharray="5 4"
            />
          </>
        ) : (
          <ReferenceArea
            x1={firstDate} x2={lastDate}
            fill="rgba(42,48,66,0.28)" fillOpacity={1}
            label={{
              value: "IN-SAMPLE", position: "insideTopLeft",
              fill: "#555d70", fontSize: 10,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600, letterSpacing: 1, dx: 10, dy: 10,
            }}
          />
        )}

        {/* Baseline at 100 */}
        <ReferenceLine y={100} stroke="#1f2430" strokeWidth={1} />

        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={fmtDate}
          tick={TICK_STYLE}
          axisLine={false} tickLine={false} tickMargin={8}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={TICK_STYLE}
          axisLine={false} tickLine={false}
          width={38}
          tickFormatter={(v: number) => v.toFixed(0)}
        />
        <Tooltip content={<EquityTooltip />} cursor={{ stroke: "#2a3042", strokeWidth: 1 }} />

        {/* IS area — muted */}
        <Area
          dataKey="is"
          name="In-sample"
          stroke="#555d70"
          strokeWidth={1.5}
          fill="rgba(85,93,112,0.10)"
          dot={false}
          activeDot={false}
          connectNulls={false}
          isAnimationActive={false}
        />

        {/* OOS area — hero */}
        <Area
          dataKey="oos"
          name="Out-of-sample"
          stroke="#10b981"
          strokeWidth={2}
          fill="rgba(16,185,129,0.10)"
          dot={false}
          activeDot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
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
    <div className="rounded-lg border border-border bg-elevated/95 backdrop-blur-sm px-3.5 py-2.5 shadow-card text-xs space-y-1 min-w-[130px]">
      <p className="font-medium text-text-primary border-b border-border pb-1.5">{fmtDate(label as string)}</p>
      <div className="flex justify-between gap-4">
        <span className="text-text-tertiary">Drawdown</span>
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
        <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="0" />

        {/* Background regions matching equity chart */}
        {boundaryDate ? (
          <>
            <ReferenceArea x1={firstDate} x2={boundaryDate} fill="rgba(42,48,66,0.20)" fillOpacity={1} />
            <ReferenceArea x1={boundaryDate} x2={lastDate} fill="rgba(239,68,68,0.03)" fillOpacity={1} />
            <ReferenceLine
              x={boundaryDate}
              stroke="#3b82f6" strokeOpacity={0.4}
              strokeWidth={1.5} strokeDasharray="5 4"
            />
          </>
        ) : (
          <ReferenceArea x1={firstDate} x2={lastDate} fill="rgba(42,48,66,0.20)" fillOpacity={1} />
        )}

        {/* 0% baseline */}
        <ReferenceLine y={0} stroke="#2a3042" strokeWidth={1.5} />

        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={fmtDate}
          tick={TICK_STYLE}
          axisLine={false} tickLine={false} tickMargin={8}
        />
        <YAxis
          domain={[yMin, 0]}
          tick={TICK_STYLE}
          axisLine={false} tickLine={false}
          width={38}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
        />
        <Tooltip content={<DrawdownTooltip />} cursor={{ stroke: "#2a3042", strokeWidth: 1 }} />

        <Area
          dataKey="dd"
          stroke="#ef4444"
          strokeWidth={1.5}
          fill="rgba(239,68,68,0.18)"
          dot={false}
          activeDot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
          isAnimationActive={false}
          baseValue={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
