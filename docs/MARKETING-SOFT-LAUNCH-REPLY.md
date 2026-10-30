# Reply to Marketing & Content — Soft launch device / demo / recording brief

**Date:** 30 Oct 2026 (Europe/London)  
**Product:** MarginOS (spec v16 + amendment v16.4)  
**Build basis:** `main` + demo-store branch (Store A/B/C + multi-platform)  
**Environment note:** This QA pass used Chromium at phone / tablet / desktop viewports. It is **not** a substitute for native iOS / Android / iPad device farms. Marketing should **not** claim “works on phone, tablet and PC” for cross-device Pro sync until backend account sync (B3) ships.

---

## 1. Device check (works / partly works / doesn’t work)

| Flow | Phone (viewport) | Tablet (viewport) | PC / Mac (1920×1080) | Notes |
|---|---|---|---|---|
| Sign up / log in (email) | **Works** | **Works** | **Works** | Demo auth: email + password in-browser. Verification uses demo token / paste flow until K6 email delivery is live. |
| Google sign-in | **Doesn’t work** | **Doesn’t work** | **Doesn’t work** | Intentionally disabled pending K6. Do **not** record. |
| CSV upload Shopify / Amazon / Etsy | **Works** | **Works** | **Works** | Parsers + ECB FX + PII strip warnings live. Touch targets usable at 390×844 / 768×1024 / 1920×1080. |
| Free features (top 10 products, score+band+confidence, top 3 leaks without £, 1 headline action, 24h deletion, upgrade prompt) | **Works** | **Works** | **Works** | Use a Free account + real upload **or** clear sample then upload a demo CSV (sample data skips the 24h Free clock). |
| Pro features (score breakdown, ranked leaks with £, scenarios, target prices, PDF, tax estimates, multi-platform) | **Works** | **Works** | **Works** | Unlock via demo Pro (or live Stripe when env vars set). |
| PDF download + open | **Partly works** | **Partly works** | **Works** | Desktop Chrome downloads/opens reliably. Mobile/tablet browsers often open PDF in a new tab or download tray — record “generate → file appears”, not OS-level share sheets. |
| Checkout “Sold through Link” | **Partly works** | **Partly works** | **Partly works** | Copy is live in Upgrade modal (`Sold through Link` / `LINK.COM* MARGINOS`). **Live Stripe Checkout** only when `VITE_LIVE_STRIPE=1` + API keys. Soft launch demo uses mock unlock unless those are configured. |
| Second device sees same Pro data | **Doesn’t work** | **Doesn’t work** | **Doesn’t work** | Data is **browser `localStorage` only**. No cloud account sync until B3. **Do not record “upload on phone → same results on tablet/PC”.** Workaround for assets: export cleaned CSV on device 1, re-import on device 2 (not true sync). |

### Honest line marketing can use now

> MarginOS soft launch works in the browser on phone, tablet and desktop for sign-in, CSV upload, Free/Pro results and PDF on desktop. Pro data stays on the device you used until cloud sync ships — we are not claiming cross-device sync yet. Checkout shows Sold through Link; live card capture depends on Stripe go-live.

---

## 2. Demo store data (synthetic only)

Load from **Orders → Demo stores…** (shop must be empty / sample-only). No real customer data.

| Store | Platform | Health (typical GBP, 0 overheads) | Story beat |
|---|---|---|---|
| **Store A · Shopify** | Shopify | **96 Strong** (verified) | Candles / soap / tote healthy. **Seasonal Gift Box loses money** once packaging + undercharged shipping + fees land — “I thought this was making money.” |
| **Store B · Amazon** | Amazon FBA | **11 At risk** (verified) | All four SKUs losing; heavy Sponsored Products; clear ranked leaks and fixes. |
| **Store C · Etsy** | Etsy | **56 Needs attention** (verified) | Rings + prints win; **Custom Name Mug** loses money after fees/shipping/ads — middle-of-the-road shop. |
| **Multi-platform demo** | Shopify + Amazon + Etsy | Mixed (verified) | Use for Pro “multi-platform shop view” recording. Buttons: Store A / B / C / Multi-platform. |

Also keep **Load sample** for the original blended demo if needed.

---

## 3. Recording plan — what is live vs do not record

### Record (in spec / live)

**FREE account**

1. Clear sample → upload Shopify/Amazon/Etsy CSV → results  
2. Whole-store true profit  
3. Overall Health Score + band + confidence  
4. Top 3 leaks **without amounts**  
5. 1 headline action  
6. 24-hour deletion notice + upgrade prompt  

**PRO account**

1. Health Score breakdown  
2. Every leak ranked by monthly cost  
3. Scenarios  
4. Target prices  
5. PDF generate + open (desktop preferred)  
6. Tax estimates  
7. Multi-platform shop (use **Multi-platform demo** or upload all three)  
8. Upgrade Free → Pro **within 24h** and keep data (same browser)  

### Do **not** record (coming later / not live)

- Google sign-in (K6)  
- Cross-device sync of the same Pro account (B3)  
- Live bank statement LINE.COM capture beyond on-screen “Sold through Link” copy (unless Stripe live)  
- Anything marked “coming later” in the public spec  

### Formats we can produce in this environment

| Format | Feasible here? | Notes |
|---|---|---|
| PC 1920×1080 clean browser | **Yes** | Primary evidence set. |
| Phone 1080×1920 portrait | **Viewport only** | Chromium resized — not native iOS/Android screen record. Marketing should re-capture on real devices for App Store / ads if required. |
| Tablet landscape + portrait | **Viewport only** | Same caveat. |
| Cross-device Pro sync film | **No** | Blocked by architecture — see §1. |

### Screenshots needed (checklist)

- [ ] Pricing / Upgrade modal (early-bird + Sold through Link)  
- [ ] Free vs Pro gating side-by-side  
- [ ] 24-hour deletion notice (after a **real Free upload**, not sample)  
- [ ] Checkout strip showing “Sold through Link”  

### Demo login + links

| Item | Value |
|---|---|
| Demo login | Any email + password in Auth modal (demo provider). Prefer a dedicated soft-launch mailbox, e.g. `demo@marginos.app` / password set for the session. Verify via demo token paste until SES is live. |
| Live app URL | Production host once deployed (Vercel). Local: `http://localhost:3847` for internal QA. |
| Sign-up | In-app Auth modal (email). |
| Checkout | Upgrade → Pro CTA. Live Stripe when `VITE_LIVE_STRIPE` + `/api/checkout` configured; otherwise demo unlock. |

---

## 4. Recording tips (confirmed for soft launch)

- Do Not Disturb; no notifications; no real PII in CSVs.  
- Steady pace; 2–3 s pause on score, leaks, Gift Box / Mug “loss” moment, Sold through Link line.  
- Prefer **light** theme for marketing unless brand says otherwise.  
- For Free 24h banner: upload a small CSV on Free — sample/demo-store loads **do not** start the Free deletion clock.  

---

## 5. Ask back to Marketing

1. Confirm whether soft-launch copy will omit “works across your phone, tablet and PC with the same Pro data” until B3.  
2. Confirm if you need **native** device screen records (we can supply viewport masters + a shot list) or if Chromium masters are enough for web ads.  
3. Confirm live Stripe credentials timing so “Sold through Link” checkout film is mock vs real.  
