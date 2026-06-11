"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileText, Code2, Upload, Lock, CheckCircle2,
  ChevronRight, ChevronLeft, Copy, Check,
  AlertCircle, ArrowRight, Shield, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/AppShell";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SubmissionType = "signal" | "code" | null;
type AssetClass = "Nifty F&O" | "Bank Nifty F&O" | "NSE Large Cap" | "NSE Mid Cap" | "NSE Small Cap" | "Multi-Asset" | "";
type Frequency  = "Intraday" | "Daily" | "Weekly" | "Monthly" | "";

interface FormState {
  submissionType: SubmissionType;
  signalFileName: string;
  codeText: string;
  name: string;
  assetClass: AssetClass;
  universe: string;
  frequency: Frequency;
  capacityM: string;
  description: string;
  backtestStart: string;
  backtestEnd: string;
  hasOOS: boolean;
}

interface Confirmation {
  hash: string;
  timestamp: string;
  submissionId: string;
  receivedAt: string;
}

const INITIAL: FormState = {
  submissionType: null,
  signalFileName: "",
  codeText: "",
  name: "",
  assetClass: "",
  universe: "",
  frequency: "",
  capacityM: "",
  description: "",
  backtestStart: "2020",
  backtestEnd: "2024",
  hasOOS: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function genHash(): string {
  const hex = "0123456789abcdef";
  let h = "";
  for (let i = 0; i < 64; i++) h += hex[Math.floor(Math.random() * 16)];
  return h;
}

function genSubmissionId(): string {
  const n = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
  return `SUB-2026-${n}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Submission type" },
  { n: 2, label: "Strategy metadata" },
  { n: 3, label: "Review & submit" },
];

function StepBar({ current }: { current: number }) {
  return (
    <nav aria-label="Submission steps" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map(({ n, label }, i) => {
          const done    = n < current;
          const active  = n === current;
          const upcoming = n > current;

          return (
            <li key={n} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done    ? "bg-profit border-profit text-white" :
                  active  ? "bg-accent border-accent text-white" :
                            "bg-surface border-border text-text-tertiary"
                )}>
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
                </div>
                <span className={cn(
                  "text-2xs font-mono whitespace-nowrap hidden sm:block",
                  active  ? "text-text-primary" :
                  done    ? "text-profit" : "text-text-tertiary"
                )}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "h-px flex-1 mx-2 mb-5 sm:mb-0 transition-colors",
                  done ? "bg-profit/40" : "bg-border"
                )} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared form primitives
// ─────────────────────────────────────────────────────────────────────────────

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 space-y-0.5">
      <div className="text-xs font-medium text-text-secondary">{children}</div>
      {hint && <div className="text-2xs text-text-tertiary">{hint}</div>}
    </div>
  );
}

function Input({
  value, onChange, placeholder, className, type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded bg-surface border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary",
        "focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors",
        className
      )}
    />
  );
}

function Select<T extends string>({
  value, onChange, options, placeholder,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(
        "w-full rounded bg-surface border border-border px-3 py-2 text-sm text-text-primary",
        "focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors appearance-none cursor-pointer",
        !value && "text-text-tertiary"
      )}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-elevated text-text-primary">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Textarea({
  value, onChange, placeholder, rows = 4, mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        "w-full rounded bg-surface border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary resize-y",
        "focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors",
        mono && "font-mono text-xs leading-relaxed"
      )}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Submission type
// ─────────────────────────────────────────────────────────────────────────────

function TypeCard({
  type, selected, onSelect, icon: Icon, title, description, tag, tagColor,
}: {
  type: SubmissionType;
  selected: boolean;
  onSelect: () => void;
  icon: React.ElementType;
  title: string;
  description: string;
  tag: string;
  tagColor: "accent" | "profit";
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border p-5 flex flex-col gap-4 transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        selected
          ? "border-accent/60 bg-accent/5 shadow-glow"
          : "border-border bg-surface hover:border-accent/30 hover:bg-elevated/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition-colors",
          selected
            ? "bg-accent/20 border-accent/30 text-accent"
            : "bg-muted border-border text-text-secondary"
        )}>
          <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
        </div>

        <span className={cn(
          "mt-0.5 inline-flex items-center gap-1 rounded px-2 py-0.5 text-2xs font-medium border",
          tagColor === "profit"
            ? "bg-profit/10 text-profit border-profit/20"
            : "bg-accent/10 text-accent border-accent/20"
        )}>
          {tagColor === "profit" ? <Lock className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
          {tag}
        </span>
      </div>

      <div>
        <h3 className={cn(
          "text-base font-semibold mb-1.5 transition-colors",
          selected ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
        )}>
          {title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>

      {/* Selection indicator */}
      <div className={cn(
        "flex items-center gap-2 text-xs font-medium transition-opacity",
        selected ? "opacity-100" : "opacity-0"
      )}>
        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
        <span className="text-accent">Selected</span>
      </div>
    </button>
  );
}

function FileDropZone({ fileName, onFile }: { fileName: string; onFile: (name: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file.name);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative rounded-lg border-2 border-dashed p-8 flex flex-col items-center gap-3",
        "cursor-pointer transition-colors select-none",
        dragging  ? "border-accent/60 bg-accent/5" :
        fileName  ? "border-profit/40 bg-profit/5" :
                    "border-border hover:border-accent/30 hover:bg-elevated/40"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.parquet,.feather,.xlsx"
        className="sr-only"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0].name); }}
      />

      {fileName ? (
        <>
          <CheckCircle2 className="h-8 w-8 text-profit" strokeWidth={1.5} />
          <div className="text-center">
            <p className="text-sm font-medium text-profit">{fileName}</p>
            <p className="text-xs text-text-tertiary mt-0.5">Click to replace</p>
          </div>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 text-text-tertiary" strokeWidth={1.5} />
          <div className="text-center">
            <p className="text-sm font-medium text-text-secondary">
              Drop your signal file here, or <span className="text-accent">browse</span>
            </p>
            <p className="text-xs text-text-tertiary mt-1">CSV · Parquet · Feather · Excel · max 100 MB</p>
          </div>
        </>
      )}
    </div>
  );
}

const CODE_PLACEHOLDER = `# Paste your strategy code below — Python, R, or Julia accepted.
# Example (Python):

import pandas as pd
import numpy as np

def generate_signals(prices: pd.DataFrame) -> pd.DataFrame:
    """
    Return a DataFrame of daily position weights.
    Index: date · Columns: ticker · Values: weight (-1 to +1)
    """
    returns = prices.pct_change()
    mom_12_1 = prices.shift(21) / prices.shift(252) - 1
    signals  = mom_12_1.rank(axis=1, pct=True) - 0.5
    return signals.where(signals.abs() > 0.3, 0)
`;

function Step1({
  form, update,
}: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">What are you submitting?</h2>
        <p className="text-sm text-text-secondary mt-1">
          Choose how much of your strategy you share. You can always upgrade to full-code later.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TypeCard
          type="signal"
          selected={form.submissionType === "signal"}
          onSelect={() => update({ submissionType: "signal" })}
          icon={FileText}
          title="Signal file only"
          description="Upload a CSV or Parquet of daily position weights or raw signals. We run all validation using the signals alone — your strategy logic, code, and hypothesis remain entirely private."
          tag="Logic stays private"
          tagColor="profit"
        />
        <TypeCard
          type="code"
          selected={form.submissionType === "code"}
          onSelect={() => update({ submissionType: "code" })}
          icon={Code2}
          title="Full source code"
          description="Share your implementation. Enables deeper walk-forward testing, richer overfitting diagnostics, and a higher potential Alpha Score. Reviewed under strict NDA."
          tag="Deeper validation"
          tagColor="accent"
        />
      </div>

      {/* Privacy note — always visible */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-elevated/40 px-4 py-3">
        <Shield className="h-4 w-4 text-text-tertiary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          <span className="text-text-primary font-medium">Either path is fully protected.</span>
          {" "}Signal files reveal no source code. Full-code submissions are encrypted at rest,
          reviewed only by 26 Miles quant staff, and governed by your contributor NDA.
          We never share or redistribute your methodology.
        </p>
      </div>

      {/* Conditional upload / code area */}
      {form.submissionType === "signal" && (
        <div className="space-y-2">
          <Label hint="Columns: date, ticker (or index component), position weight (−1 to +1)">
            Signal file
          </Label>
          <FileDropZone
            fileName={form.signalFileName}
            onFile={(name) => update({ signalFileName: name })}
          />
        </div>
      )}

      {form.submissionType === "code" && (
        <div className="space-y-2">
          <Label hint="Python · R · Julia — must include a signal-generation function or backtest loop">
            Strategy code
          </Label>
          <Textarea
            value={form.codeText}
            onChange={(v) => update({ codeText: v })}
            placeholder={CODE_PLACEHOLDER}
            rows={14}
            mono
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Metadata
// ─────────────────────────────────────────────────────────────────────────────

const ASSET_CLASS_OPTIONS: { value: AssetClass; label: string }[] = [
  { value: "Nifty F&O",       label: "Nifty F&O" },
  { value: "Bank Nifty F&O",  label: "Bank Nifty F&O" },
  { value: "NSE Large Cap",   label: "NSE Large Cap" },
  { value: "NSE Mid Cap",     label: "NSE Mid Cap" },
  { value: "NSE Small Cap",   label: "NSE Small Cap" },
  { value: "Multi-Asset",     label: "Multi-Asset" },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "Intraday", label: "Intraday (sub-daily)" },
  { value: "Daily",    label: "Daily" },
  { value: "Weekly",   label: "Weekly" },
  { value: "Monthly",  label: "Monthly" },
];

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const y = String(2010 + i);
  return { value: y, label: y };
});

function Step2({
  form, update,
}: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Strategy metadata</h2>
        <p className="text-sm text-text-secondary mt-1">
          Used to route your submission to the right validator and set capacity expectations.
        </p>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <Label hint="A short, descriptive internal name — not shown publicly until you go live">
            Strategy name <span className="text-loss">*</span>
          </Label>
          <Input
            value={form.name}
            onChange={(v) => update({ name: v })}
            placeholder="e.g. Nifty Momentum Factor v3"
          />
        </div>

        {/* Asset class + frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Asset class <span className="text-loss">*</span></Label>
            <Select
              value={form.assetClass}
              onChange={(v) => update({ assetClass: v })}
              options={ASSET_CLASS_OPTIONS}
              placeholder="Select asset class"
            />
          </div>
          <div>
            <Label>Rebalance frequency <span className="text-loss">*</span></Label>
            <Select
              value={form.frequency}
              onChange={(v) => update({ frequency: v })}
              options={FREQUENCY_OPTIONS}
              placeholder="Select frequency"
            />
          </div>
        </div>

        {/* Universe */}
        <div>
          <Label hint="Describe the investable universe, e.g. 'Nifty 200 constituents', 'Bank Nifty weekly options'">
            Universe
          </Label>
          <Input
            value={form.universe}
            onChange={(v) => update({ universe: v })}
            placeholder="e.g. Nifty 500 constituents, top 100 by liquidity"
          />
        </div>

        {/* Capacity */}
        <div>
          <Label hint="Your conservative estimate of the strategy's capacity ceiling in USD millions">
            Expected capacity (USD M) <span className="text-loss">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary font-mono">$</span>
            <Input
              value={form.capacityM}
              onChange={(v) => update({ capacityM: v })}
              placeholder="e.g. 15"
              type="number"
              className="pl-7"
            />
          </div>
        </div>

        {/* Backtest period */}
        <div>
          <Label hint="The in-sample period used to develop the strategy">
            Backtest period
          </Label>
          <div className="flex items-center gap-3">
            <Select
              value={form.backtestStart as any}
              onChange={(v) => update({ backtestStart: v })}
              options={YEAR_OPTIONS}
              placeholder="From"
            />
            <span className="text-text-tertiary text-sm flex-shrink-0">to</span>
            <Select
              value={form.backtestEnd as any}
              onChange={(v) => update({ backtestEnd: v })}
              options={YEAR_OPTIONS}
              placeholder="To"
            />
            <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.hasOOS}
                onChange={(e) => update({ hasOOS: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-border accent-accent cursor-pointer"
              />
              <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors whitespace-nowrap">
                Includes OOS period
              </span>
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label hint="Brief, plain-language description of the signal hypothesis (no code)">
            Signal hypothesis
          </Label>
          <Textarea
            value={form.description}
            onChange={(v) => update({ description: v })}
            placeholder="Describe what drives your signal in 2–4 sentences. e.g. 'Cross-sectional 12-1 price momentum on Nifty 500, ranked weekly, long top decile short bottom decile, sector-neutral...'"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Review
// ─────────────────────────────────────────────────────────────────────────────

function ReviewRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border last:border-b-0">
      <span className="text-sm text-text-secondary flex-shrink-0">{label}</span>
      <span className={cn("text-sm text-text-primary text-right", mono && "font-mono tabular-nums")}>
        {value}
      </span>
    </div>
  );
}

function Step3({ form }: { form: FormState }) {
  const typeLabel = form.submissionType === "signal" ? "Signal file only" : "Full source code";
  const fileDesc  = form.submissionType === "signal"
    ? form.signalFileName || "—"
    : `${form.codeText.trim().split("\n").length} lines of code`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Review your submission</h2>
        <p className="text-sm text-text-secondary mt-1">
          Confirm the details below. Once submitted, your strategy will be timestamped and queued for validation.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-2.5 bg-elevated border-b border-border">
          <span className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">Submission summary</span>
        </div>
        <div className="px-4 divide-y divide-border">
          <ReviewRow label="Submission type"  value={typeLabel} />
          <ReviewRow label="File / code"       value={fileDesc} />
          <ReviewRow label="Strategy name"     value={form.name} />
          <ReviewRow label="Asset class"       value={form.assetClass} />
          <ReviewRow label="Universe"          value={form.universe || "Not specified"} />
          <ReviewRow label="Frequency"         value={form.frequency} />
          <ReviewRow label="Expected capacity" value={form.capacityM ? `$${form.capacityM}M` : "Not specified"} mono />
          <ReviewRow
            label="Backtest period"
            value={`${form.backtestStart} – ${form.backtestEnd}${form.hasOOS ? " (includes OOS)" : ""}`}
            mono
          />
          {form.description && (
            <div className="py-2.5">
              <p className="text-sm text-text-secondary mb-1">Hypothesis</p>
              <p className="text-sm text-text-primary leading-relaxed">{form.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* IP / agreement notice */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent flex-shrink-0" />
          <span className="text-sm font-medium text-text-primary">What happens on submit</span>
        </div>
        <ul className="space-y-2">
          {[
            "A SHA-256 provenance hash is computed from your submission content and bound to a UTC timestamp.",
            "The hash is stored immutably — establishing that this strategy existed in this form before any review begins.",
            "Your submission is encrypted and queued for the next validation cycle (typically 2–4 weeks).",
            "You will receive a written validation report regardless of outcome.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-accent flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-text-tertiary pt-1 border-t border-accent/10">
          By submitting you confirm you have read and agree to the 26 Miles Contributor Agreement and
          that the submitted material is your original work.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation screen
// ─────────────────────────────────────────────────────────────────────────────

function HashDisplay({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(hash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border bg-elevated/60 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">SHA-256 provenance hash</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-2xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-profit" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="font-mono text-xs text-text-secondary break-all leading-relaxed">{hash}</p>
    </div>
  );
}

function ConfirmationScreen({
  conf, strategyName,
}: {
  conf: Confirmation;
  strategyName: string;
}) {
  return (
    <div className="space-y-8 text-center">
      {/* Success mark */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-profit/10 border border-profit/20">
          <CheckCircle2 className="h-8 w-8 text-profit" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Submission received</h2>
          <p className="text-sm text-text-secondary mt-1">
            Your strategy has been timestamped and queued for validation.
          </p>
        </div>
      </div>

      {/* Receipt card */}
      <div className="rounded-xl border border-border bg-surface text-left overflow-hidden">
        <div className="px-5 py-3 bg-elevated border-b border-border flex items-center justify-between">
          <span className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">Submission receipt</span>
          <span className="font-mono text-xs text-accent">{conf.submissionId}</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xs text-text-tertiary font-mono uppercase tracking-wider mb-1">Strategy</p>
              <p className="text-sm text-text-primary font-medium">{strategyName || "Unnamed strategy"}</p>
            </div>
            <div>
              <p className="text-2xs text-text-tertiary font-mono uppercase tracking-wider mb-1">Submitted at</p>
              <p className="text-sm font-mono text-text-primary tabular-nums">{conf.receivedAt}</p>
            </div>
            <div className="col-span-2">
              <p className="text-2xs text-text-tertiary font-mono uppercase tracking-wider mb-1">UTC timestamp</p>
              <p className="text-sm font-mono text-text-secondary tabular-nums">{conf.timestamp}</p>
            </div>
          </div>

          <HashDisplay hash={conf.hash} />

          <div className="rounded-lg border border-profit/20 bg-profit/5 px-4 py-3 flex items-start gap-2.5">
            <Lock className="h-3.5 w-3.5 text-profit flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Your submission is timestamped and bound to your contributor agreement.
              The hash above proves this strategy existed in this form at the time shown —
              before any review has taken place.
            </p>
          </div>
        </div>
      </div>

      {/* What's next */}
      <div className="rounded-xl border border-border bg-surface p-5 text-left space-y-3">
        <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">What happens next</p>
        <div className="space-y-3">
          {[
            { step: "01", text: "A quant validator is assigned within 3 business days." },
            { step: "02", text: "OOS testing and overfitting checks run over 2–4 weeks." },
            { step: "03", text: "You receive a full written validation report — pass or fail." },
            { step: "04", text: "Passing strategies enter the paper-trading phase. Capital follows." },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="font-mono text-xs text-text-tertiary flex-shrink-0 w-4">{step}</span>
              <span className="text-sm text-text-secondary leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-medium bg-accent hover:bg-accent/90 text-white transition-colors"
        >
          Go to dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-medium border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary transition-colors"
        >
          View leaderboard
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation bar
// ─────────────────────────────────────────────────────────────────────────────

function canAdvance(step: number, form: FormState): boolean {
  if (step === 1) {
    if (!form.submissionType) return false;
    if (form.submissionType === "signal" && !form.signalFileName) return false;
    if (form.submissionType === "code"   && form.codeText.trim().length < 20) return false;
    return true;
  }
  if (step === 2) {
    return !!(form.name.trim() && form.assetClass && form.frequency && form.capacityM);
  }
  return true;
}

function NavBar({
  step, form, onBack, onNext, onSubmit, submitting,
}: {
  step: number;
  form: FormState;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const ok = canAdvance(step, form);

  return (
    <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
      <button
        onClick={onBack}
        disabled={step === 1}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-medium border border-border transition-colors",
          step === 1
            ? "opacity-0 pointer-events-none"
            : "text-text-secondary hover:text-text-primary hover:border-accent/30"
        )}
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3">
        {!ok && step !== 3 && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-text-tertiary">
            <AlertCircle className="h-3.5 w-3.5" />
            {step === 1
              ? form.submissionType
                ? "Upload a file or paste code to continue"
                : "Choose a submission type"
              : "Fill in required fields to continue"}
          </span>
        )}

        {step < 3 ? (
          <button
            onClick={onNext}
            disabled={!ok}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-5 py-2 text-sm font-medium transition-colors",
              ok
                ? "bg-accent hover:bg-accent/90 text-white"
                : "bg-muted text-text-tertiary cursor-not-allowed"
            )}
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded px-5 py-2 text-sm font-semibold bg-accent hover:bg-accent/90 text-white transition-colors disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit strategy"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root page
// ─────────────────────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  function update(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function handleSubmit() {
    setSubmitting(true);
    // Simulate a short async delay for realism
    setTimeout(() => {
      const now = new Date();
      setConfirmation({
        hash:         genHash(),
        timestamp:    now.toISOString().replace("T", " ").slice(0, 19) + " UTC",
        receivedAt:   now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        submissionId: genSubmissionId(),
      });
      setSubmitting(false);
    }, 1400);
  }

  return (
    <PageContainer className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Submit a strategy
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Your submission is encrypted, timestamped, and reviewed under NDA.
        </p>
      </div>

      {!confirmation ? (
        <>
          <StepBar current={step} />

          <div className="card p-6 sm:p-8">
            {step === 1 && <Step1 form={form} update={update} />}
            {step === 2 && <Step2 form={form} update={update} />}
            {step === 3 && <Step3 form={form} />}

            <NavBar
              step={step}
              form={form}
              onBack={() => setStep((s) => Math.max(1, s - 1))}
              onNext={() => setStep((s) => Math.min(3, s + 1))}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        </>
      ) : (
        <div className="card p-6 sm:p-8 animate-fade-in">
          <ConfirmationScreen conf={confirmation} strategyName={form.name} />
        </div>
      )}
    </PageContainer>
  );
}
