# Phase 04: Production Readiness Fixes - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** Cross-AI codebase review (Gemini + Claude)

---

<domain>
## Phase Boundary

Fix critical and high-priority issues identified in cross-AI codebase reviews before production deployment. This phase addresses bugs, security concerns, and data integrity problems. No new features — reactive bug fixing only.

Issues sourced from:
- `.planning/codebase-REVIEWS.md` (Claude self-review)
- `.planning/codebase-CROSS-AI-REVIEWS.md` (Gemini + Claude consensus)

</domain>

<decisions>
## Implementation Decisions

### D-01: Token Store Migration
- **Problem:** In-memory `globalThis.tokenStore` in `lib/auth.ts` fails in multi-instance deployments (Vercel serverless). Magic links created on instance A cannot be verified on instance B.
- **Solution:** Migrate to PostgreSQL `VerificationToken` table (already exists in schema but unused).
- **Token lifecycle:** Delete token immediately after successful verification (no accumulation).
- **Files affected:** `lib/auth.ts`, `prisma/schema.prisma` (model exists)

### D-02: Payment Status Updates (Stripe)
- **Problem:** Stripe webhook creates orders with `paymentStatus: PENDING` and never updates to `PAID`. Also missing `paidAt` and `paidAmount`.
- **Solution:** In `app/api/webhook/route.ts`, after order creation:
  ```typescript
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
      paidAmount: session.amount_total / 100
    }
  });
  ```
- **Files affected:** `app/api/webhook/route.ts`

### D-03: Payment Status Updates (Pay-on-Pickup)
- **Problem:** PAY_ON_PICKUP orders remain `PENDING` even after admin marks order as COMPLETED (payment collected at pickup).
- **Solution:** In `app/api/admin/orders/[id]/route.ts` PATCH handler, when `status` changes to `COMPLETED` AND `paymentMethod === 'PAY_ON_PICKUP'`, auto-set `paymentStatus: 'PAID'` and `paidAt: new Date()`.
- **Files affected:** `app/api/admin/orders/[id]/route.ts`

### D-04: Error Message Prefix Mismatch
- **Problem:** `lib/orders.ts` throws `ITEM_UNAVAILABLE:[productName]` but `app/api/checkout/route.ts` checks for `INSUFFICIENT_STOCK:`. Stock errors return generic "Order failed" instead of helpful "Out of stock: [Name]".
- **Solution:** Change `INSUFFICIENT_STOCK:` to `ITEM_UNAVAILABLE:` in checkout route (line ~173).
- **Files affected:** `app/api/checkout/route.ts`

### D-05: API Error Response Standardization
- **Problem:** Inconsistent error shapes across API routes — some return `{ error }`, others add `details`, `productName`, etc. Frontend must handle multiple formats.
- **Solution:** Standardize all API error responses to:
  ```typescript
  interface ApiError {
    error: string;       // always present
    code?: string;       // machine-readable code (e.g., "ITEM_UNAVAILABLE")
    details?: unknown;   // additional context
  }
  ```
- **Files affected:** All `app/api/*/route.ts` files (verify-qr, resend-qr, checkout, webhook, magic-link)

### D-06: QR Verification for Completed Orders
- **Problem:** When a customer scans an already-completed order QR code, API returns 409 "Order is not ready for pickup" — confusing for staff who can't distinguish "not ready" from "already done".
- **Solution:** Add explicit COMPLETED check before READY check in `verify-qr`:
  ```typescript
  if (order.status === "COMPLETED") {
    return NextResponse.json({
      error: "Order already completed",
      status: order.status,
      alreadyCompleted: true
    }, { status: 200 });
  }
  ```
- **Files affected:** `app/api/orders/verify-qr/route.ts`

### D-07: Rate Limiting for verify-qr Endpoint
- **Problem:** Public endpoint with no auth, hits database. Malicious actor could brute-force random 64-char hex tokens.
- **Solution:** Add rate limiting: 30 requests per minute per IP. Use existing `lib/ratelimit.ts` pattern.
- **Files affected:** `app/api/orders/verify-qr/route.ts`

### D-08: QR Token Case Normalization
- **Problem:** QR tokens are generated as lowercase hex, but if URL parsing produces uppercase, API returns 400 "Invalid QR token format".
- **Solution:** Normalize token to lowercase in scanner before sending to API:
  ```typescript
  token = url.searchParams.get('token')?.toLowerCase();
  ```
