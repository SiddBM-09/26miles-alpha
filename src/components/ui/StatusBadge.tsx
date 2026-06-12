import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Circle, Clock, Activity, TrendingDown, Archive } from "lucide-react";

// ── Validation check badges ──────────────────────────────────────────────────

export type CheckStatus = "pass" | "warn" | "fail";

const CHECK_STYLES: Record<CheckStatus, string> = {
  pass: "bg-profit/8 text-profit border-profit/25",
  warn: "bg-warn/8 text-warn border-warn/25",
  fail: "bg-loss/8 text-loss border-loss/25",
};

const CHECK_ICONS: Record<CheckStatus, React.ElementType> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const CHECK_LABELS: Record<CheckStatus, string> = {
  pass: "PASS",
  warn: "WARN",
  fail: "FAIL",
};

interface CheckBadgeProps {
  status: CheckStatus;
  label?: string;
  className?: string;
}

export function CheckBadge({ status, label, className }: CheckBadgeProps) {
  const Icon = CHECK_ICONS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-mono font-medium border tracking-wide",
        CHECK_STYLES[status],
        className
      )}
    >
      <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
      {label ?? CHECK_LABELS[status]}
    </span>
  );
}

// ── Strategy lifecycle state badges ─────────────────────────────────────────

export type LifecycleState =
  | "incubation"
  | "paper"
  | "live"
  | "decaying"
  | "retired";

const LIFECYCLE_STYLES: Record<LifecycleState, string> = {
  incubation: "bg-muted/60 text-text-tertiary border-border",
  paper:      "bg-accent/8 text-accent border-accent/25",
  live:       "bg-profit/8 text-profit border-profit/25",
  decaying:   "bg-warn/8 text-warn border-warn/25",
  retired:    "bg-muted/40 text-text-tertiary border-border",
};

const LIFECYCLE_ICONS: Record<LifecycleState, React.ElementType> = {
  incubation: Circle,
  paper:      Clock,
  live:       Activity,
  decaying:   TrendingDown,
  retired:    Archive,
};

const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
  incubation: "Incubation",
  paper:      "Paper / Fwd-test",
  live:       "Live",
  decaying:   "Decaying",
  retired:    "Retired",
};

interface LifecycleBadgeProps {
  state: LifecycleState;
  /** Show a pulsing dot for live state */
  pulse?: boolean;
  className?: string;
}

export function LifecycleBadge({ state, pulse = true, className }: LifecycleBadgeProps) {
  const Icon = LIFECYCLE_ICONS[state];
  const isLive = state === "live";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-mono font-medium border tracking-wide",
        LIFECYCLE_STYLES[state],
        className
      )}
    >
      {isLive && pulse ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-profit opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-profit" />
        </span>
      ) : (
        <Icon className="h-2.5 w-2.5" strokeWidth={2} />
      )}
      {LIFECYCLE_LABELS[state]}
    </span>
  );
}

// ── Generic status dot (for tables) ─────────────────────────────────────────

export function StatusDot({ status, className }: { status: CheckStatus; className?: string }) {
  const colors: Record<CheckStatus, string> = {
    pass: "bg-profit",
    warn: "bg-warn",
    fail: "bg-loss",
  };
  return (
    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", colors[status], className)} />
  );
}
