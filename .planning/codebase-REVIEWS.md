---
phase: "codebase"
reviewers: [claude-self]
reviewed_at: 2026-03-26T00:00:00Z
plans_reviewed: ["full-codebase"]
---

# Cross-AI Codebase Review — Essa Cafe (ShopSeeds)

## Summary

The codebase is in reasonably good shape for a Phase 2.1 launch. The QR scanner integration is well-designed with proper SSR handling, the database schema supports all documented features, and the API routes follow consistent patterns. However, there are several meaningful issues that should be addressed before going to production.

---

## Critical Issues (Must Fix Before Production)

### 1. [HIGH] `verify-qr` doesn't check if order is already completed

**File**: `app/api/orders/verify-qr/route.ts` (line 59-67)

```typescript
if (order.status !== "READY") {
  return NextResponse.json(
    { error: "Order is not ready for pickup", status: order.status },
    { status: 409 }
  );
}
```

**Problem**: An order that was previously scanned and marked COMPLETED can still be scanned again. The QR code is valid for 7 days, so a customer could present an already-fulfilled QR code and the scanner would return a 409 "not ready" — but the order is actually already done. The staff has no way to distinguish "not ready yet" from "already completed."

**Fix**: Add a `COMPLETED` check before the `READY` check:
```typescript
if (order.status === "COMPLETED") {
  return NextResponse.json(
    { error: "Order already completed", status: order.status, alreadyCompleted: true },
    { status: 200 }  // or 409 with a flag
  );
}
if (order.status !== "READY") { ... }
```

---

### 2. [HIGH] Stripe webhook doesn't send order-ready email

**File**: `app/api/webhook/route.ts` (lines 95-99)

```typescript
await Promise.allSettled([
  sendOrderConfirmation(orderWithItems),
  sendAdminNewOrderNotification(orderWithItems),
]);
```

**Problem**: When a Stripe order is created via webhook, it sends `sendOrderConfirmation` and `sendAdminNewOrderNotification` — but NOT `sendOrderReadyEmail`. The QR code for pickup is only generated when the admin changes status to READY (via `PATCH /api/admin/orders/[id]`), which is correct. So this is actually fine — the order confirmation says "your order is confirmed" and the READY email with QR comes later.

**Verdict**: NOT A BUG. The flow is correct. Stripe payment → order created as NEW → admin marks READY → QR email sent. However, the admin notification email should clarify that the QR code will come in a separate email when the order is ready.

---

### 3. [HIGH] QR token format mismatch between scanner and API

**File**: `app/(admin)/admin/scan/QRScanner.tsx` (lines 26-37) vs `app/api/orders/verify-qr/route.ts` (line 6)

**Scanner** accepts both full URL (`?token=xxx`) and raw tokens:
```typescript
if (decodedText.includes('?token=')) {
  const url = new URL(decodedText);
  token = url.searchParams.get('token');
} else if (decodedText.startsWith('http')) {
  // URL without token param
  ...
} else {
  token = decodedText.trim();
}
```

**API** requires 64-char lowercase hex: `z.string().min(64).max(64).regex(/^[a-f0-9]+$/)`

**Problem**: If a raw token is scanned but has any uppercase characters, the API returns a 400 with "Invalid QR token format". The QR token is generated as hex lowercase (`crypto.randomBytes(32).toString("hex")`), so this should always be lowercase. However, if the URL is scanned from a device that normalizes casing, this could fail. More critically: if any part of the URL parsing chain produces an uppercase token, verification fails silently with a format error rather than an "invalid token" error.

**Recommendation**: Add `.toLowerCase()` when extracting the token from URL params in the scanner:
```typescript
token = url.searchParams.get('token')?.toLowerCase();
```

---

### 4. [HIGH] `resend-qr` allows resend for NEW orders (but should require READY or COMPLETED)

**File**: `app/api/orders/resend-qr/route.ts` (lines 88-94)

```typescript
if (order.status !== "READY" && order.status !== "COMPLETED") {
  return NextResponse.json(
    { error: `Cannot resend QR code for order with status: ${order.status}` },
    { status: 409 }
  );
}
```

**This is correct** — it prevents QR codes from being sent before orders are ready. However, there's a related issue: `resend-qr` is a `POST` that **does not** update the `status` field. If an order was NEW and somehow got changed to READY without a QR being generated (e.g., a direct DB update), the QR could be resent. This is unlikely but worth noting.

**Verdict**: No bug, but the status check should be documented.

