# QA & Deployment handoff — Spec v17 (Design & Development → QA)

**From:** Design & Development Agent  
**To:** QA & Deployment Agent  
**Date:** 31 Oct 2026 (Europe/London)  
**PR branch:** `cursor/v17-devices-launch-cd8f`  
**Spec:** MarginOS Product Spec v17 (supersedes v16.x amendments)

## What changed (this pass)

1. **§15 Devices** — 44px minimum controls, page `overflow-x` clip, safe-area padding, product list always shows name / verdict / profit+margin, import “Importing…” state, amount `inputMode`, Etsy one-at-a-time hint.  
2. **§15.2** — In-app browser banner (copy link / open) + Auth modal hint; unsupported IE/legacy Edge message.  
3. **§2 / §9** — Public copy exactly **“TikTok Shop: coming soon”** (no date) on hero, upload, footer. TikTok importer **not** built.  
4. **Marketing demos** — Store A/B/C + multi-platform (from prior marketing branch) included.  
5. Audits: `docs/AUDIT-v17-1-design-dev.md`, `docs/AUDIT-v17-2-design-dev.md`.

## Your job (priority order)

### A. Spec §15.8 acceptance (must)
Run matrix §15.9 on **real** iPhone, Android phone, iPad, Windows/Mac PC. Flows T1–T13. Especially: 320px, 44px taps, Free countdown, Clear sample / Start fresh cancel, Stripe return (when test keys exist), PDF save/share, 1k-order 3s target, 50k Free file.

### B. Regression
Free gating, 24h clocks, Pro unlock keep-data, PDF, FX/PII warnings, demo stores A/B/C scores, `Switch to Free` **hidden** in production build (`VITE_DEMO_HARNESS` unset).

### C. Launch blockers to report clearly
| Item | Owner |
|---|---|
| K1 sample exports | Akthar §20.1 |
| K4 live Stripe SMP | Akthar §20.2 |
| K6 Google sign-in | Akthar §20.3 |
| Legal UK/EU storage wording | Legal — do not invent |
| Accountant VAT | §12.9 |
| Cross-device sync | Still not built (B3) — fail marketing claim if asserted |

### D. Soft-launch recommendation draft
QA should state whether soft launch is **GO / GO with caveats / NO-GO**, listing only remaining blockers. Do not claim “optimised for every phone” until §15.8 real-device pass.

## How to run

```bash
git fetch origin cursor/v17-devices-launch-cd8f
git checkout cursor/v17-devices-launch-cd8f
npm test && npm run build
npm run dev -- --host 0.0.0.0 --port 3847
```

Production-like: `npm run build && npm run preview` with `VITE_DEMO_HARNESS` unset.

## Do not record / do not claim
- Google sign-in as live  
- Cross-device Pro sync  
- TikTok Shop import (coming soon only)  
- Native app store optimisation  

## Attachments for Marketing (already)
`docs/MARKETING-SOFT-LAUNCH-REPLY.md` + demo CSVs under `docs/demo-csvs/`.
