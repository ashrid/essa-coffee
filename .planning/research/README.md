# Research Findings: ShopSeeds Stack

This directory contains comprehensive ecosystem research for ShopSeeds, a small local e-commerce plant/seed store.

## Quick Start

**Start here:** Read `SUMMARY.md` first (5-10 mins) for executive overview and roadmap implications.

**Then dive into:** STACK.md → FEATURES.md → ARCHITECTURE.md → PITFALLS.md (in any order based on your needs).

## Files Overview

| File | Focus | Key Content | Read Time |
|------|-------|-----------|-----------|
| **SUMMARY.md** | Executive overview | Recommended stack, roadmap phases, confidence levels, success criteria | 10 mins |
| **STACK.md** | Technology choices | Specific versions (Next.js 15, React 19, PostgreSQL 16, Stripe), alternatives, what NOT to use | 20 mins |
| **FEATURES.md** | Product requirements | Table stakes vs differentiators, MVP definition, 100-hour estimate | 25 mins |
| **ARCHITECTURE.md** | System design | Data flow, design patterns, anti-patterns, scalability, deployment | 20 mins |
| **PITFALLS.md** | Risk mitigation | 6 critical pitfalls, 5 moderate, 5 minor, phase-specific warnings, debugging guide | 20 mins |

**Total research: ~1,350 lines, HIGH confidence (specific versions, verified with current docs)**

## Recommended Stack (TL;DR)

```
Frontend:    Next.js 15 + React 19 + TypeScript
Backend:     Next.js API Routes (same repo)
Database:    PostgreSQL 16 + Prisma 6 ORM
Payment:     Stripe (online payments + pay-on-pickup)
Styling:     Tailwind CSS 4 + Framer Motion
Hosting:     Vercel (one-click deploy from Git)
```

**Why this stack for ShopSeeds:**
- Solo developer → monolith is faster than microservices
- <30 products → PostgreSQL outperforms NoSQL
- Local pickup only → no shipping complexity
- Bold design goal → Tailwind + animations solve this well
- Payment critical → Stripe is bulletproof, industry standard
- Vercel for Next.js → zero infrastructure overhead

## Roadmap Phases (from SUMMARY.md)

### Phase 1: MVP (Weeks 1-4)
Ship a working store: catalog → cart → checkout → payment → email confirmation

### Phase 1.5: Validate (Days 1-7 after launch)
Monitor Stripe/emails, fix bugs, collect customer feedback

### Phase 2: Polish (Weeks 5-6)
Ship features customers actually asked for (not features you imagined)

### Phase 3: Scale (Week 7+, if applicable)
Handle growth constraints (unlikely unless this becomes massively successful)

## Critical Success Factors

1. **Payment handling is bulletproof** (use Stripe pre-built checkout, validate webhooks)
2. **Checkout UX is simple** (2-3 steps, mobile-first, no unnecessary fields)
3. **Validate inputs on server** (Zod schemas, never trust client-side)
4. **DO NOT ship shipping** (plants are fragile, solo ops can't handle it)
5. **Skip unnecessary features** (user accounts, real-time inventory, bloated admin)

## What NOT to Build (Anti-Features)

- **Shipping:** Fragile product + solo ops = disaster. Local pickup is your feature.
- **User accounts:** No shipping = no reason to track order history. Email-based loyalty is simpler.
- **Real-time inventory:** For <30 products, manual daily admin updates are fine.
- **Marketplace:** You're selling your plants, not running a platform.
- **Advanced admin dashboard:** List orders, change status. That's it. Add more if admin asks.

## Key Recommendations

### For Launch (V1)
- [ ] Product catalog with search
- [ ] Shopping cart (localStorage)
- [ ] Checkout with payment choice (Stripe or pay-on-pickup)
- [ ] Order confirmation email
- [ ] Admin product management
- [ ] Admin order management
- [ ] Mobile responsive design
- [ ] Bold, modern design (not generic)

### For Post-Launch (V1.1+, based on feedback)
- [ ] Plant care tips (high value, differentiator)
- [ ] Seasonal collections (keep content fresh)
- [ ] Email loyalty program (repeat customers)
- [ ] Estimated pickup time (transparency)
- [ ] Better product organization (if catalog grows)

### Never (Out of Scope)
- [ ] Shipping
- [ ] User accounts
- [ ] Multi-location support
- [ ] Subscription boxes
- [ ] Video tours
- [ ] Wishlists (email button instead)

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Stack | **HIGH** | Industry standards (Next.js, React, PostgreSQL, Stripe). 2025-verified with current docs. |
| Features | **HIGH** | Table stakes universal, differentiators validated by competitor analysis. |
| Architecture | **HIGH** | Proven patterns. Monolith on Vercel is standard for this scale. |
| Pitfalls | **HIGH** | Well-documented mistakes. Industry consensus on payment safety, checkout UX, scope creep. |
| Deployment | **HIGH** | Zero-risk. Vercel + Postgres + Stripe are managed, mature services. |

## Next Steps

1. **Read SUMMARY.md** (executive overview)
2. **Read STACK.md** (get npm install commands)
3. **Create project:** `npx create-next-app@latest shop-seeds --typescript --tailwind`
4. **Follow project structure** in STACK.md
5. **Build Phase 1 features** in order: catalog → cart → checkout → payment → email
6. **Reference ARCHITECTURE.md** for design patterns
7. **Reference PITFALLS.md** before each feature (prevention > fixing bugs)
8. **Monitor during launch** (Stripe dashboard, email logs, database)

## Questions to Validate Before Coding

- **Market:** Have you surveyed ~5-10 potential customers? "Would you buy plants online for local pickup?" (need 50%+ yes)
- **Pricing:** Analyzed 3-5 competitors? Decided on markup? (typically 3-5x for plants)
- **Suppliers:** Where do plants come from? Storage/shelf life? Inventory rotation?
- **Legal:** Terms of Service, Privacy Policy, business structure, tax ID? (consult lawyer if unsure)
- **Brand:** Created 2-3 design mockups? Tested with target customers? (don't design in a vacuum)

## Success Criteria for V1 Launch

Before calling it done, verify:
- Store is live at your domain (DNS working)
- All products browseable with images
- Shopping cart persists across refresh
- Stripe test payment works
- Pay-on-pickup option works
- Order confirmation email arrives (check spam)
- Admin can CRUD products and orders
- Mobile checkout works (real iPhone + Android)
- Error handling is graceful (no crashes)
- Stripe webhook validation in place

If all pass: soft-launch to friends/family. If most fail: you have work to do.

## Sources & Verification

This research follows the source hierarchy:
1. **Official documentation** (Next.js, React, Prisma, Stripe, Vercel)
2. **Verified with current docs** (versions as of Feb 2026)
3. **Industry consensus** (competitor analysis, e-commerce best practices)
4. **Training data** (flagged as MEDIUM confidence where not verified)

All specific version numbers are 2025-current and should be re-verified if this research sits >3 months.

## Team Context

This research is part of the GSD (Get-Shit-Done) methodology:
- **Orchestrator:** Creates roadmap based on this research
- **Implementation:** Use STACK.md + FEATURES.md to prioritize work
- **Validation:** Use PITFALLS.md as a prevention checklist
- **Deployment:** Follow ARCHITECTURE.md for system design

Research is intentionally opinionated (not wishy-washy) to make roadmap decisions clear.

---

**Project:** ShopSeeds (local plant e-commerce store)
**Researched:** 2026-02-16
**Status:** Research Complete → Ready for Roadmap Creation
