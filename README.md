# MarginOS

Premium diagnosis app for e-commerce sellers: true profit after product cost, shipping, ads, platform fees and returns — with a Margin Health Score (0–100), ranked leaks, recommendations, calculators, scenarios and PDF export.

Built to **MarginOS Product Spec v16** with amendments **v16.1–v16.4** (approved 29 October 2026).

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
| Free vs Pro matrix (§7–8 launch) | UI + gating |
| Show the maths | On key metrics |
| Calculators | Break-even ROAS/ACOS, break-even & target price |
| Scenarios / PDF / saved datasets | Pro |
| Clear sample data / Start fresh (v16.3) | Implemented |
| Free 24h retention + raw-file deletion (v16.4) | Implemented |
| Slice A UI parity (B5–B7 handoff) | Template deletion time, upload-limit midnight copy, Shopify PII warnings |
| Google sign-in | Enabled when `VITE_GOOGLE_CLIENT_ID` is set (K6 GIS OAuth) |
| K11 payment-fail → past-due delete | Client demo path in Upgrade modal |
| Digital product mark (manual, K2) | Per-product toggle |
| Currency GBP/EUR/USD/CAD/AUD | Selector |
| i18n store + hidden language selector | English only |
| Auth (email + Google) | Demo modal |
| Stripe Managed Payments (§12.10) | Live path via `/api/checkout` when `VITE_PAYMENTS_MODE=stripe`; mock in demo |
| Shopify / Amazon / Etsy CSV parsers | Sample order dataset + MarginOS cost/ads templates; PII strip warnings on all three |
| ECB FX | Offline ECB reference table + convert-at-import; unsupported currencies excluded |
| Auth (email + Google) | Strict verify tokens + SES hook (`/api/auth/send-verification`); Google GIS via Client ID |
| Account deletion / 24-month inactivity | Implemented client-side (K8 / §10.2.8) |

See `.env.example` for Stripe / SES secrets. Demo harnesses (Switch to Free, K11 simulators) only in `import.meta.env.DEV` unless `VITE_DEMO_HARNESS=true`.

Open questions: `docs/OPEN-QUESTIONS.md`  
Approved spec: `docs/MarginOS-Spec-v16-Final.pdf`  
Amendments: `docs/MarginOS-Amendment-v16.1.pdf`, `docs/MarginOS-Amendment-v16.3.pdf`, `docs/MarginOS-Amendment-v16.4.pdf`  
Checklists: `docs/checklists/` (Stripe SMP, auth rules)

**Decided (v16.2):** K2 Etsy digital manual; K3 fee presets signed off (Shopify Basic, Amazon 15%); K5 in-app auth + SES London.  
**Decided (v16.3):** Clear sample data + Start fresh; **K7** auto-clear sample on first successful own upload.  
**Decided (v16.4):** Free data deleted after 24 hours; raw files deleted after import; **K8–K11** (refunded Pro keep/export, 3 uploads/day, sales wording, delayed-payment pause).  
**Pending Akthar:** K1 sample exports; confirm Google Cloud authorized JS origins include `https://marginos.online` (and local Vite). Privacy wording pending legal review (K10).

## Pricing (from spec)

- Free: £0  
- Pro: £59 lifetime (early-bird £39 for first 200 sales)  
- Sold through Link (Stripe Managed Payments); displayed prices tax-inclusive  

## Stack

React + TypeScript (Vite), Tailwind CSS v4, Recharts, jsPDF, localStorage.
