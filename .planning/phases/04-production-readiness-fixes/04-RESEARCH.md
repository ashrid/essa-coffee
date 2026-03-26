<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

[Copy verbatim from CONTEXT.md ## Decisions]

### D-01: Token Store Migration
- **Problem:** In-memory `globalThis.tokenStore` in `lib/auth.ts` fails in multi-instance deployments (Vercel serverless). Magic links created on instance A cannot be verified on instance B.
- - **Solution:** Migrate to PostgreSQL `VerificationToken` table (already exists in schema but unused).
    - **Token lifecycle:** Delete token immediately after successful verification (no accumulation).
    - **Files affected:** `lib/auth.ts`, `prisma/schema.prisma` (model exists)

    - **D-02: Payment Status Updates (Stripe)
    - **Problem:** Stripe webhook creates orders with `paymentStatus: PENDING` and never updates to `PAID`. Also missing `paidAt` and `paidAmount`.
    - **Solution:** In `app/api/webhook/route.ts`, after order creation:
 update `paymentStatus`, `paidAt`, and `paidAmount` via `prisma.order.update()`.
    - **Files affected:** `app/api/webhook/route.ts`
    - **D-03: Payment Status Updates (Pay-on-Pickup)
    - **Problem:** PAY_ON_PICKUP orders remain `PENDING` even after admin marks order as `COMPLETED` (payment collected at pickup).
    - **Solution:** In `app/api/admin/orders/[id]/route.ts` PATCH handler, when `status` changes to `COMPLETED` AND `paymentMethod === 'PAY_ON_PICKUP'`, auto-set `paymentStatus: 'PAID'` and `paidAt: new Date()`.
    - **Files affected:** `app/api/admin/orders/[id]/route.ts`

    - **D-04: Error Message Prefix Mismatch
    - **Problem:** `lib/orders.ts` throws `ITEM_UNAVAILABLE:[productName]` but `app/api/checkout/route.ts` checks for `INSUFFICIENT_STOCK:`. Stock errors return generic "Order failed" instead of helpful "Out of stock: [Name]".
    - **Solution:** Change `INSUFFICIENT_STOCK:` to `ITEM_UNAVAILABLE:` in checkout route (line ~173).
    - **Files affected:** `app/api/checkout/route.ts`
    - **D-05: API Error Response Standardization
    - **Problem:** Inconsistent error shapes across API routes -- some return `{ error }`, others add `details`, `productName`, etc. Frontend must handle multiple formats.
    - **Solution:** Standardize all API error responses to:
      interface ApiError {
        error: string;       // always present
        code?: string;       // machine-readable code (e.g., "ITEM_UNAVAILABLE")
        details?: unknown;   // additional context
      }
    ```
    - **Files affected:** All `app/api/*/route.ts` files (verify-qr, resend-qr, checkout, webhook, magic-link)

    - **D-06: QR Verification for Completed Orders
    - **Problem:** When a customer scans an already-completed order QR code, API returns 409 "Order is not ready for pickup" -- confusing for staff who can't distinguish "not ready" from "already done".
    - **Solution:** Add explicit COMPLETED check before READY check in `verify-qr`:
      if (order.status === "COMPLETED") {
        return NextResponse.json({
          error: "Order already completed",
          status: order.status,
          alreadyCompleted: true
        }, { status: 200 });
      }
    ```
    - **Files affected:** `app/api/orders/verify-qr/route.ts`

    - **D-07: Rate Limiting for verify-qr Endpoint
    - **Problem:** Public endpoint with no auth, hits database. Malicious actor could brute-force random 64-char hex tokens.
    - **Solution:** Add rate limiting: 30 requests per minute per IP. Use existing `lib/ratelimit.ts` pattern.
    - **Files affected:** `app/api/orders/verify-qr/route.ts`

    - **D-08: QR Token Case Normalization
    - **Problem:** QR tokens are generated as lowercase hex, but if URL parsing produces uppercase, API returns 400 "Invalid QR token format".
    - **Solution:** Normalize token to lowercase in scanner before sending to API:
      token = url.searchParams.get('token')?.toLowerCase();
    }
    ```
    - **Files affected:** `app/(admin)/admin/scan/QRScanner.tsx`

    - **D-09: OrderStatusHistory Implementation
    - **Problem:** `OrderStatusHistory` model exists in schema but no code writes to it. Dead table.
    - **Solution:** Implement logging on every PATCH to `/api/admin/orders/[id]` when status changes:
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

    - **D-10: Database Index Changes
    - Add: `@@index([stripeSessionId])` on Order model -- webhook queries by this field.
    - Remove: `@@index([qrTokenExpiresAt])` -- expiration check happens after unique qrToken lookup, index adds write overhead with no read benefit.
    - **Files affected:** `prisma/schema.prisma`
    - **Claude's Discretion**
    - Floating-point precision for currency calculations (flagged by Claude as MEDIUM) -- defer to future phase if issues arise
    - Remove dead `showScanner` state in `app/(admin)/admin/scan/page.tsx` -- low priority cleanup
    - Environment variable validation at startup -- nice-to-have, not blocking
    - **Model exists but schema is prime candidate for context.md decisions**
        - Already match project's Prisma schema with `@@index` annotations
        - Existing patterns: Zod validation in server-side, Promise.allSettled for email, existing checkRateLimit pattern

        - Prisma transactions with serializable isolation for order creation
    - Stripe integration for hosted Checkout page
    - Magic link authentication (email-based)
    - Shared `ApiError` interface for consistent error handling

    - Rate limiting with Upstash Redis (existing pattern) for rate-limiting
 API routes
    - Webhook handler for payment confirmation
    - Admin order management (status updates)
    - QR verification endpoint
    - Magic link authentication
    - Checkout endpoint

- All bug fixes are targeted and follow established patterns and leverage existing solutions to maintain consistency.
 minimize risk of and ensure data integrity.

## Common Pitfalls
 (Based on Context.md and code review)

### Pitfall 1: Token Store Multi-Instance Failure
- **What goes wrong:** Deploying to Vercel without database-backed token store causes magic link verification to fail randomly when different instances handle requests.
    - **Why it happens:** Each Vercel serverless function instance has its memory isolated. Node.js module caching means `globalThis` persists in memory but is in the requests.
- **How to avoid:** Use Prisma-backed `VerificationToken` table. Delete tokens immediately after use to prevent accumulation. Schema already has this model.
 so, **Files affected:** `lib/auth.ts`
    - **Warning signs:** Magic link requests to admin email address failing after redeployment, increased latency under load

    - **Reference:** Upstash deployment docs, https://upstash.com/docs/ratelimit/overview/baset-on-serverless platforms, Prisma integration requires code changes, not configuration changes, not understanding of any existing model's relationships.

### Pitfall 2: Payment Status Not Updated (Stripe webhooks)
- **What goes wrong:** Orders remain in `PENDING` state forever, causing customer confusion and inaccurate records
 This might whether payment was successful
    - **Why it happens:** The oversight in webhook implementation; payment status update was simply forgotten
    - **How to avoid:** Add explicit `prisma.order.update()` call after order creation in webhook handler
    - **Warning signs:** Customers report "payment pending" when payment already completed, admin sees orders without payment status in dashboard
    - **Reference:** Stripe webhook documentation
 https://docs.stripe.com/webhooks

 **Files affected:** `app/api/webhook/route.ts`

### Pitfall 3: Payment Status Not Updated (Pay-on-pickup)
- **What goes wrong:** Orders using `PAY_ON_PICKUP` remain `PENDING` even after completion, making it unclear if payment was collected or track order revenue
 this is already.
    - **Why it happens:** Admin order PATCH handler updates status but does no coupling to update the payment status
    - **How to avoid:** In PATCH handler, when status changes to `COMPLETED` AND `paymentMethod === 'PAY_ON_PICKUP'`, auto-set `paymentStatus: 'PAID'` and `paidAt`
`
    - **Files affected:** `app/api/admin/orders/[id]/route.ts`
    - **Warning signs:** Admin forgets to update payment status when marking orders complete
    - **Reference:** Admin order workflow documentation

 **Files affected:** `app/api/admin/orders/[id]/route.ts`

### Pitfall 4: Error Prefix Mismatch
- **What goes wrong:** Checkout route catches `INSUFFICIENT_STOCK:` but `lib/orders.ts` throws `ITEM_UNAVAILABLE:`, Users get generic "Order failed" instead of specific "Out of stock: [Name]" message
    - **Why it happens:** Error message prefix mismatch between throw and and catch
 Current code uses different prefixes.
    - **How to avoid:** Change checkout route to check for `ITEM_UNAVAILABLE:` prefix (line ~173)
 to match the `lib/orders.ts` behavior
    - **Files affected:** `app/api/checkout/route.ts`
    - **Warning signs:** Users report "order failed" on generic error; when specific stock errors should occur

 can test by forcing an checkout flow or    - **Reference:** Checkout route implementation in `app/api/checkout/route.ts`

### Pitfall 5: API Error Response In Consistency
- **What goes wrong:** Different API routes return errors in different formats (`{ error }`, `{ error, message }`, `{ error, productName }`, etc.), making frontend error handling complex and brittle. Frontend must parse multiple response shapes to display appropriate user feedback.
    - **Why it happens:** No standard interface or different developers used different conventions over time.
    - **How to avoid:** Create a shared `ApiError` interface and use it consistently across all API routes:

interface ApiError {
  error: string;       // Human-readable message (always present)
  code?: string;       // Machine-readable code for programmatic handling (e.g., "ITEM_UNAVAILABLE")
  details?: unknown;   // Additional context
}
```

**Files affected:** All `app/api/*/route.ts` files

 see `app/api/checkout/route.ts`, for example

### Pitfall 6: QR Verification Confusing for Completed Orders
- **What goes wrong:** Scanning a completed order returns "Order is not ready for pickup" error when it order is actually completed, Staff cannot distinguish "not ready" from "already done"
, and it updates may confusing.
    - **Why it happens:** The READY check comes before the COMPLETED check, so it order is logic doesn't account for this case
    - **How to avoid:** Add explicit COMPLETED check before the READY check to return clearer message with `alreadyCompleted: true` flag
 this is **Files affected:** `app/api/orders/verify-qr/route.ts`
    - **Warning signs:** Staff scan orders that they result in "Order is not ready for pickup" when they are already completed. Consider adding logging to track completion events.

    - **Reference:** Admin QR scanner code review

### Pitfall 7: Rate Limiting B Missing on Public Endpoint
- **What goes wrong:** No rate limiting on `verify-qr` endpoint, which could vulnerable to brute-force attacks
 - **Why it happens:** The endpoint is public with no authentication, making it accessible to anyone with the network access. Rate limiting was overlooked or security concern were    - **How to avoid:** Use existing `checkRateLimit()` function from `lib/ratelimit.ts` with 30 requests per minute per IP configuration. Add IP extraction helper for `verify-qr` route.
    - **Files affected:** `app/api/orders/verify-qr/route.ts`,    - **Warning signs:** High request volume from single IP without warning; check Vercel logs for `X-RateLimit-Limit` headers being 429 responses
    - **Reference:** Upstash Rate Limiting docs
 https://upstash.com/docs/ratelimit/getting-start

 **Files affected:** `app/api/orders/verify-qr/route.ts`

### Pitfall 8: Case-Sensitivity in QR Scanner
- **What goes wrong:** If URL parsing produces uppercase hex, API returns 400 "Invalid QR token format" even though tokens are generated as lowercase
    - **Why it happens:** URL parsing can produce uppercase, environment variable (e.g., on server) or URL parsing can normalize case sensitivity.    - **How to avoid:** Normalize token to lowercase before sending to API:
      token = url.searchParams.get('token')?.toLowerCase()
    }
    ```
    - **Files affected:** `app/(admin)/admin/scan/QRScanner.tsx`
    - **Warning signs:** Scanner fails on verify QR codes with uppercase tokens in error message
    - **Reference:** Admin scan page code review, CONTEXT.md

### Pitfall 9: Dead OrderStatusHistory Table
- **What goes wrong:** The `OrderStatusHistory` model exists in schema but no code writes to it, leading to dead table that doesn't serve a purpose
    - **Why it happens:** Feature was implemented but forgotten; developers assumed it was just history would
 added but never used it
    - **How to avoid:** Add implementation on every status change in admin order PATCH route
 await prisma.orderStatusHistory.create({
  data: {
    orderId: order.id,
    oldStatus: previousStatus,
    newStatus: newStatus,
    changedBy: session.user.email,
    changedAt: new Date()
  })
});
 ```
`

