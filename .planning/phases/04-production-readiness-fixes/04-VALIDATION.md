---
phase: 04
slug: production-readiness-fixes
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-26
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (no automated tests) |
| **Config file** | None |
| **Quick run command** | `npm run build` |
| **Full suite command** | Manual verification checklist |
| **Estimated runtime** | ~5 minutes per plan |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` to verify no type errors
- **After every plan wave:** Manual verification of affected endpoints
- **Before `/gsd:verify-work`:** All manual checks must pass
- **Max feedback latency:** 5 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 04-01-01 | 01 | 1 | D-01 | manual | Magic link send + verify flow | ⬜ pending |
| 04-02-01 | 02 | 1 | D-02 | manual | Stripe webhook payment status check | ⬜ pending |
| 04-02-02 | 02 | 1 | D-03 | manual | Pay-on-pickup completion check | ⬜ pending |
| 04-03-01 | 03 | 1 | D-04 | manual | Stock error message verification | ⬜ pending |
| 04-03-02 | 03 | 1 | D-05 | manual | API error response format check | ⬜ pending |
| 04-04-01 | 04 | 2 | D-06 | manual | Completed order QR scan | ⬜ pending |
| 04-04-02 | 04 | 2 | D-07 | manual | Rate limit enforcement (429 response) | ⬜ pending |
| 04-04-03 | 04 | 2 | D-08 | manual | Uppercase QR token handling | ⬜ pending |
| 04-05-01 | 05 | 2 | D-09 | manual | OrderStatusHistory write check | ⬜ pending |
| 04-05-02 | 05 | 2 | D-10 | manual | Index migration + query perf | ⬜ pending |

*Status: ⬜ pending · ✅ passed · ❌ failed*

---

## Wave 0 Requirements

**No test infrastructure detected.** Manual verification only.

Existing infrastructure:
- `npm run build` — TypeScript compilation and type checking
- `npm run lint` — ESLint for code quality
- `npx prisma validate` — Schema validation

*All Wave 0 requirements covered by existing tooling.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Magic link auth flow | D-01 | Requires email delivery | 1. Request magic link 2. Check email 3. Click link 4. Verify admin access |
| Stripe payment status | D-02 | Requires Stripe webhook | 1. Create Stripe order 2. Complete payment 3. Check DB: `paymentStatus='PAID'` |
| Pay-on-pickup status | D-03 | Requires admin action | 1. Create PAY_ON_PICKUP order 2. Mark COMPLETED 3. Check DB: `paymentStatus='PAID'` |
| Stock error message | D-04 | Requires checkout flow | 1. Add out-of-stock item 2. Attempt checkout 3. Verify specific error |
| Rate limiting | D-07 | Requires 30+ requests | 1. Hit verify-qr 31x 2. Expect 429 on 31st |
| QR case normalization | D-08 | Requires scanner | 1. Generate uppercase QR URL 2. Scan 3. Verify success |

---

## Validation Sign-Off

- [x] All tasks have manual verification instructions
- [x] Sampling continuity: build check after every commit
- [x] Wave 0 covers all dependencies (existing tooling)
- [x] No watch-mode flags needed
- [x] Feedback latency < 5 min per check
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
