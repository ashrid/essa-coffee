---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 04-05-PLAN.md
last_updated: "2026-03-26T10:28:37.653Z"
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 22
  completed_plans: 18
---

# Project State: ShopSeeds

**Project:** ShopSeeds - Local e-commerce for plants and seeds
**State Created:** 2026-02-16
**Mode:** YOLO (ship fast, validate with customers)

---

## Project Reference

**Core Value:**
Customers can browse plants and seeds online, place an order, and pick it up — replacing informal selling with a professional storefront.

**Key Constraints:**

- Pickup-only fulfillment (no shipping in v1)
- Solo admin operation (one person manages everything)
- Small catalog (<30 products: houseplants, seeds, succulents)
- Modern, bold visual design (owner preference)
- Guest checkout only (no customer accounts)

**Current Focus:**
Phase 04 — production-readiness-fixes

---

## Current Position

Phase: 04 (production-readiness-fixes) — EXECUTING
Plan: 2 of 5

## Roadmap Structure

**Total phases:** 3

1. **Phase 1: Core MVP** (16 requirements)
   - Catalog browsing, cart, checkout (Stripe + pay-on-pickup), admin, mobile design
   - Success criteria: browsing, checkout flows, payment, inventory, search, admin functions, pickup info, responsive

2. **Phase 2: Launch & Validation** (0 requirements, operational)
   - Deploy to production, monitor, gather feedback
   - Success criteria: live deployment, payment reliability, email delivery, inventory accuracy, error handling, feedback loop

3. **Phase 3: Competitive Advantages** (post-feedback)
   - Build features customers request (not speculative)
   - Candidates: plant care tips, seasonal collections, curated categories, email loyalty, advanced search

---

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Pickup-only for v1 | Simplifies fulfillment, shipping added only if validated | Committed |
| Guest checkout (no accounts) | Reduces friction, sufficient for solo owner | Committed |
| Stripe for payments | PCI compliance handled by Stripe, webhooks, proven | Committed |
| Stripe Checkout hosted page | Never custom payment form - PCI compliance | Committed (Plan 04) |
| Serializable transactions | Prevents overselling during concurrent checkouts | Committed (Plan 04) |
| Webhook idempotency | stripeSessionId check prevents duplicate orders | Committed (Plan 04) |
| Non-blocking email sending | Promise.allSettled prevents email failures from blocking orders | Committed (Plan 05) |
| Email failure isolation | try/catch wrappers ensure order creation always succeeds | Committed (Plan 05) |
| Minimal admin v1 | Owner needs list orders + change status, nothing more | Committed |
| Mobile-responsive from day 1 | No separate mobile build, responsive design required | Committed |
| PostreSQL + Prisma | ACID transactions prevent overselling, type-safe ORM | Committed |
| Server-side Zod validation | Prevents injection, malformed orders, security critical | Committed |
| shadcn New York style | More refined component aesthetics, suits modern/bold design goal | Committed (Plan 01) |
| Manual scaffold over create-next-app | create-next-app blocked by existing .claude/.planning dirs | Resolved (Plan 01) |
| DATABASE_URL user-provided | DB credentials not in codebase, user provides before dev | Committed (Plan 01) |
| Toast-only on add-to-cart | No drawer auto-open per 01-CONTEXT.md user decision — toast confirms action | Committed (Plan 03) |
| CartSummary ctaHref/ctaLabel props | Single component handles drawer (View Cart) and cart page (Proceed to Checkout) | Committed (Plan 03) |
| totalItems/subtotal stored state | Zustand persist requires stored values for hydration; recalculated on each mutation | Committed (Plan 03) |
| Prisma Decimal type for prices | Components accept `number \| string \| { toString() }` to handle Decimal without conversion | Committed (Plan 02) |
| ISR 60s revalidation | Product pages regenerate every 60s for near-real-time updates without sacrificing performance | Committed (Plan 02) |
| Hybrid filtering approach | Server-side for category/stock/sort, client-side for search | Committed (Plan 02) |
| Hex-only palette swap | Class names unchanged; only hex values in tailwind.config.ts replaced — zero component refactor for color changes | Committed (01.1-03) |
| StockBadge.tsx filename preserved | Keeping filename avoids import path churn; component renamed internally to AvailabilityBadge | Committed (01.1-03) |
| Email inline styles also updated | Email templates use inline hex values, not Tailwind tokens — required separate #1b4332 -> #3b1f0e update | Committed (01.1-03) |

---

## Performance Metrics

**Tracking begins after Phase 1 launch.**

Metrics to monitor (Phase 2):

- Order volume (orders/day, repeat customers)
- Payment success rate (% transactions approved)
- Cart abandonment rate (% carts not completed)
- Email deliverability (% confirmation emails delivered, spam rate)
- Mobile conversion (% purchases on mobile vs desktop)
- Product popularity (top 5 products by sales)
- Customer support inquiries (volume, top issues)