- **Files affected:** `app/api/admin/orders/[id]/route.ts`
    - **Warning signs:** Status history table remains empty despite status changes being logged
    - **Reference:** Admin order management code review, CONTEXT.md D-09

## Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|------|
| In-memory token store | `lib/auth.ts` Map with `globalThis` | Prisma `VerificationToken` table | Cross-instance compatibility, race conditions, token enumeration attacks, Must DB query with unique constraints | VerificationToken already exists - simple `create`/`update`/`delete` pattern already in Prisma official docs | HIGH confidence) |
 Rate limiting | `app/api/orders/verify-qr/route.ts` | None (use `checkRateLimit()` from `lib/ratelimit.ts`) | Upstash Redis | Upstash with in-memory fallback | 30 req/min/IP, brute-force protection | HIGH confidence) |
 API error standardization | `app/api/*/route.ts` files | Already use Zod for validation | Most return `{ error, code?: string, details?: unknown }` | No consistent shape across routes, makes frontend error handling complex and brittle | `lib/orders.ts` throws typed errors | Verify code only checks for `INSUFFICIENT_STOCK:` prefix, `lib/checkout/route.ts` checks for wrong prefix | Simple string prefix fix, `lib/orders.ts` throws `ITEM_UNAVAILABLE:${productName}`            Checkout route should check for `INSUFFICIENT_STOCK` prefix, more helpful error messages to users | using Context7, official Prisma docs (HIGH confidence) |
 Stripe webhook payment updates | `app/api/webhook/route.ts` | After order creation, update `paymentStatus`, `paidAt`, `paidAmount` via `prisma.order.update()` | Prisma official docs (HIGH confidence)            Payment status on pay-on-pickup | `app/api/admin/orders/[id]/route.ts` | When status changes to `COMPLETED` AND `paymentMethod === 'PAY_ON_PICKUP'`, auto-set `paymentStatus: 'PAID'` and `paidAt` | Prisma official docs (HIGH confidence)            QR verification improvements | `app/api/orders/verify-qr/route.ts` | Add explicit `COMPLETED` check before `READY`, add rate limiting, improve error handling | These topic are already well-documented in the codebase. The research identified targeted implementation patterns that best practices, and potential pitfalls.

 The fixes are all localized to specific files with clear ownership boundaries established. No new dependencies required, Implementation is primarily involves modifying to existing code in `lib/auth.ts`, and `app/api/webhook/route.ts`, `app/api/checkout/route.ts`, `app/api/admin/orders/[id]/route.ts`, `app/api/orders/verify-qr/route.ts`, and the `app/(admin)/admin/scan/QRScanner.tsx`. Finally, a Prisma migration for needed for database index changes.

 Testing is optional but recommended. Manual verification through the like database queries or UI checks are sufficient.

 The phase covers reactive bug fixing from code reviews, with no new features added.

## Validation Architecture

This section is not applicable - no test infrastructure exists in the codebase. Testing would be performed manually through the like UI testing, database queries, or API response verification.

 review of the reports.

### Wave 0 Gaps
- `tests/` directory does does (no tests exist)
- `vitest.config.*` or `jest.config.*` (no config files)
- Framework install: not detected
- Shared fixtures: Not applicable (no conftest file)
- Test coverage: No automated tests cover any requirements. Manual verification is recommended.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Prisma and Upstash well are established, documented with verification
 version checks
- Architecture patterns: HIGH - Existing codebase patterns well-documented, Context.md provides specific solutions
- Pitfalls: HIGH - Derived from cross-AI code review, documented with specific root causes and fixes
- Code examples: HIGH - Based on existing codebase and official documentation

- Research date: 2026-03-26
- Valid until: 2026-04-26 (30 days - stable codebase)

