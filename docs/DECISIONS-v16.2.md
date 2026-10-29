# Spec clarification v16.2 — Akthar decisions

**Date:** 29 October 2026  
**Amends:** v16 / v16.1 Part C items K2, K3, K5  
**Does not change:** pricing, positioning, or feature set beyond locking the v16.1 recommendations.

## K2 — Etsy digital listings
**Decision:** Digital stays **manual**. Do not auto-detect from Etsy `Listings Type`.  
**Behaviour:** Etsy orders are physical unless the user marks the listing (or shop) as digital (v16 §12.0).

## K3 — Fee presets
**Decision:** Sign off the v16.1 A2 DRAFT table as launch presets (sources checked 29 Oct 2026).  
- Shopify payment preset: **Basic** plan rates per region.  
- Amazon referral comparison: **15%** (“Everything else”), with Show the maths note that category rates are 5–20%.  
- Recheck at least every 6 months (§12.3).

## K5 — Sign-in and email
**Decision:**  
- Sign-in: **in-app** open-source library (e.g. Better Auth / Auth.js — developer picks what fits the stack).  
- Email: **Amazon SES**, London region (`eu-west-2`).  
- Must meet v16.1 **A5** rules; both go on the subprocessor list with a DPA.  
- Google sign-in still needs Akthar’s Google Cloud project (**K6**).

## Still open
K1 (sample CSVs), K4 (Stripe), K6 (Google Cloud).
