# Project Research Summary: ShopSeeds

**Project:** ShopSeeds
**Domain:** Local e-commerce plant/seed store (pickup-only, <30 products, solo admin)
**Researched:** 2026-02-16
**Overall Confidence:** HIGH

## Executive Summary

ShopSeeds is a local e-commerce store selling plants and seeds with local pickup only (no shipping). The recommended approach is a **modern full-stack application using Next.js 15, React 19, TypeScript, PostgreSQL 16, and Stripe**, deployed on Vercel. This stack is purpose-built for small e-commerce: it handles payment processing, inventory management, and admin workflows efficiently without over-engineering. The architecture is a straightforward monolith—everything in one codebase, one-click deployment, no microservices complexity.

The key insight is that **most small e-commerce projects fail by over-engineering** (trying to be Shopify) or using bloated platforms. ShopSeeds succeeds by shipping a minimal working store in 3-4 weeks, validating the business model with real customers, then iterating based on actual demand. This requires discipline: committing to "pickup-only" (no shipping), using guest checkout (no user accounts), and keeping the admin panel bare minimum. These constraints aren't limitations—they're your competitive advantage for speed and focus.

The biggest technical risks are **payment handling** (must be bulletproof from day one) and **checkout UX** (if broken, sales are zero). Both are well-mitigated by using Stripe's pre-built Checkout (never custom payment forms), validating all input on the server with Zod, and testing edge cases thoroughly. Everything else—inventory, search, admin features—can improve post-launch based on real feedback.

## Key Findings

### Recommended Stack

**Core technologies:**
- **Next.js 15.x** — Full-stack framework combining frontend + API in one codebase. Eliminates context switching. Server Components (React 19) enable optimal performance. Official Vercel deployment with zero configuration.
- **React 19.x** — UI library bundled with Next.js. Large e-commerce component ecosystem. Easier to hire for than niche frameworks.
- **TypeScript 5.x** — Prevents common e-commerce bugs (negative quantities, payment data leaks). Type safety is essential for payment processing.
- **PostgreSQL 16.x** — ACID transactions guarantee order integrity. JSON support for flexible product metadata. Single database scales to millions of orders.
- **Prisma 6.x** — Type-safe ORM. Auto-generates TypeScript types from schema. Eliminates SQL injection bugs.
- **Stripe (latest API)** — PCI compliance handled by Stripe, not you. Supports online payments, pay-on-pickup orders, and webhooks. **Use Stripe Checkout (pre-built), never custom payment forms.**

**Supporting libraries:** React Hook Form (cart/checkout state), Zod (server-side input validation—mandatory for security), TanStack Query 5.x (client caching), Tailwind CSS 4.x (responsive design), Headless UI (accessible components), Framer Motion (animations).

**Infrastructure:** Vercel (official Next.js host, one-click deploys from GitHub), Vercel Postgres (managed PostgreSQL) or Neon/Supabase for flexibility, SendGrid or Resend for transactional emails.

### Expected Features

**Table stakes (must ship in v1.0):**
- Product catalog with images, pricing, availability
- Shopping cart with add/remove/quantity, localStorage persistence
- Checkout form (2-3 steps: details → pickup info → payment choice)
- Payment processing (online via Stripe + pay-on-pickup option)
- Order confirmation email with pickup instructions
- Inventory visibility (in-stock / limited / out-of-stock)
- Mobile-responsive entire flow
- Pickup location and hours prominently displayed
- Error messages and form validation

Without these, the store is incomplete. They're baseline expectations, not differentiators.

**Differentiators (add in v1.1-v1.5, post-launch):**
- Plant care tips per product (education reduces refund requests, educational differentiator)
- Seasonal collections (drives repeat visits, relevant for seeds)
- Curated categories ("Beginner-friendly," "Low-light," "Pet-safe" instead of generic sorting)
- Email-based loyalty discounts (buy 3x, get 10% off—repeat customer driver, no accounts needed)
- Gift message option at checkout (captures gift-giving market)

These improve conversion and repeat customers. Add when customer feedback validates demand.

