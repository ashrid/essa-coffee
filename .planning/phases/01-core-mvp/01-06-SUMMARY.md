---
phase: "01-core-mvp"
plan: "06"
completed: "2026-02-16"
duration: "18 min"
commit: "83da074"
---

# Plan 01-06: Admin Panel — Complete

## What Was Built

Full admin panel with password-free magic link authentication, dashboard with operational stats, product CRUD with rich text editor, order management, category CRUD, and inventory tracking.

### Authentication & Layout

**Magic Link Auth (Auth.js v5 + Resend):**
- `lib/auth.ts` — NextAuth v5 configuration with Resend email provider, ADMIN_EMAIL gate
- `app/api/auth/[...nextauth]/route.ts` — Auth.js API route handlers
- `middleware.ts` — Protects all `/admin/*` routes, redirects to login if unauthenticated
- `app/(admin)/admin/login/page.tsx` — Magic link form with "check your email" confirmation

**Admin Layout:**
- `app/(admin)/layout.tsx` — Forest-themed sidebar (240px) with navigation, mobile-responsive hamburger menu
- Sidebar links: Dashboard, Orders (with new count badge), Products, Categories
- Sign out button and "View Store" external link

### Dashboard

- `app/(admin)/admin/page.tsx` — Server-side fetched stats:
  - New Orders count (status: NEW)
  - Low Stock Alerts count (stock ≤ threshold)
  - Today's Revenue (Stripe payments only)
  - Recent Orders table (last 5) with status badges
  - Quick links: Add Product, View All Orders

### Product Management

**Components:**
- `components/admin/ProductForm.tsx` — Tiptap rich text editor (bold, italic, lists) for description/care instructions, 5 image URL inputs, category select, stock fields
- `components/admin/LowStockBadge.tsx` — Amber badge for low stock items

**Pages:**
- `app/(admin)/admin/products/page.tsx` — Product table with low stock highlighting (amber-50 bg), edit/delete actions
- `app/(admin)/admin/products/new/page.tsx` — Create product form
- `app/(admin)/admin/products/[id]/page.tsx` — Edit product form

**API Routes:**
- `app/api/admin/products/route.ts` — GET all products, POST create (with slug generation)
- `app/api/admin/products/[id]/route.ts` — GET single, PATCH update, DELETE (with order-item check)

### Order Management

**Components:**
- `components/admin/OrderStatusSelect.tsx` — Color-coded status dropdown (NEW: blue, READY: amber, COMPLETED: green, etc.)
- `components/admin/DashboardStats.tsx` — Three stat cards with icons

**Pages:**
- `app/(admin)/admin/orders/page.tsx` — Order list with status filter tabs, customer info, payment method
- `app/(admin)/admin/orders/[id]/page.tsx` — Full order detail with status update dropdown

**API Routes:**
- `app/api/admin/orders/route.ts` — GET all orders newest first
- `app/api/admin/orders/[id]/route.ts` — GET single, PATCH status update

### Category Management

- `app/(admin)/admin/categories/page.tsx` — Category list with product counts, inline add/edit, delete (disabled if has products)
- `app/api/admin/categories/route.ts` — GET all with count, POST create
- `app/api/admin/categories/[id]/route.ts` — DELETE (with product check)

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Magic link auth | No passwords to manage; Resend provider sends email links; ADMIN_EMAIL env var gates access |
| Tiptap rich text | Lightweight, extensible editor for product descriptions and care instructions |
| Image URLs (not uploads) | Simpler infrastructure; owner can use cloud storage or direct URLs |
| Low stock threshold per product | Different products have different restock needs; configurable at product level |
| ISR revalidation on mutations | Product changes reflect on storefront immediately |
| Server-side stats fetching | Dashboard loads fast with aggregated data in single query |

## Files Created/Modified

```
lib/auth.ts                                    # Auth.js v5 config
middleware.ts                                  # Route protection (modified)
app/api/auth/[...nextauth]/route.ts            # Auth handlers
app/(admin)/layout.tsx                         # Admin shell with sidebar
app/(admin)/admin/login/page.tsx               # Magic link form
app/(admin)/admin/page.tsx                     # Dashboard
app/(admin)/admin/products/page.tsx            # Product list
app/(admin)/admin/products/new/page.tsx        # Create product
app/(admin)/admin/products/[id]/page.tsx       # Edit product
app/(admin)/admin/orders/page.tsx              # Order list
app/(admin)/admin/orders/[id]/page.tsx         # Order detail
app/(admin)/admin/categories/page.tsx          # Category management
app/api/admin/products/route.ts                # Products API
app/api/admin/products/[id]/route.ts           # Single product API
app/api/admin/orders/route.ts                  # Orders API
app/api/admin/orders/[id]/route.ts             # Single order API
app/api/admin/categories/route.ts              # Categories API
app/api/admin/categories/[id]/route.ts         # Single category API
components/admin/ProductForm.tsx               # Product form with Tiptap
components/admin/OrderStatusSelect.tsx         # Status dropdown
components/admin/LowStockBadge.tsx             # Stock alert badge
components/admin/DashboardStats.tsx            # Stat cards
prisma/schema.prisma                           # Added User, Account, Session, VerificationToken
```

## Verification Status

- [x] Auth.js configured with Resend provider
- [x] Prisma schema updated with auth models
- [x] Middleware protects /admin/* routes
- [x] Login page shows "check your email" after submission
- [x] Admin layout has forest sidebar with navigation
- [x] Dashboard fetches stats server-side
- [x] Product form has Tiptap editor
- [x] Product list highlights low stock items
- [x] Order status dropdown updates with PATCH
- [x] Categories page with product count

## Dependencies Added

```bash
npm install next-auth@beta @auth/prisma-adapter
npm install @tiptap/react @tiptap/starter-kit
```

## User Setup Required

1. Add to `.env`:
   - `NEXTAUTH_SECRET` — generate with `openssl rand -hex 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` for dev
   - `ADMIN_EMAIL` — the email allowed to log in
   - `AUTH_RESEND_KEY` — same as Plan 05 Resend key

2. Run `npx prisma db push` to add auth tables

3. Run `npm run dev` and visit `/admin/login`

## Blockers / Notes

- Full magic link flow requires Resend API key and verified domain
- Without Resend configured, login form submits but email won't send
- Local testing: temporarily bypass email check in `signIn` callback for development

---

*Summary created: 2026-02-16*
*All tasks complete — ready for Phase 1 continuation*
