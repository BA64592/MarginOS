# Sign-in rules (v16.1 A5) — tool-neutral

Apply whatever Akthar chooses in **K5** (recommended: open-source library in-app + Amazon SES London).

## Email / password
- Hash with Argon2id (or bcrypt if unavailable)
- Min 8 characters; reject breached passwords (NIST SP 800-63B)
- Rate-limit sign-in and reset

## Email verification
- Single-use link, 24h expiry; rate-limited resend
- Uploads and checkout locked until verified

## Google
- OIDC; identify by `sub`, never email alone
- Verified only when ID token `email_verified` is true; otherwise MarginOS verification email
- Validate signature, issuer, audience, expiry
- Auto-link only when Google email is verified; if existing email account was never verified, linking removes its password

## Password reset
- Single-use, 1h expiry; successful reset signs out other sessions

## Sessions & logs
- Secure, httpOnly, SameSite cookies
- Never log passwords, tokens or verification links
- UK/EU data location; subprocessors + DPA

Keep sign-in behind `src/lib/auth/provider.ts` (same pattern as payments).
