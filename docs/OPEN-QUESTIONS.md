# Open questions log (spec §14)

Amended by **MarginOS Spec Amendment v16.1**, clarification **v16.2**, and feature amendment **v16.3** (29 October 2026).  
**Akthar decisions 29 October 2026:** K2, K3, K5 (v16.2); Clear sample data / Start fresh + **K7** (v16.3).

| ID | Date raised | Section | Question | Raised by | Answer | Answered by | Amendment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q1 | 29 Oct 2026 | 6, 12.0, 12.7 | Exact Shopify / Etsy / Amazon export columns and MarginOS field mapping? | Developer | Column lists in v16.1 **A1**. Real exports still needed (**K1**). Etsy digital auto-detect **rejected** (**K2** / v16.2) — manual mark only. | Business & Product; Akthar (K2) | v16.1 / v16.2 |
| Q2 | 29 Oct 2026 | 12.3 | Fee preset table sign-off? | Developer | **Signed off (v16.2):** DRAFT table in A2 is launch presets; Shopify **Basic** plan; Amazon referral compared to **15%** Everything else with category maths note. | Akthar | v16.1 / v16.2 |
| Q3 | 29 Oct 2026 | 12.8 | Official tax rate sources? | Developer | Sources in v16.1 **A3**. US: export only. | Business & Product | v16.1 |
| Q4 | 29 Oct 2026 | 12.5, 12.10 | Live Stripe Managed Payments setup? | Developer | Checklist **A4**. Akthar Stripe tasks still open (**K4**). | Business & Product | v16.1 |
| Q5 | 29 Oct 2026 | 5, 10.2, 12.6 | Real email/password and Google sign-in? | Developer | **Approved (v16.2):** in-app open-source sign-in library + **Amazon SES London**. Google Cloud project still Akthar (**K6**). A5 security rules apply. | Akthar | v16.1 / v16.2 |
| Q6 | 29 Oct 2026 | 6, 7, 10.2, 12.4, 12.6, 12.7 | Demo testing: costs set to £0 were applied to loaded sample orders. Can users clear sample data, or reset everything? | Akthar (demo testing) | **v16.3 approved:** Clear sample data + Start fresh (each with “Are you sure?”); uploads not restored; account deletion unchanged (15.E). **K7:** sample cleared automatically on first successful own upload; failed/cancelled upload leaves it (E9). | Business & Product; Akthar | v16.3 |

## Decisions locked (v16.2)

| ID | Decision |
| --- | --- |
| **K2** | Etsy digital stays **manual** (no Listings Type auto-detect). |
| **K3** | Fee presets **signed off**; Shopify preset = **Basic**; Amazon referral vs **15%**. |
| **K5** | **In-app** sign-in library + **Amazon SES** (London / eu-west-2). |

## Still pending on Akthar

| ID | Topic | Status |
| --- | --- | --- |
| **K1** | Friendly-seller sample exports | Action — confirm “confirm” columns |
| **K4** | Stripe account, SMP eligibility, Dashboard | Action — blocks live checkout |
| **K6** | Google Cloud OAuth project | Action — needed for Google sign-in |

See also: `docs/MarginOS-Amendment-v16.1.pdf`, `docs/MarginOS-Amendment-v16.3.pdf`, `docs/checklists/`, `docs/DECISIONS-v16.2.md`, `docs/DECISIONS-v16.3.md`.
