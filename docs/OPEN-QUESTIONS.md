# Open questions log (spec §14)

Amended by **MarginOS Spec Amendment v16.1** (29 October 2026). Part B is ready to use. Part C needs Akthar’s approval or action; until he decides, v16 behaviour stays as written.

| ID | Date raised | Section | Question | Raised by | Answer | Answered by | Amendment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q1 | 29 Oct 2026 | 6, 12.0, 12.7 | Exact Shopify / Etsy / Amazon export columns and MarginOS field mapping? | Developer | Column lists, parsing rules and mappings in v16.1 **A1**. Items marked “confirm” must be checked against real exports. Akthar to ask friendly sellers (**K1**). Optional Etsy digital auto-detect needs approval (**K2**); default unchanged. | Business & Product Agent | v16.1 |
| Q2 | 29 Oct 2026 | 12.3 | Fee preset table sign-off (platform × region × compared fee type)? | Developer | DRAFT table + mapping clarifications in v16.1 **A2**. Not live until Akthar signs off (**K3**), including Shopify Basic plan recommendation and Amazon 15% referral comparison. | Business & Product (draft); Akthar (sign-off pending) | v16.1 |
| Q3 | 29 Oct 2026 | 12.8 | Official tax rate sources and update cadence? | Developer | Sources, date-effective storage and recheck timing in v16.1 **A3**. US unchanged: export only. | Business & Product Agent | v16.1 |
| Q4 | 29 Oct 2026 | 12.5, 12.10 | What is needed for live Stripe Managed Payments? | Developer | Developer checklist in v16.1 **A4**. Akthar’s account / verification / bank / eligibility / Dashboard tasks in **K4** (action pending). | Business & Product Agent | v16.1 |
| Q5 | 29 Oct 2026 | 5, 10.2, 12.6 | Which real email/password and Google sign-in setup? | Developer | Tool-neutral security rules in v16.1 **A5**. Options in **K5** (open-source library + Amazon SES London recommended). Choice + spend need Akthar’s approval. Google Cloud setup is Akthar’s action (**K6**). | Business & Product (recommendation); Akthar (decision pending) | v16.1 |

## Pending on Akthar (Part C)

| ID | Topic | Default until decided |
| --- | --- | --- |
| K1 | Ask friendly sellers for sample exports | Parsers built against A1; “confirm” columns remain working assumptions |
| K2 | Auto-detect Etsy digital via Listings Type | **No** — Etsy physical unless user marks digital (v16) |
| K3 | Sign off DRAFT fee presets; Shopify plan; Amazon 15% comparison | DRAFT rates coded and labelled **draft — pending sign-off**; Shopify Basic; Amazon referral vs 15% with maths note |
| K4 | Stripe account, identity, bank, SMP eligibility, Dashboard | Checkout stays on mock payment provider layer |
| K5 | Sign-in approach + email sender | Demo auth only; A5 rules documented behind auth interface |
| K6 | Google Cloud OAuth project | Not started |

See also: `docs/MarginOS-Amendment-v16.1.pdf`, `docs/checklists/`.
