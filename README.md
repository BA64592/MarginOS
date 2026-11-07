# Margins 365

Premium diagnosis app for e-commerce sellers: true profit after product cost, shipping, ads, platform fees and returns — with a Margin Health Score (0–100), ranked leaks, recommendations, calculators, scenarios and PDF export.

**Product name (K58):** Margins 365  
**Live host:** https://margins365.com  
**Legacy alias:** marginos.online  

Built to **Margins 365 Product Spec v19** (K41–K58). Cutover checklist: `docs/CUTOVER-20.5-K58.md`.

## Run

```bash
npm install
npm run dev
```

Dev server: [http://localhost:3847](http://localhost:3847)

```bash
npm run build
npm run preview
```

## Spec alignment (launch slice)

| Area | Status in this build |
| --- | --- |
| True profit / CM / net margin (§12.0) | Implemented |
| Health Score parts + confidence (§12.1) | Implemented |
| Product verdicts (§12.2) | Implemented |
| Six launch leaks + target price (§12.3) | Implemented |
| Plans / trial (v18+) | UI + gating |
| Show the maths | On key metrics |
| Calculators | Break-even ROAS/ACOS, break-even & target price |
| Scenarios / PDF / saved datasets | Pro |
| Clear sample data / Start fresh | Implemented |
| Google sign-in | Enabled when `VITE_GOOGLE_CLIENT_ID` is set (K57) |
| Password reset | SES link flow (K57) |
| Currency GBP/EUR/USD/CAD/AUD | Selector |
| i18n store + hidden language selector | English only |
| Stripe Managed Payments (§12.10) | Live path via `/api/checkout` when `VITE_PAYMENTS_MODE=stripe` |
| Shopify / Amazon / Etsy CSV parsers | Sample + cost/ads templates; TikTok coming soon (K53) |
| Auth (email + Google) | Strict verify tokens + SES; Google GIS; password reset |
| Brand rename | PRODUCT_NAME → Margins 365 (K58); live domain still marginos.online |

See `.env.example` for Stripe / SES secrets. Demo harnesses only in `import.meta.env.DEV` unless `VITE_DEMO_HARNESS=true`.

**Spec docs:** `docs/Margins365-Spec-v19.pdf`, `docs/Margins365-v19-Changes.pdf`  
**Cutover:** `docs/CUTOVER-20.5-K58.md`  
**Pending ops cutover:** DNS/SES/Google OAuth/Stripe URLs for `margins365.com` (see 20.5). Privacy wording pending legal review.

## Stack

React + TypeScript (Vite), Tailwind CSS v4, Recharts, jsPDF, localStorage / DigitalOcean App Platform.
