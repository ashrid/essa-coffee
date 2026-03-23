# Phase 2: Launch & Validation - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the built Essa Cafe app to production, configure all third-party services for live operation, validate that the full order flow works reliably with real traffic, and establish a lightweight feedback loop. No new features. Success = customers can browse, order, and pay — and the owner can see/manage those orders — with no silent failures.

</domain>

<decisions>
## Implementation Decisions

### Hosting platform
- **D-01:** App hosted on **Vercel** — zero-config Next.js deployment, auto-deploy on every push to `main`
- **D-02:** Preview deployments enabled — each pull request gets its own preview URL for testing before merging to main

### Database hosting
- **D-03:** PostgreSQL hosted on **Neon** (serverless) — provision via Vercel marketplace integration; use Neon's connection pooling URL for serverless compatibility

### Deployment workflow
- **D-04:** Auto-deploy on push to `main` — no manual deploy step, Vercel handles builds
- **D-05:** Environment variables managed via Vercel dashboard (not CLI or secrets manager)

### Monitoring & error tracking
- **D-06:** No additional monitoring tools — rely on **Vercel function logs** for server errors and **Stripe dashboard** for payment/webhook failures
- **D-07:** Passive alerting only — Stripe emails on failed webhooks, Vercel emails on failed deploys. No active uptime monitoring configured at launch.

### Auth.js audit (folded from todo)
- **D-08:** Before launch, audit the codebase for Auth.js v4→v5 migration gaps — verify magic link flow works end-to-end in production (the todo flagged potential incomplete migration)

### Claude's Discretion
- Exact Neon connection string format (pooled vs direct for Prisma migrate vs runtime)
- Stripe webhook endpoint registration steps
- Order of environment variable setup
- Production database migration strategy (run `prisma migrate deploy` on first deploy)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Key production configuration files (executor must read before touching)
- `.env.example` — full list of required environment variables for production
- `lib/auth.ts` — Auth.js v5 configuration (magic link provider, session strategy)
- `lib/auth-edge.ts` — Edge-compatible auth config (middleware uses this)
- `middleware.ts` — Route protection for `/admin/*` — verify works with production AUTH_URL
- `lib/stripe.ts` — Stripe client singleton (verify STRIPE_SECRET_KEY env var)
- `app/api/webhook/route.ts` — Stripe webhook handler (needs STRIPE_WEBHOOK_SECRET for production endpoint)
- `lib/email.ts` — Gmail SMTP transporter (GMAIL_USER + GMAIL_APP_PASSWORD required; email from-name still says "ShopSeeds" — must be updated to "Essa Cafe" before launch)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/orders.ts` — `createOrderAtomically` handles Stripe + pay-on-pickup paths; no changes needed for deployment
- `prisma/schema.prisma` — schema is production-ready after Phase 1.1 migrations; run `prisma migrate deploy` (not `dev`) in production
- `.env.example` — complete template for all production env vars; use as checklist

### Established Patterns
- Non-blocking email: `Promise.allSettled` in `app/api/checkout/route.ts` and `app/api/webhook/route.ts` — email failures don't block order creation
- Stripe idempotency: `stripeSessionId` uniqueness check in webhook prevents duplicate orders on replay
- Auth.js v5 split config: `lib/auth.ts` (full, Node.js) vs `lib/auth-edge.ts` (edge-compatible) — both must be correctly wired for Vercel Edge Runtime

### Integration Points
- Vercel build will run `prisma generate` (needs `postinstall` script or explicit build command)
- Neon requires `?sslmode=require` on DATABASE_URL in production
- Stripe production webhook must be registered at `https://<production-domain>/api/webhook`
- NEXT_PUBLIC_APP_URL must be set to production domain for email links to work correctly

### Known issue before launch
- `lib/email.ts` from-name and email subjects still say "ShopSeeds" (not updated in Phase 1.1) — executor must update to "Essa Cafe" before launch

</code_context>

<specifics>
## Specific Ideas

No specific references — deployment follows standard Vercel + Neon + Stripe production setup.

</specifics>

<deferred>
## Deferred Ideas

- **Apple Pay support** — user asked about this during discussion; it's a new payment method (scope expansion), not part of Phase 2 deployment. Add to roadmap backlog for Phase 3 or later.

### Reviewed Todos (not folded)
- None — the Auth.js audit was folded into scope (D-08).

</deferred>

---

*Phase: 02-launch-validation*
*Context gathered: 2026-03-23*
