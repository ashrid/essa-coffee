---
phase: 01-core-mvp
plan: "02"
subsystem: storefront
tags: [ui, frontend, nextjs, prisma]
dependency_graph:
  requires: ["01-01"]
  provides: ["product-catalog", "product-detail", "homepage", "shop-page"]
  affects: ["01-03", "01-04"]
tech_stack:
  added: []
  patterns:
    - "Server Components with Prisma for data fetching"
    - "Client Components for interactivity (use client)"
    - "ISR for product detail pages (60s revalidate)"
    - "URL search params for filter state"
    - "Debounced search with useMemo"
key_files:
  created:
    - app/(store)/page.tsx
    - app/(store)/shop/page.tsx
    - app/(store)/shop/ShopPageClient.tsx
    - app/(store)/shop/[slug]/page.tsx
    - app/(store)/shop/[slug]/AddToCartButton.tsx
    - components/store/ProductGrid.tsx
    - components/store/FeaturedProducts.tsx
    - components/store/SearchBar.tsx
    - components/store/CategorySidebar.tsx
    - components/store/ProductImageCarousel.tsx
    - components/store/RelatedProducts.tsx
    - components/ui/checkbox.tsx
    - components/ui/select.tsx
  modified:
    - components/store/ProductCard.tsx
    - lib/auth.ts
  deleted: []
decisions:
  - "Used Prisma Decimal-compatible types (number | string | { toString() }) for price props"
  - "ISR with 60s revalidate for product detail pages"
  - "Client-side search filters server-fetched products (hybrid approach)"
  - "URL search params for filter persistence and shareability"
  - "Touch swipe support in image carousel for mobile UX"
metrics:
  duration: 25
  completed_date: 2026-02-17
---

# Phase 01 Plan 02: Storefront UI Summary

**One-liner:** Public-facing storefront with homepage, filterable product catalog, and ISR-enabled product detail pages with image carousels.

## What Was Built

### Homepage (`app/(store)/page.tsx`)
- Hero section with forest-600 background and call-to-action
- Featured products section (top 4 featured, in-stock items)
- Full product catalog grid below
- Server Component fetching data directly from Prisma

### Shop Page (`app/(store)/shop/page.tsx` + `ShopPageClient.tsx`)
- Two-column layout: sidebar (250px) + product grid
- Server-side filtering by category and in-stock status
- Server-side sorting by price (asc/desc) or default (newest)
- Client-side search with 200ms debounce
- Product count display

### Product Detail Page (`app/(store)/shop/[slug]/page.tsx`)
- ISR with `generateStaticParams` and 60s revalidate
- Dynamic metadata generation for SEO
- Image carousel with touch swipe support
- Thumbnail navigation strip
- Product info: name, category badge, price, stock badge
- Description and care instructions sections (HTML rendering)
- Related products from same category
- Add to cart button (client component)

### Components Created

| Component | Type | Purpose |
|-----------|------|---------|
| `ProductGrid` | Server/Client | Responsive grid (2-3 cols) with empty state |
| `FeaturedProducts` | Server | Section wrapper for featured items |
| `SearchBar` | Client | Debounced search input with icon |
| `CategorySidebar` | Client | Category filters, in-stock toggle, price sort |
| `ProductImageCarousel` | Client | Swipeable carousel with thumbnails |
| `RelatedProducts` | Server | Horizontal scroll (mobile) / grid (desktop) |
| `AddToCartButton` | Client | Cart integration with toast |

### UI Components Added
- `checkbox.tsx` - shadcn/ui checkbox for in-stock filter
- `select.tsx` - shadcn/ui select for price sorting

## Key Decisions

1. **Type Safety with Prisma Decimal**: Product price props accept `number | string | { toString() }` to handle Prisma's Decimal type without conversion overhead.

2. **Hybrid Filtering**: Server-side for category/stock/sort (URL params), client-side for search (instant feedback). This balances performance with UX.

3. **ISR for Product Pages**: 60-second revalidation gives near-real-time updates without sacrificing performance.

4. **Touch Swipe in Carousel**: Native touch event handling for mobile image browsing without external libraries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing shadcn/ui components**
- **Found during:** Build verification
- **Issue:** CategorySidebar imported `@/components/ui/checkbox` and `@/components/ui/select` which didn't exist
- **Fix:** Added components via `npx shadcn@latest add checkbox select`
- **Files modified:** `components/ui/checkbox.tsx`, `components/ui/select.tsx`

**2. [Rule 1 - Bug] Type incompatibility with Prisma Decimal**
- **Found during:** Build verification
- **Issue:** Product components expected `price: number | string` but Prisma returns `Decimal`
- **Fix:** Updated type definitions to accept `number | string | { toString(): string }` across all product-related components
- **Files modified:** `ProductCard.tsx`, `ProductGrid.tsx`, `FeaturedProducts.tsx`, `RelatedProducts.tsx`, `ShopPageClient.tsx`

**3. [Rule 1 - Bug] ESLint error in auth.ts**
- **Found during:** Build verification
- **Issue:** Unused `user` variable in session callback
- **Fix:** Removed unused variable from destructuring
- **Files modified:** `lib/auth.ts`

## Verification Results

- [x] `npm run build` succeeds
- [x] Homepage renders with featured products and catalog
- [x] Shop page shows sidebar filters and product grid
- [x] Category filter updates URL and product list
- [x] In-stock toggle filters products
- [x] Price sort works (low/high)
- [x] Search bar filters products client-side
- [x] Product detail page renders with carousel
- [x] Pickup info page shows address, hours, map
- [x] ISR generates static paths for all products

## Self-Check: PASSED

All created files verified:
- `/mnt/c/Users/force/.projects/shop-seeds/app/(store)/page.tsx` - FOUND
- `/mnt/c/Users/force/.projects/shop-seeds/app/(store)/shop/page.tsx` - FOUND
- `/mnt/c/Users/force/.projects/shop-seeds/app/(store)/shop/[slug]/page.tsx` - FOUND
- `/mnt/c/Users/force/.projects/shop-seeds/components/store/ProductGrid.tsx` - FOUND
- `/mnt/c/Users/force/.projects/shop-seeds/components/store/FeaturedProducts.tsx` - FOUND
- `/mnt/c/Users/force/.projects/shop-seeds/components/store/SearchBar.tsx` - FOUND
- `/mnt/c/Users/force/.projects/shop-seeds/components/store/CategorySidebar.tsx` - FOUND
- `/mnt/c/Users/force/.projects/shop-seeds/components/store/ProductImageCarousel.tsx` - FOUND
- `/mnt/c/Users/force/.projects/shop-seeds/components/store/RelatedProducts.tsx` - FOUND

All commits verified:
- `c3fcefc` - feat(01-02): Storefront UI - homepage, shop page, product detail
- `7566c5b` - fix(01-02): Type fixes for Prisma Decimal and ESLint
