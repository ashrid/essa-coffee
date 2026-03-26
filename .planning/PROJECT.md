# Essa Cafe

## What This Is

An online ordering system for Essa Cafe, a local coffee shop. Customers browse a menu of hot drinks, iced drinks, specialty beverages, and food items, place orders online, and pick up at the shop. The store is managed by a solo owner with a focused menu (~15 items).

## Core Value

Customers can order ahead and pick up fresh coffee without waiting in line — replacing phone orders with a modern mobile-first ordering experience.

## Requirements

### Validated (v1.0 MVP — Shipped 2026-03-26)

- [x] Product catalog with photos, names, prices, and descriptions
- [x] Category filtering (Hot Drinks, Iced Drinks, Specialty, Food)
- [x] Product availability toggle (isAvailable) instead of stock tracking
- [x] Search products by name
- [x] Pickup location and hours
- [x] Shopping cart with localStorage persistence
- [x] Guest checkout (name, email, phone)
- [x] Stripe online payment
- [x] Pay-on-pickup option
- [x] Order confirmation emails (customer + admin notification)
- [x] Magic link admin authentication
- [x] Admin product management (add, edit, toggle availability)
- [x] Admin order management and status updates
- [x] QR code generation for order pickup
- [x] Mobile QR scanning for staff
- [x] Rate limiting on verification endpoints
- [x] Payment status tracking (paidAt, paidAmount)
- [x] Order status history logging
- [x] Modern, bold visual design (espresso/caramel/cream palette)
- [x] Fully responsive on mobile/tablet

### Active (Future Milestones)

- Client-side shop hours validation (server-side only currently)
- Order status history UI display (logged but not shown)
- Payment status in customer emails

### Out of Scope

- Delivery/shipping — pickup only
- Customer accounts/login — guest checkout only
- Multi-staff access — solo operation
- Table service — pickup counter only

## Context

- Coffee shop ordering system (pivoted from plant store in Phase 01.1)
- Local customer base
- Focused menu: ~15 items across 4 categories
- Solo-managed — simple admin interface
- Pickup-only fulfillment
- Mobile-first design priority

## Constraints

- **Catalog size**: ~15 coffee/food items — simple architecture
- **Solo admin**: One person manages everything
- **Pickup only**: No delivery logic
- **Payment flexibility**: Stripe + pay-on-pickup required

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pickup-only | Simplifies fulfillment for counter service | ✓ Shipped |
| isAvailable toggle | Coffee items don't need quantity tracking | ✓ Shipped |
| No customer accounts | Reduces friction for quick orders | ✓ Shipped |
| Espresso/caramel palette | Warm coffee aesthetic | ✓ Shipped |
| Magic link auth | No password management for solo owner | ✓ Shipped |
| PostgreSQL token store | Works across serverless instances | ✓ Shipped v1.0 |
| Stripe + pay-on-pickup | Dual payment for local flow | ✓ Shipped |
| QR code pickup | Contactless order handoff | ✓ Shipped |
| Rate limiting | Prevent QR endpoint abuse | ✓ Shipped |

## Current State

**v1.0 MVP SHIPPED** — 2026-03-26

5 phases complete (22 plans, 24 tasks):
- Core MVP (catalog, cart, checkout, admin)
- Coffee Ordering Pivot (rebrand, schema migration)
- Launch & Validation (pre-launch fixes)
- Admin QR Scanner (mobile scanning)
- Production Readiness (token store, payment tracking, rate limiting)

All E2E flows verified working. 18/19 requirements satisfied (1 intentionally redesigned). 90% integration health.

**Next milestone:** Feature requests based on customer feedback

---
*Last updated: 2026-03-26 — v1.0 milestone shipped*
