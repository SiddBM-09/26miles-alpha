import { cn, fmtPct } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MetricLabel } from "@/components/ui/MetricLabel";

export type MetricTrend = "up" | "down" | "neutral";

interface MetricCardProps {
  label: string;
  tooltip?: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  trend?: MetricTrend;
  annotation?: string;
  loading?: boolean;
  className?: string;
}

const TREND_ICON: Record<MetricTrend, React.ElementType> = {
  up:      TrendingUp,
  down:    TrendingDown,
  neutral: Minus,
};

const TREND_COLOR: Record<MetricTrend, string> = {
  up:      "text-profit",
  down:    "text-loss",
  neutral: "text-text-tertiary",
};

const LABEL_CLS = "text-2xs font-mono text-text-tertiary uppercase tracking-[0.10em]";

export function MetricCard({
  label,
  tooltip,
  value,
  unit,
  subValue,
  trend,
  annotation,
  loading = false,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className={cn("card p-4 flex flex-col gap-2", className)}>
        <div className="h-2 w-20 rounded-sm bg-elevated animate-shimmer" />
        <div className="h-6 w-14 rounded-sm bg-elevated animate-shimmer" />
        <div className="h-2 w-16 rounded-sm bg-elevated animate-shimmer" />
      </div>
    );
  }

  const TrendIcon = trend ? TREND_ICON[trend] : null;
  const trendColor = trend ? TREND_COLOR[trend] : "";

  return (
    <div
      className={cn(
        "card p-4 flex flex-col gap-1 transition-colors hover:border-accent/20",
        className
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        {tooltip ? (
          <MetricLabel
            label={label}
            tooltip={tooltip}
            labelClassName={LABEL_CLS}
          />
        ) : (
          <span className={LABEL_CLS}>{label}</span>
        )}
        {TrendIcon && (
          <TrendIcon className={cn("h-3 w-3 flex-shrink-0", trendColor)} strokeWidth={2} />
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="font-mono text-2xl font-semibold text-text-primary tabular-nums leading-none">
          {typeof value === "number" ? value.toFixed(2) : value}
        </span>
        {unit && (
          <span className="text-xs text-text-tertiary font-mono">{unit}</span>
        )}
      </div>

      {/* Sub-value / delta */}
      {subValue && (
        <span className={cn("text-xs font-mono tabular-nums", trendColor || "text-text-secondary")}>
          {subValue}
        </span>
      )}

      {/* Annotation */}
      {annotation && (
        <span className="text-2xs text-text-tertiary font-mono mt-0.5">{annotation}</span>
      )}
    </div>
  );
}

/** Compact inline metric — for use inside tables or tight layouts */
export function InlineMetric({
  value,
  unit,
  trend,
  className,
}: {
  value: string | number;
  unit?: string;
  trend?: MetricTrend;
  className?: string;
}) {
  const color =
    trend === "up"   ? "text-profit" :
    trend === "down" ? "text-loss"   : "text-text-primary";

  return (
    <span className={cn("font-mono tabular-nums text-sm", color, className)}>
      {typeof value === "number" ? value.toFixed(2) : value}
      {unit && <span className="text-text-tertiary ml-0.5">{unit}</span>}
    </span>
  );
}
