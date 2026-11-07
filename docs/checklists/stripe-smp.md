# Stripe Managed Payments — developer checklist (v16.1 A4)

**K4 status:** Stripe account created by Akthar. Engineering wires DigitalOcean `/api/checkout` + webhook; owner finishes Dashboard identity/bank/SMP eligibility.

Once test keys exist:

1. Own Stripe user with Developer role; **test** keys first; secrets only in DigitalOcean / host secret store.
2. Pin API version `2025-03-31.basil` or later.
3. Products Starter/Growth/Pro/Scale, tax code `txcd_10103001`; monthly + annual GBP inclusive — run `scripts/stripe-bootstrap-products.mjs` or create in Dashboard (`docs/STRIPE-SETUP.md`).
4. Checkout Session via `POST /api/checkout`: `mode=subscription`, 14-day trial, `managed_payments[enabled]=true` when eligible (falls back without), `client_reference_id` = account ID, plan/interval metadata, 30‑minute expiry; allowed-country check first.
5. Webhook on the live host `/api/webhooks/stripe`: `checkout.session.completed`, subscription updated/deleted, refund/dispute; verify signatures; de-dupe event IDs.
6. Pass §12.10 test-mode matrix + Adaptive Pricing + receipt/descriptor check.
7. Ask Stripe whether SMP can block buyer countries server-side; log answer here.
8. Go live only after K4 + legal/accountant checks: live prices, live webhook, one real purchase+refund, alerts + daily reconciliation.

App entry: `src/lib/payments/provider.ts` → `/api/checkout` when `VITE_PAYMENTS_MODE=stripe` + publishable key. See `docs/STRIPE-SETUP.md`.
