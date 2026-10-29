# Sign-in rules (v16.1 A5) — approved stack v16.2

**Approved (Akthar, 29 Oct 2026 / v16.2):** in-app open-source sign-in library + **Amazon SES London** (`eu-west-2`).

Google Cloud OAuth project is still **K6** (Akthar). Until K6, email/password verification via SES is the path; Google button stays disabled or demo-only.

## Email / password
- Hash with Argon2id (or bcrypt if unavailable)
- Min 8 characters; reject breached passwords (NIST SP 800-63B)
- Rate-limit sign-in and reset

## Email verification (SES London)
- Single-use link, 24h expiry; rate-limited resend
- Uploads and checkout locked until verified
- From-address and templates configured in SES; secrets only in host secret store

## Google (after K6)
- OIDC; identify by `sub`, never email alone
- Verified only when ID token `email_verified` is true; otherwise MarginOS verification email
- Validate signature, issuer, audience, expiry
- Auto-link only when Google email is verified; if existing email/password account was never verified, linking removes its password

## Password reset
- Single-use, 1h expiry; successful reset signs out other sessions

## Sessions & logs
- Secure, httpOnly, SameSite cookies
- Never log passwords, tokens or verification links
- UK/EU data location; subprocessors + DPA (auth library host DB + SES)

Keep sign-in behind `src/lib/auth/provider.ts`.
