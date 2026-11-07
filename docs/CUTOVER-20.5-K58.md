# Brand & domain cutover — K58 / spec 20.5

**Approved name:** Margins 365 (exact spelling and spacing)  
**Target domain:** margins365.com  
**Canonical host:** https://margins365.com  
**Legacy:** `marginos.online` / `www.marginos.online` → **301/308 redirect** to the canonical host (path + query preserved). SES From may still use `noreply@marginos.online` until the new domain is verified for mail.

Do **not** invent support or privacy mailboxes. Trademark clearance is not implied. Repository paths, `--mo-*` CSS tokens, and historical MarginOS-* filenames stay as identifiers. Logo and colours stay.

## Cutover checklist

1. **Brand strings** — `PRODUCT_NAME` = `Margins 365`.
2. **Public URLs** — canonical host `margins365.com`; legacy hosts redirect in `scripts/server.mjs`.
3. **Google OAuth** — authorised JS origins include `https://margins365.com`.
4. **Amazon SES** — prefer verifying `margins365.com` for From; until then keep existing SES identity.
5. **Stripe** — webhook + Checkout URLs on `https://margins365.com`; four tier products (`docs/STRIPE-SETUP.md`).
6. **Verify** on the canonical host, then keep the legacy alias only for redirects (do not delete DNS until mail/OAuth no longer need it).
