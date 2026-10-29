# Stripe Managed Payments — developer checklist (v16.1 A4)

**Blocked until Akthar completes K4** (create Stripe account, invite Developer role, identity/business checks, UK GBP bank, SMP eligibility, tax-inclusive defaults, Adaptive Pricing, support email, statement descriptor).

Once access exists:

1. Own Stripe user with Developer role; sandbox keys first; secrets only in host secret store; restricted key.
2. Pin API version `2025-03-31.basil` or later.
3. Product “MarginOS Pro”, tax code `txcd_10103001`; prices £59 / £39 with currency_options per §12.5; `tax_behavior = inclusive` on every price.
4. Checkout Session: `mode=payment`, `managed_payments[enabled]=true`, `client_reference_id` = MarginOS account ID, 30‑minute expiry; allowed-country check first.
5. Webhook: events in §12.10; verify signatures; process each event ID once; fetch latest Charge/Dispute before deciding.
6. Pass full §12.10 test-mode matrix + Adaptive Pricing + receipt/descriptor check.
7. Ask Stripe whether SMP can block buyer countries server-side; log answer here.
8. Go live only after K4 + legal/accountant checks: live prices, live webhook, one real purchase+refund, alerts + daily reconciliation.

This app’s payment code stays behind `src/lib/payments/provider.ts` until a Stripe adapter is added.
