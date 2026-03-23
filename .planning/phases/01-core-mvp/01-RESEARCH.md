# Phase 1: Core MVP - Research

**Researched:** 2026-02-16
**Method:** Perplexity MCP (live web search)
**Phase Goal:** Ship working e-commerce store with catalog, cart, checkout, payment, and admin panel

---

## 1. Project Structure & Architecture (Next.js 15 + App Router)

### Recommended Folder Structure

```
shop-seeds/
├── app/
│   ├── (store)/                  # Public storefront (shared layout: header, footer, cart)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Homepage (featured products + full catalog)
│   │   ├── shop/
│   │   │   ├── page.tsx          # Full catalog with filters
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Product detail page (ISR)
│   │   ├── cart/
│   │   │   └── page.tsx          # Full cart page
│   │   ├── checkout/
│   │   │   └── page.tsx          # 2-step checkout
│   │   ├── order-confirmation/
│   │   │   └── page.tsx          # Post-order confirmation
│   │   └── pickup-info/
│   │       └── page.tsx          # Pickup location/hours/directions
│   ├── (admin)/                  # Admin panel (separate layout: sidebar)
│   │   ├── layout.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx          # Dashboard (orders count, low stock, revenue)
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Magic link login
│   │   │   ├── products/
│   │   │   │   ├── page.tsx      # Product list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # Add product form
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Edit product form
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx      # Order list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Order detail
│   │   │   └── categories/
│   │   │       └── page.tsx      # Category management
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts          # Create Stripe session / pay-on-pickup order
│   │   ├── webhook/
│   │   │   └── route.ts          # Stripe webhook handler
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts      # Auth.js routes
│   ├── layout.tsx                # Root layout
│   ├── globals.css
│   ├── loading.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                       # Base UI components (shadcn/ui)
│   ├── store/                    # Storefront components (ProductCard, CartDrawer, etc.)
│   ├── admin/                    # Admin components (OrderTable, ProductForm, etc.)
│   ├── checkout/                 # Checkout components (CheckoutForm, PaymentSelector)
│   └── emails/                   # React Email templates
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── stripe.ts                 # Stripe client init
│   ├── auth.ts                   # Auth.js config
│   ├── cart-store.ts             # Zustand cart store (localStorage)
│   ├── validators.ts             # Zod schemas for forms/API
│   └── utils.ts                  # Shared utilities
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts                  # Protect /admin routes
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### Key Architectural Patterns

- **Route Groups**: `(store)` for public storefront, `(admin)` for admin panel — separate layouts, no URL impact
- **ISR for Products**: Server Components fetch Prisma data; `revalidatePath('/shop')` on admin product changes
- **Cart State**: Zustand with `persist` middleware → localStorage. No server-side cart.
- **Server Actions**: For form submissions (checkout, admin CRUD) — type-safe, no manual API routes needed for forms
- **Middleware**: Protect all `/admin/*` routes except `/admin/login`

### Stack (Confirmed)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15 |
| UI Library | React | 19 |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 6.x |
| Payments | Stripe (Checkout) | stripe@17.x |
| Email | Resend + React Email | latest |
| Auth | Auth.js (NextAuth v5) | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | latest |
| State (Cart) | Zustand | 5.x |
| Validation | Zod | 3.x |
| Deployment | Vercel | - |

---

## 2. Database Schema (Prisma + PostgreSQL)

### Schema Design

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  products    Product[]
  @@map("categories")
}

model Product {
  id                String      @id @default(cuid())
  name              String
  slug              String      @unique
  description       String?     // Rich text (HTML from editor)
  price             Decimal     @db.Decimal(10, 2)
  images            String[]    // Array of image URLs (up to 5)
  stockQuantity     Int         @default(0)
  lowStockThreshold Int         @default(5)
  isFeatured        Boolean     @default(false)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  categoryId        String
  category          Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  orderItems        OrderItem[]
  @@index([categoryId])
  @@index([isFeatured])
  @@index([stockQuantity])
  @@map("products")
}

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique @default(cuid())
  guestName       String
  guestEmail      String
  guestPhone      String?
  guestNotes      String?
  status          OrderStatus   @default(NEW)
  paymentMethod   PaymentMethod @default(PAY_ON_PICKUP)
  stripeSessionId String?
  total           Decimal       @db.Decimal(10, 2)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  items           OrderItem[]
  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  price     Decimal @db.Decimal(10, 2) // Snapshot at purchase time
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Restrict)
  @@unique([orderId, productId])
  @@map("order_items")
}

enum OrderStatus {
  NEW
  READY
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  STRIPE
  PAY_ON_PICKUP
}
```

### Inventory Safety — Atomic Transactions

```typescript
await prisma.$transaction(async (tx) => {
  // Check stock for all items
  for (const item of cartItems) {
    const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
    if (product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
  }
  // Create order
  const order = await tx.order.create({ data: orderData });
  // Deduct stock atomically
  for (const item of cartItems) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { decrement: item.quantity } }
    });
  }
  return order;
}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
```

Key: `Serializable` isolation level prevents concurrent overselling.

---

## 3. Stripe Integration

### Dual Payment Flow

**Online Payment (Stripe Checkout):**
1. Client POSTs cart to `/api/checkout` with `paymentMethod: 'STRIPE'`
2. Server creates Stripe Checkout Session with `mode: 'payment'`
3. Client redirects to `session.url` (Stripe hosted page)
4. Stripe webhook `checkout.session.completed` confirms payment
5. Server updates order status, sends confirmation email

**Pay-on-Pickup (No Stripe charge):**
1. Client POSTs cart to `/api/checkout` with `paymentMethod: 'PAY_ON_PICKUP'`
2. Server creates order directly in DB (no Stripe session)
3. Server sends confirmation email with pickup details
4. Order starts in `NEW` status

### Webhook Handler

- Listen for `checkout.session.completed` event
- Verify signature with `stripe.webhooks.constructEvent()`
- Use `metadata.order_id` to match to DB order
- Use `event.id` for idempotency (skip if already processed)
- Update order status from `NEW` to paid state

### Idempotency

Pass unique key (order ID) to `stripe.checkout.sessions.create()` to prevent duplicate sessions on network retries.

---

## 4. Admin Authentication

### Approach: Auth.js v5 with Email Provider

**Why Auth.js over custom:** Handles token generation, validation, session cookies, and expiry automatically. Single admin user doesn't justify custom auth complexity.

**Setup:**
- Auth.js email provider with Resend as transport
- Magic link validity: 10-15 minutes
- Session stored in JWT cookie (no DB sessions needed for single user)
- Middleware protects all `/admin/*` except `/admin/login`

**Security:**
- HttpOnly session cookie
- CSRF protection built into Auth.js
- Same-browser enforcement for magic links (optional extra security)

### Middleware Pattern

```typescript
// middleware.ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  if (req.nextUrl.pathname.startsWith("/admin") &&
      !req.nextUrl.pathname.startsWith("/admin/login") &&
      !req.auth) {
    return Response.redirect(new URL("/admin/login", req.url));
  }
});

export const config = { matcher: ["/admin/:path*"] };
```

---

## 5. Email System

### Approach: Resend + React Email

**Why Resend:** Native Next.js SDK, React Email creators, 3,000 free emails/month, simplest setup.

**Two email types:**
1. **Customer order confirmation** — Sent after order creation (both payment methods)
2. **Admin new order notification** — Sent to store owner for each new order

**Template approach:** React Email components in `components/emails/` — render JSX to HTML server-side.

**Sending pattern:** Call `resend.emails.send()` from server actions/API routes after order creation.

---

## 6. Key Implementation Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Cart persistence | Zustand + localStorage | No server dependency, works offline, simple |
| Product images | Store URLs in DB, files in Vercel Blob or Cloudinary | Don't store binary in DB |
| Rich text editor | Tiptap (free, React-native, outputs HTML) | Lightweight, good DX |
| Admin product form | Dedicated form page (not inline) | Multiple images + rich text = too complex for inline |
| Refund handling | Manual via Stripe Dashboard | Auto-refund adds complexity for edge cases |
| Featured products | Auto-select newest products with stock > 0 | Simple algorithm, no admin toggle needed |
| Search | Client-side filter on pre-fetched products | <30 products, no need for server search |
| Category management | Simple CRUD in admin | Categories are admin-managed, not hardcoded |

---

## 7. Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Overselling | Serializable transactions + stock check at checkout |
| Payment failure mid-checkout | Stripe webhooks as source of truth, not redirect |
| Email delivery failure | Resend retry + webhook monitoring |
| Admin lockout | Recovery via DB token reset or env-based bypass |
| Image upload size | Client-side resize before upload, max 5MB limit |
| Cart/price mismatch | Re-validate prices server-side at checkout |

---

*Research completed: 2026-02-16*
*Sources: Perplexity MCP (live web), Next.js docs, Stripe docs, Prisma docs, Auth.js docs*
