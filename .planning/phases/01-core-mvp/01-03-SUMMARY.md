---
phase: 01-core-mvp
plan: "03"
subsystem: ui
tags: [zustand, localstorage, cart, sonner, toast, next-auth, sheet, react]

# Dependency graph
requires:
  - phase: 01-core-mvp
    plan: "01"
    provides: "Next.js 15 scaffold, shadcn sheet component, lib/utils formatPrice, tailwind theme tokens"
provides:
  - Zustand cart store with localStorage persistence (lib/cart-store.ts)
  - CartDrawer: slide-out Sheet from right with item list and CartSummary
  - CartItem: quantity controls (+/-, direct input), remove button, line total
  - CartSummary: subtotal/item count display with configurable CTA
  - Cart page at /cart with full quantity controls and Proceed to Checkout CTA
  - Header updated with live cart badge (totalItems) and openDrawer on click
  - ProductCard with addItem + toast.success("Added to cart") on button click
  - Sonner Toaster in store layout for toast notifications
affects: [04-checkout, 05-admin]

# Tech tracking
tech-stack:
  added:
    - zustand persist middleware (createJSONStorage)
    - sonner Toaster component
  patterns:
    - Zustand cart store with computed totalItems/subtotal updated on every mutation
    - persist partialize: persists items/totalItems/subtotal; isDrawerOpen excluded (UI state)
    - SSR-safe localStorage: storage: typeof window !== "undefined" ? createJSONStorage(() => localStorage) : undefined
    - useCartStore.getState().addItem() for non-hook contexts (ProductCard onClick)
    - CartSummary accepts ctaHref + ctaLabel props for reuse across drawer and cart page

key-files:
  created:
    - lib/cart-store.ts
    - components/store/CartItem.tsx
    - components/store/CartSummary.tsx
    - components/store/CartDrawer.tsx
    - app/(store)/cart/page.tsx
    - components/store/ProductCard.tsx
    - components/store/EmptyState.tsx
    - components/store/Footer.tsx
    - components/store/StockBadge.tsx
    - app/(store)/pickup-info/page.tsx
  modified:
    - components/store/Header.tsx
    - app/(store)/layout.tsx

key-decisions:
  - "Toast-only on add-to-cart (no auto-open drawer) per user decision in 01-CONTEXT.md"
  - "CartSummary uses ctaHref/ctaLabel props for reuse: drawer uses View Cart /cart, cart page uses Proceed to Checkout /checkout"
  - "totalItems and subtotal stored as state values updated on each mutation (not derived via selector) for compatibility with persist middleware"
  - "ProductCard created with full cart integration rather than two-step (create stub then update) since Plan 02 not yet executed"

patterns-established:
  - "Cart state: items[] + isDrawerOpen + totalItems + subtotal all in single Zustand store"
  - "CartItem component reused in both drawer and cart page"
  - "Quantity capped at stockQuantity in addItem and updateQuantity"
  - "Remove item when quantity reaches 0 via updateQuantity"

# Metrics
duration: 6min
completed: 2026-02-16
---

# Phase 1 Plan 03: Cart System Summary

**Zustand cart store with localStorage persistence, slide-out drawer (shadcn Sheet), full cart page with +/- quantity controls, and toast notifications on add-to-cart**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-16T15:55:57Z
- **Completed:** 2026-02-16T16:01:53Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Zustand store persists cart to localStorage under "shop-seeds-cart" with SSR-safe guard
- CartDrawer slides in from right via shadcn Sheet, shows live item list with CartItem components
- Cart page at /cart: desktop grid layout (items + sticky summary sidebar), full quantity controls, "Proceed to Checkout" links to /checkout
- Header badge shows live totalItems count; cart icon click opens drawer (not link)
- ProductCard calls addItem then shows sonner toast — no drawer auto-open per project context decision

## Task Commits

Each task was committed atomically:

