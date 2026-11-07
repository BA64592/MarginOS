# Brand & domain cutover — K58 / spec 20.5

**Approved name:** Margins 365 (exact spelling and spacing)  
**Target domain:** margins365.com  
**Live until cutover:** marginos.online + existing SES identities

This is a checklist for the verified public cutover. Do **not** treat margins365.com as already configured. Do **not** invent support or privacy mailboxes. Trademark clearance is not implied. Repository paths, `--mo-*` CSS tokens, and historical MarginOS-* filenames stay as identifiers. Logo and colours stay.

## Before switching public traffic

1. **Brand strings** — `PRODUCT_NAME` / `VITE_PRODUCT_NAME` = `Margins 365` everywhere user-facing (UI, PDF, email, sample report).
2. **Public URLs** — prepare canonical / OG / sitemap / app / reset / legal links for `https://margins365.com`; keep serving `marginos.online` until cutover, then redirect.
3. **Google OAuth** — add JS origins + redirect URIs for `margins365.com`; keep `marginos.online` until cutover succeeds.
4. **Amazon SES** — verify `margins365.com`, DKIM / DMARC / SPF / MAIL FROM; keep sending from current identities until tests pass.
5. **Stripe** — update success/cancel/webhook URLs and confirm statement descriptor in Dashboard (do not invent a descriptor in code). Create the four tier products (see `docs/STRIPE-SETUP.md` / `scripts/stripe-bootstrap-products.mjs`).
6. **Verify** in a test environment, then switch public traffic and redirect the old host.
