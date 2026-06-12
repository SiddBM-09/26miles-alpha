"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
  type TooltipProps,
} from "recharts";

export interface EarningsChartPoint {
  monthLabel: string;   // "Jun '25"
  month: string;        // "2025-06" — for reference line matching
  retainer: number;
  perfFee: number;
  cumulative: number;
}

function fmtINR(n: number): string {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const retainer = payload.find((p) => p.dataKey === "retainer")?.value ?? 0;
  const perfFee  = payload.find((p) => p.dataKey === "perfFee")?.value ?? 0;
  const cumul    = payload.find((p) => p.dataKey === "cumulative")?.value ?? 0;
  const total    = (retainer as number) + (perfFee as number);

  return (
    <div className="rounded-lg border border-border bg-elevated/95 backdrop-blur-sm px-3.5 py-3 text-xs space-y-2 min-w-[160px]">
      <p className="font-medium text-text-primary border-b border-border pb-1.5">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary">Retainer</span>
          <span className="font-mono tabular-nums text-text-secondary">{fmtINR(retainer as number)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-text-tertiary">Perf fee</span>
          <span className={`font-mono tabular-nums ${(perfFee as number) > 0 ? "text-profit" : "text-text-tertiary"}`}>
            {(perfFee as number) > 0 ? fmtINR(perfFee as number) : "Below HWM"}
          </span>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-1">
          <span className="text-text-secondary font-medium">Total</span>
          <span className="font-mono tabular-nums text-text-primary font-medium">{fmtINR(total)}</span>
        </div>
      </div>
      <div className="flex justify-between gap-4 border-t border-border pt-1.5">
        <span className="text-text-tertiary">Cumulative</span>
        <span className="font-mono tabular-nums text-accent">{fmtINR(cumul as number)}</span>
      </div>
    </div>
  );
}

interface EarningsChartProps {
  data: EarningsChartPoint[];
  retainerMonthly: number;
  hwmMonth: string;       // "YYYY-MM" — month where HWM was last raised
  hwmLabel: string;       // e.g. "NAV 143.8 → 148.2"
}

export function EarningsChart({
  data,
  retainerMonthly,
  hwmMonth,
  hwmLabel,
}: EarningsChartProps) {
  const hwmEntry = data.find((d) => d.month === hwmMonth);
  const hwmX     = hwmEntry?.monthLabel;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 48, bottom: 0, left: 8 }} barCategoryGap="30%">
          <CartesianGrid
            vertical={false}
            stroke="#1f2430"
            strokeDasharray="0"
          />

          <XAxis
            dataKey="monthLabel"
            tick={{ fill: "#555d70", fontSize: 11, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />

          {/* Left axis — monthly payout */}
          <YAxis
            yAxisId="monthly"
            orientation="left"
            tickFormatter={(v) => `₹${v / 1000}K`}
            tick={{ fill: "#555d70", fontSize: 11, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            width={46}
          />

          {/* Right axis — cumulative */}
          <YAxis
            yAxisId="cumul"
            orientation="right"
            tickFormatter={(v) => `₹${(v / 100_000).toFixed(1)}L`}
            tick={{ fill: "#555d70", fontSize: 11, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.05)" }} />

          <Legend
            wrapperStyle={{ fontSize: 11, color: "#8b91a0", paddingTop: 12 }}
            iconType="square"
            iconSize={8}
            formatter={(value) => value === "retainer" ? "Retainer" : value === "perfFee" ? "Performance fee" : "Cumulative"}
          />

          {/* Retainer floor reference */}
          <ReferenceLine
            yAxisId="monthly"
            y={retainerMonthly}
            stroke="#2a3042"
            strokeDasharray="4 3"
            label={{
              value: "Retainer floor",
              position: "insideTopLeft",
              fill: "#555d70",
              fontSize: 10,
              fontFamily: "var(--font-inter)",
              dy: -6,
            }}
          />

          {/* HWM milestone marker */}
          {hwmX && (
            <ReferenceLine
              yAxisId="monthly"
              x={hwmX}
              stroke="#3b82f6"
              strokeDasharray="4 3"
              strokeOpacity={0.5}
              label={{
                value: `HWM raised ↑`,
                position: "insideTopRight",
                fill: "#3b82f6",
                fontSize: 10,
                fontFamily: "var(--font-inter)",
                opacity: 0.8,
                dy: -6,
              }}
            />
          )}

          {/* Stacked bars */}
          <Bar yAxisId="monthly" dataKey="retainer" stackId="pay" fill="#2a3042" name="retainer" radius={[0, 0, 0, 0]} />
          <Bar yAxisId="monthly" dataKey="perfFee"  stackId="pay" fill="#10b981" fillOpacity={0.85} name="perfFee" radius={[2, 2, 0, 0]} />

          {/* Cumulative line */}
          <Line
            yAxisId="cumul"
            dataKey="cumulative"
            name="Cumulative"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
