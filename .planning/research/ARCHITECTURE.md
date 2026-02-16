# Architecture Patterns: Small E-Commerce Store

**Domain:** Local plant/seed store with local pickup, online + pay-on-pickup payments
**Researched:** 2026-02-16
**Confidence:** HIGH

## Recommended Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
│  React + TypeScript + TanStack Query + Tailwind CSS        │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │  Product Page    │  │  Shopping Cart   │  │ Checkout │  │
│  │  (SSG/ISR)       │  │  (Client State)  │  │ (Form)   │  │
│  └──────────────────┘  └──────────────────┘  └──────────┘  │
└────────────────────────────────┬─────────────────────────────┘
                                 │ (REST API Calls)
                    ┌────────────┴─────────────┐
                    │  NEXT.JS API ROUTES     │
                    │  (TypeScript)           │
                    │                         │
    ┌───────────────┼──────────────────────────┴──────────────┐
    │               │                                         │
    ▼               ▼                                         ▼
┌─────────────┐  ┌──────────────────┐                ┌──────────────────┐
│  /api/      │  │  /api/products   │                │  /api/orders     │
│  stripe/    │  │  - GET /         │                │  - POST /        │
│  checkout   │  │  - GET /[id]     │                │  - GET /[id]     │
│  - POST /   │  │  (with Prisma)   │                │  (with Prisma)   │
│  - webhook  │  │                  │                │                  │
└─────────────┘  └──────────────────┘                └──────────────────┘
    │ calls            │ queries                          │ queries
    │ Stripe API       │                                   │
    ▼ returns          ▼                                   ▼
┌─────────────┐  ┌──────────────────────────────────────────────┐
│   Stripe    │  │       PostgreSQL Database                   │
│  (Payments) │  │  ┌──────────────────────────────────────┐   │
└─────────────┘  │  │  Tables:                             │   │
                 │  │  - products (id, name, price, ...)  │   │
                 │  │  - orders (id, customer, items, ...) │   │
                 │  │  - order_items (order_id, item_id..) │   │
                 │  │  - inventory (product_id, qty, ...)  │   │
                 │  └──────────────────────────────────────┘   │
                 └──────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Frontend (React/Next.js)** | Render UI, manage cart state, form validation, user interaction | API routes, localStorage |
| **API Routes** | Handle requests, validate input, call business logic, return JSON | Database (Prisma), Stripe, email service |
| **Database (PostgreSQL)** | Persist products, orders, inventory | ORM (Prisma) |
| **Payment Processor (Stripe)** | Process online payments, generate session tokens, handle webhooks | API routes |
| **Email Service** | Send order confirmations, pickup notifications | API routes |

### Data Flow

```
1. User Browsing (Product Discovery)
   User → Browser → Next.js SSG/ISR → Cached Product Pages → Browser renders

2. Add to Cart (Client-side State)
   User clicks "Add to Cart" → React state update → localStorage persist → UI updates

3. Checkout - Online Payment Path
   User submits checkout form
   → Frontend validates form
   → POST /api/orders (create order record)
   → Backend: Create Stripe session
   → Return session ID to frontend
   → Frontend: Redirect to Stripe Checkout
   → User pays on Stripe
   → Stripe webhook: POST /api/stripe/webhook (order status update)
   → Backend: Mark order as "paid"
   → Send email confirmation

4. Checkout - Pay-On-Pickup Path
   User submits checkout form (skips Stripe)
   → Frontend validates form
   → POST /api/orders (create order with status = "pending_pickup")
   → Backend: Create order record
   → Send email with pickup instructions
   → Admin sees order in dashboard

5. Admin Order Management
   Admin views orders → Next.js admin page → GET /api/orders → List from database
   Admin marks "ready" → PATCH /api/orders/[id] (status update)
   → Backend sends "ready for pickup" email to customer
```

## Patterns to Follow

### Pattern 1: Server Components for Data Fetching

**What:** Use Next.js Server Components (React 19) to fetch data on the server, not the client.

**When:** Loading product catalog, product detail pages, order history (future).

**Benefits:**
- Eliminates waterfall requests (data loads before rendering)
- Database queries stay on server (security: no exposing query logic to client)
- Smaller JavaScript bundle (no client-side data fetching library needed for static data)
- Better SEO (content is in HTML, not hidden in JS)

**Example:**

