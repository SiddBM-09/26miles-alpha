"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles, FileText, Code2, Upload, Lock, CheckCircle2,
  ChevronRight, ChevronLeft, Copy, Check, AlertCircle,
  ArrowRight, Shield, Clock, Plus, X, RefreshCw, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/AppShell";
import { MetricLabel } from "@/components/ui/MetricLabel";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SubmissionType = "ai" | "signal" | "code" | null;
type AssetClass = "Nifty F&O" | "Bank Nifty F&O" | "NSE Large Cap" | "NSE Mid Cap" | "NSE Small Cap" | "Multi-Asset" | "";
type Frequency  = "Intraday" | "Daily" | "Weekly" | "Monthly" | "";

interface Rule {
  id: string;
  indicator: string;
  condition: string;
  value: string;
  action: string;
}

interface AIResult {
  strategyName: string;
  summary: string;
  suggestedAssetClass: AssetClass;
  suggestedFrequency: Frequency;
  capacityEstimateM: number;
  universe: string;
  parameters: { key: string; value: string }[];
  rules: Rule[];
}

interface FormState {
  submissionType: SubmissionType;
  // AI Maker
  aiDescription: string;
  aiRules: Rule[];
  aiResult: AIResult | null;
  // Signal
  signalFileName: string;
  // Code
  codeText: string;
  codeFileName: string;
  // Metadata (Step 2)
  name: string;
  assetClass: AssetClass;
  universe: string;
  frequency: Frequency;
  capacityM: string;
  hypothesis: string;
}

interface Confirmation {
  hash: string;
  timestamp: string;
  submissionId: string;
  receivedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INDICATORS = [
  "RSI (14)", "SMA (20)", "SMA (50)", "SMA (200)",
  "EMA (20)", "MACD", "Volume", "Price",
  "BB Upper (2σ)", "BB Lower (2σ)", "ATR (14)",
];
const CONDITIONS = [
  "is below", "is above", "crosses above", "crosses below",
  "increases by %", "decreases by %",
];
const ACTIONS = ["Buy", "Sell Short", "Exit Long", "Exit Short", "Reduce to 50%"];

const AI_SUGGESTIONS = [
  "Buy large-cap stocks when RSI drops below 30, exit when it recovers above 55",
  "Long top 20% of Nifty 500 by 12-1 month momentum, rebalance weekly",
  "MACD crossover on Nifty 500 confirmed by 50-day SMA trend filter",
  "Enter reversals on high-volume gap-downs greater than 2% at open",
];

const GEN_MESSAGES = [
  "Parsing your description…",
  "Identifying signal type…",
  "Constructing rule structure…",
  "Estimating capacity parameters…",
  "Finalising strategy summary…",
];

const ASSET_CLASS_OPTIONS: { value: AssetClass; label: string }[] = [
  { value: "Nifty F&O",      label: "Nifty F&O" },
  { value: "Bank Nifty F&O", label: "Bank Nifty F&O" },
  { value: "NSE Large Cap",  label: "NSE Large Cap" },
  { value: "NSE Mid Cap",    label: "NSE Mid Cap" },
  { value: "NSE Small Cap",  label: "NSE Small Cap" },
  { value: "Multi-Asset",    label: "Multi-Asset" },
];
const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "Intraday", label: "Intraday (sub-daily)" },
  { value: "Daily",    label: "Daily" },
  { value: "Weekly",   label: "Weekly" },
  { value: "Monthly",  label: "Monthly" },
];

function newRule(): Rule {
  return { id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, indicator: "RSI (14)", condition: "is below", value: "30", action: "Buy" };
}

