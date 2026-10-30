# MarginOS QA Handoff — Design & Development

**From:** QA & Deployment Agent  
**To:** Design Agent + Development Agent  
**Date:** 30 October 2026 (Europe/London)  
**Build tested:** `main` @ `9ea4fb7` (local `http://localhost:3847`)  
**Spec baseline:** MarginOS Product Spec v16 (Final) + Spec Amendment v16.4 (Free 24-hour data deletion, raw-file deletion, upgrade-within-24h, K8–K11)

---

## 1. Purpose of this document

Pass clear, actionable findings so Design and Development can fix launch blockers **without re-litigating approved product rules**.

- Do **not** change pricing, Free/Pro matrix, or v16.4 retention rules unless Product re-opens them.
- Do **not** deploy to production until QA re-tests and the product owner explicitly approves.
- Prefer minimal, spec-aligned fixes over redesign.

**QA verdict:** Needs fixes first — **not ready for production deploy**.  
**Scores:** Production readiness **4/10** · Demo UI slice **7.5/10**.

---

## 2. What already passes (do not regress)

| Area | Spec | Status |
| --- | --- | --- |
| Free 24h clocks + notices (orders path) | v16.4 F1 / F2 | Pass |
| Raw uploaded file not stored after import | v16.4 F5 | Pass (browser never persists file bytes) |
| 3 successful uploads / day; failed import does not burn | K9 / §12.4 | Pass |
| Free gating: top 10 products, top 3 leaks (no £ impact), 1 headline | §7–8 | Pass |
| Upgrade within 24h keeps data + cancels clocks | F7 / F8.8 | Pass (demo unlock) |
| Sample clear / Start fresh / K7 auto-clear on first own upload | v16.3 | Pass |
| Pricing copy £39 early-bird / £59 lifetime; Sold through Link | §12.5 | Pass |
| No Lemon Squeezy leftovers | — | Pass |
| K8 Settings UI: kept Pro data export-only + Restore with Pro | K8 | Pass (demo “Switch to Free” path) |
| Responsive mobile (~390) / tablet (~768) | — | Pass — no layout blockers found |
| Unit tests + production build | — | Pass (`npm test`, `npm run build`) |

---

## 3. Ownership legend

| Owner | Meaning |
| --- | --- |
| **Dev** | Engineering / product logic / integrations |
| **Design** | Copy hierarchy, notice prominence, modal/flow UX, visual clarity |
| **Both** | Needs Design + Dev together |
| **Product / Akthar** | External blockers (Stripe account, Google Cloud, legal) |

---

## 4. Must-fix before launch (ordered)

### B1 — Stripe Managed Payments not wired (Critical) — Dev + Product (K4)

| | |
| --- | --- |
| **Spec** | §12.10, checklist `docs/checklists/stripe-smp.md`, K4 |
| **Free/Pro** | Free → Pro checkout |
| **Steps** | Open Upgrade → Unlock Pro |
| **Expected** | Stripe Checkout Session (`managed_payments` / Sold through Link), tax-inclusive prices, webhook-driven licence state |
| **Actual** | `src/lib/payments/provider.ts` → `mockStartCheckout` grants Pro instantly; no Stripe adapter, keys, or webhooks |
| **Dev ask** | Implement Stripe adapter behind existing provider interface; wire Checkout + webhook matrix; keep mock for local demo behind a flag |
| **Blocked by** | Akthar **K4** (Stripe account, SMP eligibility, Dashboard) |

### B2 — Auth is demo-only (Critical) — Dev + Product (K5/K6)

| | |
| --- | --- |
| **Spec** | §12.6, A5 / `docs/checklists/auth-rules.md`, K5, K6 |
| **Free/Pro** | All |
| **Steps** | Sign in → Resend verification; Continue with Google |
| **Expected** | Real email/password + SES London verification; Google disabled or real OIDC after K6; uploads/checkout locked until verified |
| **Actual** | `src/lib/auth/provider.ts` demo provider; Resend verifies instantly; Google succeeds as demo |
| **Dev ask** | Replace demo provider with approved in-app auth + SES; disable Google until K6 credentials exist |
| **Design ask** | Keep verify-before-upload banner; ensure Google disabled state is clear (not “broken”) |
| **Blocked by** | K5 stack already decided; **K6** Google Cloud project still Akthar |

### B3 — No production retention / refund / delayed-pay pipeline (Critical) — Dev

