# Phase 04: Production Readiness Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 04-production-readiness-fixes
**Areas discussed:** Token store migration, Payment status updates, QR verification edge cases, Database & schema fixes

---

## Token Store Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Upstash Redis | Serverless Redis with existing @upstash/ratelimit dependency. Same Vercel team, zero config. | |
| PostgreSQL table | Use existing VerificationToken model in schema.prisma. Simple DB queries, no new service. | ✓ |
| Managed cache service | Use Prisma Accelerate or Vercel KV. More vendor lock-in. | |

**User's choice:** PostgreSQL table
**Notes:** Simpler approach, no new vendor dependency. Table already exists in schema.

### Token lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Delete on verify | Delete tokens after successful verification. Simple, no accumulation. | ✓ |
| Keep with TTL | Keep tokens for 15 min then delete via cron/job. | |

**User's choice:** Delete on verify
**Notes:** Matches current in-memory behavior.

---

## Payment Status Updates

### Stripe webhook timing

| Option | Description | Selected |
|--------|-------------|----------|
| Update on webhook | Set paymentStatus=PAID, paidAt, paidAmount when Stripe webhook fires. | ✓ |
| Manual admin update | Keep PENDING and manually mark PAID in admin. | |

**User's choice:** Update on webhook
**Notes:** Standard e-commerce pattern.

### Pay-on-pickup lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-set PAID on COMPLETED | When admin marks PAY_ON_PICKUP as COMPLETED, auto-set paymentStatus=PAID. | ✓ |
| Leave PENDING | Keep PENDING forever. Admin must manually update paymentStatus. | |
| Manual admin update | Admin explicitly changes paymentStatus separately from order status. | |

**User's choice:** Auto-set PAID on COMPLETED
**Notes:** Payment collected at pickup, so COMPLETED = payment received.

### Error response format

| Option | Description | Selected |
|--------|-------------|----------|
| Standardize error format | Use consistent { error, code, details? } shape across all API routes. | ✓ |
| Fix prefix only | Just fix INSUFFICIENT_STOCK→ITEM_UNAVAILABLE mismatch. | |

**User's choice:** Standardize error format
**Notes:** Easier frontend handling, consistent API contract.

---

## QR Verification Edge Cases

### COMPLETED order response

| Option | Description | Selected |
|--------|-------------|----------|
| 200 + flag | Return 200 with { alreadyCompleted: true } flag. Frontend shows "already fulfilled". | ✓ |
| 409 Conflict | Return 409 like other status errors. Client must parse error string. | |

**User's choice:** 200 + flag
**Notes:** Clearer for staff to distinguish "not ready" from "already done".

### Rate limiting

| Option | Description | Selected |
|--------|-------------|----------|
| Add rate limiting | 30 requests per minute per IP. Prevents abuse of public endpoint. | ✓ |
| Skip rate limiting | QR scanning is low-risk. Keep simple. | |

**User's choice:** Add rate limiting
**Notes:** Public endpoint hitting database needs protection.

### Token case normalization

| Option | Description | Selected |
|--------|-------------|----------|
| Normalize in scanner | Add .toLowerCase() in QRScanner.tsx when extracting token. | ✓ |
| Keep API-only | Just validate in API (already done). | |

**User's choice:** Normalize in scanner
**Notes:** Defense in depth.

---

## Database & Schema Fixes

### OrderStatusHistory

| Option | Description | Selected |
|--------|-------------|----------|
| Implement logging | Create OrderStatusHistory records on every PATCH to /api/admin/orders/[id]. | ✓ |
| Remove unused model | Remove dead OrderStatusHistory model from schema. | |

**User's choice:** Implement logging
**Notes:** Audit trail valuable for compliance.

### Index changes

| Option | Description | Selected |
|--------|-------------|----------|
| Add @@index([stripeSessionId]) | Webhook finds by stripeSessionId — missing index slows queries. | ✓ |
| Remove @@index([qrTokenExpiresAt]) | Index exists but never used (queries use unique qrToken first). | ✓ |

**User's choice:** Add stripeSessionId index, Remove qrTokenExpiresAt index
**Notes:** Add read performance for webhook, remove write overhead for unused index.

---

## Claude's Discretion

Areas where user deferred to Claude:
- Floating-point precision fix (deferred — low priority)
- Remove dead showScanner state (deferred — cosmetic)
- Environment variable validation at startup (deferred — nice-to-have)

## Deferred Ideas

- Floating-point precision (big.js or cents) — defer until issues observed
- NEXT_PUBLIC_APP_URL validation — low priority
- Dead state cleanup in scan page — cosmetic

---

*Log generated: 2026-03-26*