- **Files affected:** `app/(admin)/admin/scan/QRScanner.tsx`

### D-09: OrderStatusHistory Implementation
- **Problem:** `OrderStatusHistory` model exists in schema but no code writes to it. Dead table.
- **Solution:** Implement logging on every PATCH to `/api/admin/orders/[id]` when status changes:
  ```typescript
  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      oldStatus: previousStatus,
      newStatus: newStatus,
      changedBy: session.user.email, // admin email
      changedAt: new Date()
    }
  });
  ```
- **Files affected:** `app/api/admin/orders/[id]/route.ts`

### D-10: Database Index Changes
- **Add:** `@@index([stripeSessionId])` on Order model — webhook queries by this field.
- **Remove:** `@@index([qrTokenExpiresAt])` — expiration check happens after unique qrToken lookup, index adds write overhead with no read benefit.
- **Files affected:** `prisma/schema.prisma`

### Claude's Discretion
- Floating-point precision for currency calculations (flagged by Claude as MEDIUM) — defer to future phase if issues arise
- Remove dead `showScanner` state in `app/(admin)/admin/scan/page.tsx` — low priority cleanup
- Environment variable validation at startup — nice-to-have, not blocking

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cross-AI Reviews (Source of Issues)
- `.planning/codebase-REVIEWS.md` — Claude self-review with 14 issues identified
- `.planning/codebase-CROSS-AI-REVIEWS.md` — Gemini + Claude consensus with action items

### Auth System
- `lib/auth.ts` — Current in-memory token store implementation
- `prisma/schema.prisma` (VerificationToken model) — Target table for token migration

### Payment Flow
- `app/api/webhook/route.ts` — Stripe webhook handler (needs paymentStatus update)
- `app/api/checkout/route.ts` — Checkout route (needs error prefix fix)
- `app/api/admin/orders/[id]/route.ts` — Admin order update (needs PAY_ON_PICKUP auto-PAID, status history)

### QR System
- `app/api/orders/verify-qr/route.ts` — QR verification endpoint (needs COMPLETED handling, rate limiting)
- `app/(admin)/admin/scan/QRScanner.tsx` — Scanner component (needs lowercase normalization)

### Shared Utilities
- `lib/orders.ts` — Order creation logic (source of ITEM_UNAVAILABLE error)
- `lib/ratelimit.ts` — Rate limiting pattern to replicate

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/ratelimit.ts` — Upstash-based rate limiting with `checkRateLimit()` function; replicate pattern for verify-qr
- `prisma/schema.prisma` (VerificationToken) — Table exists with identifier/token/expires fields; just needs auth.ts integration

### Established Patterns
- Email failure isolation: `Promise.allSettled` pattern prevents email failures from blocking order creation
- Idempotent webhook: `stripeSessionId` check prevents duplicate orders
- Zod validation: All API routes use `lib/validators.ts` for input validation

### Integration Points
- Auth middleware expects `lib/auth.ts` to export `getToken()` / `setToken()` / `deleteToken()` — keep interface, change backing store
- Admin order PATCH route is the single point for status changes — add status history logging there

</code_context>

<specifics>
## Specific Ideas

1. **VerificationToken query pattern:**
   ```typescript
   // In lib/auth.ts
   async function setToken(identifier: string, token: string, expires: Date) {
     await prisma.verificationToken.create({
       data: { identifier, token, expires }
     });
   }
   ```

2. **Rate limiting verify-qr:**
   ```typescript
   const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
   const { success } = await checkRateLimit(`verify-qr:${ip}`, 30, 60_000);
   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
   ```

3. **Standard error format:**
   ```typescript
   return NextResponse.json({
     error: "Order not found",
     code: "ORDER_NOT_FOUND"
   }, { status: 404 });
   ```

</specifics>

<deferred>
## Deferred Ideas

- Floating-point precision fix (use big.js or cents) — defer until issues observed
- Next public APP URL validation for email links — low priority
- Remove dead `showScanner` state in scan page — cosmetic cleanup

</deferred>

---

*Phase: 04-production-readiness-fixes*
*Context gathered: 2026-03-26*