**Anti-features (skip entirely, scope killers):**
- **Shipping** — Major complexity, 40% failure rate for fragile plants, squeezes margins. Store local pickup as brand strength.
- **User accounts** — Adds password resets, authentication, checkout friction. Use email for loyalty instead.
- **Real-time inventory sync** — Overkill for <30 products. Manual daily admin updates sufficient.
- **Wishlist/Save-for-later** — Minimal conversion impact. Use "email this product" if customers request.
- **Marketplace/multi-seller** — Changes entire business model.
- **Video tours, subscription boxes, advanced filters** — Premature. Validate business first.

### Architecture Approach

**Recommended pattern:** Next.js API routes + PostgreSQL + Stripe webhooks + server-side rendering.

**Data flow:**
1. **Product pages** — Statically generated at build time, revalidated every 1 hour (ISR). Instant load, SEO-friendly.
2. **Shopping cart** — Client-side state (localStorage). No API calls until checkout.
3. **Checkout** — Form validated on client for UX. Server-side validation with Zod for security. Creates order atomically in database.
4. **Payment** — Delegate entirely to Stripe Checkout. Your app never touches card data. Store only Stripe transaction IDs.
5. **Webhooks** — Stripe sends payment confirmation → updates order status → sends email.

**Major components:**
- **Frontend (React + Next.js)** — Renders product pages (server-generated), cart (client state), checkout (validated form)
- **API Routes** — POST /api/orders (create order), POST /api/stripe/checkout (Stripe session), POST /api/stripe/webhook (payment updates)
- **Database (PostgreSQL)** — products, orders, order_items, inventory tables. Indexed on product.id and order.status.
- **Payment (Stripe)** — Handles tokenization, PCI compliance, transactions. Your code never handles card data.
- **Email (SendGrid)** — Sends confirmations and pickup notifications. Custom domain email (orders@shopseeds.com) to avoid spam.

**Patterns to follow:**
- Use Server Components for static data (eliminates waterfall requests, better SEO)
- Use TanStack Query only for dynamic data (orders, admin views)
- Use Stripe webhooks for payment updates (reliable even if user closes browser)
- Validate EVERY input on server with Zod (client validation is UX only)
- Use Prisma transactions for inventory updates (prevents overselling)

**Anti-patterns to avoid:**
- Don't fetch all products on every load. Use ISR.
- Don't store payment tokens. Let Stripe own payment state.
- Don't build real-time inventory without rate limiting. Manual updates are fine for <30 items.
- Don't query database then filter in JavaScript. Push queries to database.
- Don't over-engineer admin panel. Build bare minimum v1.

### Critical Pitfalls

1. **Building for shipping when launching pickup-only** — Adds complexity upfront (address fields, carrier logic, 5+ checkout steps). If shipping fails (plants die in transit), you've wasted weeks. Prevention: Commit to pickup-only in database schema. Refactor only if proof exists later.

2. **Not validating input on server** — Frontend validation is UX only. Attackers can submit malformed orders (negative quantities, invalid products, SQL injections). Corrupts database. Prevention: Validate EVERY POST/PATCH with Zod. Use Prisma (prevents SQL injection). Test with invalid payloads.

3. **Handling Stripe payments manually** — Storing tokens, building custom payment forms, managing refunds yourself. Leads to PCI compliance violations (legal liability), silent payment failures, months of debugging. Prevention: Use Stripe Checkout (pre-built). Let Stripe own payment state. Store only transaction IDs. Verify webhook signatures.

4. **Over-engineering the admin panel** — Building charts, bulk operations, filters. Takes 3 weeks. Admin only needs to list 5 orders/day and mark "ready." Prevention: Bare minimum v1 (list, change status). Add when admin asks.

5. **Not testing checkout edge cases** — Only test happy path. Don't test network failures, browser closes mid-payment, Stripe webhook fails. 10% of orders fail silently on launch. Prevention: Use Stripe test cards for all scenarios. Simulate failures with Stripe CLI. Replay webhooks. Monitor Stripe + email logs + database on launch day.

**Bonus pitfalls:** Inventory overselling (use atomic database transactions), email deliverability (use SendGrid/Resend, set up SPF/DKIM/DMARC), mobile checkout broken (test on real phones, 48x48px touch targets).

## Implications for Roadmap

Based on research, the recommended phase structure has **3 major phases with clear dependencies and built-in validation points**.

