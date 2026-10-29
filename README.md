# MarginOS

Premium diagnosis app for e-commerce sellers: true profit after product cost, shipping, ads, platform fees and returns — with a Margin Health Score (0–100), ranked leaks, recommendations, calculators, scenarios and PDF export.

Built to **MarginOS Product Spec v16** (approved 29 October 2026).

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
| Currency GBP/EUR/USD/CAD/AUD | Selector |
| i18n store + hidden language selector | English only |
| Auth (email + Google) | Demo modal |
| Stripe Managed Payments (§12.10) | Mock provider layer |
| Shopify / Amazon / Etsy CSV parsers | Sample order dataset + MarginOS cost/ads templates; exact platform columns logged in open questions |
| ECB FX + full tax engine | Stubs / settings UI; full rate tables pending sign-off |

Open questions: `docs/OPEN-QUESTIONS.md`  
Approved spec: `docs/MarginOS-Spec-v16-Final.pdf`

## Pricing (from spec)

- Free: £0  
- Pro: £59 lifetime (early-bird £39 for first 200 sales)  
- Sold through Link (Stripe Managed Payments); displayed prices tax-inclusive  

## Stack

React + TypeScript (Vite), Tailwind CSS v4, Recharts, jsPDF, localStorage.