| | |
| --- | --- |
| **Spec** | v16.4 F1, F6, F8.1, F8.14, K8, K11 |
| **Free/Pro** | Free + refunded Pro |
| **Steps** | Expire Free clocks; refund/chargeback Pro; pending then **failed** delayed payment |
| **Expected** | Server-side clocks; data inaccessible at exactly 24h; live purge ≤1h; K8 from Stripe events (export-only, not in results); payment fail deletes any Free data whose clock would already have ended |
| **Actual** | Client `localStorage` + 30s tick only; K8 via header **Switch to Free**; `paymentPending` / `setPaymentPending` exist with **no UI** and **no fail→delete** path |
| **Dev ask** | Backend retention jobs + webhook handlers; implement K11 fail path; replace demo Switch to Free with licence-driven state (keep Switch to Free only as a test harness if needed, behind demo flag) |
| **Design ask** | Spec pending-payment UI (paused countdown copy already exists in banner when `pausedAt` set); design payment-failed / data-deleted messaging |

### B4 — ECB FX conversion missing (High) — Dev

| | |
| --- | --- |
| **Spec** | §6 currency conversion |
| **Free/Pro** | Free + Pro |
| **Steps** | Import orders in non-home currency; try unsupported currency |
| **Expected** | Convert at ECB rate on order date; unsupported currency excluded with named message |
| **Actual** | `userFxRates: {}`; no ECB table/API; parsers largely stamp home currency without conversion maths |
| **Dev ask** | Implement ECB FX (or get Product sign-off to defer with explicit in-app limitation copy) |
| **Design ask** | If deferred: clear empty-state / warning copy when FX unavailable |

### B5 — Template CSV success omits exact Free deletion datetime (High) — Dev (+ Design check)

| | |
| --- | --- |
| **Spec** | v16.4 F2, F8.5 |
| **Free/Pro** | Free |
| **Device** | Desktop Chromium |
| **Steps** | Verified Free user → upload MarginOS Template CSV |
| **Expected** | Import summary includes exact deletion date/time in user TZ (parity with orders import) |
| **Actual** | Free `template` clock starts; `ProductWorkspace` success message only reports cost/ad row counts — no “Free data deleted …” datetime. Countdown banner still appears. |
| **Dev ask** | Mirror orders path messaging from `AppContext.importPlatformOrders` (uses `formatDeletionTime`) into template success `csvMsg` |
| **Design ask** | Confirm single pattern for post-import deletion time (orders + template + manual) so notices feel consistent |

---

## 5. Should-fix before launch (Medium / Low)

### B6 — Platform “0 uploads left” missing midnight reset time (Medium) — Dev

| | |
| --- | --- |
| **Spec** | §10.1.10 / K9 |
| **Steps** | Burn 3 Free uploads → try another **platform** import |
| **Expected** | Message includes reset time (midnight in user TZ) |
| **Actual** | Orders path: `0 uploads left today.` Template path already mentions midnight. Inconsistent. |
| **Dev ask** | Align `AppContext.importPlatformOrders` / `recordSuccessfulUpload` messaging with template copy |

### B7 — Shopify PII strip warnings never surface (Medium) — Dev (+ Design microcopy)

| | |
| --- | --- |
| **Spec** | §10.2.1 / A1 |
| **Steps** | Upload Shopify Orders CSV with Email / Name / Address columns |
| **Expected** | Columns ignored **and** user warned they were stripped |
| **Actual** | `shopify.ts` `STRIP_HEADER_HINTS` loop is empty — no warnings pushed (data still not stored — privacy OK, transparency gap) |
| **Dev ask** | Emit warning(s) when strip headers present |
| **Design ask** | Short, non-alarming strip notice copy |

### B8 — 24-month inactivity for kept Pro data (Medium) — Dev

| | |
| --- | --- |
| **Spec** | v16.4 K8 / F9 |
| **Expected** | Kept order data deleted after 24 months inactivity; emails 60/30 days before |
| **Actual** | Not implemented (localStorage keeps indefinitely) |
| **Dev ask** | Server job + SES templates once auth/email exist |

### B9 — Account deletion stub (Medium) — Dev + Design

| | |
| --- | --- |
| **Spec** | §10.2.8 / 15.E |
| **Expected** | Email-confirmed account deletion |
| **Actual** | Settings copy: “not available in this demo build” |
| **Dev / Design** | Full flow when backend auth exists |

### B10 — Privacy line pending legal (Low) — Product / Legal (K10)

| | |
| --- | --- |
| **Spec** | v16.4 K10 |
| **Note** | Sales wording approved; privacy retention line pending legal. Do not invent final legal copy. |

---

## 6. Design-only notes (no Critical layout bugs)

Responsive pass on **390×844** and **768×1024**: no overflow / clipped CTAs / broken modals found.

Optional polish (not launch blockers):

