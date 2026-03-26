<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
[Copy verbatim from CONTEXT.md ## Decisions]
### D-01: Token Store Migration
- **Problem:** In-memory `globalThis.tokenStore` in `lib/auth.ts` fails in multi-instance deployments (Vercel serverless). magic links created on instance A cannot be verified on instance B.
- **Solution:** Migrate to PostgreSQL `VerificationToken` table (already exists in schema but unused).
 token lifecycle: Delete token immediately after successful verification ( no accumulation).
)
- **Files affected:** `lib/auth.ts`, `prisma/schema.prisma` (model exists)

    - `lib/db.ts` (prisma client singleton)

### D-02: Payment status updates (Stripe)
- **Problem:** Stripe webhook creates orders with `paymentStatus: PENDING` and never updates to `paidAt` and `paidAmount`. also missing `paidAt`/`paidAmount` fields on Order schema.
.
- **Solution:** After order creation, update `paymentStatus` to `PAID` and `paidAt`, and `paidAmount`:

:
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

### D-03: Payment status updates (Pay-on-pickup)
- **Problem:** PAY-on-pickup orders remain `PENDING` even after payment collected at pickup.
 but `paymentStatus` should auto-set to `PAID` with `paidAt` at.
 tracking.
- **Solution:** In `app/api/admin/orders/[id]/route.ts` PATCH handler, when status changes to `COMPLETED` and `paymentMethod === 'PAY_ON_PICKUP'`, auto-set `paymentStatus: 'PAID'`, `paidAt: new Date()`, and `paidAmount` from the session.
 order amounts.
  });
  ```

- **Files affected:** `app/api/admin/orders/[id]/route.ts`

### D-04: Error message prefix mismatch
- **Problem:** `lib/orders.ts` throws `ITEM_UNAVAILABLE:[productName]` but `app/api/checkout/route.ts` checks for `INSUFFICIENT_STOCK:` prefix — wrong prefix
- **Solution:** Change prefix to `ITEM_UNAVAILABLE:` in checkout route
 lines ~173-179.

  const productName = error.message.replace("ITEM_UNAVAILABLE:", "");
  return NextResponse.json(
    { error: "Out of stock", productName, status: 409 }
  );
}

    // else generic error
    return NextResponse.json({ error: "Order failed" }, { status: 500 });
  }
}
```

- **Files affected:** `app/api/checkout/route.ts`, `lib/orders.ts`, `lib/validators.ts`

### D-05: API error response standardization
- **Problem:** Inconsistent error shapes across API routes — some return `{ error }`, others add `details`, `productName`, etc. Frontend must to handle multiple formats.
- **Solution:** Standardize all API routes to a unified `ApiError` interface:
 see code example in CONTEXT.md.
 and optionally create a helper function `createApiError()` for cleaner construction and better error responses
- **Files affected:** all `app/api/*/route.ts` files

### D-06: QR verification for completed orders
- **Problem:** When scanning already-completed order QR codes, confusing 409 "not ready for pickup" instead of "already completed"
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

  // Check is handled elsewhere
 return 409

- **Files affected:** `app/api/orders/verify-qr/route.ts`

### D-07: Rate limiting for verify-qr endpoints
- **Problem:** Public endpoint with no auth, hits database, brute-force attacks are possible.
- **Solution:** Add rate limiting using existing `lib/ratelimit.ts` pattern
    - 30 requests per minute per IP
 Use `checkRateLimit(`verify-qr:${ip}`, 30, 60_000)` (30 minutes)
    if (!success) {
      return NextResponse.json({ error: "Too many requests. }, { status: 429 });
    }
    // Otherwise, return generic 200 error
  }
  ```

  // Check order status is READY for pickup
  if (order.status === "READY") return 409.
 NextResponse.json({
    error: "Order is not ready for pickup",
    status: order.status,
    readyForPickup: order.status === "READY"
  };
 `status` fields on `qrToken` only)
  // Payment collected at pickup - update status and COMpleted -> paid
 plus `paidAt`/`paidAmount`
  // The fields are the status history, read current status before updating
  const wasStatusHistory = await prisma.orderStatusHistory.create({
    data: {
      orderId,
      oldStatus,
      newStatus,
      changedBy: session?.user?.email ?? "system",
      changedAt: new Date()
    }
  });
  // Audit log + timestamp
  });
 re-verify
});
 ```
- **Files affected:** `app/api/orders/verify-qr/route.ts`, `app/(admin)/admin/scan/QRScanner.tsx`

### D-08: Case normalization for QR tokens
- **Problem:** QR tokens may generated as lowercase hex but but if URL parsing produces uppercase, the API returns 400 "Invalid QR token format"
- **Solution:** Normalize token to lowercase in scanner before sending to API
      ```typescript
      token = url.searchParams.get('token')?.toLowerCase();
      onScan(token);
    }
  }
  ```

- **Files affected:** `app/(admin)/admin/scan/QRScanner.tsx`, `prisma/schema.prisma`

### D-10: database index changes
- **Add:** `@@index([stripeSessionId])` on Order model — webhook queries by this field
- **Remove:** `@@index([qrTokenExpiresAt])` -- expiration check happens after unique qrToken lookup, index adds write overhead with no read benefit
    - **Files affected:** `prisma/schema.prisma`