---

## Accumulated Context

### Research Outputs

Research completed 2026-02-16. Key findings:

**Recommended Stack:**

- Next.js 15, React 19, TypeScript, PostgreSQL 16, Prisma, Stripe, SendGrid/Resend
- Vercel deployment (auto-deploy on git push)
- TanStack Query for dynamic data, Tailwind CSS, Headless UI

**Table Stakes (must ship v1.0):**

- Product catalog with images, pricing, availability
- Shopping cart with persistence
- Checkout form (2-3 steps)
- Payment (Stripe Checkout pre-built, never custom payment form)
- Pay-on-pickup option
- Order confirmation email
- Inventory visibility
- Mobile-responsive
- Pickup location/hours

**Differentiators (v1.1+, post-feedback):**

- Plant care tips per product
- Seasonal collections
- Curated categories (Beginner-friendly, Low-light, Pet-safe)
- Email loyalty discounts
- Gift message option

**Critical Pitfalls:**

1. Over-engineering (avoid complex features before validating)
2. Not validating input server-side (security risk)
3. Custom payment forms (use Stripe Checkout pre-built)
4. Over-engineering admin (minimum v1)
5. Not testing checkout edge cases

**Architecture Pattern:**

- Server-side rendering for products (ISR)
- Client-side state for cart (localStorage)
- Server-side validation for all API routes (Zod)
- Atomic database transactions for inventory
- Stripe webhooks for payment confirmation

### Design Direction

**Visual style:** Modern, bold (differentiates from typical soft/earthy plant store aesthetics)

**Specifics:** TBD - recommend 2-3 visual mockups pre-development with owner review

### Inventory & Operations

**Scope (v1):** Manual daily admin updates, no real-time sync
**Tracking:** In-stock / limited / out-of-stock status
**Safety:** Atomic database transactions prevent overselling

### Roadmap Evolution

- Phase 01.1 inserted after Phase 01: Coffee ordering pivot — adapt site for coffee shop ordering, remove stock/care fields, replace all plant-seed references (URGENT)
- Phase 4 added: Production Readiness Fixes — address 4 critical issues from cross-AI review before launch

---

## Blockers & Gaps

### Gaps Identified (before Phase 1 starts)

1. **Customer demand validation** — Assume online + local pickup is viable. Recommend: survey 5-10 potential customers: "Would you buy plants online for local pickup?" If <50% yes, reconsider model.

2. **Pricing strategy** — Not covered in tech research. Recommend: analyze 3-5 competitors, decide markup (typically 3-5x for plants).

3. **Brand/design specifics** — "Bold design" mentioned, not defined. Recommend: create 2-3 visual mockups, share with target customers, iterate before development.

4. **Supplier/inventory logistics** — Where sourced? Storage constraints? Shelf life? How to manage rotation? Affects operations, not tech, but tech should support it.

5. **Legal/compliance** — Terms of Service, Privacy Policy, business structure, tax ID. Not tech, but necessary before launch.

6. **Payment methods confirmation** — Owner: cash, card, both? Tax handling? Local regulations?

7. **Image photography standards** — Budget 2 hours per product (2-3 angles, consistent background, size reference).

8. **Email template design** — Recommend plain-text initially, HTML polish later.

### Mitigation

- **Pre-Phase 1:** Owner validates customer demand, defines brand design, confirms pricing/legal
- **Phase 1:** Use Stripe Checkout pre-built (never custom), validate all input server-side, test checkout edge cases
- **Phase 2:** Monitor Stripe dashboard + email logs + database day 1

---

## Performance Metrics — Execution

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-core-mvp | 01 | 12 min | 3/3 | 24 |
| 01-core-mvp | 02 | 25 min | 3/3 | 13 |
| 01-core-mvp | 03 | 6 min | 2/2 | 12 |
| 01-core-mvp | 04 | 18 min | 2/2 | 9 |
| 01-core-mvp | 05 | 6 min | 2/2 | 5 |
| 01-core-mvp | 06 | 18 min | 2/2 | 22 |

---
| Phase 01.1-coffee-ordering-pivot P01 | 8 min | 2 tasks | 18 files |
| Phase 01.1-coffee-ordering-pivot P02 | 15 min | 2 tasks | 6 files |
| Phase 01.1-coffee-ordering-pivot P03 | 5 min | 2 tasks | 16 files |
| Phase 01.1-coffee-ordering-pivot P04 | 20 | 2 tasks | 6 files |
| Phase 02-launch-validation P01 | 5 min | 3 tasks | 3 files |
| Phase 02.1-admin-qr-scanner-enhancement-inserted P01 | 2 min | 1 tasks | 2 files |
| Phase 02.1-admin-qr-scanner-enhancement-inserted P02 | 5 min | 2 tasks | 2 files |
| Phase 04-production-readiness-fixes P05 | 5min | 1 tasks | 2 files |

