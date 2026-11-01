# Server auth + Pro licence (B2/B3 slice)

## What changed
- Accounts live in Postgres (`DATABASE_URL` on App Platform)
- Password hashed with bcrypt
- Email verification tokens stored server-side (works across devices)
- Session cookie `marginos_session` (HttpOnly, SameSite=Lax, Secure in production)
- Stripe `checkout.session.completed` sets `users.plan = pro`

## API
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/continue` | Sign in or create account |
| GET | `/api/auth/me` | Current session |
| POST | `/api/auth/logout` | Clear session |
| POST | `/api/auth/send-verification` | SES link (authed) |
| POST/GET | `/api/auth/verify` | Consume token |

## After deploy
1. Sign in again with the same email/password (creates the DB user).
2. Open the new verification email on any device.
3. Pro should restore from Stripe webhook by account id / email; if a prior test purchase used a local-only account id, re-open Upgrade once or ask Eng to grant Pro by email.
