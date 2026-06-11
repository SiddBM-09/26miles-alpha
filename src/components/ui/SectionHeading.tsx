import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Visual weight — "page" for top-level H1, "section" for H2, "sub" for H3 */
  level?: "page" | "section" | "sub";
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  level = "section",
  className,
}: SectionHeadingProps) {
  const Tag = level === "page" ? "h1" : level === "section" ? "h2" : "h3";

  const titleStyles = {
    page:    "text-2xl font-semibold tracking-tight text-text-primary",
    section: "text-lg font-semibold tracking-tight text-text-primary",
    sub:     "text-base font-medium text-text-primary",
  };

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <Tag className={titleStyles[level]}>{title}</Tag>
        {subtitle && (
          <p className="text-sm text-text-secondary">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 mt-0.5">{action}</div>}
    </div>
  );
}

/** Horizontal rule with optional label — for separating content sections */
export function SectionDivider({ label, className }: { label?: string; className?: string }) {
  if (!label) {
    return <hr className={cn("border-border my-6", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-3 my-6", className)}>
      <hr className="flex-1 border-border" />
      <span className="text-2xs text-text-tertiary uppercase tracking-widest font-mono flex-shrink-0">
        {label}
      </span>
      <hr className="flex-1 border-border" />
    </div>
  );
}