```typescript
// app/products/page.tsx (Server Component)
async function ProductsPage() {
  const products = await db.product.findMany({
    select: { id: true, name: true, price: true, image: true }
  });

  return (
    <div>
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

### Pattern 2: Incremental Static Regeneration (ISR) for Product Pages

**What:** Generate product pages at build time, but re-generate them periodically (e.g., every 1 hour) to pick up inventory changes.

**When:** Product detail pages. Inventory rarely changes mid-hour for small catalogs.

**Benefits:**
- Cached static pages (instant load)
- Automatic refresh without rebuilding entire site
- Handles inventory updates without manual deployment

**Example:**

```typescript
// app/products/[id]/page.tsx
export const revalidate = 3600; // Re-generate every hour

export async function generateStaticParams() {
  const products = await db.product.findMany({ select: { id: true } });
  return products.map(p => ({ id: p.id.toString() }));
}
```

### Pattern 3: TanStack Query for Real-Time State

**What:** Use TanStack Query for server state that changes during session.

**When:** Shopping cart operations, order fetching, admin order updates.

**Benefits:**
- Automatic caching and refetching
- Optimistic updates (update UI immediately, sync with server)
- Handles race conditions

### Pattern 4: Zod Validation

**What:** Define data schemas. Validate all inputs before database operations.

**When:** All POST/PATCH endpoints (create order, update product, etc.).

**Benefits:**
- Security: Prevents injection attacks
- Type inference
- Single source of truth for data shape

### Pattern 5: Webhook Handling for Stripe

**What:** Listen for Stripe webhooks and update order status.

**When:** After user completes/fails payment on Stripe.

**Benefits:**
- Reliable order status synchronization
- Handles user closing browser mid-payment
- Webhook signature verification prevents spoofing

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fetching All Data on Every Page Load
- **Why bad:** Waterfalls (slow first load)
- **Instead:** Use Server Components for static data. TanStack Query only for dynamic data.

### Anti-Pattern 2: Storing Payment Information Manually
- **Why bad:** PCI compliance nightmare. Security risk.
- **Instead:** Use Stripe's tokenization. Store only Stripe transaction IDs.

### Anti-Pattern 3: Real-Time Inventory Without Rate Limiting
- **Why bad:** Database thrashing with concurrent queries.
- **Instead:** Show simple: "In stock" / "Limited" / "Out of stock". Manual admin updates for <30 products.

### Anti-Pattern 4: Querying Entire Database, Then Filtering in JavaScript
- **Why bad:** Slow. Doesn't scale.
- **Instead:** Push filtering to database with Prisma `.where()`.

## Scalability Considerations

For small stores growing naturally over time.

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Database** | Single PostgreSQL sufficient. Queries <100ms. | Monitor slow queries. May need read replicas for reporting. | Shard by user_id. Separate write/read database. |
| **API Rate** | Single Next.js instance handles 1000s req/sec. | Vercel auto-scales. Same. | May need dedicated database replica. |
| **Concurrent Checkouts** | Session-based rate limiting (3 checkouts per IP per minute). | Same—Vercel handles concurrency. | Distributed rate limiting (Redis). |
| **Product Images** | Vercel CDN included. Unlimited. | Same. | External storage (S3) if images > 100GB. |
| **Search** | Linear search over 30 items: instant. | Add index at 1000 items. Still fast. | Elasticsearch if 100k+ items. |
| **Email** | SendGrid free tier (100/day). | SendGrid pro ($30/mo, 100k/mo). | Dedicated infrastructure or high-volume service. |
| **Backup** | Vercel Postgres automated (1-day retention). | Manual monthly backup to S3. | Enterprise-grade replication and failover. |

**Key insight:** This architecture scales to millions of transactions with minimal changes. For now, optimize for developer speed, not scale.

## Deployment Architecture

### Development (Local)
- Node.js 18+ + PostgreSQL 16
- Stripe CLI for testing webhooks
- Environment variables in .env.local

### Production (Vercel)
```
GitHub main → Vercel → Auto-deploys
                ↓
        PostgreSQL (Vercel)
                ↓
        Stripe API (production)
                ↓
        Email service (SendGrid/Resend)
```

## Recommendations for v1

1. **Use Vercel + Vercel Postgres + Stripe + SendGrid.** Infrastructure is solved. Single-click deploy.

2. **No authentication for v1.** Skip. Just collect email.

3. **No Redis/caching initially.** Vercel includes built-in caching. Add only if profiling shows bottlenecks.

4. **Images auto-optimize via Vercel CDN.** Done.

5. **Monitoring:** Use Vercel's built-in analytics. Add Sentry only if needed (free tier available).

---

*Architecture research for: ShopSeeds e-commerce plant store*
*Researched: 2026-02-16*
