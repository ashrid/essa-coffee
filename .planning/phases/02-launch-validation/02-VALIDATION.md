---
phase: 2
slug: launch-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual + Observational (no automated tests — Phase 2 is operational) |
| **Config file** | none |
| **Quick run command** | `npm run build` (confirms no compile errors) |
| **Full suite command** | Manual checklist below |
| **Estimated runtime** | ~5 minutes per manual check cycle |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` to confirm no regressions
- **After every plan wave:** Run full manual checklist for that wave
- **Before `/gsd:verify-work`:** All 6 success criteria must be confirmed observable
- **Max feedback latency:** Manual verification before marking wave complete

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | D-01/D-02 | manual | `npm run build` | ✅ | ⬜ pending |
| 2-01-02 | 01 | 1 | D-03 | manual | Neon dashboard check | N/A | ⬜ pending |
| 2-01-03 | 01 | 1 | D-05 | manual | Vercel dashboard env vars | N/A | ⬜ pending |
| 2-01-04 | 01 | 1 | D-08 | manual | Magic link flow test | N/A | ⬜ pending |
| 2-02-01 | 02 | 2 | SC-2 | manual | Stripe Dashboard webhook status | N/A | ⬜ pending |
| 2-02-02 | 02 | 2 | SC-3 | manual | Email inbox confirmation | N/A | ⬜ pending |
| 2-03-01 | 03 | 3 | SC-6 | manual | Support email receipt | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Phase 2 is operational validation — no new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Store loads in < 2s | SC-1 | Browser-only metric | Open production URL, check DevTools Network tab — TTFB < 500ms, full load < 2s |
| Admin panel accessible | SC-1 | Auth flow — can't automate without credentials | Navigate to `/admin`, trigger magic link email, click link, confirm dashboard loads |
| Stripe payment completes | SC-2 | Real Stripe transaction required | Place test order with Stripe test card `4242 4242 4242 4242`, confirm order in DB |
| Webhook delivers reliably | SC-2 | External Stripe system | Stripe Dashboard → Webhooks → confirm "Delivered" status, no errors |
| Order confirmation email arrives | SC-3 | Real email delivery | Place test order, confirm email arrives in customer inbox (not spam) within 2 min |
| Pickup notification reaches admin | SC-3 | Real email delivery | Place test order, confirm admin receives pickup notification email |
| Inventory decrements on order | SC-4 | Database state check | Place order for item, check admin dashboard stock count decremented by ordered qty |
| Manual stock update reflects | SC-4 | Admin → storefront round-trip | Update stock count in admin, refresh storefront — confirm updated count within 5 min |
| Error page shown on failure | SC-5 | UI behavior | Submit invalid data, confirm user-friendly error message shown (not raw exception) |
| Support email receives inquiry | SC-6 | Real email delivery | Send test message to support email, confirm owner receives it |
| Magic link works in production | D-08 | Auth.js v5 edge runtime check | Trigger magic link from production URL, confirm token arrives and login succeeds |

---

## Validation Sign-Off

- [ ] All tasks have observable verification criteria
- [ ] Each wave has a manual check before proceeding to next wave
- [ ] All 6 success criteria have at least one manual test instruction
- [ ] No automated tests required (Phase 2 is operational — Phase 1 covers functional correctness)
- [ ] `nyquist_compliant: true` set in frontmatter when all checks pass

**Approval:** pending
