# Stack Research: Small E-Commerce Store

**Domain:** Local e-commerce store (plant/seed sales, under 30 products, local pickup)
**Researched:** 2026-02-16
**Confidence:** MEDIUM (training data verified with available documentation)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | 15.x | Full-stack framework | Industry standard for small-medium e-commerce. Handles frontend + backend in single codebase. Built-in API routes, great DX. Perfect for solo developers. |
| **React** | 19.x | UI library | Bundled with Next.js. Large ecosystem, abundant e-commerce libraries. Easy to find answers. |
| **TypeScript** | 5.x | Language | Prevents common cart/checkout bugs. Essential for payment processing. Slightly slower initial dev, massive time savings in debugging. |
| **PostgreSQL** | 16.x | Database | ACID guarantees for transactions (orders, payments). JSON support for flexible product metadata. Superior to MongoDB for transactional workloads. Single database scales to thousands of products. |
| **Prisma** | 6.x | Database ORM | Type-safe queries, auto-migrations, fantastic DX. Auto-generates TypeScript types from schema. Eliminates entire class of SQL bugs. |
| **Stripe** | Latest API | Payment processing | Dominant in small e-commerce. Handles both online payments + recurring payments. Built-in webhooks for order fulfillment. Most flexible for "pay on pickup" flow. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **React Hook Form** | 7.x | Form management | Shopping cart state, checkout forms. Lightweight, no dependencies. Pairs perfectly with TypeScript. |
| **Zod** | 3.x | Schema validation | Validate product data, orders, payment requests server-side. Prevents injection attacks. Works with Prisma. |
| **TanStack Query** | 5.x | Server state | Fetch products, orders from backend. Handles caching, refetching, optimistic updates. Industry standard. |
| **Tailwind CSS** | 4.x | Styling | Rapid UI development, responsive design out of box. Bold design easy to achieve. No CSS file bloat. |
| **Headless UI** | Latest | Accessible components | Shopping cart dropdowns, modals, menus. Accessible by default. Pairs perfectly with Tailwind. |
| **Framer Motion** | 11.x | Animations | Smooth transitions, page animations for "modern bold design" feel. Easy to use, performant. |

### Payment & Order Handling

| Tool | Purpose | Why Recommended |
|------|---------|-----------------|
| **Stripe** | Online payments | PCI compliance handled. Supports Stripe Payments + Custom Payments for pay-on-pickup. Webhooks for automatic order status updates. |
| **Stripe CLI** | Local testing | Test payment flows locally without deploying. Simulate webhook delivery. |

### Infrastructure & Deployment

| Tool | Purpose | Why Recommended |
|------|---------|-----------------|
| **Vercel** | Hosting | Official Next.js host. One-click deployments from Git. Free tier sufficient for under 30 products. Auto-scales with traffic. PostgreSQL add-on via Vercel Postgres (or external). |
| **Vercel Postgres** | Database hosting | Managed PostgreSQL on Vercel infrastructure. Or use external provider (Railway, Neon, Supabase) if preference. |
| **Docker** | Containerization | Optional but recommended for local dev consistency. Not required for Vercel deployment. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Next.js CLI** | Project scaffolding | `npx create-next-app@latest --typescript` |
| **Prettier** | Code formatting | Auto-format on save. Avoid style debates. |
| **ESLint** | Linting | Catch bugs. ESLint + Prettier is standard. |
| **Vitest** + **React Testing Library** | Testing | Vitest is faster than Jest for Next.js. Test components + API routes. |

## Installation