const INITIAL: FormState = {
  submissionType: null,
  aiDescription: "", aiRules: [], aiResult: null,
  signalFileName: "",
  codeText: "", codeFileName: "",
  name: "", assetClass: "", universe: "", frequency: "", capacityM: "", hypothesis: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock AI generation
// ─────────────────────────────────────────────────────────────────────────────

function mockGenerate(description: string, rules: Rule[]): AIResult {
  const d = description.toLowerCase();
  const hasMeanRevert = /oversold|overbought|revert|bounce|rsi|recovery|mean/.test(d);
  const hasMomentum   = /momentum|trend|breakout|rally|strength|follow/.test(d);
  const hasOptions    = /option|futures|f&o|derivative|nifty|bank nifty/.test(d);
  const hasMacd       = /macd|crossover|cross/.test(d);
  const hasUserRules  = rules.length > 0;

  const rsiHint = hasUserRules && rules.some(r => r.indicator.startsWith("RSI") && r.condition.includes("below"));

  if (hasMeanRevert || rsiHint) {
    return {
      strategyName: "RSI Mean-Reversion v1",
      summary: "This strategy targets short-term price dislocations in liquid large-cap equities by entering long when the 14-period RSI falls below 30 (oversold) and exiting when it crosses back above 55, signalling normalisation. A 20-day realised volatility filter gates entries to avoid mean-reversion attempts during trending regimes where the signal historically degrades. Positions are sized inversely proportional to realised volatility, capped at 3% of the notional book per name.",
      suggestedAssetClass: "NSE Large Cap",
      suggestedFrequency: "Daily",
      capacityEstimateM: 12,
      universe: "Nifty 500 constituents, min 30-day ADV ₹15 Cr",
      parameters: [
        { key: "RSI period",       value: "14 days" },
        { key: "Entry threshold",  value: "RSI < 30 (oversold)" },
        { key: "Exit threshold",   value: "RSI > 55 (normalised)" },
        { key: "Volatility gate",  value: "20-day realised vol < 35% ann." },
        { key: "Position cap",     value: "3% per name, vol-scaled" },
        { key: "Hold period (est.)", value: "4–12 trading days" },
      ],
      rules: hasUserRules ? rules : [
        { id: "g1", indicator: "RSI (14)",   condition: "is below",     value: "30", action: "Buy" },
        { id: "g2", indicator: "RSI (14)",   condition: "is above",     value: "55", action: "Exit Long" },
        { id: "g3", indicator: "Volume",     condition: "is above",     value: "150", action: "Buy" },
      ],
    };
  }

  if (hasMacd) {
    return {
      strategyName: "MACD Trend-Follow v1",
      summary: "This strategy generates directional signals on Nifty 500 equities using a 12-26-9 MACD crossover confirmed by a 50-day SMA trend filter — long only when price is above the 50-day SMA, flat otherwise. Entry requires the MACD histogram to hold direction for two consecutive bars to filter false crossovers during choppy markets. Exits are triggered by a MACD cross in the opposite direction or a trailing 1.5× ATR stop.",
      suggestedAssetClass: "NSE Large Cap",
      suggestedFrequency: "Daily",
      capacityEstimateM: 18,
      universe: "Nifty 200 constituents, min 20-day ADV ₹20 Cr",
      parameters: [
        { key: "MACD fast EMA",      value: "12 periods" },
        { key: "MACD slow EMA",      value: "26 periods" },
        { key: "Signal line",        value: "9-period EMA of MACD" },
        { key: "Trend filter",       value: "Price above SMA (50)" },
        { key: "Entry confirmation", value: "2-bar histogram hold" },
        { key: "Trailing stop",      value: "1.5× ATR (14)" },
      ],
      rules: hasUserRules ? rules : [
        { id: "g1", indicator: "MACD",   condition: "crosses above", value: "0", action: "Buy" },
        { id: "g2", indicator: "SMA (50)", condition: "is below",    value: "0", action: "Buy" },
        { id: "g3", indicator: "MACD",   condition: "crosses below", value: "0", action: "Exit Long" },
      ],
    };
  }

  if (hasMomentum) {
    return {
      strategyName: "Cross-Sectional Momentum v1",
      summary: "This strategy exploits the cross-sectional momentum premium by ranking Nifty 500 constituents on their 12-1 month return (12-month formation, 1-month skip to mitigate short-term reversal), going long the top 20% and flat the bottom 20%. Portfolio is rebalanced weekly at Friday close with equal-weight within each decile and a sector-neutrality overlay to prevent unintended factor concentrations. The skip-month is the critical implementation detail — without it, short-term reversal erodes signal quality materially.",
      suggestedAssetClass: "NSE Large Cap",
      suggestedFrequency: "Weekly",
      capacityEstimateM: 25,
      universe: "Nifty 500 constituents, top 300 by 30-day liquidity",
      parameters: [
        { key: "Formation period", value: "12 months (returns)" },
        { key: "Skip period",      value: "1 month (reversal avoidance)" },
        { key: "Rebalance",        value: "Weekly, Friday close" },
        { key: "Long decile",      value: "Top 20% by 12-1 return" },
        { key: "Short/flat",       value: "Bottom 20%, flat (no shorting)" },
        { key: "Sector neutrality", value: "Applied at GICS Level 2" },
      ],
      rules: hasUserRules ? rules : [
        { id: "g1", indicator: "Price", condition: "increases by %", value: "12", action: "Buy" },
        { id: "g2", indicator: "Price", condition: "decreases by %", value: "10", action: "Sell Short" },
      ],
    };
  }

  if (hasOptions) {
    return {
      strategyName: "Options Flow Alpha v1",
      summary: "This strategy derives short-term directional signals from Nifty and Bank Nifty weekly options order flow, entering when the put-call ratio and aggregate open interest diverge meaningfully from the prior-day baseline. The strategy targets 0–3 DTE contracts with defined risk, using ATM straddle pricing as an implied volatility gauge. All positions carry a hard stop at 1.5× entry premium and are delta-hedged on entry.",
      suggestedAssetClass: "Nifty F&O",
      suggestedFrequency: "Intraday",
      capacityEstimateM: 4,
      universe: "Nifty & Bank Nifty weekly ATM options, 0–3 DTE",
      parameters: [
        { key: "PCR threshold",  value: "> 1.5σ from 5-day avg" },
        { key: "OI divergence",  value: "> 20% shift call/put imbalance" },
        { key: "Target DTE",     value: "0–3 days to expiry" },
        { key: "Delta hedge",    value: "Delta-neutral at entry" },
        { key: "Stop-loss",      value: "1.5× entry premium" },
        { key: "Max daily risk", value: "0.5% of book" },
      ],
      rules: hasUserRules ? rules : [
        { id: "g1", indicator: "Volume", condition: "is above",  value: "200", action: "Buy" },
        { id: "g2", indicator: "ATR (14)", condition: "is above", value: "50", action: "Sell Short" },
      ],
    };
  }

  // Generic multi-factor fallback
  return {
    strategyName: "Multi-Factor Alpha v1",
    summary: "This strategy combines quality, value, and momentum factors to identify large-cap equities with undervalued fundamentals and improving price dynamics. The composite signal is a z-score blend of trailing twelve-month earnings revisions (40%), price-to-book rank (35%), and 3-month price momentum (25%), rebalanced monthly. The universe is screened for a minimum ₹10 Cr daily average turnover to ensure capacity and execution quality.",
    suggestedAssetClass: "NSE Large Cap",
    suggestedFrequency: "Monthly",
    capacityEstimateM: 15,
    universe: "Nifty 500 constituents, min 30-day ADV ₹10 Cr",
    parameters: [
      { key: "Factor 1 (quality)",  value: "Earnings revision — weight 40%" },
      { key: "Factor 2 (value)",    value: "Price-to-book rank — weight 35%" },
      { key: "Factor 3 (momentum)", value: "3-month return — weight 25%" },
      { key: "Composite signal",    value: "Z-score blend, monthly" },
      { key: "Liquidity screen",    value: "ADV > ₹10 Cr (30-day)" },
      { key: "Rebalance",           value: "Monthly, first trading day" },
    ],
    rules: hasUserRules ? rules : [
      { id: "g1", indicator: "Price",  condition: "increases by %", value: "5",   action: "Buy" },
      { id: "g2", indicator: "Volume", condition: "is above",       value: "150", action: "Buy" },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 space-y-0.5">
      <div className="text-xs font-medium text-text-secondary">{children}</div>
      {hint && <div className="text-2xs text-text-tertiary">{hint}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded bg-surface border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary",
        "focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors",
        className
      )}
    />
  );
}

function SelectInput<T extends string>({ value, onChange, options, placeholder }: {
  value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[]; placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(
        "w-full rounded bg-surface border border-border px-3 py-2 text-sm text-text-primary appearance-none cursor-pointer",
        "focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors",
        !value && "text-text-tertiary"
      )}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-elevated text-text-primary">{o.label}</option>
      ))}
    </select>
  );
}

