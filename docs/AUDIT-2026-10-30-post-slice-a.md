# MarginOS Audit Report — Post Slice A

**From:** QA & Deployment Agent  
**Date:** 30 October 2026 (Europe/London)  
**Build audited:** `main` @ `8389af4` (Slice A merge)  
**Spec baseline:** Product Spec v16 (Final) + Amendment v16.4  
**Prior handoff:** `docs/QA-HANDOFF-v16.4.md`

---

## 1. Verdict

| | |
| --- | --- |
| **Recommendation** | **Needs fixes first — not ready for production deploy** |
| **Production readiness** | **5 / 10** (was 4/10) |
| **Demo UI slice** | **8.5 / 10** (was 7.5/10) |
| **Slice A** | **Pass** (code + browser verified) |

No production deploy without owner approval after remaining Critical blockers are closed.

---

## 2. Engineering hygiene

| Check | Result |
| --- | --- |
| `npm test` (targetPrice, retention, shopify PII) | Pass |
| `npm run build` | Pass |
| Branch | `main` clean vs `origin/main` |
| Lemon Squeezy leftovers | None |

---

## 3. Slice A verification

| ID | Claim | Status | Evidence |
| --- | --- | --- | --- |
| **B5** | Template success includes exact Free deletion datetime + original-file note | **Pass** | `AppContext.replaceTemplate` + `ProductWorkspace.onTemplate`; orders path still correct |
| **B6** | Platform “0 uploads” includes midnight reset | **Pass** | Shared `en.uploadsExhausted` |
| **B7** | Shopify PII strip warnings | **Pass** | `shopify.ts` + browser: Email/Billing columns warned; `shopify.pii.test.ts` |
| **Google / K6** | Sign-in disabled with clear copy | **Pass** | `AuthModal` `GOOGLE_SIGN_IN_ENABLED = false` |
| **K11** | Payment-fail deletes past-due Free data | **Pass (client/demo)** | `applyPaymentFailure` + Upgrade modal demo controls |

### Browser re-test (Chromium, localhost:3847)

- Google disabled + K6 helper — Pass  
- Email verify gate — Pass  
- Orders import: “Original file deleted…” + exact deletion datetime — Pass  
- Shopify personal-data warning — Pass  
- Upgrade modal K11 demo section — Pass  

---

## 4. Open findings (updated)

| ID | Severity | Status | Notes |
| --- | --- | --- | --- |
| **B1** Stripe SMP | Critical | **Open** | Mock checkout only; blocked on K4 |
| **B2** Real auth + SES | Critical | **Open** (Google UI done) | Demo provider; instant verify |
| **B3** Retention / refund backend | Critical | **Partial** | Client clocks + K11 demo; no server purge / Stripe K8 webhooks |
| **B4** ECB FX | High | **Open** | Empty `userFxRates`; no conversion |
| **B5** Template deletion time | High | **Fixed** | |
| **B6** Midnight upload-limit copy | Medium | **Fixed** | |
| **B7** Shopify PII warnings | Medium | **Fixed** | Amazon/Etsy still no equivalent warnings (minor) |
| **B8** 24-month inactivity | Medium | **Open** | Needs server + SES |
| **B9** Account deletion | Medium | **Open** | Demo stub only |
| **B10** Privacy legal (K10) | Low | **Open** | Pending legal |

### Minor observations (not launch Critical)

| Item | Severity | Notes |
| --- | --- | --- |
| K11 / Switch-to-Free demo harnesses | Low | Must be gated or removed before production |
| Pause banner may show absolute `expiresAt` while paused | Low | Copy polish when B3 lands |
| Template-only upload on empty shop | Info | Limited UX when no products yet; not a Slice A regression |

---

## 5. What still passes (do not regress)

Free 24h clocks/notices (orders), raw file not persisted in SPA, 3 uploads/day, Free gating (top 10 / 3 leaks / 1 action), upgrade-within-24h keeps data, sample clear / Start fresh / K7, pricing £39/£59 + Link copy, K8 Settings export-only card, responsive mobile/tablet (prior pass).

---

## 6. Recommended next work

| Priority | Slice | Scope |
| --- | --- | --- |
| 1 | **B — Auth real** | SES London + verify gate; keep Google off until K6 |
| 2 | **C — Stripe SMP** | K4 + Checkout + webhooks |
| 3 | **D — Retention backend** | F8 acceptance, production K8/K11, B8 |
| 4 | **E — FX** | ECB or Product-signed deferral copy |
| 5 | **F — Account deletion** | After auth |

---

## 7. Deployment posture

| Item | Status |
| --- | --- |
| Production | **Blocked** (B1, B2, B3) |
| Vercel demo preview | Possible only with explicit owner plan + demo-harness gating |
| Env / secrets | Still missing (Stripe, SES, auth, Google) |

**End of audit.**
