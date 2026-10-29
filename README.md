# MarginOS

Premium single-page web app for e-commerce sellers: true profit after product cost, shipping, ads, platform fees and returns — with a Margin Health Score, ranked £ leaks, recommendations, scenario comparison and PDF export.

Built to the approved MarginOS product specification (Akthar Uddin, 29 Oct 2026).

## Stack

- React + TypeScript (Vite)
- Tailwind CSS v4
- Recharts
- jsPDF (Pro PDF export)
- localStorage persistence

## Run locally

```bash
npm install
npm run dev
```

App runs at [http://localhost:3847](http://localhost:3847).

```bash
npm run build
npm run preview
```

## Free vs Pro (from approved spec)

| Feature | Free | Pro (£19 lifetime) |
| --- | --- | --- |
| Data input | Manual or one CSV upload | Unlimited CSV + saved datasets |
| Products | Up to 10 | Unlimited |
| True profit | Yes | Yes |
| Health Score | Overall only | Breakdown by cost area & product |
| Margin leaks | Top 3, no £ impact | All leaks ranked by £ impact |
| Recommendations | 1 headline action | Action for every leak |
| Scenario comparison | No | Yes |
| PDF reports | No | Yes |
| Saved history | No | Yes |

Demo Pro unlock is local (no Lemon Squeezy checkout in this build).

## CSV format

```csv
name,units_sold,selling_price,product_cost,shipping_cost,ad_spend,platform_fee_pct,return_rate_pct
```

## True profit model

For each product (monthly):

- Gross revenue = units × price
- Refunds = gross × return rate
- Net revenue = gross − refunds
- Costs = COGS + shipping + ads + platform fees + return handling (60% of COGS+shipping on returned units)
- **True profit** = net revenue − costs

Health Score (0–100) scores net margin, ad efficiency, returns, platform fees and COGS ratio against healthy e-com benchmarks. Leaks are sized as £ above those benchmarks.