---

## Medium Issues

### 5. [MEDIUM] No rate limiting on `verify-qr` endpoint

**File**: `app/api/orders/verify-qr/route.ts`

**Problem**: This endpoint is public (no auth required) and hits the database. A malicious actor could brute-force scan random 64-char hex strings and cause unnecessary DB load.

**Fix**: Add rate limiting similar to `lib/ratelimit.ts`:
```typescript
// After token validation
const { success } = await checkRateLimit(`verify-qr:${ip}`, 30, 60 * 1000);
if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
```

---

### 6. [MEDIUM] Race condition in `OrderNumberCounter` upsert

**File**: `lib/orders.ts` (lines 11-18)

```typescript
const result = await tx.$queryRaw<{ next_val: number }[]>`
  INSERT INTO "OrderNumberCounter" ("id", "lastNumber")
  VALUES (1, 1)
  ON CONFLICT ("id")
  DO UPDATE SET "lastNumber" = "OrderNumberCounter"."lastNumber" + 1
  RETURNING "lastNumber" as next_val
`;
```

**Problem**: Two concurrent requests could read the same `lastNumber`, both increment to the same value, and return duplicate order numbers (ORD-001, ORD-001). The `ON CONFLICT DO UPDATE` is atomic at the row level, but the `RETURNING` happens after the update is applied — however, Prisma's `$queryRaw` with template literals may not guarantee the RETURNING sees the post-update value in all isolation levels.

**Fix**: Use `SELECT FOR UPDATE` to lock the row during the transaction, or use PostgreSQL's `nextval()` on a sequence. The current `Serializable` isolation level should protect this, but it's worth verifying with a load test.

---

### 7. [MEDIUM] `showScanner` state is defined but never used

**File**: `app/(admin)/admin/scan/page.tsx` (line 129)

```typescript
const [scannedToken, setScannedToken] = useState<string | null>(null);
const [showScanner, setShowScanner] = useState(true);  // <-- never used
```

**Problem**: `showScanner` is set in `handleScan` but the state management only checks `scannedToken`. The `showScanner` state is dead code.

**Fix**: Remove `showScanner` state since it's not needed — the scanner is always visible when no token is present, and disappears when a token is scanned. The `scannedToken !== null` check is sufficient.

---

### 8. [MEDIUM] Missing `paymentStatus` updates in webhook

**File**: `app/api/webhook/route.ts`

**Problem**: When a Stripe order is created via webhook, `paymentStatus` is not set. The schema has `paymentStatus PaymentStatus @default(PENDING)` but the webhook and checkout routes never update it to `PAID`. For Stripe orders, this should be set to `PAID` when the `checkout.session.completed` event fires.

**Fix**: Add to webhook after order creation:
```typescript
await prisma.order.update({
  where: { id: order.id },
  data: { paymentStatus: "PAID", paidAt: new Date() },
});
```

---

### 9. [MEDIUM] `paymentStatus` update missing for PAY_ON_PICKUP

**File**: `app/api/checkout/route.ts` (lines 100-103)

When a PAY_ON_PICKUP order is created, `paymentStatus` remains `PENDING`. Since the customer hasn't paid yet, this is correct — but when the order is later marked COMPLETED, does `paymentStatus` get updated to reflect that payment was received (cash/card at pickup)? There's no code path that updates `paymentStatus` when an admin marks a PAY_ON_PICKUP order as COMPLETED.

**Recommendation**: Document whether `paymentStatus` for PAY_ON_PICKUP should be updated manually by admin or automatically when status becomes COMPLETED.

---

## Low Issues

### 10. [LOW] `ScannerContainer` is imported but `ScannerContainer.tsx` wasn't read in plan

**File**: `app/(admin)/admin/scan/page.tsx` (line 10)

The plan (02.1-03-PLAN.md) references `ScannerContainer` but the actual `ScannerContainer.tsx` file content wasn't verified before writing the plan. However, the file exists and follows the expected pattern. No action needed.

---

### 11. [LOW] Inconsistent error response format

**File**: Multiple API routes

- `verify-qr` returns `{ error: string }` with different status codes (400, 404, 409, 410, 500)
- `resend-qr` returns `{ error: string }` or `{ error: string, details: [...] }`
- `magic-link` catches all errors and returns `{ success: true }` (intentional — prevents email enumeration)
- `checkout` returns `{ error: string, message?: string }` or `{ error: string, productName?: string }`

