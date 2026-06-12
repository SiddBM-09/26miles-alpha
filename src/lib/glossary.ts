/** Canonical one-sentence definitions used by MetricLabel tooltips across the app. */
export const GLOSSARY = {
  alphaScore:       "A rating of a researcher's proven skill, from live and out-of-sample results only — not backtests.",
  sharpeRatio:      "Return earned per unit of risk; higher means better risk-adjusted performance.",
  oos:              "Performance on data the strategy never saw while being built — the first real test of a genuine edge.",
  inSample:         "Performance on the data used to build the strategy; easy to make look good, so trusted least.",
  walkForward:      "Repeatedly testing on later unseen periods to check the edge holds over time, not just once.",
  drawdown:         "The drop from a peak to a trough in cumulative returns; measures worst-case pain.",
  overfitting:      "Adjusts results for how many variations were tried, estimating how much is real vs. luck.",
  dataLeakage:      "Detects future information accidentally used by the strategy, which would make backtests look fake-good.",
  capacity:         "How much capital the strategy can hold before its own trading erodes the edge.",
  turnover:         "How often the strategy trades; higher turnover means higher costs.",
  correlationToBook:"How similar the strategy is to what 26 Miles already holds; lower is more valuable (adds diversification).",
  hwm:              "Your previous peak of cumulative profit; you earn performance pay only on new profit above it, so you're never paid twice for the same gains.",
  performanceShare: "Your percentage of the net profit your strategy generates.",
  retainer:         "A fixed base amount paid while your strategy is in use.",
  selectionBonus:   "A one-time reward when your strategy passes validation and goes live.",
  lifecycleState:   "Where a strategy is — Incubation, Paper/Forward-test, Live, Decaying, or Retired.",
} as const;
