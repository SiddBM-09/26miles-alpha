"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const SESSION_COOKIE = "26miles_session";

const NAV_LINKS = [
  { href: "/dashboard",   label: "Dashboard"   },
  { href: "/data",        label: "Research Lab" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/income",      label: "How you earn" },
  { href: "/submit",      label: "Submit"      },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Top navigation
// ─────────────────────────────────────────────────────────────────────────────

function TopNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  // Re-check cookie on every route change (post-login / post-logout hydration)
  useEffect(() => {
    setLoggedIn(document.cookie.includes(`${SESSION_COOKIE}=`));
  }, [pathname]);

  function logout() {
    document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    setLoggedIn(false);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-canvas/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo (image with accessible fallback) */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
          aria-label="26 Miles — home"
        >
          <img
            src="https://26milescapital.com/images/logo.svg"
            alt="26 Miles Capital"
            className="h-7 w-auto object-contain"
          />
          <span className="sr-only">26 Miles Alpha</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-3 py-1.5 text-sm rounded transition-colors",
                  active
                    ? "text-text-primary bg-elevated"
                    : "text-text-secondary hover:text-text-primary hover:bg-elevated/60"
                )}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-2xs font-mono text-text-tertiary uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-profit animate-pulse" />
            Live
          </span>

          {loggedIn ? (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium border border-border hover:border-loss/40 text-text-secondary hover:text-loss transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center rounded px-3 py-1.5 text-sm font-medium border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/submit"
                className="hidden sm:inline-flex items-center rounded px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent/90 text-white transition-colors shadow-sm"
              >
                Submit Strategy
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App shell — skips chrome on /login
// ─────────────────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page is fully self-contained — no nav/footer chrome
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-2xs text-text-tertiary font-mono">
          <span>© 2026 26 Miles Capital LP — Institutional Research Platform</span>
          <span>Prototype · Not investment advice</span>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page container — reusable width/padding wrapper
// ─────────────────────────────────────────────────────────────────────────────

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in",
        className
      )}
    >
      {children}
    </div>
  );
}
