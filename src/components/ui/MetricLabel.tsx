"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricLabelProps {
  label: string;
  tooltip: string;
  className?: string;
  labelClassName?: string;
}

export function MetricLabel({ label, tooltip, className, labelClassName }: MetricLabelProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className={labelClassName}>{label}</span>
      <span className="group relative inline-flex items-center">
        <Info className="h-3 w-3 text-text-tertiary hover:text-accent transition-colors cursor-help flex-shrink-0" />
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                     hidden group-hover:block w-52 rounded-lg border border-border bg-elevated
                     px-3 py-2 text-xs text-text-secondary leading-relaxed whitespace-normal"
        >
          {tooltip}
          <span className="absolute left-1/2 -translate-x-1/2 top-full h-0 w-0
                           border-x-[5px] border-x-transparent border-t-[5px] border-t-border" />
        </span>
      </span>
    </span>
  );
}