```bash
# Create project
npx create-next-app@latest shop-seeds --typescript --tailwind

# Core dependencies
npm install react react-dom next typescript

# Database
npm install @prisma/client prisma

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# State & data fetching
npm install @tanstack/react-query axios

# UI & animations
npm install @headlessui/react framer-motion

# Payment processing
npm install stripe @stripe/react-stripe-js @stripe/stripe-js

# Development dependencies
npm install -D @types/node @types/react @types/react-dom prettier eslint-config-prettier eslint-plugin-prettier

# Testing (optional but recommended)
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Next.js** | **SvelteKit** | If you know Svelte. Smaller bundle, similar DX. Less common, smaller ecosystem. Use if you prioritize bundle size over hiring/support. |
| **Next.js** | **Remix** | If you need multi-region deployment (runs on regular Node.js). Slightly more powerful routing. Not necessary for single-region small store. |
| **Next.js** | **Nuxt.js** | If you prefer Vue. Smaller community than React for e-commerce. Skip unless Vue is team preference. |
| **PostgreSQL** | **MongoDB** | If you have MongoDB expertise. NOT recommended—e-commerce requires transactions, MongoDB is weaker here. Only use if forced by existing infrastructure. |
| **PostgreSQL** | **SQLite** | For truly minimal setup (local development only). NOT suitable for production—can't handle concurrent checkouts reliably. Use only for prototype/learning. |
| **Stripe** | **Square** | If you want in-person payment terminal too. Square is better for retail + online. For online-only, Stripe is simpler. |
| **Stripe** | **PayPal** | If targeting international customers heavily. PayPal charges higher fees (~3.5% vs Stripe ~2.9%). Good backup but not primary. |
| **Vercel** | **Railway** | Simpler pricing model, more transparent. Good alternative. Vercel is faster for Next.js specifically. Neither is wrong. |
| **Vercel** | **Render** | Free tier with auto-sleep (might cause cold starts). Cheaper long-term if traffic is low. Railway or Render both solid. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Create React App (CRA)** | Legacy, slower builds, no server-side rendering. The ecosystem moved on. Next.js does everything CRA does + more. | **Next.js** — zero-config alternative that's better. |
| **MongoDB** | Doesn't support ACID transactions (well enough for e-commerce). Payment data, orders must be transactional. | **PostgreSQL** — designed for this. |
| **GraphQL for small store** | Overkill. REST API is simpler, faster to iterate. You have <30 products, not a Netflix scale problem. | **REST API** (via Next.js API routes). Use GraphQL only if querying relationships becomes unwieldy (won't happen here). |
| **Redux** | Legacy state management. React 19 + Context + TanStack Query handles this better. Redux is for massive apps. | **React Context** + **TanStack Query** — modern, lighter. |
| **CSS-in-JS** (styled-components, emotion) | Adds runtime overhead. Tailwind is faster, cleaner. | **Tailwind CSS** — static extraction is better. |
| **Traditional hosting** (cPanel, shared hosting) | Painful deployment, no auto-scaling, outdated Node.js versions, poor support for modern JS. | **Vercel, Railway, Render** — built for modern JS. |
| **Custom payment integration** | PCI-DSS compliance is complex and risky. Never handle raw card data yourself. | **Stripe** (or Square) — they handle compliance, you just integrate. |

## Stack Patterns by Variant

**If you want to minimize deployment complexity:**
- Use **Vercel** (official Next.js host, one-click deploy)
- Use **Vercel Postgres** (managed database included)
- Reason: Eliminates database ops entirely, auto-scales, global CDN included

**If you want maximum flexibility / lower long-term costs:**
- Use **Railway** or **Render** for hosting
- Use **Neon** or **Supabase** for PostgreSQL
- Reason: More transparent pricing, easier to self-manage, no vendor lock-in

**If you want to support international payments:**
- Add **Stripe Connect** for multi-currency
- Or add **PayPal** as secondary payment method
- Reason: Stripe + PayPal together covers 95%+ of payment methods globally

**If design is highest priority:**
- Use **Framer Motion** for animations (as recommended)
- Use **Tailwind CSS** with custom config (colors, spacing) for brand consistency
- Consider **shadcn/ui** components as starting point
- Reason: Bold design requires smooth UX + distinctive visuals. These tools enable both.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| **Next.js 15.x** | **React 19.x** | React 19 is stable, fully compatible. Use Server Components for optimal performance. |
| **Prisma 6.x** | **PostgreSQL 14+** | Prisma 6 requires PG 14 minimum. PG 16 is latest, fully supported. |
| **TypeScript 5.x** | **Node.js 18.x+** | TypeScript 5.3+ supports latest ECMAScript. Node 18+ is stable LTS. |
| **Stripe API** | **@stripe/react-stripe-js 2.x** | Stripe regularly updates API. Use latest @stripe/stripe-js package to avoid API mismatches. |
| **TanStack Query 5.x** | **React 19.x** | Query 5 optimized for React 19. Earlier versions work but without full benefits. |

## Development Workflow

### Local Setup
```bash
# Clone repo
git clone <repo>
cd shop-seeds

