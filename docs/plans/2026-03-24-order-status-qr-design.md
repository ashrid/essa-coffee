# Order Status Notifications + QR Pickup Implementation Plan

## Overview
Implement smart email notifications on status changes and QR code pickup flow for in-person order completion.

---

## Phase 1: Database Migration

### File: `prisma/migrations/20260324150000_add_qr_token/migration.sql`
```sql
-- Add QR token fields to Order table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "qrToken" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "qrTokenExpiresAt" TIMESTAMP(3);

-- Create index for QR token lookups
CREATE INDEX IF NOT EXISTS "Order_qrToken_idx" ON "orders"("qrToken");
```

### File: `prisma/schema.prisma`
**Modify** Order model to add:
```prisma
model Order {
  // ... existing fields ...
  qrToken          String?   // QR code verification token
  qrTokenExpiresAt DateTime? // Token expiration (7 days from generation)
  // ...
}
```

---

## Phase 2: Email Components

### File: `components/emails/OrderReadyEmail.tsx` (NEW)
- Display QR code image prominently
- Order details summary
- Pickup instructions
- "Track Order" button linking to `/order-status?order={orderNumber}`

### File: `components/emails/OrderStatusUpdateEmail.tsx` (NEW)
- Reusable for CANCELLED and REFUNDED statuses
- Status-specific messaging and color coding
- Order summary
- Support contact info

### File: `lib/email.ts`
**Add functions:**
- `sendOrderReadyEmail()` — sends QR email when status→READY
- `sendOrderStatusUpdateEmail()` — sends update for cancelled/refunded
- `generateQRToken()` — creates secure random token

**Modify:**
- `sendOrderConfirmation()` — add Track Order link

---

## Phase 3: API Routes

### File: `app/api/orders/verify-qr/route.ts` (NEW)
**GET** `/api/orders/verify-qr?token=xxx`
- Validate token exists and not expired
- Check order status is READY
- Return order details (safe subset)
- Error: 401 if invalid/expired, 400 if wrong status

### File: `app/api/orders/resend-qr/route.ts` (NEW)
**POST** `/api/orders/resend-qr`
Body: `{ orderId: string }`
- Auth required (admin only)
- Generate new QR token (invalidates old)
- Send fresh OrderReadyEmail
- Return success/error

### File: `app/api/admin/orders/[id]/route.ts`
**Modify PATCH handler:**
- When status changes to READY:
  - Generate new qrToken (crypto.randomBytes)
  - Set qrTokenExpiresAt = now + 7 days
  - Call sendOrderReadyEmail()
- When status changes to CANCELLED/REFUNDED:
  - Call sendOrderStatusUpdateEmail()
- Clear qrToken when status→COMPLETED (optional cleanup)

---

## Phase 4: Admin Scan Page

### File: `app/(admin)/admin/scan/page.tsx` (NEW)
Mobile-optimized scan handler:
- Read `?token=xxx` from URL
- Call `/api/orders/verify-qr` to validate
- Display order summary card:
  - Order number (large)
  - Customer name
  - Items list (condensed)
  - Total amount
- Big green "MARK AS COMPLETED" button
- Calls PATCH `/api/admin/orders/{id}` to set COMPLETED
- On success: redirect back to `/admin/scan` (empty, ready for next)
- Error states: invalid token, expired, already completed

---

## Phase 5: Admin Order Detail Updates

### File: `app/(admin)/admin/orders/[id]/page.tsx`
**Add:**
- "Resend QR Email" button (visible when status is READY)
- Display QR token status (valid/expired/none)
- Link to scan page for testing

---

## Phase 6: Email Template Updates

### File: `components/emails/OrderConfirmationEmail.tsx`
**Add:**
- "Track Your Order" button
- Link: `/order-status?order={orderNumber}`

---

## Implementation Order

1. **Database** — Migration + schema update
2. **Email lib** — Add token generation + new email functions
3. **Email components** — OrderReadyEmail + OrderStatusUpdateEmail
4. **API** — verify-qr route
5. **API** — resend-qr route
6. **API** — Modify admin orders PATCH for QR generation
7. **Page** — Admin scan page
8. **Admin UI** — Resend button + QR status display
9. **Update** — OrderConfirmationEmail with tracking link
10. **Test** — Full flow end-to-end

---

## QR Token Security

- Token: 32 bytes from crypto.randomBytes, hex encoded
- Expires: 7 days from generation
- One token per order (new token invalidates old)
- Token only works when order.status === READY
- No sensitive data in QR URL (just token)

---

## Dependencies

- `qrcode` — generate QR code images (for email)
- `@react-email/components` — already installed

Install:
```bash
npm install qrcode
npm install -D @types/qrcode
```