**Problem**: Frontend error handling must know which fields to expect. The `VerificationError` interface in `page.tsx` uses `{ error: string; status?: OrderStatus }` but the API may return additional fields.

**Recommendation**: Standardize error response shape:
```typescript
interface ApiError {
  error: string;       // always present
  code?: string;       // machine-readable code
  details?: unknown;   // additional context
}
```

---

### 12. [LOW] `qrTokenExpiresAt` index exists but is never queried

**File**: `prisma/schema.prisma` (line 71)

```prisma
@@index([qrTokenExpiresAt])
```

**Problem**: The index is on `qrTokenExpiresAt` but the only place this field is used is in the `verify-qr` route checking `qrTokenExpiresAt < new Date()`. A single-row lookup by `qrToken` (which is `unique`) doesn't need this index. The index adds write overhead with no read benefit.

**Recommendation**: Remove the `@@index([qrTokenExpiresAt])` index — the expiration check happens after the unique `qrToken` lookup, so no index is needed.

---

### 13. [LOW] `handleScan` has stale closure in useEffect dependency

**File**: `app/(admin)/admin/scan/QRScanner.tsx` (lines 21-53, 139)

The `handleScan` function is defined with `useCallback` and passed `onScan` and `onError` as dependencies. However, `handleScan` is also called inside the `useEffect` that initializes the scanner. The `useEffect` depends on `[handleScan, onError]`, which is correct — but if `onError` changes identity between renders (not memoized in the parent), the scanner would re-initialize.

**Verdict**: Not a bug in practice since `onError` from `ScanPageContent` is a stable `useCallback`, but the coupling is fragile.

---

### 14. [LOW] `lib/validators.ts` phone optional but frontend may not validate

**File**: `lib/validators.ts` (line 9)

```typescript
guestPhone: z.string().min(10, "Phone must be at least 10 digits").optional().or(z.literal("")),
```

**Problem**: Phone is optional in the validator. The frontend may or may not enforce the 10-digit minimum. If a customer enters a 3-digit phone, it passes validation but is useless for pickup coordination.

---

## QR Flow Analysis

The complete QR token lifecycle:

1. **Order created** → No QR token yet (status=NEW, PAY_ON_PICKUP or via webhook for STRIPE)
2. **Admin marks READY** → `generateQRToken()` called, token stored in `Order.qrToken`, `qrTokenExpiresAt` set (7 days), `sendOrderReadyEmail` fires with QR attached
3. **Customer scans QR** → camera → `Html5QrcodeScanner` → URL parsing → `GET /api/orders/verify-qr?token=xxx`
4. **API verifies** → finds order by `qrToken`, checks expiry, checks status is READY, returns order details
5. **Staff sees order** → marks COMPLETED via `PATCH /api/admin/orders/[id]` with `status: COMPLETED`
6. **Customer scans again** → gets 409 "Order is not ready" (should be "already completed")

**Flow is correct** except for issue #1 (already-completed orders not distinguished).

---

## Schema ↔ Code Consistency

| Schema Field | Used In | Notes |
|---|---|---|
| `Order.qrToken` | verify-qr, resend-qr, admin orders PATCH | OK |
| `Order.qrTokenExpiresAt` | verify-qr | OK |
| `Order.paymentStatus` | Not updated anywhere after creation | BUG - should be set to PAID on webhook |
| `OrderNumberCounter` | lib/orders.ts | OK |
| `OrderStatusHistory` | Not written anywhere | Dead field? Should track status changes |
| `Order.paidAt` | Not set anywhere | BUG - should be set on Stripe payment |

---

## Recommendations (Priority Order)

1. **[MUST]** Fix `verify-qr` to distinguish COMPLETED orders from NEW/READY orders
2. **[MUST]** Add `paidAt` and `paymentStatus: PAID` update in Stripe webhook
3. **[SHOULD]** Add rate limiting to `verify-qr` endpoint
4. **[SHOULD]** Add `.toLowerCase()` to token extraction in QRScanner
5. **[SHOULD]** Verify race condition in `OrderNumberCounter` with load test
6. **[SHOULD]** Remove dead `showScanner` state
7. **[NICE]** Remove unused `@@index([qrTokenExpiresAt])`
8. **[NICE]** Standardize API error response format
9. **[NICE]** Document/update `paymentStatus` for PAY_ON_PICKUP lifecycle
10. **[NICE]** Consider adding `OrderStatusHistory` entries for audit trail
