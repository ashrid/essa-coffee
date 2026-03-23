# ShopSeeds Roadmap

**Project:** ShopSeeds - Local e-commerce for plants and seeds
**Status:** Planning
**Created:** 2026-02-16
**Depth:** Quick (3 phases, 1-3 plans each)

---

## Phases

- [x] **Phase 1: Core MVP** - Build working e-commerce store with catalog, cart, checkout, and payment (pickup-only) ✓
- [ ] **Phase 1.1: Coffee Ordering Pivot** - Adapt site for coffee shop ordering, remove stock/care fields, replace plant-seed content (INSERTED)
- [ ] **Phase 2: Launch & Validation** - Deploy to production, monitor operations, gather customer feedback
- [ ] **Phase 3: Competitive Advantages** - Add features based on real customer demand

---

## Phase Details

### Phase 1: Core MVP

**Goal:** Ship a working e-commerce store that accepts orders with online payment and pay-on-pickup options, enabling customers to browse products, add to cart, and complete checkout.

**Depends on:** Nothing (first phase)

**Requirements:**
- CAT-01, CAT-02, CAT-03, CAT-04, CAT-05 (Catalog)
- SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, SHOP-06 (Shopping)
- ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06 (Admin)
- DSN-01, DSN-02 (Design)

**Success Criteria** (observable user/admin behaviors):

1. **Customer can browse catalog** — User navigates storefront, views all products with photos, names, prices, descriptions, and category filters without errors
2. **Customer can complete checkout with online payment** — User adds items to cart, views cart with subtotal, enters guest details (name, email, phone), selects Stripe payment, and receives order confirmation email
3. **Customer can complete checkout with pay-on-pickup** — User follows same checkout flow but selects "pay on pickup" instead of card payment, completes order, and receives confirmation with pickup instructions
4. **Customer sees inventory status** — User views in-stock/out-of-stock status on product cards and cannot add out-of-stock items to cart
5. **Customer can find products by search and filters** — User filters by category (Houseplants/Seeds/Succulents) and searches by product name, results appear within 1 second
6. **Admin can manage catalog** — Owner logs into admin panel, adds/edits/removes products with name, description, price, images, and category
7. **Admin can manage orders** — Owner views all orders with customer details and status, updates status from new → ready → completed
8. **Admin can adjust inventory** — Owner adjusts stock levels for products without inventory corruption (accurate counts persist)
9. **Store displays pickup location and hours** — Customer sees pickup location, hours, and directions prominently on storefront and checkout
10. **Store is mobile-responsive** — Store renders correctly and is fully usable on phone, tablet, and desktop with touch targets ≥48px

**Plans:** 7 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffold: Next.js 15, Prisma schema, Tailwind earthy theme, shadcn/ui, seed data
- [ ] 01-02-PLAN.md — Storefront UI: homepage, catalog grid, sidebar filters, search, product detail, pickup info
- [ ] 01-03-PLAN.md — Cart system: Zustand store, cart drawer, cart page with quantity controls
- [ ] 01-04-PLAN.md — Checkout + payments: 2-step checkout form, Stripe Checkout, pay-on-pickup, webhook, confirmation page
- [ ] 01-05-PLAN.md — Email: React Email templates, Resend integration, customer + admin notifications
- [ ] 01-06-PLAN.md — Admin panel: magic link auth, dashboard, product/order/category CRUD, inventory management
- [ ] 01-07-PLAN.md — Human verification of complete Phase 1 MVP

---

### Phase 01.1: Coffee Ordering Pivot (INSERTED)

**Goal:** Adapt the ShopSeeds store for coffee shop online ordering — replace all plant/seed product content, remove stock-quantity management and care instructions, ensure the full order flow (browse coffee drinks → cart → checkout → order creation) works correctly.

**Requirements**: D-01 through D-20 (all locked decisions in 01.1-CONTEXT.md)
**Depends on:** Phase 1
**Plans:** 1/4 plans executed

Plans:
- [x] 01.1-01-PLAN.md — Schema migration (isAvailable), validators, orders, cart store
- [ ] 01.1-02-PLAN.md — Admin panel: ProductForm, DashboardStats, product API routes
- [ ] 01.1-03-PLAN.md — Store palette, AvailabilityBadge, branding sweep, store pages
- [ ] 01.1-04-PLAN.md — Coffee seed data (4 categories, ~14 products) + human verification

### Phase 2: Launch & Validation

**Goal:** Deploy to production, ensure operations are solid, identify what actually matters through real customer usage and feedback.

**Depends on:** Phase 1

**Requirements:**
- (No new requirements - Phase 2 is operational validation, not feature development)

**Success Criteria** (observable operational behaviors):

1. **Store is live and accessible** — Production deployment to custom domain works, storefront loads within 2 seconds, admin panel accessible with authentication
2. **Payment processing is reliable** — Stripe payments and webhooks process successfully, zero silent failures, order database matches Stripe transaction log
3. **Email delivery works** — Order confirmation emails arrive in customer inbox (not spam), pickup notification emails send to admin, <5% bounce rate
4. **Inventory tracking is accurate** — Stock counts match actual picks/sales, no overselling, manual updates by admin reflect in storefront within 5 minutes
5. **Error handling catches failures** — Network failures, invalid inputs, missing data don't crash system, users see clear error messages
6. **Customer feedback loop established** — Support email receives inquiries, owner tracks feedback in log, top 3 issues identified

**Plans:** TBD

---

### Phase 3: Competitive Advantages

**Goal:** Build features that customers actually request, based on Phase 2 feedback - only ship what demonstrates real demand.

**Depends on:** Phase 2

**Requirements:**
- (No v1 requirements - Phase 3 candidates: plant care tips, seasonal collections, curated categories, email loyalty, advanced search)

**Success Criteria** (observable user behaviors - examples for likely features):

1. **Feature adoption is measurable** — Selected feature (e.g., seasonal collections) is viewable by customers, tracked usage shows >20% engagement
2. **Feature doesn't break existing flows** — Catalog, cart, checkout, payment, admin all work identically after feature addition
3. **Customer feedback validates choice** — Selected feature aligns with top feedback from Phase 2 (not speculative)

**Plans:** TBD

---

## Progress Tracking

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core MVP | 0/3 | Not started | — |
| 2. Launch & Validation | 0/2 | Not started | — |
| 3. Competitive Advantages | 0/1 | Not started | — |

---

## Coverage Summary

**v1 Requirements:** 18 total
**Mapped to phases:** 18
**Coverage:** 18/18 (100%)

- Phase 1: 16 requirements (Catalog 5, Shopping 6, Admin 6, Design 2)
- Phase 2: 0 requirements (operational validation)
- Phase 3: 0 requirements (post-feedback enhancements)

All v1 requirements mapped. No orphans.

---

*Roadmap created: 2026-02-16*
*Next step: `/gsd:plan-phase 1` to generate executable plans*
