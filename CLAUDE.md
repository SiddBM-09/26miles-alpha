# Project: 26 Miles Alpha Marketplace — Prototype

## What this is
A front-end prototype for a quant-research marketplace. Independent quant
researchers upload trading strategies; 26 Miles Capital validates them and
allocates real capital to the winners, paying contributors an ongoing income.
This is a PROTOTYPE: use realistic mock/static data only. No real backend,
no real auth, no API calls to external services. Hard-code believable data in
TypeScript files under /src/lib/mock.

## Audience
A hedge-fund / product reviewer evaluating this as an assignment. It must look
institutional and credible, not like a crypto or consumer app.

## Pages to build (App Router routes)
- /                 Landing / marketing page (vision, why join, one CTA)
- /dashboard        Researcher dashboard (earnings, PnL attribution, HWM status,
                    list of their strategies with lifecycle states)
- /leaderboard      Ranked researchers/strategies by Alpha Score (OOS/live only)
- /submit           Strategy submission flow (signal upload + code paste,
                    metadata, provenance/timestamp confirmation)
- /strategy/[id]    Validation report (the showpiece — see below)

## The validation report (/strategy/[id]) is the centerpiece
Show, with charts and clear pass/fail badges:
- Equity curve (in-sample vs out-of-sample, visually separated)
- Out-of-sample Sharpe, walk-forward stability
- Drawdown / underwater chart
- Overfitting check (deflated Sharpe / PBO) — pass/warn/fail badge
- Data-leakage check — pass/warn/fail badge
- Capacity estimate and turnover
- Correlation-to-book
- Lifecycle state: Incubation → Paper / Forward-test → Live → Decaying → Retired
Make backtest metrics visually de-emphasised and OOS/live metrics the hero —
the product's whole thesis is "we trust live results, not backtests."

## Design direction (apply everywhere)
- Aesthetic: precise, editorial, institutional. Reference the restraint of
  Linear, Stripe, and a Bloomberg terminal — NOT flashy.
- Color: a near-black / deep charcoal base with off-white text. ONE confident
  accent color for positive/active states (a controlled green or electric
  blue). Reserve red strictly for risk, drawdown, and failed checks.
- Typography: a clean grotesk (Inter or Geist) for UI; a monospace font with
  TABULAR NUMERALS for every number, metric, and table cell so figures align.
- Density: data-dense but with breathing room. Use cards, clean tables, and
  small-multiple charts.
- Always include real hover, empty, and loading states. No dead pixels.
- Use recharts for all charts. Keep charts minimal: thin lines, muted grids,
  clear axis labels.
- Fully responsive; must look right on a laptop and a phone.

## Code conventions
- TypeScript everywhere. Components in /src/components, pages in /src/app.
- Mock data lives in /src/lib/mock/*.ts and is imported by pages.
- Use shadcn/ui components; don't hand-roll buttons/tables.
- Keep components small and composable.

## Positioning (important)
26 Miles Capital is the SOLE allocator of capital. This is NOT a public or
multi-investor marketplace, and NOT copy-trading. Only 26 Miles Capital
evaluates strategies and invests in them. Researchers are paid an income BY
26 Miles — there are no outside investors backing them. All copy must reflect
this ("26 Miles allocates capital to your strategy"), never imply a crowd.

## Privacy rules
- A researcher sees ONLY their own earnings, payouts, and allocated capital on
  their dashboard. Never render any other user's monetary earnings anywhere.
- The leaderboard ranks ONLY on Alpha Score and strategy performance (OOS/live
  metrics) — never on how much money a person was paid.

## Submission types (three)
Strategies can be submitted three ways:
1. AI Strategy Maker — a no-code / low-code builder: describe an idea in plain
   language and/or assemble rules visually; an AI-assisted preview is generated.
2. Signal file — upload timestamped weights/predictions; logic stays private.
3. Full source code — paste or upload a coded strategy.

## Info icons (global rule)
EVERY metric label anywhere in the app must have a small info icon (ⓘ) beside
it that shows a one-sentence plain-language definition on hover/tap, using a
shadcn Tooltip. Build ONE reusable <MetricLabel label tooltip /> component and
use it everywhere. Use the glossary the user provides for definitions.

## Auth
A simple mock login (no real backend). Demo credentials shown on the login page:
email demo@26miles.com / password demo123. Protect dashboard, submit,
leaderboard, and strategy pages behind it.