"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
  type TooltipProps,
} from "recharts";

export interface EarningsChartPoint {
  monthLabel: string;   // "Jun '25"
  month:      string;   // "2025-06" — for reference line matching
  retainer:   number;
  perfFee:    number;
  cumulative: number;
}

function fmtINR(n: number): string {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

const TICK = { fill: "#4D5562", fontSize: 10, fontFamily: "var(--font-mono)" };
const GRID = "rgba(255,255,255,0.045)";

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const retainer = payload.find((p) => p.dataKey === "retainer")?.value ?? 0;
  const perfFee  = payload.find((p) => p.dataKey === "perfFee")?.value  ?? 0;
  const cumul    = payload.find((p) => p.dataKey === "cumulative")?.value ?? 0;
  const total    = (retainer as number) + (perfFee as number);

  return (
    <div className="rounded border border-border bg-elevated/98 px-3 py-2.5 text-xs space-y-1.5 min-w-[160px]">
      <p className="font-mono font-medium text-text-primary border-b border-border pb-1.5 tracking-wide">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary font-mono">Retainer</span>
          <span className="font-mono tabular-nums text-text-secondary">{fmtINR(retainer as number)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary font-mono">Perf fee</span>
          <span className={`font-mono tabular-nums ${(perfFee as number) > 0 ? "text-profit" : "text-text-tertiary"}`}>
            {(perfFee as number) > 0 ? fmtINR(perfFee as number) : "Below HWM"}
          </span>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-1">
          <span className="text-text-secondary font-mono font-medium">Total</span>
          <span className="font-mono tabular-nums text-text-primary font-medium">{fmtINR(total)}</span>
        </div>
      </div>
      <div className="flex justify-between gap-4 border-t border-border pt-1.5">
        <span className="text-text-tertiary font-mono">Cumulative</span>
        <span className="font-mono tabular-nums text-accent">{fmtINR(cumul as number)}</span>
      </div>
    </div>
  );
}

interface EarningsChartProps {
  data:            EarningsChartPoint[];
  retainerMonthly: number;
  hwmMonth:        string;   // "YYYY-MM"
  hwmLabel:        string;   // e.g. "NAV 143.8 → 148.2"
}

export function EarningsChart({ data, retainerMonthly, hwmMonth, hwmLabel }: EarningsChartProps) {
  const hwmEntry = data.find((d) => d.month === hwmMonth);
  const hwmX     = hwmEntry?.monthLabel;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 48, bottom: 0, left: 8 }} barCategoryGap="32%">
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />

          <XAxis dataKey="monthLabel" tick={TICK} axisLine={false} tickLine={false} tickMargin={8} />

          {/* Left axis — monthly payout */}
          <YAxis
            yAxisId="monthly"
            orientation="left"
            tickFormatter={(v) => `₹${v / 1000}K`}
            tick={TICK}
            axisLine={false} tickLine={false}
            width={44}
          />

          {/* Right axis — cumulative */}
          <YAxis
            yAxisId="cumul"
            orientation="right"
            tickFormatter={(v) => `₹${(v / 100_000).toFixed(1)}L`}
            tick={TICK}
            axisLine={false} tickLine={false}
            width={44}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(170,255,62,0.04)" }} />

          <Legend
            wrapperStyle={{
              fontSize: 10,
              color: "#4D5562",
              paddingTop: 12,
              fontFamily: "var(--font-mono)",
            }}
            iconType="square"
            iconSize={6}
            formatter={(value) =>
              value === "retainer"   ? "Retainer" :
              value === "perfFee"    ? "Performance fee" :
              "Cumulative"
            }
          />

          {/* Retainer floor reference */}
          <ReferenceLine
            yAxisId="monthly"
            y={retainerMonthly}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 3"
            label={{
              value: "Retainer floor",
              position: "insideTopLeft",
              fill: "#4D5562",
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              dy: -6,
            }}
          />

          {/* HWM milestone marker — accent-tinted */}
          {hwmX && (
            <ReferenceLine
              yAxisId="monthly"
              x={hwmX}
              stroke="rgba(170,255,62,0.50)"
              strokeDasharray="4 3"
              label={{
                value: "HWM ↑",
                position: "insideTopRight",
                fill: "rgba(170,255,62,0.70)",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                dy: -6,
              }}
            />
          )}

          {/* Stacked bars — retainer (muted base) + perf fee (profit) */}
          <Bar yAxisId="monthly" dataKey="retainer" stackId="pay" fill="#252830"    name="retainer" radius={[0, 0, 0, 0]} />
          <Bar yAxisId="monthly" dataKey="perfFee"  stackId="pay" fill="#22D47A" fillOpacity={0.9} name="perfFee" radius={[2, 2, 0, 0]} />

          {/* Cumulative line — accent, the hero metric */}
          <Line
            yAxisId="cumul"
            dataKey="cumulative"
            name="Cumulative"
            stroke="#AAFF3E"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "#AAFF3E", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
