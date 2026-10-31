# Deep audit #2 — Spec v17 after Design & Development fixes

**Date:** 31 Oct 2026 (Europe/London)  
**Branch:** `cursor/v17-devices-launch-cd8f`  
**Checks:** `npm test` ✓ · `npm run build` ✓

## Re-check of audit #1 items

| ID | Result after fix |
|---|---|
| V17-D1 TikTok wording | **Pass** — Hero, PlatformImport, footer use exact `TikTok Shop: coming soon` (no date) |
| V17-D2 44px taps | **Pass (code)** — `Button` / `Input` / maths / product rows / amount fields use `min-h-11` (44px). QA must spot-measure on real devices |
| V17-D3 No page sideways scroll | **Pass (mitigation)** — `overflow-x: clip` + safe-area insets. QA: 320px / landscape |
| V17-D4 Product key columns | **Pass** — list always shows name, verdict, true profit + margin |
| V17-D5 In-app browser | **Pass (code)** — `BrowserSupportBanner` + Auth hint + copy/open link; Google disabled in in-app |
| V17-D6 Unsupported browser | **Pass (best effort)** — IE / legacy Edge message |
| V17-D7 Maths tap | **Pass** |
| V17-D8 Number keyboard | **Pass** — `inputMode="decimal"` / `email` on key fields |
| V17-D9 Etsy one-at-a-time | **Pass** — copy + separate file inputs |
| V17-D10 Template clears sample | **Pass** — existing `replaceTemplate` automatic clear confirmed |
| V17-D11 Perf / 50k | **Open — QA** |
| V17-D12 K1/K4/K6 | **Open — Akthar §20** |
| V17-D13 UK storage public copy | **Hold — legal** |
| V17-D14 TikTok importer | **Out of scope (coming soon)** |

## Residual launch risks (not invented by D&D)

1. **Real-device §15.9 matrix** (iPhone, Android, iPad, PC × browsers) — Cloud Chromium ≠ acceptance.  
2. **Live Stripe SMP + Google OIDC** still scaffolded. Soft launch can ship email auth + demo/mock checkout only if Akthar accepts; otherwise K4/K6 block “full” launch claims.  
3. **PDF share sheet on iOS** — browser-dependent; QA T11.  
4. **Cross-device Pro sync** — still localStorage; do not market as synced.  
5. **Q10 file MB limit** — none set; QA report behaviour.  
6. Bundle size warning (~1.2 MB JS) — watch cold start on mid-range 4G (§15.6).

## Design & Development sign-off

**Ready to hand to QA & Deployment** for §15.8 / §15.9 audits, regression of Free/Pro, and launch checklist. Product code for v17 device + TikTok *wording* deltas is in this branch; external §20 actions remain with Akthar.
