# Launch audit — Spec v17 (QA & Deployment)

**Date:** 31 Oct 2026 (Europe/London)  
**Build:** `main` @ `de65cee` (includes v17 devices + TikTok copy + demo stores)  
**Spec:** MarginOS Product Spec v17  

## Verdict

### Full public launch (live paid Pro, full §15 claims): **NO-GO**

Blocked by Akthar / external §20 items and unproven real-device matrix.

### Soft / controlled launch (email auth, honest marketing limits): **GO WITH CAVEATS**

Product core on `main` builds and passes automated tests; smoke UI OK. Ship only with the caveats below — do not claim Google, live card capture (until Stripe live), cross-device sync, or “optimised on every phone” until §15.9 real devices pass.

---

## Evidence this run

| Check | Result |
|---|---|
| `npm test` | **Pass** (target price, retention, PII, FX, demo stores, browserEnv) |
| `npm run build` | **Pass** |
| Smoke UI (Chromium) | **Pass** — TikTok copy, Store A score 96, Sold through Link, Google disabled copy |
| Spec §15.9 real iPhone / Android / iPad / PC | **Not run** (environment = viewport / Chromium only) |
| Live Stripe end-to-end | **Not configured** (scaffold + mock / demo unlock) |
| SES email verification end-to-end | **Not configured** (demo / token path) |

---

## Scorecard vs Spec v17

| Area | Status | Notes |
|---|---|---|
| Positioning / Free–Pro copy (K10 sales lines) | **OK** | Privacy legal wording still pending — do not invent UK/EU storage claims |
| Pricing / Sold through Link copy | **OK** | Live checkout needs K4 |
| Shopify / Amazon / Etsy CSV | **OK (code)** | Needs K1 real sample exports for final column confirmation |
| TikTok Shop | **OK for launch** | Exact “TikTok Shop: coming soon” — importer correctly **not** built |
| Health Score, leaks, maths, calculators | **OK** | |
| Free 24h retention + raw file delete | **OK (client)** | Durable server purge (B3 / §19) not live — clocks are browser-local |
| Pro gating / PDF / scenarios / tax | **OK** | |
| ECB FX + PII strip warnings | **OK** | |
| Sample clear / Start fresh / demo stores | **OK** | |
| §15 device code (44px, overflow, in-app banner) | **OK (code)** | Real-device acceptance **open** |
| Google sign-in (K6 / §20.3) | **Blocked** | Disabled with clear copy |
| Stripe Managed Payments live (§20.2) | **Blocked** | Spec marks as blocks launch |
| Auth + SES production (K5) | **Partial** | Scaffold; demo verify path for soft launch |
| Cross-device same Pro data | **Missing** | localStorage only — marketing must not claim sync |
| Legal (terms, privacy, DPA, refund wording) | **Blocked** | Spec: pending before launch |
| Accountant VAT (§12.9) | **Open** | External |
| Hosting UK DO + backups (§19) | **Open** | Ops / Akthar |

---

## Soft-launch caveats (must communicate)

1. **Email sign-in only** — no Google until K6.  
2. **Checkout** — “Sold through Link” on screen; real charges only after Stripe SMP live. Until then use demo unlock or Stripe test mode explicitly.  
3. **Data stays on the device/browser** — no cloud sync; Free 24h depends on that browser’s storage.  
4. **Do not claim** full phone/tablet optimisation until §15.9 real-device pass.  
5. **Do not ship** with `VITE_DEMO_HARNESS=true` in production (hides “Switch to Free” / K11 simulators when unset in prod builds).

---

## Minimum to flip full launch to GO

1. Complete §20.2 Stripe Managed Payments + webhook verify in production.  
2. Production SES verification emails (and domain).  
3. Legal pack signed off (incl. storage wording).  
4. QA sign-off on §15.8 / §15.9 real devices (at least iPhone, Android, iPad, one PC).  
5. Deploy production build with secrets from `.env.example`; demo harness off.  
6. Optional for “Google works”: §20.3. Optional for sync claims: server persistence (B3).

---

## Recommendation

| Mode | Decision |
|---|---|
| **Invite / soft launch** (friends, content, demos) | **GO WITH CAVEATS** — use `main` @ `de65cee`, constrained claims |
| **Public paid launch** | **NO-GO** until Stripe + legal + real-device QA (and SES) |

Owner next steps: Akthar §20.1–20.4; QA real-device matrix; Marketing stick to `docs/MARKETING-SOFT-LAUNCH-REPLY.md` limits.
