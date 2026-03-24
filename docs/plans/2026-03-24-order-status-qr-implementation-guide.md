# Order Status Notifications + QR Pickup — Expanded Implementation Guide

## Critical Implementation Details & Risk Mitigation

---

## Phase 1: Database Migration

### Schema Changes

**File:** `prisma/schema.prisma`

```prisma
model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique @default(cuid())
  guestName       String
  guestEmail      String
  guestPhone      String?
  guestNotes      String?
  pickupTime      DateTime?
  status          OrderStatus   @default(NEW)
  paymentMethod   PaymentMethod @default(PAY_ON_PICKUP)
  stripeSessionId String?
  total           Decimal       @db.Decimal(10, 2)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // NEW FIELDS
  qrToken          String?   // QR code verification token
  qrTokenExpiresAt DateTime? // Token expiration (7 days from generation)

  items OrderItem[]

  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@index([qrToken]) // NEW: Index for QR token lookups
  @@map("orders")
}
```

### Migration Commands

```bash
# Create migration without applying (safe approach)
npx prisma migrate dev --create-only --name add_qr_token_fields

# Review generated SQL in prisma/migrations/YYYYMMDD_HHMMSS_add_qr_token_fields/migration.sql
# Then apply:
npx prisma migrate dev

# Generate Prisma Client with new types
npx prisma generate
```

### Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Migration fails on production | Always use `--create-only` first, review SQL, test on staging |
| Existing orders break | New fields are nullable (`String?`), existing orders remain valid |
| Index creation locks table | PostgreSQL creates indexes concurrently by default in Prisma |

---

## Phase 2: Email Library Functions

### Dependencies

```bash
npm install qrcode
npm install -D @types/qrcode
```

### QR Token Generation

**Key security requirements:**
- Use `crypto.randomBytes(32)` for 64-character hex token
- Expires: 7 days (`Date.now() + 7 * 24 * 60 * 60 * 1000`)
- One token per order (new token invalidates old)
- Token only works when `order.status === 'READY'`

### Risk Mitigation for Email Functions
| Risk | Mitigation |
|------|------------|
| QR token predictable | Use `crypto.randomBytes` not `Math.random()` |
| Email fails, customer has no QR | Provide "Resend QR" admin function |
| QR token in logs | Never log full token, only truncated prefix for debugging |
| Email service down | All email functions are non-blocking (try/catch with console.error) |

---

## Phase 3: React Email Components

### OrderReadyEmail.tsx Structure

Based on existing email patterns in the codebase:

```tsx
// Components needed:
// - Container, Section, Text, Button from @react-email/components
// - QR code as <img> with data URL
// - Order summary table
// - Pickup instructions
// - Track Order button → /order-status?order={orderNumber}
```

### QR Code Generation Pattern

```typescript
import QRCode from 'qrcode';

// Generate QR data URL for embedding in email
const qrDataUrl = await QRCode.toDataURL(
  `${baseUrl}/admin/scan?token=${qrToken}`,
  {
    width: 400,
    margin: 2,
    color: {
      dark: '#166534',  // Match Essa Cafe green theme
      light: '#ffffff',
    },
  }
);
```

### Risk Mitigation
| Risk | Mitigation |
|------|------------|
| QR code too small to scan | Minimum 400px width, test with actual phone camera |
| Email clients block images | Always include plaintext fallback URL below QR image |
| QR code expires too soon | 7 days is generous; admin can reissue if needed |

---

## Phase 4: API Routes — Implementation Patterns

### Route Handler Structure

Based on Next.js App Router patterns from MCP:

```typescript
// app/api/orders/verify-qr/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Validation logic...

    return NextResponse.json({ order: safeOrderData });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
```

### PATCH Handler Modifications

**Current location:** `app/api/admin/orders/[id]/route.ts`

**Modification points:**
1. After successful status update, check `parsed.data` (new status)
2. If new status === 'READY':
   - Generate QR token
   - Set expiration
   - Update order with token
   - Send OrderReadyEmail
