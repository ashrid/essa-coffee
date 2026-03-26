# Milestones

## v1.0 Essa Cafe MVP (Shipped: 2026-03-26)

**Phases completed:** 5 phases, 22 plans, 24 tasks

**Key accomplishments:**

- Next.js 15 App Router project with Prisma schema (Category/Product/Order models), earthy Tailwind theme (forest/sage/cream), and shadcn/ui New York components
- One-liner:
- Zustand cart store with localStorage persistence, slide-out drawer (shadcn Sheet), full cart page with +/- quantity controls, and toast notifications on add-to-cart
- One-liner:
- Resend-powered transactional emails with React Email templates, integrated into checkout and Stripe webhook for automatic customer confirmations and admin notifications
- Magic Link Auth (Auth.js v5 + Resend):
- 1. [Rule 1 - Bug] TypeScript cascade — 16 files still referenced removed schema fields
- Admin panel fully pivoted to coffee context — ProductForm uses isAvailable/isFeatured toggles, dashboard shows 2-stat grid, product list shows availability badge, all old stock/care field references removed
- Espresso/caramel Tailwind palette swap, Essa Cafe rebrand across all store/admin/email files, and 2-state AvailabilityBadge replacing the old StockBadge
- Essa Cafe coffee menu seeded (4 categories, 14 products) and full Phase 01.1 build verified clean at exit 0 with 37 static pages
- One-liner:
- Store is live and ready for customer traffic as of 2026-03-25.
- One-liner:
- Modified: `app/(admin)/admin/scan/page.tsx`
- Migrated in-memory magic link token store to PostgreSQL, enabling authentication across Vercel serverless instances
- Stripe webhook now updates paymentStatus, paidAt, paidAmount for all paid orders. Pay-on-pickup orders auto-set to PAID when admin marks COMPLETED. All status changes logged to OrderStatusHistory table.
- Fixed error prefix mismatch between lib/orders.ts (ITEM_UNAVAILABLE) and checkout route (INSUFFICIENT_STOCK), created shared ApiError interface and ErrorCodes enum for consistent error handling across all API routes
- QR verification endpoint hardened with rate limiting, completed order handling, and case normalization for robust staff scanning experience
- Removed unused qrTokenExpiresAt index from Order model, relying on existing @unique constraint for stripeSessionId lookups

---
