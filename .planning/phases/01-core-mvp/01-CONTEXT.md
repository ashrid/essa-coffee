# Phase 1: Core MVP - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship a working e-commerce store that accepts orders with online payment and pay-on-pickup options. Customers can browse products, add to cart, and complete checkout. Admin can manage catalog, orders, and inventory. Store is mobile-responsive.

</domain>

<decisions>
## Implementation Decisions

### Storefront look & feel
- Grid of cards layout for product catalog (2-3 columns desktop, 2 columns mobile)
- Earthy + modern brand personality: natural tones (greens, cream) with modern layout and bold typography
- Homepage: featured products section at top (auto-selected), then full catalog grid below
- Left sidebar with categories, "in stock only" toggle, and price sort (low-high, high-low)
- Out-of-stock products shown grayed out with badge, not hidden
- Dedicated product detail page (not modal/overlay)
- Dedicated "Pickup Info" page linked in navigation, also shown during checkout
- Greens + cream color palette: forest/sage greens with warm cream backgrounds
- Empty category state: friendly message with plant illustration ("Nothing here yet")
- Placeholder store name/tagline for now — owner will finalize branding later

### Shopping & checkout flow
- Cart: slide-out drawer for quick view, dedicated cart page for final confirmation before checkout
- Toast notification when adding items to cart (not auto-open slide-out)
- Full quantity control in cart (+/- buttons and direct number input)
- Cart persists in localStorage across browser sessions
- 2-step checkout flow: Step 1 (contact details), Step 2 (payment selection + confirm)
- Guest info collected: name, email, phone, optional notes field
- Payment selection via radio buttons: "Pay now (card)" and "Pay on pickup (cash/card)"
- Stock validated at checkout time (not real-time) — clear error if item unavailable
- Confirmation page + email after order placed
- Confirmation email includes full pickup details (address, hours, instructions)
- No minimum order amount
- Pickup during business hours only — no time slot selection

### Admin panel
- Dashboard overview as landing page: new orders count, low stock alerts, today's revenue
- Magic link authentication (email-based, no password)
- Order status flow: New → Ready for pickup → Completed, plus Cancelled and Refunded states
- Low stock alerts: dashboard badge count + highlighted rows in product list
- Low stock threshold configurable per product
- Admin panel is mobile-friendly (check orders and update status on the go)
- Admin gets email notification for each new order
- Multiple images per product (up to 5)
- Products ordered automatically by newest first (no manual reorder)
- Featured products auto-selected by system (no manual toggle)
- Rich text editor for product descriptions (bold, lists, headings)
- Admin-managed categories (can create/edit/delete, not hardcoded)

### Claude's Discretion
- Product editing UX (inline vs form page — Claude picks based on data complexity)
- Refund handling (auto Stripe refund vs manual — Claude picks based on complexity trade-off)
- Loading skeleton and error state designs
- Exact spacing, typography, and component styling
- Auto-featured product selection algorithm
- Dashboard stats layout and design

</decisions>

<specifics>
## Specific Ideas

- "Earthy + modern" means natural tones (greens, terracotta feel) but with modern layout and bold type — differentiates from typical soft/pastel plant store aesthetics
- Sidebar categories for filtering, not just top nav tabs
- Both cart experiences: quick slide-out for browsing flow, full page for checkout readiness
- Care/growing instructions section on product detail pages alongside description
- Related products (2-3 from same category) shown at bottom of product detail page
- Image carousel/slider on product detail page (swipeable)
- Simple text search for products (matches names and descriptions) — no autocomplete needed for ~30 products

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-core-mvp*
*Context gathered: 2026-02-16*