3. If new status === 'CANCELLED' or 'REFUNDED':
   - Send OrderStatusUpdateEmail

### Risk Mitigation for APIs
| Risk | Mitigation |
|------|------------|
| Race condition on token generation | Use database UPDATE with token, don't read-then-write |
| Email sending blocks response | Fire-and-forget: don't await email in API response path |
| Invalid status transitions | Prisma enum enforces valid statuses, but add logic check for READY→CANCELLED etc |
| QR token enumeration | Return generic "invalid or expired" message; don't reveal if token exists |

---

## Phase 5: Admin Scan Page

### Mobile-First Design Requirements

- Minimum touch target: 48px
- Large complete button: full width, min 56px height
- Clear visual hierarchy: Order # > Customer > Items > Button
- Auto-redirect after 2 seconds (not 3 — faster workflow)

### Page Flow

```
1. Page loads with ?token=xxx
2. Call /api/orders/verify-qr?token=xxx
3. If error: show error message + "Back to Orders" button
4. If success: display order card
5. Admin taps "MARK AS COMPLETED"
6. PATCH /api/admin/orders/{id} with status: COMPLETED
7. On success: show success toast, redirect to /admin/scan (clean)
```

### Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Double-tap completes twice | Disable button after first click, show loading state |
| Wrong order completed | Display order details prominently before complete button |
| Phone loses connection | Clear error message, retry button |
| Token expires mid-scan | Check expiry on load, show "Token expired, contact staff" |

---

## Phase 6: Backward Compatibility

### Existing Orders
- Orders without `qrToken` field: work normally, just can't use QR flow
- Orders in READY status before this change: admin can manually regenerate QR via "Resend" button

### Existing APIs
- All changes are additive
- PATCH /api/admin/orders/[id] still accepts same body, just has side effects now

### Existing Emails
- OrderConfirmationEmail keeps working, gets enhanced with tracking link

---

## Phase 7: Testing Checklist

### Unit Tests (if test suite exists)
- [ ] Token generation produces unique, random tokens
- [ ] Token expiration calculated correctly (+7 days)
- [ ] QR verification rejects expired tokens
- [ ] QR verification rejects tokens for non-READY orders

### Integration Tests
- [ ] Full flow: NEW → READY (email sent with QR) → Scan → COMPLETED
- [ ] Resend QR generates new token, invalidates old
- [ ] CANCELLED sends cancellation email
- [ ] Order without QR token shows "Generate QR" option in admin

### Manual Tests
- [ ] QR code scans successfully with phone camera
- [ ] Email renders correctly in Gmail, Outlook, Apple Mail
- [ ] Mobile scan page usable on small screen (iPhone SE)
- [ ] Admin can complete order via QR scan
- [ ] Auto-redirect works after completion

---

## Rollback Plan

If critical issues occur:

1. **Database:** Migration is additive only (nullable fields), no rollback needed
2. **Code:** Revert to previous git commit
3. **In-flight orders:** Orders with QR tokens will have stale tokens, but manual admin completion still works

---

## Environment Variables

No new env vars required. Uses existing:
- `NEXT_PUBLIC_APP_URL` — for QR link generation
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — for email sending
- `ADMIN_EMAIL` — for admin notifications

---

## Performance Considerations

1. **QR Generation:** ~50ms per image, done once per READY status change
2. **Token Lookup:** Indexed field, sub-millisecond query
3. **Email Sending:** Async, non-blocking
4. **Image Size:** QR code PNG ~5KB, inlined as data URL

---

## Security Checklist

- [ ] QR tokens are cryptographically random (crypto.randomBytes)
- [ ] Tokens expire after 7 days
- [ ] Token validation checks order status === READY
- [ ] No sensitive data in QR URL (only token)
- [ ] Admin authentication required for all QR management endpoints
- [ ] Rate limiting: Consider adding to /api/orders/verify-qr if abuse detected
