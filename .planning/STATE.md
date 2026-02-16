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
Phase 1 (Core MVP) — building working e-commerce store with catalog, cart, checkout, payment, and admin panel.

---

## Current Position

**Phase:** 1 (Core MVP)
**Plan:** 02 (next to execute)
**Status:** In progress — Plan 01 complete
**Progress:** 33% (1/3 plans in Phase 1 complete)

```
[=============                           ] 33%
```

---

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
| Minimal admin v1 | Owner needs list orders + change status, nothing more | Committed |
| Mobile-responsive from day 1 | No separate mobile build, responsive design required | Committed |
| PostreSQL + Prisma | ACID transactions prevent overselling, type-safe ORM | Committed |
| Server-side Zod validation | Prevents injection, malformed orders, security critical | Committed |
| shadcn New York style | More refined component aesthetics, suits modern/bold design goal | Committed (Plan 01) |
| Manual scaffold over create-next-app | create-next-app blocked by existing .claude/.planning dirs | Resolved (Plan 01) |
| DATABASE_URL user-provided | DB credentials not in codebase, user provides before dev | Committed (Plan 01) |

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

---

## Session Notes

**Created:** 2026-02-16 after roadmap generation
**Roadmap Status:** Complete, 3 phases derived from 18 v1 requirements
**Coverage:** 100% (18/18 requirements mapped)
**Last Executed:** Plan 01-01 — Scaffold Next.js 15 + Prisma schema + Tailwind theme
**Stopped At:** Completed 01-01-PLAN.md
**Last Updated:** 2026-02-16T15:52:42Z

### Plan 01 Blocker (User Action Required)

Database not yet set up. Before Plan 02 can run server-side Prisma queries:
1. Create `.env` with `DATABASE_URL="postgresql://user:pass@localhost:5432/shopseeds"`
2. Run `npx prisma db push`
3. Run `npx prisma db seed`

---

*State initialized: 2026-02-16*
*Updated by: Plan 01 execution (01-01-PLAN.md)*