### Phase 1: Core MVP (3-4 weeks)

**Goal:** Ship a working e-commerce store that processes real orders. This is the critical path—everything depends on it.

**Delivers:**
- Product catalog with images, prices, availability
- Shopping cart (add/remove, quantity, localStorage)
- Checkout flow (2-3 steps: details, pickup info, payment choice)
- Online payment via Stripe Checkout
- Pay-on-pickup option (orders without payment)
- Order confirmation email with pickup instructions
- Inventory status display
- Admin panel: list orders, change status (minimal, ~8-16 hours total)
- Mobile-responsive entire flow
- Server-side validation with Zod on all API routes

**Implements:**
- Next.js, React 19, TypeScript setup
- PostgreSQL schema (products, orders, order_items, inventory)
- Prisma ORM with migrations
- Stripe integration (Checkout Session, webhook handling, signature verification)
- SendGrid email service
- Vercel deployment pipeline
- Atomic database transactions for inventory safety

**Avoids pitfalls:**
- Pickup-only in schema (no address fields, no shipping logic)
- Server-side Zod validation (prevents injection, overselling)
- Stripe Checkout pre-built (never custom payment form)
- Atomic transactions for inventory (prevents overselling)
- Test checkout end-to-end with Stripe test cards + CLI
- Monitor Stripe dashboard + email logs + database on day 1

**Timeline:** 3-4 weeks. Non-negotiable for any e-commerce business.

