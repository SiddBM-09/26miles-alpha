"use client";

import {
  ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer,
} from "recharts";
import { useChartColors } from "@/components/ThemeProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EquityPoint {
  date: string;
  is:   number | null;
  oos:  number | null;
}

export interface DrawdownPoint {
  date:     string;
  dd:       number;
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

// ─────────────────────────────────────────────────────────────────────────────
// Equity curve tooltip
// ─────────────────────────────────────────────────────────────────────────────

function EquityTooltip({ active, payload, label, c }: any) {
  if (!active || !payload?.length) return null;
  const is  = payload.find((p: any) => p.dataKey === "is")?.value;
  const oos = payload.find((p: any) => p.dataKey === "oos")?.value;

  return (
    <div
      className="rounded border px-3 py-2 text-xs space-y-1.5 min-w-[140px]"
      style={{ background: c.tooltipBg, borderColor: c.tooltipBorder }}
    >
      <p className="font-mono font-medium border-b pb-1.5 tracking-wide"
        style={{ color: c.tooltipItem, borderColor: c.tooltipBorder }}>
        {fmtDate(label as string)}
      </p>
      {is != null && (
        <div className="flex justify-between gap-4">
          <span className="font-mono" style={{ color: c.tooltipLabel }}>IS</span>
          <span className="font-mono tabular-nums" style={{ color: c.tooltipLabel }}>{(is as number).toFixed(1)}</span>
        </div>
      )}
      {oos != null && (
        <div className="flex justify-between gap-4">
          <span className="font-mono" style={{ color: c.accent }}>OOS</span>
          <span className="font-mono tabular-nums" style={{ color: c.accent }}>{(oos as number).toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Equity curve chart
// ─────────────────────────────────────────────────────────────────────────────

interface EquityCurveChartProps {
  data:         EquityPoint[];
  boundaryDate: string | null;
}

export function EquityCurveChart({ data, boundaryDate }: EquityCurveChartProps) {
  const c = useChartColors();

  const ticks     = sparseTicks(data);
  const firstDate = data[0]?.date ?? "";
  const lastDate  = data[data.length - 1]?.date ?? "";

  const allValues = data.flatMap((d) => [d.is, d.oos]).filter((v): v is number => v != null);
  const yMin = Math.floor(Math.min(...allValues) / 5) * 5 - 2;
  const yMax = Math.ceil (Math.max(...allValues) / 5) * 5 + 2;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="0" />

        {boundaryDate ? (
          <>
            <ReferenceArea
              x1={firstDate} x2={boundaryDate}
              fill={c.isRegion} fillOpacity={1}
              label={{
                value: "IN-SAMPLE", position: "insideTopLeft",
                fill: c.tick.fill, fontSize: 9,
                fontFamily: "var(--font-mono)",
                fontWeight: 600, letterSpacing: 2, dx: 10, dy: 12,
              }}
            />
            <ReferenceArea
              x1={boundaryDate} x2={lastDate}
              fill={c.accentRegion} fillOpacity={1}
              label={{
                value: "OUT-OF-SAMPLE", position: "insideTopLeft",
                fill: c.accent, fontSize: 9,
                fontFamily: "var(--font-mono)",
                fontWeight: 600, letterSpacing: 2, dx: 10, dy: 12,
              }}
            />
            <ReferenceLine
              x={boundaryDate}
              stroke={c.accentBoundary}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          </>
        ) : (
          <ReferenceArea
            x1={firstDate} x2={lastDate}
            fill={c.isRegion} fillOpacity={1}
            label={{
              value: "IN-SAMPLE", position: "insideTopLeft",
              fill: c.tick.fill, fontSize: 9,
              fontFamily: "var(--font-mono)",
              fontWeight: 600, letterSpacing: 2, dx: 10, dy: 12,
            }}
          />
        )}

        <ReferenceLine y={100} stroke={c.grid} strokeWidth={1} />

        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={fmtDate}
          tick={c.tick}
          axisLine={false} tickLine={false} tickMargin={8}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={c.tick}
          axisLine={false} tickLine={false}
          width={36}
          tickFormatter={(v: number) => v.toFixed(0)}
        />
        <Tooltip content={(props) => <EquityTooltip {...props} c={c} />} cursor={c.cursor} />

        {/* IS line — muted */}
        <Area
          dataKey="is"
          name="In-sample"
          stroke={c.is}
          strokeWidth={1}
          fill={c.isFill}
          dot={false}
          activeDot={false}
          connectNulls={false}
          isAnimationActive={false}
        />

        {/* OOS line — accent hero */}
        <Area
          dataKey="oos"
          name="Out-of-sample"
          stroke={c.accent}
          strokeWidth={1.5}
          fill={c.accentFill}
          dot={false}
          activeDot={{ r: 3, fill: c.accent, strokeWidth: 0 }}
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

function DrawdownTooltip({ active, payload, label, c }: any) {
  if (!active || !payload?.length) return null;
  const dd = payload[0]?.value as number;
  return (
    <div
      className="rounded border px-3 py-2 text-xs space-y-1 min-w-[130px]"
      style={{ background: c.tooltipBg, borderColor: c.tooltipBorder }}
    >
      <p className="font-mono font-medium border-b pb-1.5 tracking-wide"
        style={{ color: c.tooltipItem, borderColor: c.tooltipBorder }}>
        {fmtDate(label as string)}
      </p>
      <div className="flex justify-between gap-4">
        <span className="font-mono" style={{ color: c.tooltipLabel }}>DD</span>
        <span className="font-mono tabular-nums"
          style={{ color: dd < -5 ? c.loss : dd < -2 ? c.warn : c.tooltipItem }}>
          {dd.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawdown chart
// ─────────────────────────────────────────────────────────────────────────────

interface DrawdownChartProps {
  data:         DrawdownPoint[];
  boundaryDate: string | null;
  minDD:        number;
}

export function DrawdownChart({ data, boundaryDate, minDD }: DrawdownChartProps) {
  const c = useChartColors();

  const ticks     = sparseTicks(data);
  const firstDate = data[0]?.date ?? "";
  const lastDate  = data[data.length - 1]?.date ?? "";
  const yMin      = Math.floor(minDD / 5) * 5 - 2;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="0" />

        {boundaryDate ? (
          <>
            <ReferenceArea x1={firstDate} x2={boundaryDate} fill={c.isRegion}     fillOpacity={1} />
            <ReferenceArea x1={boundaryDate} x2={lastDate}  fill={c.accentRegion} fillOpacity={1} />
            <ReferenceLine
              x={boundaryDate}
              stroke={c.accentBoundary}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          </>
        ) : (
          <ReferenceArea x1={firstDate} x2={lastDate} fill={c.isRegion} fillOpacity={1} />
        )}

        <ReferenceLine y={0} stroke={c.grid} strokeWidth={1} />

        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={fmtDate}
          tick={c.tick}
          axisLine={false} tickLine={false} tickMargin={8}
        />
        <YAxis
          domain={[yMin, 0]}
          tick={c.tick}
          axisLine={false} tickLine={false}
          width={36}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
        />
        <Tooltip content={(props) => <DrawdownTooltip {...props} c={c} />} cursor={c.cursor} />

        <Area
          dataKey="dd"
          stroke={c.loss}
          strokeWidth={1.5}
          fill={c.ddFill}
          dot={false}
          activeDot={{ r: 3, fill: c.loss, strokeWidth: 0 }}
          isAnimationActive={false}
          baseValue={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