function TextareaInput({ value, onChange, placeholder, rows = 4, mono = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; mono?: boolean;
}) {
  return (
    <textarea
      value={value} placeholder={placeholder} rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded bg-surface border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary resize-y",
        "focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors",
        mono && "font-mono text-xs leading-relaxed"
      )}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File drop zone (reused by signal + code)
// ─────────────────────────────────────────────────────────────────────────────

function FileDropZone({ fileName, onFile, accept, hint }: {
  fileName: string; onFile: (name: string) => void; accept: string; hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f.name);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative rounded-lg border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors select-none",
        dragging  ? "border-accent/60 bg-accent/5" :
        fileName  ? "border-profit/40 bg-profit/5" :
                    "border-border hover:border-accent/30 hover:bg-elevated/40"
      )}
    >
      <input ref={inputRef} type="file" accept={accept} className="sr-only"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0].name); }} />
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
              Drop your file here, or <span className="text-accent">browse</span>
            </p>
            <p className="text-xs text-text-tertiary mt-1">{hint}</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule row
// ─────────────────────────────────────────────────────────────────────────────

function RuleRow({ rule, onUpdate, onRemove }: {
  rule: Rule;
  onUpdate: (patch: Partial<Rule>) => void;
  onRemove: () => void;
}) {
  const sel = (opts: string[], val: string, key: keyof Rule) => (
    <select
      value={val}
      onChange={(e) => onUpdate({ [key]: e.target.value })}
      className="w-full rounded border border-border bg-surface px-2 py-1.5 text-xs text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
    >
      {opts.map((o) => <option key={o} value={o} className="bg-elevated">{o}</option>)}
    </select>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-[2fr_2fr_1fr_1.5fr_auto] gap-2 items-center">
      {sel(INDICATORS, rule.indicator, "indicator")}
      {sel(CONDITIONS, rule.condition, "condition")}
      <input
        type="number"
        value={rule.value}
        onChange={(e) => onUpdate({ value: e.target.value })}
        placeholder="val"
        className="w-full rounded border border-border bg-surface px-2 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary font-mono focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
      />
      {sel(ACTIONS, rule.action, "action")}
      <button
        onClick={onRemove}
        className="flex items-center justify-center h-7 w-7 rounded border border-border text-text-tertiary hover:text-loss hover:border-loss/40 transition-colors"
        aria-label="Remove rule"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Strategy Maker
// ─────────────────────────────────────────────────────────────────────────────

function AIStrategyMaker({ form, update }: {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => setMsgIdx((i) => (i + 1) % GEN_MESSAGES.length), 500);
    return () => clearInterval(interval);
  }, [generating]);

  const canGenerate = form.aiDescription.trim().length > 0 || form.aiRules.length > 0;

  function handleGenerate() {
    if (!canGenerate || generating) return;
    setGenerating(true);
    setTimeout(() => {
      const result = mockGenerate(form.aiDescription, form.aiRules);
      update({ aiResult: result });
      setHasGenerated(true);
      setGenerating(false);
    }, 1800);
  }

  function handleEdit() {
    update({ aiResult: null });
  }

  function addRule() {
    update({ aiRules: [...form.aiRules, newRule()] });
  }

  function updateRule(id: string, patch: Partial<Rule>) {
    update({ aiRules: form.aiRules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }

  function removeRule(id: string) {
    update({ aiRules: form.aiRules.filter((r) => r.id !== id) });
  }

  // ── Generated result view ─────────────────────────────────────────────────

  if (form.aiResult) {
    const r = form.aiResult;
    return (
      <div className="space-y-4 animate-fade-in">

        {/* Result card */}
        <div className="rounded-lg border border-accent/30 bg-surface overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-elevated border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
                <Bot className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="text-2xs text-text-tertiary font-mono uppercase tracking-wider">AI draft</p>
                <p className="text-sm font-semibold text-text-primary">{r.strategyName}</p>
              </div>
            </div>
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent transition-colors border border-border hover:border-accent/30 rounded px-2.5 py-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              Edit &amp; regenerate
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Summary prose */}
            <p className="text-sm text-text-secondary leading-[1.8]">{r.summary}</p>

            {/* Parameters grid */}
            <div>
              <p className="text-2xs font-mono text-text-tertiary uppercase tracking-wider mb-2.5">
                Suggested parameters
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {r.parameters.map(({ key, value }) => (
                  <div key={key} className="flex items-baseline gap-2 text-xs">
                    <span className="text-text-tertiary font-mono flex-shrink-0 w-36">{key}</span>
                    <span className="text-text-primary font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated rules */}
            <div>
              <p className="text-2xs font-mono text-text-tertiary uppercase tracking-wider mb-2.5">
                Rules
              </p>
              <div className="space-y-1.5">
                {r.rules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-2 text-xs font-mono">
                    <span className="h-1 w-1 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-text-secondary">{rule.indicator}</span>
                    <span className="text-text-tertiary">{rule.condition}</span>
                    <span className="text-text-primary font-medium">{rule.value}</span>
                    <span className="text-text-tertiary mx-0.5">→</span>
                    <span className={cn(
                      "font-medium",
                      rule.action.startsWith("Buy") ? "text-profit" :
                      rule.action.startsWith("Sell") ? "text-loss" : "text-warn"
                    )}>
                      {rule.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Carry-forward note */}
            <div className="flex items-start gap-2.5 rounded-lg border border-profit/20 bg-profit/5 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-profit flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-relaxed">
                The suggested asset class, frequency, and capacity will pre-fill Step 2.
                You can review and adjust them before submitting.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Builder view ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Plain language */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-text-secondary mb-1.5">
            Describe your strategy idea
          </p>
          <TextareaInput
            value={form.aiDescription}
            onChange={(v) => update({ aiDescription: v })}
            placeholder='e.g. "Buy large-cap stocks when RSI drops below 30 and sell when they recover above 55. Avoid entry during high-volatility regimes."'
            rows={4}
          />
        </div>

        {/* Quick suggestions */}
        {!form.aiDescription && (
          <div className="flex flex-wrap gap-2">
            <span className="text-2xs text-text-tertiary font-mono self-center">Try:</span>
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => update({ aiDescription: s })}
                className="rounded-full border border-border bg-elevated px-3 py-1 text-2xs text-text-secondary hover:border-accent/40 hover:text-text-primary transition-colors"
              >
                {s.length > 50 ? s.slice(0, 48) + "…" : s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visual rule builder */}
      <div className="rounded-lg border border-border bg-elevated/30 p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-text-secondary">Visual rule builder</p>
            <p className="text-2xs text-text-tertiary mt-0.5">
              Optional — if you leave this empty, the AI will infer rules from your description.
            </p>
          </div>
        </div>

        {form.aiRules.length > 0 && (
          <div className="space-y-2">
            {/* Column labels (desktop only) */}
            <div className="hidden sm:grid sm:grid-cols-[2fr_2fr_1fr_1.5fr_auto] gap-2 px-0.5">
              {["Indicator", "Condition", "Value", "Action", ""].map((h) => (
                <span key={h} className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {form.aiRules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                onUpdate={(p) => updateRule(rule.id, p)}
                onRemove={() => removeRule(rule.id)}
              />
            ))}
          </div>
        )}

        <button
          onClick={addRule}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors border border-accent/20 hover:border-accent/40 rounded px-3 py-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </button>
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className={cn(
            "inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-semibold transition-colors",
            canGenerate && !generating
              ? "bg-accent hover:bg-accent/90 text-canvas"
              : "bg-muted text-text-tertiary cursor-not-allowed"
          )}
        >
          {generating ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-canvas/30 border-t-canvas animate-spin" />
              {GEN_MESSAGES[msgIdx]}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {hasGenerated ? "Regenerate" : "Generate Strategy"}
            </>
          )}
        </button>

        {!canGenerate && (
          <span className="text-xs text-text-tertiary flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Add a description or rules to generate
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal upload
// ─────────────────────────────────────────────────────────────────────────────

function SignalUpload({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-profit/20 bg-profit/5 px-4 py-3">
        <Lock className="h-4 w-4 text-profit flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          <span className="font-medium text-text-primary">Your strategy logic stays entirely private.</span>
          {" "}We validate purely from the signal output — no source code, no model weights, no hypothesis required.
          Your implementation is never seen by anyone at 26 Miles.
        </p>
      </div>
      <FileDropZone
        fileName={form.signalFileName}
        onFile={(n) => update({ signalFileName: n })}
        accept=".csv,.parquet,.feather,.xlsx"
        hint="CSV · Parquet · Feather · Excel · max 100 MB"
      />
      <p className="text-2xs text-text-tertiary font-mono leading-relaxed">
        Format: date column + one column per ticker (or index component) with position weight (−1 to +1).
        See the contributor guide for schema details.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full source code
// ─────────────────────────────────────────────────────────────────────────────

const CODE_PLACEHOLDER = `# Python, R, or Julia accepted.
# Example (Python):

import pandas as pd
import numpy as np

def generate_signals(prices: pd.DataFrame) -> pd.DataFrame:
    """Return daily position weights. Index: date | Columns: ticker | Values: weight (-1 to +1)."""
    mom_12_1 = prices.shift(21) / prices.shift(252) - 1
    signals  = mom_12_1.rank(axis=1, pct=True) - 0.5
    return signals.where(signals.abs() > 0.3, 0)
`;

function CodeSubmit({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-elevated/40 px-4 py-3">
        <Shield className="h-4 w-4 text-text-tertiary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          Full-code submissions are encrypted at rest, reviewed only by 26 Miles quant staff, and governed by your contributor NDA.
          Enables deeper walk-forward testing and a higher potential Alpha Score.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FieldLabel>Strategy code</FieldLabel>
          <div className="flex items-center gap-2">
            {form.codeFileName && (
              <span className="text-2xs font-mono text-profit flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {form.codeFileName}
              </span>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="text-2xs text-accent hover:text-accent/80 border border-accent/20 hover:border-accent/40 rounded px-2 py-1 transition-colors font-mono"
            >
              {form.codeFileName ? "Replace file" : "Upload file"}
            </button>
            <input ref={fileRef} type="file" accept=".py,.r,.jl,.txt" className="sr-only"
              onChange={(e) => { if (e.target.files?.[0]) { update({ codeFileName: e.target.files[0].name, codeText: "" }); } }} />
          </div>
        </div>
        {!form.codeFileName && (
          <TextareaInput
            value={form.codeText}
            onChange={(v) => update({ codeText: v })}
            placeholder={CODE_PLACEHOLDER}
            rows={12}
            mono
          />
        )}
      </div>
      <p className="text-2xs text-text-tertiary font-mono">
        Python · R · Julia · Must include a signal-generation function or backtest loop.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — type selection + active content
// ─────────────────────────────────────────────────────────────────────────────

interface TypeDef {
  id: SubmissionType;
  Icon: React.ElementType;
  label: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  description: string;
  features: string[];
  border: string;
  selectedBorder: string;
  selectedBg: string;
  iconCls: string;
  flagship?: boolean;
}

const TYPES: TypeDef[] = [
  {
    id: "ai",
    Icon: Sparkles,
    label: "AI Strategy Maker",
    tag: "No-code",
    tagColor: "text-accent",
    tagBg: "bg-accent/10 border-accent/20",
    description: "Describe your idea in plain language. Our AI co-pilot translates it into a structured, testable strategy — rules, parameters, and all.",
    features: ["Natural language description", "Visual rule builder", "AI-generated parameters"],
    border: "border-border hover:border-accent/40",
    selectedBorder: "border-accent/60",
    selectedBg: "bg-accent/5",
    iconCls: "bg-accent/10 border-accent/20 text-accent",
    flagship: true,
  },
  {
    id: "signal",
    Icon: FileText,
    label: "Signal file",
    tag: "Logic stays private",
    tagColor: "text-profit",
    tagBg: "bg-profit/10 border-profit/20",
    description: "Upload a CSV or Parquet of timestamped position weights. We validate from the signal alone — your strategy logic is never shared.",
    features: ["CSV · Parquet · Feather · Excel", "No source code required", "Hypothesis stays private"],
    border: "border-border hover:border-profit/40",
    selectedBorder: "border-profit/60",
    selectedBg: "bg-profit/5",
    iconCls: "bg-profit/10 border-profit/20 text-profit",
  },
  {
    id: "code",
    Icon: Code2,
    label: "Full source code",
    tag: "Deeper validation",
    tagColor: "text-warn",
    tagBg: "bg-warn/10 border-warn/20",
    description: "Paste or upload your implementation in Python, R, or Julia. Enables richer walk-forward testing and a higher potential Alpha Score.",
    features: ["Python · R · Julia accepted", "Deeper overfitting diagnostics", "Reviewed under NDA"],
    border: "border-border hover:border-warn/30",
    selectedBorder: "border-warn/50",
    selectedBg: "bg-warn/5",
    iconCls: "bg-warn/10 border-warn/20 text-warn",
  },
];

function Step1({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">How are you submitting?</h2>
        <p className="text-sm text-text-secondary mt-1">
          Choose the path that fits your strategy. You can always resubmit using a different method later.
        </p>
      </div>

      {/* Type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TYPES.map((t) => {
          const { Icon } = t;
          const selected = form.submissionType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => update({ submissionType: t.id })}
              className={cn(
                "relative w-full text-left rounded-lg border p-5 flex flex-col gap-4 transition-all text-left",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                selected ? `${t.selectedBorder} ${t.selectedBg}` : `${t.border} bg-surface`
              )}
            >
              {t.flagship && (
                <span className={cn(
                  "absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium",
                  t.tagBg, t.tagColor
                )}>
                  <Sparkles className="h-2.5 w-2.5" />
                  Recommended
                </span>
              )}

              <div className="flex items-start gap-3">
                <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition-colors", t.iconCls)}>
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </div>
              </div>

              <div>
                <h3 className={cn("text-sm font-semibold mb-1.5", selected ? "text-text-primary" : "text-text-secondary")}>
                  {t.label}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">{t.description}</p>
              </div>

              <ul className="space-y-1.5 mt-auto">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-text-tertiary">
                    <CheckCircle2 className="h-3 w-3 text-text-tertiary/60 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {selected && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active content */}
      {form.submissionType && (
        <div className="card p-6 animate-fade-in">
          {form.submissionType === "ai"     && <AIStrategyMaker form={form} update={update} />}
          {form.submissionType === "signal" && <SignalUpload    form={form} update={update} />}
          {form.submissionType === "code"   && <CodeSubmit      form={form} update={update} />}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — metadata
// ─────────────────────────────────────────────────────────────────────────────

function Step2({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Strategy details</h2>
        <p className="text-sm text-text-secondary mt-1">
          Used to route your submission to the right validator and set capacity expectations.
        </p>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <FieldLabel hint="Not shown publicly until your strategy goes live.">
            <MetricLabel
              label="Strategy name"
              tooltip="A short internal identifier for your strategy. Not shown publicly until it goes live."
              labelClassName="text-xs font-medium text-text-secondary"
            />
            {" "}<span className="text-loss">*</span>
          </FieldLabel>
          <TextInput
            value={form.name}
            onChange={(v) => update({ name: v })}
            placeholder="e.g. Nifty Momentum Factor v3"
          />
        </div>

        {/* Asset class + frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>
              <MetricLabel
                label="Asset class"
                tooltip="The primary market or instrument class your strategy trades."
                labelClassName="text-xs font-medium text-text-secondary"
              />
              {" "}<span className="text-loss">*</span>
            </FieldLabel>
            <SelectInput
              value={form.assetClass}
              onChange={(v) => update({ assetClass: v })}
              options={ASSET_CLASS_OPTIONS}
              placeholder="Select asset class"
            />
          </div>
          <div>
            <FieldLabel>
              <MetricLabel
                label="Rebalance frequency"
                tooltip="How often the strategy generates new position weights or rebalances its portfolio."
                labelClassName="text-xs font-medium text-text-secondary"
              />
              {" "}<span className="text-loss">*</span>
            </FieldLabel>
            <SelectInput
              value={form.frequency}
              onChange={(v) => update({ frequency: v })}
              options={FREQUENCY_OPTIONS}
              placeholder="Select frequency"
            />
          </div>
        </div>

        {/* Universe */}
        <div>
          <FieldLabel>
            <MetricLabel
              label="Universe"
              tooltip="The set of instruments the strategy selects from, e.g. 'Nifty 500 constituents, top 200 by liquidity'."
              labelClassName="text-xs font-medium text-text-secondary"
            />
          </FieldLabel>
          <TextInput
            value={form.universe}
            onChange={(v) => update({ universe: v })}
            placeholder="e.g. Nifty 500 constituents, top 100 by liquidity"
          />
        </div>

        {/* Capacity */}
        <div>
          <FieldLabel hint="Conservative estimate of max AUM before returns degrade.">
            <MetricLabel
              label="Expected capacity"
              tooltip="Your conservative estimate of the maximum AUM this strategy can run before market impact degrades returns. In USD millions."
              labelClassName="text-xs font-medium text-text-secondary"
            />
            {" "}(USD M) <span className="text-loss">*</span>
          </FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary font-mono">$</span>
            <TextInput
              value={form.capacityM}
              onChange={(v) => update({ capacityM: v })}
              placeholder="e.g. 15"
              type="number"
              className="pl-7"
            />
          </div>
        </div>

        {/* Hypothesis (only for signal/code types) */}
        {form.submissionType !== "ai" && (
          <div>
            <FieldLabel hint="No code — plain language only.">
              <MetricLabel
                label="Signal hypothesis"
                tooltip="A brief plain-language description of what drives your strategy's signal — 2 to 4 sentences."
                labelClassName="text-xs font-medium text-text-secondary"
              />
            </FieldLabel>
            <TextareaInput
              value={form.hypothesis}
              onChange={(v) => update({ hypothesis: v })}
              placeholder="Describe what drives your signal in 2–4 sentences. e.g. 'Cross-sectional 12-1 price momentum on Nifty 500, ranked weekly, long top decile, sector-neutral…'"
              rows={3}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — review & submit
// ─────────────────────────────────────────────────────────────────────────────

function mockHash(seed: string): string {
  const hex = "0123456789abcdef";
  let h = 0x12345678;
  for (const c of seed) { h = (Math.imul(h, 31) ^ c.charCodeAt(0)) | 0; }
  let out = "";
  for (let i = 0; i < 64; i++) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0;
    out += hex[(h >>> 28) & 0xf];
  }
  return out;
}

function ReviewRow({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border last:border-b-0">
      <span className="text-sm text-text-secondary flex-shrink-0">{label}</span>
      <span className={cn("text-sm text-text-primary text-right", mono && "font-mono tabular-nums")}>{value}</span>
    </div>
  );
}

function Step3({ form }: { form: FormState }) {
  const typeLabel =
    form.submissionType === "ai"     ? "AI Strategy Maker" :
    form.submissionType === "signal" ? "Signal file" : "Full source code";

  const fileDesc =
    form.submissionType === "ai"     ? (form.aiResult?.strategyName ?? "AI-generated") :
    form.submissionType === "signal" ? (form.signalFileName || "—") :
    form.codeFileName                ? form.codeFileName :
    `${form.codeText.trim().split("\n").length} lines of code`;

  const seed = `${form.submissionType}${form.name}${form.assetClass}${Date.now()}`;
  const hash = mockHash(seed);
  const now  = new Date();
  const ts   = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Review your submission</h2>
        <p className="text-sm text-text-secondary mt-1">
          Confirm everything below, then submit. 26 Miles Capital will evaluate your strategy — there are no outside investors or third-party reviewers.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="px-4 py-2.5 bg-elevated border-b border-border">
          <span className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">Submission summary</span>
        </div>
        <div className="px-4 divide-y divide-border">
          <ReviewRow label="Submission type"  value={typeLabel} />
          <ReviewRow label="File / strategy"  value={fileDesc} />
          <ReviewRow label="Strategy name"    value={form.name} />
          <ReviewRow label="Asset class"      value={form.assetClass} />
          <ReviewRow label="Universe"         value={form.universe || "Not specified"} />
          <ReviewRow label="Frequency"        value={form.frequency} />
          <ReviewRow label="Expected capacity" value={form.capacityM ? `$${form.capacityM}M` : "Not specified"} mono />
        </div>
      </div>

      {/* AI result preview */}
      {form.submissionType === "ai" && form.aiResult && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 px-5 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="text-xs font-medium text-text-primary">AI-generated strategy attached</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
            {form.aiResult.summary}
          </p>
          <p className="text-2xs font-mono text-text-tertiary">
            {form.aiResult.rules.length} rules · {form.aiResult.suggestedAssetClass} · ~${form.aiResult.capacityEstimateM}M capacity
          </p>
        </div>
      )}

      {/* Provenance + agreement */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent flex-shrink-0" />
          <span className="text-sm font-medium text-text-primary">What happens on submit</span>
        </div>
        <ul className="space-y-2">
          {[
            "A SHA-256 provenance hash is computed from your submission and bound to a UTC timestamp — establishing that this strategy existed in this form before any review begins.",
            "Your submission is encrypted and queued for the 26 Miles quant desk. No outside parties have access at any stage.",
            "You will receive a full written validation report within 4–6 weeks, regardless of outcome.",
            "26 Miles Capital is the sole evaluator and capital allocator. Your strategy is never shared with or sold to third parties.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-accent flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {/* Mock hash preview */}
        <div className="rounded-lg border border-border bg-elevated/60 p-3 space-y-1.5">
          <span className="text-2xs font-mono text-text-tertiary uppercase tracking-wider">SHA-256 provenance hash (preview)</span>
          <p className="font-mono text-2xs text-text-secondary break-all leading-relaxed">{hash}</p>
          <p className="font-mono text-2xs text-text-tertiary">{ts}</p>
        </div>

        <p className="text-xs text-text-tertiary pt-1 border-t border-accent/10">
          By submitting you confirm that this material is your original work and you agree to the 26 Miles Contributor Agreement.
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
        <button onClick={copy} className="flex items-center gap-1 text-2xs text-text-tertiary hover:text-text-secondary transition-colors">
          {copied ? <Check className="h-3 w-3 text-profit" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="font-mono text-xs text-text-secondary break-all leading-relaxed">{hash}</p>
    </div>
  );
}

function ConfirmationScreen({ conf, strategyName }: { conf: Confirmation; strategyName: string }) {
  return (
    <div className="space-y-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-profit/10 border border-profit/20">
          <CheckCircle2 className="h-8 w-8 text-profit" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Submission received</h2>
          <p className="text-sm text-text-secondary mt-1">
            Timestamped and queued for the 26 Miles quant desk.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface text-left overflow-hidden">
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
              26 Miles Capital is the sole evaluator — no outside parties will see this material.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 text-left space-y-3">
        <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">What happens next</p>
        <div className="space-y-3">
          {[
            { step: "01", text: "A quant validator is assigned within 3 business days." },
            { step: "02", text: "OOS testing and overfitting checks run over 4–6 weeks." },
            { step: "03", text: "You receive a full written validation report — pass or fail." },
            { step: "04", text: "Passing strategies enter the paper-trading phase. 26 Miles allocates its own capital from there." },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="font-mono text-xs text-text-tertiary flex-shrink-0 w-4">{step}</span>
              <span className="text-sm text-text-secondary leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-medium bg-accent hover:bg-accent/90 text-canvas transition-colors">
          Go to dashboard <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/leaderboard" className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-medium border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary transition-colors">
          View leaderboard
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step bar + nav
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Your strategy" },
  { n: 2, label: "Details" },
  { n: 3, label: "Review" },
];

function StepBar({ current }: { current: number }) {
  return (
    <nav aria-label="Submission steps" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map(({ n, label }, i) => {
          const done    = n < current;
          const active  = n === current;
          return (
            <li key={n} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done   ? "bg-profit border-profit text-canvas" :
                  active ? "bg-accent border-accent text-canvas" :
                           "bg-surface border-border text-text-tertiary"
                )}>
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
                </div>
                <span className={cn(
                  "text-2xs font-mono whitespace-nowrap hidden sm:block",
                  active ? "text-text-primary" : done ? "text-profit" : "text-text-tertiary"
                )}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px flex-1 mx-2 mb-5 sm:mb-0 transition-colors", done ? "bg-profit/40" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function canAdvance(step: number, form: FormState): boolean {
  if (step === 1) {
    if (!form.submissionType) return false;
    if (form.submissionType === "ai")     return form.aiResult !== null;
    if (form.submissionType === "signal") return form.signalFileName !== "";
    if (form.submissionType === "code")   return form.codeText.trim().length >= 20 || form.codeFileName !== "";
  }
  if (step === 2) {
    return !!(form.name.trim() && form.assetClass && form.frequency && form.capacityM);
  }
  return true;
}

function stepHint(step: number, form: FormState): string {
  if (step === 1) {
    if (!form.submissionType)            return "Choose a submission type above";
    if (form.submissionType === "ai")    return form.aiResult ? "" : "Generate your strategy first";
    if (form.submissionType === "signal") return "Upload a signal file to continue";
    return "Paste or upload code to continue";
  }
  return "Fill in required fields to continue";
}

function NavBar({ step, form, onBack, onNext, onSubmit, submitting }: {
  step: number; form: FormState; onBack: () => void;
  onNext: () => void; onSubmit: () => void; submitting: boolean;
}) {
  const ok   = canAdvance(step, form);
  const hint = stepHint(step, form);

  return (
    <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
      <button
        onClick={onBack}
        disabled={step === 1}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-medium border border-border transition-colors",
          step === 1 ? "opacity-0 pointer-events-none" : "text-text-secondary hover:text-text-primary hover:border-accent/30"
        )}
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3">
        {!ok && hint && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-text-tertiary">
            <AlertCircle className="h-3.5 w-3.5" />
            {hint}
          </span>
        )}

        {step < 3 ? (
          <button
            onClick={onNext}
            disabled={!ok}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-5 py-2 text-sm font-medium transition-colors",
              ok ? "bg-accent hover:bg-accent/90 text-canvas" : "bg-muted text-text-tertiary cursor-not-allowed"
            )}
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded px-5 py-2 text-sm font-semibold bg-accent hover:bg-accent/90 text-canvas transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <><span className="h-3.5 w-3.5 rounded-full border-2 border-canvas/30 border-t-canvas animate-spin" /> Submitting…</>
            ) : (
              <>Submit strategy <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

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
  return `SUB-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  function update(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function handleNext() {
    // Pre-fill metadata from AI result when advancing to Step 2
    if (step === 1 && form.submissionType === "ai" && form.aiResult) {
      const r = form.aiResult;
      setForm((f) => ({
        ...f,
        name:      f.name      || r.strategyName,
        assetClass: f.assetClass || r.suggestedAssetClass,
        frequency: f.frequency || r.suggestedFrequency,
        capacityM: f.capacityM || String(r.capacityEstimateM),
        universe:  f.universe  || r.universe,
      }));
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function handleSubmit() {
    setSubmitting(true);
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
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Submit a strategy</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your submission is encrypted, timestamped, and evaluated solely by 26 Miles Capital.
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
              step={step} form={form}
              onBack={() => setStep((s) => Math.max(1, s - 1))}
              onNext={handleNext}
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
