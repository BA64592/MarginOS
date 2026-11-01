# Stripe setup (K4) — MarginOS on DigitalOcean

## What Engineering can automate

With a Stripe **secret key** we can:

1. Create product **MarginOS Pro** + inclusive £59 / £39 prices (`scripts/stripe-bootstrap-products.mjs`)
2. Expose `POST /api/checkout` and `POST /api/webhooks/stripe` on the App Platform Web Service
3. Set DigitalOcean env vars and redeploy
4. Register the webhook endpoint once the app is live

## What only the Stripe account owner can finish

- Business identity / UK bank / tax profile
- Confirm **Managed Payments / Link** eligibility (or ask Stripe Support)
- Statement descriptor, support email, Adaptive Pricing toggles
- Switch from **test** → **live** keys after a successful test purchase
- One real live purchase + refund before claiming paid launch

## Env vars (DigitalOcean)

| Key | Scope | Notes |
|---|---|---|
| `VITE_PAYMENTS_MODE` | BUILD_TIME | `stripe` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | BUILD_TIME | `pk_test_…` then `pk_live_…` |
| `STRIPE_SECRET_KEY` | RUN_TIME SECRET | `sk_test_…` / `sk_live_…` |
| `STRIPE_PRICE_FULL` | RUN_TIME | Price id from bootstrap |
| `STRIPE_PRICE_EARLY_BIRD` | RUN_TIME | Price id from bootstrap |
| `STRIPE_WEBHOOK_SECRET` | RUN_TIME SECRET | `whsec_…` |
| `STRIPE_API_VERSION` | RUN_TIME | `2025-03-31.basil` |

Rebuild after changing any `VITE_*` value.

## Webhook

Endpoint: `https://marginos.online/api/webhooks/stripe`  
Events (minimum): `checkout.session.completed`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, `payment_intent.payment_failed`

Licence persistence across devices still needs server storage (B3); until then success URL `/?checkout=success` unlocks Pro in the browser session.

## Bootstrap prices

```bash
STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-bootstrap-products.mjs
```

## Checklist

See `docs/checklists/stripe-smp.md`.
