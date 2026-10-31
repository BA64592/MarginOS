# Deep audit #1 — Spec v17 vs codebase (Design & Development)

**Date:** 31 Oct 2026 (Europe/London)  
**Basis:** MarginOS Spec v17 + v17 Changes handoff  
**Branch:** `cursor/v17-devices-launch-cd8f` (includes marketing demo stores)

## Verdict

Launch-blocking product gaps concentrate in **§15 Devices** and **TikTok public wording**. Core profit maths, Free 24h retention, FX, PII strip, demo auth/Stripe scaffolding from v16.4 remain present. Google (K6), live Stripe (K4), sample exports (K1), and UK storage public copy (legal) stay **Akthar / external**, not D&D inventables.

## Gap matrix (audit 1)

| ID | Spec | Severity | Status before fix | Action |
|---|---|---|---|---|
| V17-D1 | §2 / §9 TikTok wording exactly “TikTok Shop: coming soon”, no date | High (copy) | Missing from UI | Add to platforms / hero / upload |
| V17-D2 | §15.4 Tap targets ≥ 44×44 CSS px | High | Buttons `h-9`/`h-10` (36–40px) | Raise control min-height to 44px |
| V17-D3 | §15.4 No page sideways scroll at 320px | Medium | No `overflow-x` guard | Clip page overflow; safe-area padding |
| V17-D4 | §15.5 Wide tables: name + verdict + profit/margin sticky/visible | Medium | List shows all three; row tap target short | Enlarge product rows; keep key cols visible |
| V17-D5 | §15.2 In-app browser: never stuck; Google → open in browser | High | No detection / copy-link | Banner + copy/open URL helper |
| V17-D6 | §15.8.15 Unsupported browser message | Medium | None | Lightweight support banner |
| V17-D7 | §15.4 Show the maths via tap (not hover) | Low | Tap already | Enlarge maths control to 44px |
| V17-D8 | §15.3 Amount fields → number keyboard | Medium | Text inputs / sliders | `inputMode="decimal"` on amount fields |
| V17-D9 | §15.3 Multi-file one-at-a-time (Etsy) | Low | Separate file inputs exist | Clarify copy that files can be added one at a time |
| V17-D10 | §17.9 Template-only clears sample | OK | `replaceTemplate` already clears sample | Confirm in audit 2 |
| V17-D11 | §15.6 Perf / 50k on phone | QA | Not proven here | Hand to QA matrix T12–T13 |
| V17-D12 | K6 Google / K4 Stripe live / K1 exports | External | Scaffold only | Document for launch actions §20 |
| V17-D13 | Public UK storage wording | Blocked | Legal pending | Do **not** change public copy |
| V17-D14 | TikTok importer / XLSX | Out of scope | Not for launch | Coming soon only |

## Keep as-is (verified present)

- Free 24h clocks, pause/fail (K11), raw file not stored  
- ECB FX + unsupported currency drop  
- PII strip warnings  
- Pro gating, PDF, scenarios, tax estimates  
- Demo harness gated (`Switch to Free` not in prod)  
- Marketing Store A/B/C + multi-platform demos  

## Next

Implement V17-D1–D9, then deep audit #2 and QA handoff.
