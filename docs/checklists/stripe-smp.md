# Stripe Managed Payments — developer checklist (v16.1 A4)

**K4 status:** Stripe account created by Akthar. Engineering wires DigitalOcean `/api/checkout` + webhook; owner finishes Dashboard identity/bank/SMP eligibility.

Once test keys exist:

1. Own Stripe user with Developer role; **test** keys first; secrets only in DigitalOcean / host secret store.
2. Pin API version `2025-03-31.basil` or later.
3. Product “MarginOS Pro”, tax code `txcd_10103001`; prices £59 / £39 with currency_options — run `scripts/stripe-bootstrap-products.mjs` or create in Dashboard.
4. Checkout Session via `POST /api/checkout`: `mode=payment`, `managed_payments[enabled]=true` when eligible (falls back without), `client_reference_id` = MarginOS account ID, 30‑minute expiry; allowed-country check first.
5. Webhook `https://marginos.online/api/webhooks/stripe`: events in §12.10; verify signatures; de-dupe event IDs (in-memory until B3 DB).
6. Pass §12.10 test-mode matrix + Adaptive Pricing + receipt/descriptor check.
7. Ask Stripe whether SMP can block buyer countries server-side; log answer here.
8. Go live only after K4 + legal/accountant checks: live prices, live webhook, one real purchase+refund, alerts + daily reconciliation.

App entry: `src/lib/payments/provider.ts` → `/api/checkout` when `VITE_PAYMENTS_MODE=stripe` + publishable key. See `docs/STRIPE-SETUP.md`.
