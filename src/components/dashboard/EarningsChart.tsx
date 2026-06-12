"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { useChartColors } from "@/components/ThemeProvider";

export interface EarningsChartPoint {
  monthLabel: string;
  month:      string;
  retainer:   number;
  perfFee:    number;
  cumulative: number;
}

function fmtINR(n: number): string {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

function CustomTooltip({ active, payload, label, c }: any) {
  if (!active || !payload?.length) return null;

  const retainer = payload.find((p: any) => p.dataKey === "retainer")?.value ?? 0;
  const perfFee  = payload.find((p: any) => p.dataKey === "perfFee")?.value  ?? 0;
  const cumul    = payload.find((p: any) => p.dataKey === "cumulative")?.value ?? 0;
  const total    = (retainer as number) + (perfFee as number);

  return (
    <div
      className="rounded border px-3 py-2.5 text-xs space-y-1.5 min-w-[160px]"
      style={{ background: c.tooltipBg, borderColor: c.tooltipBorder }}
    >
      <p className="font-mono font-medium border-b pb-1.5 tracking-wide" style={{ color: c.tooltipItem, borderColor: c.tooltipBorder }}>{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="font-mono" style={{ color: c.tooltipLabel }}>Retainer</span>
          <span className="font-mono tabular-nums" style={{ color: c.tooltipItem }}>{fmtINR(retainer as number)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-mono" style={{ color: c.tooltipLabel }}>Perf fee</span>
          <span className="font-mono tabular-nums" style={{ color: (perfFee as number) > 0 ? c.profit : c.tooltipLabel }}>
            {(perfFee as number) > 0 ? fmtINR(perfFee as number) : "Below HWM"}
          </span>
        </div>
        <div className="flex justify-between gap-4 border-t pt-1" style={{ borderColor: c.tooltipBorder }}>
          <span className="font-mono font-medium" style={{ color: c.tooltipItem }}>Total</span>
          <span className="font-mono tabular-nums font-medium" style={{ color: c.tooltipItem }}>{fmtINR(total)}</span>
        </div>
      </div>
      <div className="flex justify-between gap-4 border-t pt-1.5" style={{ borderColor: c.tooltipBorder }}>
        <span className="font-mono" style={{ color: c.tooltipLabel }}>Cumulative</span>
        <span className="font-mono tabular-nums" style={{ color: c.accent }}>{fmtINR(cumul as number)}</span>
      </div>
    </div>
  );
}

interface EarningsChartProps {
  data:            EarningsChartPoint[];
  retainerMonthly: number;
  hwmMonth:        string;
  hwmLabel:        string;
}

export function EarningsChart({ data, retainerMonthly, hwmMonth }: EarningsChartProps) {
  const c = useChartColors();

  const hwmEntry = data.find((d) => d.month === hwmMonth);
  const hwmX     = hwmEntry?.monthLabel;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 48, bottom: 0, left: 8 }} barCategoryGap="32%">
          <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="0" />

          <XAxis dataKey="monthLabel" tick={c.tick} axisLine={false} tickLine={false} tickMargin={8} />

          <YAxis
            yAxisId="monthly"
            orientation="left"
            tickFormatter={(v) => `₹${v / 1000}K`}
            tick={c.tick}
            axisLine={false} tickLine={false}
            width={44}
          />

          <YAxis
            yAxisId="cumul"
            orientation="right"
            tickFormatter={(v) => `₹${(v / 100_000).toFixed(1)}L`}
            tick={c.tick}
            axisLine={false} tickLine={false}
            width={44}
          />

          <Tooltip
            content={(props) => <CustomTooltip {...props} c={c} />}
            cursor={{ fill: c.cursorBar }}
          />

          <Legend
            wrapperStyle={{
              fontSize: 10,
              color: c.tick.fill,
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

          {/* Retainer floor */}
          <ReferenceLine
            yAxisId="monthly"
            y={retainerMonthly}
            stroke={c.grid}
            strokeDasharray="4 3"
            label={{
              value: "Retainer floor",
              position: "insideTopLeft",
              fill: c.tick.fill,
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              dy: -6,
            }}
          />

          {/* HWM milestone marker */}
          {hwmX && (
            <ReferenceLine
              yAxisId="monthly"
              x={hwmX}
              stroke={c.hwmMarker}
              strokeDasharray="4 3"
              label={{
                value: "HWM ↑",
                position: "insideTopRight",
                fill: c.hwmMarkerLabel,
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                dy: -6,
              }}
            />
          )}

          <Bar yAxisId="monthly" dataKey="retainer" stackId="pay" fill={c.retainerBar}    name="retainer" radius={[0, 0, 0, 0]} />
          <Bar yAxisId="monthly" dataKey="perfFee"  stackId="pay" fill={c.profit} fillOpacity={0.9} name="perfFee" radius={[2, 2, 0, 0]} />

          <Line
            yAxisId="cumul"
            dataKey="cumulative"
            name="Cumulative"
            stroke={c.accent}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: c.accent, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