## Session Notes

**Created:** 2026-02-16 after roadmap generation
**Roadmap Status:** Complete, 3 phases derived from 18 v1 requirements
**Coverage:** 100% (18/18 requirements mapped)
**Last Executed:** Plan 01-05 — Transactional email system with Resend and React Email
**Stopped At:** Completed 04-05-PLAN.md

### Plan 06 Complete

Admin panel fully implemented:

- `lib/auth.ts` — Auth.js v5 with Resend email provider, ADMIN_EMAIL guard
- `middleware.ts` — Protects /admin/* routes with auth() wrapper
- `app/(admin)/layout.tsx` — Forest sidebar with navigation, mobile hamburger menu
- `app/(admin)/admin/login/page.tsx` — Magic link form with "check your email" flow
- `app/(admin)/admin/page.tsx` — Dashboard with new orders, low stock, today's revenue stats
- `app/(admin)/admin/products/page.tsx` — Product list with low stock highlighting
- `app/(admin)/admin/products/new/page.tsx` + `[id]/page.tsx` — Create/edit with Tiptap rich text
- `app/(admin)/admin/orders/page.tsx` + `[id]/page.tsx` — Order list and detail with status updates
- `app/(admin)/admin/categories/page.tsx` — Category CRUD with product count checks
- `components/admin/ProductForm.tsx` — Tiptap editor for description/care instructions, 5 image URLs
- `components/admin/OrderStatusSelect.tsx` — Color-coded status dropdown
- `components/admin/LowStockBadge.tsx` + `DashboardStats.tsx` — UI components

**Last Updated:** 2026-02-16T16:01:53Z

### Plan 02 Complete

Storefront UI fully implemented:

- `app/(store)/page.tsx` — Homepage with hero, featured products, full catalog
- `app/(store)/shop/page.tsx` — Shop page with server-side filtering
- `app/(store)/shop/ShopPageClient.tsx` — Client-side search wrapper
- `app/(store)/shop/[slug]/page.tsx` — Product detail with ISR (60s revalidate)
- `components/store/ProductGrid.tsx` — Responsive product grid
- `components/store/FeaturedProducts.tsx` — Featured section
- `components/store/SearchBar.tsx` — Debounced search input
- `components/store/CategorySidebar.tsx` — Category filters, in-stock toggle, price sort
- `components/store/ProductImageCarousel.tsx` — Swipeable carousel with thumbnails
- `components/store/RelatedProducts.tsx` — Cross-sell products
- `components/ui/checkbox.tsx` + `select.tsx` — shadcn form components

### Plan 03 Complete

Cart system fully functional:

- `lib/cart-store.ts` — Zustand store with localStorage persistence
- `components/store/CartDrawer.tsx` — Slide-out drawer (shadcn Sheet) with item list
- `components/store/CartItem.tsx` — Quantity controls, remove, line total
- `app/(store)/cart/page.tsx` — Full cart page with "Proceed to Checkout" → /checkout
- `components/store/Header.tsx` — Live badge, cart icon opens drawer
- `components/store/ProductCard.tsx` — addItem + toast.success("Added to cart")

Plan 02 (catalog browsing) still needs to be executed (shop page, homepage, product detail page).

---

*State initialized: 2026-02-16*
*Updated by: Plan 05 execution (01-05-PLAN.md)*

### Plan 05 Complete

Transactional email system with Resend and React Email:

- `components/emails/OrderConfirmationEmail.tsx` — Customer confirmation with forest green header, payment banner, items table, pickup details
- `components/emails/AdminNewOrderEmail.tsx` — Admin notification with customer details, payment badge, "View Order" CTA
- `lib/email.ts` — Resend client with sendOrderConfirmation and sendAdminNewOrderNotification, OrderWithItems type
- `app/api/checkout/route.ts` — Email sending after PAY_ON_PICKUP order (Promise.allSettled, non-blocking)
- `app/api/webhook/route.ts` — Email sending after Stripe payment confirmation (Promise.allSettled, non-blocking)

**Last Updated:** 2026-02-17T16:00:26Z

### Plan 04 Complete

Checkout flow with Stripe integration:

- `lib/stripe.ts` — Stripe client singleton
- `lib/orders.ts` — Shared `createOrderAtomically` with Serializable transactions
- `app/api/checkout/route.ts` — POST endpoint for STRIPE and PAY_ON_PICKUP
- `app/api/webhook/route.ts` — Stripe webhook with signature verification and idempotency
- `components/checkout/CheckoutStepContact.tsx` — Step 1 contact form with validation
- `components/checkout/CheckoutStepPayment.tsx` — Step 2 payment selection
- `app/(store)/checkout/page.tsx` — 2-step checkout flow
- `app/(store)/order-confirmation/page.tsx` — Order confirmation page

**Last Updated:** 2026-02-17T15:54:05Z
