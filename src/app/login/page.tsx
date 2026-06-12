"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Copy, Check, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_EMAIL    = "demo@26miles.com";
const DEMO_PASSWORD = "demo123";
const SESSION_COOKIE = "26miles_session";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny copy button
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-1.5 inline-flex items-center gap-0.5 text-text-tertiary hover:text-text-secondary transition-colors"
      aria-label={`Copy ${text}`}
    >
      {copied
        ? <Check className="h-3 w-3 text-profit" />
        : <Copy className="h-3 w-3" />
      }
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login form — needs Suspense for useSearchParams
// ─────────────────────────────────────────────────────────────────────────────

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("from") || "/dashboard";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate a short network delay
    await new Promise((r) => setTimeout(r, 600));

    if (
      email.trim().toLowerCase() === DEMO_EMAIL &&
      password === DEMO_PASSWORD
    ) {
      // Set session cookie (7-day, accessible to middleware)
      document.cookie = `${SESSION_COOKIE}=authenticated; path=/; max-age=604800; SameSite=Lax`;
      // Hard navigation so the middleware reads the fresh cookie on the request
      // and the router cache doesn't interfere.
      window.location.replace(redirectTo);
    } else {
      setError("Invalid email or password. Use the demo credentials below.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10 group">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-bold text-on-accent select-none">
          26
        </span>
        <span className="text-lg font-semibold tracking-tight text-text-primary group-hover:text-accent transition-colors">
          Miles
        </span>
        <span className="text-text-tertiary text-xs font-mono">Alpha</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Sign in to 26 Miles
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Institutional research platform
          </p>
        </div>

        {/* Demo credentials — always visible, can't miss */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider font-mono">
              Demo credentials
            </span>
            <button
              type="button"
              onClick={fillDemo}
              className="text-2xs font-mono text-accent/80 hover:text-accent border border-accent/20 hover:border-accent/40 rounded px-2 py-0.5 transition-colors"
            >
              Auto-fill →
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs text-text-tertiary font-mono w-16">email</span>
              <span className="font-mono text-xs text-text-primary flex items-center">
                {DEMO_EMAIL}
                <CopyButton text={DEMO_EMAIL} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xs text-text-tertiary font-mono w-16">password</span>
              <span className="font-mono text-xs text-text-primary flex items-center">
                {DEMO_PASSWORD}
                <CopyButton text={DEMO_PASSWORD} />
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-text-secondary">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@example.com"
              required
              className={cn(
                "w-full rounded bg-surface border px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary",
                "focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors",
                error ? "border-loss/60" : "border-border"
              )}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-text-secondary">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                required
                className={cn(
                  "w-full rounded bg-surface border px-3.5 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-tertiary",
                  "focus:outline-none focus:ring-1 focus:ring-accent/60 focus:border-accent/60 transition-colors",
                  error ? "border-loss/60" : "border-border"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-loss leading-snug">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-semibold transition-colors",
              loading
                ? "bg-accent/40 text-on-accent/50 cursor-not-allowed"
                : "bg-accent hover:bg-accent/90 text-on-accent"
            )}
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-canvas/30 border-t-canvas animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Trust note */}
        <div className="flex items-start gap-2.5 rounded border border-border bg-elevated/40 px-3.5 py-3">
          <Shield className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0 mt-0.5" />
          <p className="text-2xs text-text-tertiary leading-relaxed">
            Access is restricted to authorised researchers and 26 Miles Capital staff.
            All activity is logged under your contributor agreement.
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-2xs text-text-tertiary font-mono text-center">
        © 2026 26 Miles Capital LP · Prototype · Not investment advice
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page — Suspense boundary required for useSearchParams
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