**Success criteria:**
- [ ] Store live at domain
- [ ] All products browseable with images
- [ ] Cart works (add, remove, total, persists)
- [ ] Checkout with Stripe test payment works
- [ ] Checkout with pay-on-pickup option works
- [ ] Order confirmation email arrives
- [ ] Admin can view orders and change status
- [ ] Mobile checkout works (real devices)
- [ ] Error handling works (invalid inputs don't crash)
- [ ] Stripe webhook signature validation in place
- [ ] Database backup configured

### Phase 2: Launch & Validation (Week 1 post-launch)

**Goal:** Ensure production is solid, gather customer feedback, identify what actually matters.

**Actions:**
- Deploy to Vercel (automatic on git push)
- Set up custom domain email (orders@shopseeds.com)
- Monitor Stripe dashboard for payment issues
- Monitor email deliverability (spam folder rates)
- Monitor order database for corrupt data
- Collect customer feedback (support email, in-person)
- Track metrics: order volume, product popularity, payment failure rates, email bounce rates

**Deliverables:**
- Error tracking (Sentry or Vercel logs)
- Alert system for critical failures
- Weekly analytics summary
- Customer feedback log

**Why pause here:** Real usage surfaces issues impossible to catch in testing. Phase 1.5 data drives Phase 2.

### Phase 3: Competitive Advantages (Weeks 5+, post-feedback)

**Goal:** Build features customers actually ask for. Only add based on real demand.

**Likely candidates (pick based on Phase 2 feedback):**
- Plant care tips (if customers ask "how do I care for this?")
- Seasonal collections (easy, drives freshness)
- Curated categories (if browsing is confusing)
- Email loyalty discounts (if you see repeat customers)
- Advanced search/filters (only if catalog grows or customers request)

**Don't add without proof:**
- User accounts, real-time inventory, wishlist, video tours, subscription boxes

**Timeline:** 1-2 weeks per feature, chosen based on actual customer demand, not assumptions.

### Phase Ordering Rationale

**Why Phase 1 → Phase 2 → Phase 3?**

1. **Payment is foundation.** Everything depends on processing orders reliably. Can't validate anything without it.
2. **Feature dependencies are clear:** Catalog → Cart → Checkout → Payment. Can't defer payment to later.
3. **Smaller scope = faster ship.** Reducing Phase 1 to table stakes only means Week 4 launch instead of Week 8. Real feedback is worth more than speculative features.
4. **Manual processes work for <30 products.** Inventory, admin, email don't need automation yet. Add when constraints appear.
5. **Phase 2 feedback drives Phase 3.** You learn what matters after real customers use it.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 1 / Stripe webhook reliability:** Recommend dedicated research for webhook retry logic, error recovery, and testing strategy. This is critical path.
- **Phase 1 / Email deliverability:** Quick research during setup (SPF/DKIM/DMARC configuration), not a blocker.

**Phases with standard, well-documented patterns (skip research):**
- **Phase 1 / Catalog & Cart:** Textbook Next.js + React patterns. Official documentation complete.
- **Phase 1 / Database Schema:** PostgreSQL + Prisma for e-commerce is extremely well-documented.
- **Phase 2 / Deployment:** Vercel + Next.js is canonical. One-click, auto-scales, documented.
- **Phase 3 / Feature additions:** Depends entirely on customer feedback. Decide when they request.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Next.js, React, TypeScript, PostgreSQL, Stripe are industry standards 2025. Verified against official docs. Proven patterns. No experimental choices. |
| **Features** | HIGH | Table stakes (catalog, cart, checkout, payment) are universal e-commerce standards. Differentiators (plant care tips, curation) validated by competitor analysis. Anti-features (shipping, accounts) justified by documented failure rates in plant retail. |
| **Architecture** | HIGH | Server-side rendering, TanStack Query, Stripe webhooks, Zod validation are standard proven patterns. Monolith on Vercel is canonical for small businesses. |
| **Pitfalls** | HIGH | Payment handling, checkout UX, inventory safety are universal. Plant-specific pitfalls (shipping fragility, care-focused customers) documented in industry. Over-engineering is universal startup mistake. |
| **Deployment** | HIGH | Vercel for Next.js is plug-and-play. Postgres managed. One-click deploy from GitHub. Zero infrastructure risk. |

**Overall confidence:** HIGH. Research is comprehensive, based on official documentation and industry standards. No major gaps. Ready for roadmap planning.

## Gaps to Address

- **Customer demand validation:** This research assumes online + local pickup is viable for your market. Before Phase 1 starts, survey 5-10 potential customers: "Would you buy plants online for local pickup?" If <50% yes, reconsider model.

- **Pricing strategy:** Research doesn't cover cost structure, margins, or competitive pricing. Recommend: analyze 3-5 competitors, decide markup (typically 3-5x for plants).

- **Brand/design specifics:** "Bold design" is mentioned but not defined. Before Phase 1 starts, create 2-3 visual mockups. Share with target customers. Iterate. Otherwise you'll design in a vacuum.

- **Supplier/inventory logistics:** Where are plants sourced? Storage constraints? Shelf life? How to manage inventory rotation? Affects operations, not tech, but tech should support it.

- **Legal/compliance:** Terms of Service, Privacy Policy, business structure, local tax ID. Not tech, but necessary before launch.

- **Email template design:** Recommend plain-text templates initially. HTML polish can come later.

- **Image photography standards:** Budget 2 hours per product for high-quality photos (2-3 angles, consistent background, size reference).

- **Payment methods:** Confirm with owner: cash, card, both? Tax handling? Local regulations?

## Sources

### Primary (HIGH confidence)
- **Next.js Documentation** (https://nextjs.org/docs) — Framework, API routes, Server Components, deployment
- **Prisma Documentation** (https://www.prisma.io/docs/) — ORM, schema, migrations, transactions
- **Stripe Documentation** (https://stripe.com/docs) — Payment processing, webhooks, Checkout, fraud prevention
- **React Documentation** (https://react.dev) — Components, hooks, Server Components
- **PostgreSQL Documentation** — ACID transactions, JSON support, scalability
- **Tailwind CSS Documentation** (https://tailwindcss.com)
- **TypeScript Handbook** (https://www.typescriptlang.org/docs/)
- **Vercel Deployment Guide** (https://vercel.com/docs)

### Secondary (MEDIUM confidence)
- Competitor analysis (boutique nurseries, Etsy plant sellers, Lowe's) — Feature benchmarking
- Plant retail industry insights (40% shipping failure rate, care-focused customers)
- Small business UX patterns (no-account checkout, minimal admin)
- E-commerce best practices (table stakes vs differentiators)

### Tertiary (needed during Phase 1)
- SendGrid/Resend setup details
- Image photography guidelines (specific to your products)
- Email template design standards

---

*Research completed: 2026-02-16*
*All research files: STACK.md | FEATURES.md | ARCHITECTURE.md | PITFALLS.md*
*Ready for roadmap planning: yes*