# Install dependencies
npm install

# Setup database (local PostgreSQL or Docker)
docker run --name postgres-local -e POSTGRES_PASSWORD=dev -d postgres:16
# Or use Vercel Postgres in development

# Setup Prisma
npx prisma generate
npx prisma migrate dev --name init

# Setup environment variables
cp .env.example .env.local
# Add: DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Start dev server
npm run dev
# Runs on http://localhost:3000
```

### Deployment (Vercel)
```bash
# Push to Git
git push origin main

# Vercel auto-deploys from main branch
# Monitor: vercel.com/dashboard

# Database migrations in production
npx prisma migrate deploy
```

## Recommended Project Structure

```
shop-seeds/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage (product listing)
│   ├── products/
│   │   └── [id]/
│   │       └── page.tsx     # Product detail
│   ├── cart/
│   │   └── page.tsx         # Shopping cart
│   ├── checkout/
│   │   └── page.tsx         # Checkout flow
│   ├── api/
│   │   ├── products/        # Product endpoints
│   │   ├── orders/          # Order creation
│   │   └── stripe/
│   │       ├── webhook.ts   # Stripe webhook handler
│   │       └── checkout-session.ts  # Create Stripe session
│   └── admin/
│       ├── layout.tsx       # Admin layout
│       ├── products/
│       │   └── page.tsx     # Product management
│       └── orders/
│           └── page.tsx     # Order management
├── components/
│   ├── ProductCard.tsx
│   ├── ShoppingCart.tsx
│   ├── CheckoutForm.tsx
│   └── AdminPanel.tsx
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── stripe.ts            # Stripe client
│   └── validation.ts        # Zod schemas
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/
├── public/
│   └── images/              # Product images
├── .env.local               # Local secrets (git-ignored)
├── .env.example             # Template for env vars
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Security Considerations

### Payment Data
- Never handle card numbers directly. Use Stripe's tokenization.
- Store only Stripe transaction IDs in your database.
- Webhook validation: Verify `stripe-signature` header on all webhooks.

### API Routes
- All POST endpoints creating orders must verify user session (if needed).
- Use environment variables for Stripe keys (never commit secrets).
- Validate all inputs with Zod before processing.

### Database
- Migrations must be tested in staging before production.
- Use parameterized queries (Prisma does this automatically).
- Backup strategy: Vercel Postgres includes automated backups.

## Performance Considerations

### For Under 30 Products
- Static generation (`generateStaticParams`) for product pages: Cache indefinitely
- Incremental Static Regeneration (ISR) for product listing: Revalidate every 1 hour
- API route caching: Cache product listing API response for 5 minutes
- Image optimization: Use Next.js `Image` component, auto-optimize JPEGs

### Database
- Index on `product.id` (auto-indexed by Prisma)
- Index on `order.status` (for admin queries)
- Query optimization: Prefer `select` to avoid fetching full products when not needed

## Testing Strategy

### Unit Tests
- Zod schemas (validation logic)
- Helper functions (price calculations, tax, etc.)

### Integration Tests
- API routes: Test product fetching, order creation
- Database: Test order creation with Prisma
- Stripe: Test webhook handling (use Stripe CLI for local testing)

### E2E Tests (optional for v1)
- Product browsing → Add to cart → Checkout flow
- Stripe payment success → Order confirmation

```bash
npm run test              # Run Vitest
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

## Sources

- **Next.js Documentation** (https://nextjs.org/docs) — Verified current version, API routes, deployment
- **Prisma Documentation** (https://www.prisma.io/docs/) — Database setup, migrations, type safety
- **Stripe Documentation** (https://stripe.com/docs) — Payment processing, webhook handling
- **React Documentation** (https://react.dev) — React 19 features, Server Components
- **Tailwind CSS Documentation** (https://tailwindcss.com/docs) — Styling approach
- **TypeScript Handbook** (https://www.typescriptlang.org/docs/) — Type safety benefits
- **Vercel Deployment Guide** (https://vercel.com/docs) — Hosting and database setup

---

*Stack research for: ShopSeeds (small e-commerce store, local pickup model)*
*Researched: 2026-02-16*
*Next review: 2026-04-16 (3 months—framework/library versions may change)*
