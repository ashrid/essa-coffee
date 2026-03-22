# ShopSeeds

## What This Is

An online webstore for a local business selling small house plants and seed packets. Customers browse a catalog, add items to a cart, check out, and pick up their order locally. The store is managed by a solo owner with a small catalog (under 30 products).

## Core Value

Customers can browse plants and seeds online, place an order, and pick it up — replacing informal selling with a professional storefront.

## Requirements

### Validated

Validated in Phase 01 (core-mvp), human-verified 2026-03-22:

- [x] Product catalog with photos, names, prices, and descriptions
- [x] Shopping cart and checkout flow
- [x] Online payment option (card/mobile) — Stripe Checkout
- [x] Pay-on-pickup option
- [x] Order management for the owner (view, update status)
- [x] Product management for the owner (add, edit, remove)
- [x] Customer order confirmation and status
- [x] Modern, bold visual design — earthy/modern (forest green + cream)
- [x] Transactional emails — customer confirmation + admin notification
- [x] Magic link admin authentication

### Active

(All Phase 01 requirements validated — awaiting Phase 02 deployment)

### Out of Scope

- Delivery/shipping — pickup only for v1, delivery planned for later
- Customer accounts/login — not needed for a small local store initially
- Accessories (pots, soil, tools) — plants and seeds only
- Multi-staff access — solo operation
- Detailed plant care info — basic product info only for v1

## Context

- Brand new business, no existing website or e-commerce presence
- Local customer base (city/region)
- Small catalog under 30 items: house plants and seed packets
- Solo-managed — needs a simple admin interface, not a complex CMS
- Pickup-only fulfillment simplifies logistics significantly
- Owner wants a modern, bold aesthetic — not the typical soft/earthy plant store look

## Constraints

- **Catalog size**: Under 30 products initially — architecture should be simple, not enterprise-grade
- **Solo admin**: One person manages everything — admin UX must be efficient
- **Pickup only**: No shipping/delivery logic in v1
- **Payment flexibility**: Must support both online payment and pay-on-pickup

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pickup-only for v1 | Simplifies fulfillment, delivery added later | Implemented |
| Basic product info | Name/photo/price/description sufficient for small catalog | Implemented |
| No customer accounts | Reduces friction for buyers, solo owner doesn't need CRM | Implemented |
| Modern & bold design | Owner's preference, differentiates from typical plant stores | Implemented — earthy/modern (forest green + cream) |
| Magic link admin auth | No password management for solo owner | Implemented — Auth.js v5 + Resend |
| Stripe + pay-on-pickup | Dual payment paths for local pickup flow | Implemented |

## Current State

Phase 01 (core-mvp) complete — full working MVP built and human-verified. Ready for Phase 02 (launch & validation / deployment).

---
*Last updated: 2026-03-22 — Phase 01 complete*