1. **Post-import “Original file deleted…”** appears in the import summary string — Design may want slightly stronger hierarchy without adding hero clutter (F2 / F5).
2. **Header actions:** User icon → Auth; Pro CTA → Upgrade. Ensure targets are distinct on mobile (icons only) so Auth is findable.
3. **K8 kept-data card** lives in Settings — confirm discoverability after refund/chargeback (scroll/anchor or post-refund banner pointing to Settings).
4. **Pending payment / last-hour** states already have banner tones — Design to sign off final copy for pause + fail→delete once Dev implements B3.

Do **not** redesign the first viewport into a dashboard, add card clutter to the hero, or change brand-first hierarchy unless Product requests it.

---

## 7. Explicit non-bugs / clarifications

| Observation | Verdict |
| --- | --- |
| No Free retention banner on sample data | **Correct** (F1) |
| Upload counter still “n of 3” after Switch to Free | **Expected** — daily Free upload counter is independent of K8 kept data |
| “Switch to Free” in header | **Demo harness** for K8 — replace with Stripe-driven licence state for production |
| Raw file “deleted” in SPA | **Conceptually OK** for launch slice (never stored); production still needs F5 unfinished-import 1h cancel if multi-step upload staging is added |

---

## 8. Key code map (for Development)

| Concern | Primary files |
| --- | --- |
| Free clocks / pause / cancel | `src/lib/retention.ts`, `src/lib/retention.test.ts`, `src/context/AppContext.tsx` |
| Free notices UI | `src/components/FreeRetentionBanner.tsx` |
| Orders import + deletion datetime | `src/context/AppContext.tsx` → `importPlatformOrders` |
| Template import success copy (B5) | `src/components/ProductWorkspace.tsx` → `onTemplate` |
| Platform parsers / PII hints (B7) | `src/lib/csv/shopify.ts`, `parseUtils.ts`, `amazon.ts`, `etsy.ts` |
| Payments mock (B1) | `src/lib/payments/provider.ts`, `UpgradeModal.tsx` |
| Auth mock (B2) | `src/lib/auth/provider.ts`, `AuthModal.tsx` |
| K8 keep / export / restore | `AppContext.switchToFree` / `unlockProDemo`, `SettingsBar.tsx` |
| Pricing constants | `src/lib/pricing.ts`, `payments/provider.ts` FIXED_PRICES |
| Stripe / auth checklists | `docs/checklists/stripe-smp.md`, `docs/checklists/auth-rules.md` |
| Locked decisions | `docs/DECISIONS-v16.4.md`, `docs/OPEN-QUESTIONS.md` |

---

## 9. Suggested delivery slices

| Slice | Owner | Scope | Re-test focus |
| --- | --- | --- | --- |
| **A — Spec UI parity** | Dev (+ Design review) | B5, B6, B7 | **Done 30 Oct 2026** |
| **B — Auth real** | Dev | B2 | **Scaffolded** — verify tokens + `/api/auth/send-verification` (needs SES secrets / K5) |
| **C — Stripe SMP** | Dev + Akthar K4 | B1 | **Scaffolded** — `/api/checkout` + webhook stub (needs K4 secrets) |
| **D — Retention backend** | Dev | B3, B8 | **Partial** — client K11 + 24-month inactivity; server purge/webhooks still need host |
| **E — FX** | Dev (+ Product) | B4 | **Done** — ECB table + convert-at-import + unsupported currency drop |
| **F — Account deletion** | Dev + Design | B9 | **Done** — email-confirm delete in Settings |

QA will re-run Spec v16 + v16.4 acceptance after each merged slice. **No production deploy without explicit owner approval.**

---

## 10. Deployment posture (for awareness — do not ship yet)

| Item | Status |
| --- | --- |
| Vite static build | Works (`npm run build` → `dist/`) |
| Vercel as **demo** preview | Technically possible — **requires separate written plan + explicit approval** |
| Production | **Blocked** — missing Stripe/SES/auth secrets, backend, K4 Dashboard, legal K10 |
| Env vars in repo | None — production needs Stripe keys, webhook secret, SES, auth secrets, Google OAuth |

---

## 11. Ask back to Product (if blocking Design/Dev)

1. Confirm whether ECB FX (B4) is **launch-required** or may ship with limitation copy.  
2. Confirm K4 / K6 timelines (blocks B1 / Google).  
3. Confirm whether demo **Switch to Free** remains as a QA harness after Stripe K8 is live.  
4. Legal sign-off on K10 privacy retention wording.

---

## 12. Handoff checklist for receiving agents

- [ ] Read Spec v16 Final + Amendment v16.4 (esp. F1–F8, K8–K11)  
- [ ] Read this document end-to-end  
- [ ] Do not change approved pricing or Free/Pro matrix  
- [ ] Prefer Slice A first if a fast UI/spec parity PR is needed  
- [ ] Tag QA for re-test on each slice  
- [ ] Do not deploy production without owner + QA approval  

**End of handoff.**
