---
phase: 01-core-mvp
plan: "04"
subsystem: checkout
tags: [stripe, payments, checkout, orders, webhook]
dependency_graph:
  requires: ["01-02", "01-03"]
  provides: ["checkout-api", "webhook", "order-confirmation"]
  affects: []
tech_stack:
  added: ["stripe", "react-hook-form", "@hookform/resolvers"]
  patterns: ["Serializable transactions", "Webhook signature verification", "Idempotency checks"]
key_files:
  created:
    - lib/stripe.ts
    - lib/orders.ts
    - app/api/checkout/route.ts
    - app/api/webhook/route.ts
    - components/checkout/CheckoutStepContact.tsx
    - components/checkout/CheckoutStepPayment.tsx
    - app/(store)/checkout/page.tsx
    - app/(store)/order-confirmation/page.tsx
    - components/ui/textarea.tsx
  modified: []
decisions:
  - "Use Stripe Checkout hosted page instead of custom payment form (PCI compliance)"
  - "Serializable isolation level for atomic inventory deduction prevents overselling"
  - "Webhook creates order after payment confirmation (STRIPE path)"
  - "Pay-on-pickup creates order immediately (no payment to confirm)"
  - "Idempotency check via stripeSessionId prevents duplicate orders"
  - "Prices always fetched from DB, never trust client-submitted prices"
metrics:
  duration: "18 min"
  completed_date: "2026-02-17"
  tasks: 2
  files: 9
---

# Phase 1 Plan 04: Checkout Flow Summary

**One-liner:** 2-step checkout with Stripe Checkout integration, pay-on-pickup option, atomic inventory deduction, and webhook confirmation.

## What Was Built

### Backend (Task 1)

**lib/stripe.ts** — Stripe client singleton with 2025-02-24.acacia API version.

**lib/orders.ts** — Shared `createOrderAtomically` function using Prisma Serializable transactions:
- Verifies stock availability for each item
- Calculates total from DB prices (never client prices)
- Creates order with items in single transaction
- Deducts stock atomically
- Throws `INSUFFICIENT_STOCK:productName` on insufficient inventory

**app/api/checkout/route.ts** — POST endpoint handling both payment paths:
- **PAY_ON_PICKUP:** Creates order immediately, returns `{ success, orderId, orderNumber }`
- **STRIPE:** Creates Stripe Checkout Session, returns `{ success, checkoutUrl }`
- Validates input with Zod (checkoutContactSchema + items array)
- Returns 409 on insufficient stock, 400 on validation errors

**app/api/webhook/route.ts** — Stripe webhook handler:
- Verifies webhook signature with `stripe.webhooks.constructEvent`
- Idempotency check: skips if order with `stripeSessionId` already exists
- Parses metadata, fetches current prices from DB
- Calls `createOrderAtomically` for inventory-safe order creation
- Updates order with `stripeSessionId` after creation
- Returns 500 on failure (triggers Stripe retry)

### Frontend (Task 2)

**components/checkout/CheckoutStepContact.tsx** — Step 1 form:
- React Hook Form with Zod resolver
- Fields: Full Name (required), Email (required), Phone (optional), Notes (optional)
- Inline validation errors
- "Continue to Payment" button

**components/checkout/CheckoutStepPayment.tsx** — Step 2 form:
- Pickup info summary with store address and hours
- Order summary with cart items and subtotal
- Payment method radio buttons (Pay now with card / Pay on pickup)
- Loading state with spinner
- "Place Order" and "Back" buttons

**app/(store)/checkout/page.tsx** — Checkout page:
- Step indicator (1 — Contact Details | 2 — Payment)
- "Pickup only — no shipping" badge
- Redirects to cart if empty
- Handles PAY_ON_PICKUP: clears cart, redirects to confirmation
- Handles STRIPE: redirects to Stripe hosted checkout
- Shows toast error on out of stock

**app/(store)/order-confirmation/page.tsx** — Confirmation page (Server Component):
- Supports both `orderId` (pay-on-pickup) and `session_id` (Stripe) params
- Shows "Processing" state with auto-refresh for pending Stripe orders
- Order not found state with helpful message
- Displays: order number, items, total, payment method
- Pickup details: address, hours
- "Continue Shopping" link

**components/ui/textarea.tsx** — shadcn Textarea component for order notes.

## Key Design Decisions

### Payment Flow Architecture

| Path | When Order Created | When Stock Deducted |
|------|-------------------|---------------------|
| PAY_ON_PICKUP | Immediately at checkout | During order creation |
| STRIPE | After webhook confirmation | During webhook processing |

### Security Measures

1. **Server-side price validation:** Prices always fetched from DB, never trust client
2. **Serializable transactions:** Prevents race conditions and overselling
3. **Webhook signature verification:** Ensures events are from Stripe
4. **Idempotency:** `stripeSessionId` unique constraint prevents duplicate orders
5. **Zod validation:** All inputs validated server-side

### Error Handling

- **409 Conflict:** Insufficient stock (shows product name in toast)
- **400 Bad Request:** Validation failure (Zod issues returned)
- **500 Server Error:** Unexpected errors (logged, generic message to user)
- **Webhook 500:** Triggers Stripe retry for failed order creation

## Environment Variables Required

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Verification Steps

1. **Pay-on-pickup flow:**
   - Add item to cart → /checkout
   - Fill contact info → Continue
   - Select "Pay on pickup" → Place Order
   - Redirect to confirmation with order number
   - Cart cleared

2. **Stripe flow (requires keys):**
   - Same checkout flow, select "Pay now with card"
   - Redirect to Stripe Checkout
   - Use test card 4242 4242 4242 4242
   - Redirect back to confirmation
   - Webhook creates order (use `stripe listen --forward-to localhost:3000/api/webhook`)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] lib/stripe.ts exists
- [x] lib/orders.ts exists
- [x] app/api/checkout/route.ts exists
- [x] app/api/webhook/route.ts exists
- [x] components/checkout/CheckoutStepContact.tsx exists
- [x] components/checkout/CheckoutStepPayment.tsx exists
- [x] app/(store)/checkout/page.tsx exists
- [x] app/(store)/order-confirmation/page.tsx exists
- [x] components/ui/textarea.tsx exists
- [x] Commit 19eb985 exists (Task 1)
- [x] Commit 0fba47d exists (Task 2)
