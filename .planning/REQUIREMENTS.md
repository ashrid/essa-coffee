# Requirements: ShopSeeds

**Defined:** 2026-02-16
**Core Value:** Customers can browse plants and seeds online, place an order, and pick it up — replacing informal selling with a professional storefront.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Catalog

- [ ] **CAT-01**: User can browse all products with photos, names, prices, and descriptions
- [ ] **CAT-02**: User can filter products by category (Houseplants, Seeds, Succulents)
- [ ] **CAT-03**: User can see in-stock / out-of-stock status on each product
- [ ] **CAT-04**: User can search products by name or keyword
- [ ] **CAT-05**: User can view pickup location, hours, and directions

### Shopping

- [ ] **SHOP-01**: User can add products to a cart and adjust quantities
- [ ] **SHOP-02**: User can view cart with subtotal and remove items
- [ ] **SHOP-03**: User can check out as guest (name, email, phone)
- [ ] **SHOP-04**: User can pay online via Stripe at checkout
- [ ] **SHOP-05**: User can select "pay on pickup" as payment method
- [ ] **SHOP-06**: User receives order confirmation email with pickup details

### Admin

- [ ] **ADM-01**: Owner can add new products with name, description, price, images, and category
- [ ] **ADM-02**: Owner can edit existing product details
- [ ] **ADM-03**: Owner can remove products from the catalog
- [ ] **ADM-04**: Owner can view all orders and their current status
- [ ] **ADM-05**: Owner can update order status (new → ready for pickup → completed)
- [ ] **ADM-06**: Owner can update inventory stock levels

### Design

- [ ] **DSN-01**: Store has a modern, bold visual design
- [ ] **DSN-02**: Store is fully responsive on mobile and tablet

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Engagement

- **ENG-01**: Product pages show plant care tips (watering, light, difficulty)
- **ENG-02**: Products can be tagged and displayed as seasonal collections
- **ENG-03**: Products can be browsed by curated categories (Beginner-friendly, Pet-safe, Low-light)
- **ENG-04**: User can add a gift message at checkout
- **ENG-05**: Repeat customers receive email loyalty discounts
- **ENG-06**: Customers can leave photo reviews on products
- **ENG-07**: Users can reach store via live chat during business hours

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Shipping / delivery | Pickup only for v1; plant shipping has high failure rate and complexity |
| Customer accounts / login | No accounts needed — guest checkout reduces friction |
| Real-time inventory sync | Manual daily updates sufficient for <30 products |
| Marketplace (multi-seller) | Selling own inventory only, not a platform |
| Video product tours | High production cost, low proven ROI for small catalog |
| Wishlists / save for later | Adds complexity without clear conversion benefit |
| Subscription boxes | Recurring fulfillment too complex for solo operation |
| Multi-language support | Local business, single language sufficient |
| Social media embeds | Link from footer instead; embedded feeds go stale |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAT-01 | Phase 1 | Pending |
| CAT-02 | Phase 1 | Pending |
| CAT-03 | Phase 1 | Pending |
| CAT-04 | Phase 1 | Pending |
| CAT-05 | Phase 1 | Pending |
| SHOP-01 | Phase 1 | Pending |
| SHOP-02 | Phase 1 | Pending |
| SHOP-03 | Phase 1 | Pending |
| SHOP-04 | Phase 1 | Pending |
| SHOP-05 | Phase 1 | Pending |
| SHOP-06 | Phase 1 | Pending |
| ADM-01 | Phase 1 | Pending |
| ADM-02 | Phase 1 | Pending |
| ADM-03 | Phase 1 | Pending |
| ADM-04 | Phase 1 | Pending |
| ADM-05 | Phase 1 | Pending |
| ADM-06 | Phase 1 | Pending |
| DSN-01 | Phase 1 | Pending |
| DSN-02 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19 ✓
- Unmapped: 0 ✓

---

*Requirements defined: 2026-02-16*
*Traceability updated: 2026-02-16 (roadmap creation)*