1. **Task 1: Zustand cart store with localStorage persistence** - `2fd5340` (feat)
2. **Task 2: Cart drawer, cart page, and product card with cart integration** - `6080e3d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `lib/cart-store.ts` - Zustand store: CartItem interface, addItem/removeItem/updateQuantity/clearCart/openDrawer/closeDrawer, persist to localStorage "shop-seeds-cart"
- `components/store/CartItem.tsx` - Line item: image, name link, unit price, +/- buttons, number input, remove (Trash2), line total
- `components/store/CartSummary.tsx` - Subtotal + item count + CTA button (configurable href/label)
- `components/store/CartDrawer.tsx` - shadcn Sheet from right, reads isDrawerOpen from store, CartItem list or EmptyState, CartSummary at bottom
- `app/(store)/cart/page.tsx` - Full cart page: empty state or grid with CartItem list + sticky CartSummary with "Proceed to Checkout" /checkout CTA
- `components/store/Header.tsx` - Updated: useCartStore totalItems badge, cart icon onClick openDrawer()
- `app/(store)/layout.tsx` - Updated: CartDrawer + Toaster added site-wide
- `components/store/ProductCard.tsx` - Created with cart integration: useCartStore.getState().addItem + toast.success("Added to cart")
- `components/store/EmptyState.tsx` - Friendly empty state with inline SVG sprout illustration
- `components/store/Footer.tsx` - Footer with address, hours, copyright
- `components/store/StockBadge.tsx` - In Stock / Low Stock / Out of Stock badge
- `app/(store)/pickup-info/page.tsx` - Pickup address, hours, instructions

## Decisions Made

1. **Toast-only on add-to-cart** — Per `01-CONTEXT.md` decision: "Toast notification when adding items to cart (not auto-open slide-out)". ProductCard shows toast, does not call openDrawer.

2. **CartSummary ctaHref/ctaLabel props** — Single component handles both use cases: CartDrawer (View Cart, /cart) and cart page (Proceed to Checkout, /checkout).

3. **totalItems and subtotal as stored state** — With Zustand persist middleware, computed selectors need to be stored values to survive hydration. Each mutation recalculates both values. `onRehydrateStorage` recalculates on load.

4. **ProductCard created with cart integration from the start** — Plan 02 had not been executed. Rather than creating a stub and immediately updating it, created with full Plan 03 integration directly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created ProductCard.tsx with cart integration (Plan 02 prerequisite)**
- **Found during:** Task 2 (Cart drawer and cart page)
- **Issue:** Plan 03 Task 2 says "update ProductCard.tsx from Plan 02" but Plan 02 had not been executed. ProductCard.tsx did not exist.
- **Fix:** Created ProductCard.tsx directly with full cart store integration (addItem + toast), avoiding a stub-then-update cycle.
- **Files modified:** components/store/ProductCard.tsx (created)
- **Verification:** TypeScript check passes; useCartStore.getState().addItem + toast.success confirmed in file
- **Committed in:** `6080e3d` (Task 2 commit)

**2. [Rule 3 - Blocking] Committed partial Plan 02 files (EmptyState, Footer, StockBadge, pickup-info)**
- **Found during:** Task 2 (CartDrawer requires EmptyState import)
- **Issue:** EmptyState.tsx, Footer.tsx, StockBadge.tsx, and app/(store)/pickup-info/page.tsx existed from a partial Plan 02 execution but were uncommitted. CartDrawer imports EmptyState.
- **Fix:** Committed these files as part of Task 2 since they are direct dependencies.
- **Files modified:** components/store/EmptyState.tsx, components/store/Footer.tsx, components/store/StockBadge.tsx, app/(store)/pickup-info/page.tsx
- **Committed in:** `6080e3d` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary to unblock cart functionality. ProductCard with full integration is cleaner than stub-then-update. No scope creep — only files directly needed for Plan 03 cart system.

## Issues Encountered

- **Pre-existing TypeScript errors in admin page** — `app/(admin)/admin/page.tsx` has implicit `any` type errors (lines 39, 109). These are from a partial Plan 05 execution, not caused by Plan 03. Logged to `deferred-items.md`. Will be resolved in Plan 05.

## User Setup Required

None - cart runs entirely client-side with localStorage. No external services needed.

## Next Phase Readiness

- Cart system is complete and functional: localStorage persistence, drawer, page, quantity controls
- ProductCard ready to display products once Plan 02 catalog pages are added
- "/checkout" route is the next required endpoint (Plan 04)
- Plan 02 (catalog browsing) still needs to be completed: shop page, product detail page, homepage with featured products

---
*Phase: 01-core-mvp*
*Completed: 2026-02-16*

## Self-Check: PASSED

All required files verified present. All commits verified in git log.

Files verified:
- lib/cart-store.ts: FOUND
- components/store/CartDrawer.tsx: FOUND
- components/store/CartItem.tsx: FOUND
- components/store/CartSummary.tsx: FOUND
- app/(store)/cart/page.tsx: FOUND
- components/store/Header.tsx: FOUND
- components/store/ProductCard.tsx: FOUND
- app/(store)/layout.tsx: FOUND

Commits verified:
- 2fd5340: FOUND (feat(01-03): Zustand cart store)
- 6080e3d: FOUND (feat(01-03): Cart drawer, cart page, product card)
