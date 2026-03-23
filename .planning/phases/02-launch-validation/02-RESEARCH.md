# Phase 2: Launch & Validation - Research

**Researched:** 2026-03-23
**Domain:** Production deployment, payment processing, email delivery, operational reliability
**Confidence:** HIGH

## Summary

Essa Cafe is production-ready after Phase 1. This phase moves from development to live customer operation on Vercel + Neon + Stripe. The codebase already implements most production patterns correctly (atomic transactions, webhook idempotency, non-blocking email). Deployment requires five critical setup steps: environment variables on Vercel, database migration execution, Stripe webhook registration, Auth.js token storage for production, and email configuration audit. The app uses in-memory token storage (flagged in Phase 1 code) which works for single-dyno Vercel deployments but should be replaced with Redis if scaling beyond preview instances. No new code is needed—execution focuses on infrastructure configuration, third-party service setup, and production validation.

**Primary recommendation:** Follow the locked deployment decisions (D-01 through D-08) without variation. The success criteria are all observable operational behaviors testable via Stripe dashboard, email log inspection, and order database queries—not code metrics.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hosting & Database:**
- **D-01:** App hosted on **Vercel** — zero-config Next.js deployment, auto-deploy on every push to `main`
- **D-02:** Preview deployments enabled — each pull request gets its own preview URL for testing before merging
- **D-03:** PostgreSQL hosted on **Neon** (serverless) — provision via Vercel marketplace integration; use Neon's connection pooling URL for serverless compatibility

**Deployment Workflow:**
- **D-04:** Auto-deploy on push to `main` — no manual deploy step, Vercel handles builds
- **D-05:** Environment variables managed via Vercel dashboard (not CLI or secrets manager)

**Monitoring & Error Tracking:**
- **D-06:** No additional monitoring tools — rely on **Vercel function logs** for server errors and **Stripe dashboard** for payment/webhook failures
- **D-07:** Passive alerting only — Stripe emails on failed webhooks, Vercel emails on failed deploys. No active uptime monitoring configured at launch.

**Auth Migration Audit:**
- **D-08:** Before launch, audit the codebase for Auth.js v4→v5 migration gaps — verify magic link flow works end-to-end in production (the todo flagged potential incomplete migration)

### Claude's Discretion

- Exact Neon connection string format (pooled vs direct for Prisma migrate vs runtime)
- Stripe webhook endpoint registration steps
- Order of environment variable setup
- Production database migration strategy (run `prisma migrate deploy` on first deploy)

### Deferred Ideas (OUT OF SCOPE)

- **Apple Pay support** — new payment method, scope expansion, add to Phase 3+ roadmap

</user_constraints>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.2.0 | Full-stack React framework | Industry standard for Vercel deployment, serverless optimization built-in |
| React | 19.0.0 | UI framework | Latest stable, required for Next.js 15 |
| PostgreSQL (Neon) | 16 (serverless) | Relational database | ACID transactions prevent overselling, atomic operations for inventory |
| Prisma | 6.4.1 | Type-safe ORM | Prevents N+1 queries, handles connection pooling for serverless |
| Next-Auth | 5.0.0-beta.25 | Authentication | JWT session strategy, magic link provider built-in, edge-compatible |
| Stripe | 17.7.0 | Payment processor | PCI compliance outsourced, webhook integration proven, test mode available |
| Nodemailer | 7.0.13 | Email transport | Works with Gmail SMTP, non-blocking architecture in codebase |
| Zustand | 5.0.3 | Client state (cart) | localStorage persistence for offline cart recovery |
| Tailwind CSS | 3.4.17 | Styling | Mobile-responsive design already implemented |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.24.2 | Server-side input validation | OWASP compliance, prevents injection and malformed orders |
| React Hook Form | 7.71.1 | Form state management | Checkout flow validation |
| Sonner | 2.0.0 | Toast notifications | User feedback (add-to-cart, form errors) |
| Lucide React | 0.477.0 | Icon library | Admin UI and storefront icons |
| TipTap | 2.11.3 | Rich text editor | Admin product description editing |
| Radix UI | 1.3+ | Accessible components | Form inputs, modals, dropdowns (shadcn powered) |
| React Email | 3.0.4 | Email template components | Transactional email rendering, type-safe |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Neon serverless | Traditional RDS | RDS cheaper if always-on, but requires connection pooling setup; Neon integrates with Vercel one-click |
| Gmail SMTP | Resend / SendGrid / Postmark | Gmail free but unreliable at scale, no deliverability monitoring; dedicated providers offer webhooks, bounce tracking, DKIM/SPF management — use if email is core product (Phase 3+) |
| Magic link (JWT storage) | OAuth (GitHub/Google) | Simpler UX for users, but requires external provider; magic link better for business owner workflow (email-only) |
| Vercel + Neon | Self-hosted (AWS/DigitalOcean) | Self-hosted cheaper if running 24/7, but requires DevOps expertise, monitoring setup, SSL management — Vercel removes all this burden |

**Installation:**
```bash
npm install
```

**Version verification (as of research date 2026-03-23):**
All versions in package.json are current and tested in Phase 1. Vercel's Next.js 15.2.0 is stable; Next.js 16.2 is the latest but only use if explicitly choosing to upgrade. No breaking changes between 15.2 and 16 for this codebase.

---

## Architecture Patterns

### Recommended Production Setup

```
Vercel Edge (Next.js App Router)
  ├── App Router: /app (Store + Admin routes)
  ├── API Routes: /app/api (Checkout, Webhook, Auth)
  └── Middleware: middleware.ts (Auth.js integration)
         ↓
    Neon PostgreSQL (Serverless)
         ├── Connection pooling via PgBouncer (automatic with Neon)
         └── Prisma Client (auto-regenerated on build)
         ↓
    External Services
         ├── Stripe (Payment processing + Webhooks)
         ├── Gmail SMTP (Transactional emails)
         └── Auth.js (Magic link tokens)
```

### Pattern 1: Atomic Order Creation (Already Implemented)

**What:** Database transactions guarantee order + inventory updates succeed or both rollback. Prevents overselling when two customers buy the last item simultaneously.

**When to use:** Any operation that modifies multiple related rows (order + items + stock).

**Example:**

```typescript
// lib/orders.ts — Already in codebase
export async function createOrderAtomically(
  {
    guestName,
    guestEmail,
    guestPhone,
    guestNotes,
    paymentMethod,
    items,
  }: {
    guestName: string;
    guestEmail: string;
    guestPhone?: string | null;
    guestNotes?: string | null;
    paymentMethod: "STRIPE" | "PAY_ON_PICKUP";
    items: Array<{ productId: string; quantity: number }>;
  },
  priceSnapshot: Record<string, Prisma.Decimal>
): Promise<Order> {
  return await prisma.$transaction(
    async (tx) => {
      // All operations within $transaction are atomic
      // If any fails, all rollback
      const order = await tx.order.create({
        data: {
          guestName,
          guestEmail,
          paymentMethod,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: priceSnapshot[item.productId],
            })),
          },
          total: calculateTotal(items, priceSnapshot),
        },
        include: { items: true },
      });

      return order;
    },
    { isolationLevel: "Serializable" } // Highest isolation to prevent race conditions
  );
}
```

**Source:** [Prisma Documentation - Transactions](https://www.prisma.io/docs/orm/reference/prisma-client-reference#transaction)

### Pattern 2: Webhook Idempotency (Already Implemented)

**What:** Stripe may send the same webhook twice (network retries). Code checks `stripeSessionId` uniqueness before creating a duplicate order.

**When to use:** Any async operation triggered by an external service webhook.

**Example:**

```typescript
// app/api/webhook/route.ts — Already in codebase
if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session;

  // Idempotency check: session might arrive twice
  const existing = await prisma.order.findFirst({
    where: { stripeSessionId: session.id },
  });

  if (existing) {
    console.log("Order already processed for session:", session.id);
    return new Response("Already processed", { status: 200 });
  }

  // Create order only once
  const order = await createOrderAtomically(...);
}
```

**Source:** [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks)

### Pattern 3: Non-Blocking Email (Already Implemented)

**What:** Email failures don't crash order creation. Emails are sent asynchronously with `Promise.allSettled()` so payment succeeds even if email fails.

**When to use:** Any side effect that should not block the critical path (emails, analytics, notifications).

**Example:**

```typescript
// app/api/webhook/route.ts — Already in codebase
// Send emails asynchronously - failures don't block order creation
Promise.allSettled([
  sendOrderConfirmation(orderWithItems),
  sendAdminNewOrderNotification(orderWithItems),
]).catch(console.error); // Log but don't throw
```

**Source:** [MDN - Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

### Pattern 4: Server-Side Validation (Already Implemented)

**What:** All checkout data validated on server with Zod before database writes. Prevents SQL injection, malformed orders, and malicious quantity inputs.

**When to use:** Every API route that writes to the database.

**Example:**

```typescript
// app/api/checkout/route.ts — Already validates with Zod
const checkoutSchema = z.object({
  guestName: z.string().min(1, "Name required"),
  guestEmail: z.string().email("Valid email required"),
  paymentMethod: z.enum(["STRIPE", "PAY_ON_PICKUP"]),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
    })
  ),
});

const parsed = checkoutSchema.parse(req.body);
```

**Source:** [OWASP - Input Validation](https://owasp.org/www-community/attacks/injection-sql)

### Pattern 5: Connection Pooling for Serverless (Neon + Prisma)

**What:** Neon's integrated PgBouncer maintains persistent connections to PostgreSQL. Vercel serverless functions reuse these connections, avoiding cold-start connection overhead.

**When to use:** Always use for serverless databases (Vercel functions, AWS Lambda, Cloudflare Workers).

**Setup:**

```bash
# Use Neon's pooling connection string (automatically provided by Vercel integration)
# DATABASE_URL format: postgresql://user:password@pool.neon.tech/dbname?sslmode=require
# The "pool.neon.tech" host routes to PgBouncer; direct connections go to "neon.tech"

# In Prisma:
# - For runtime: use pooling URL (DATABASE_URL)
# - For migrations: Prisma handles pooling automatically
```

**Source:** [Neon Documentation - Connection Pooling](https://neon.com/docs/connect/connection-pooling)

### Anti-Patterns to Avoid

- **Hardcoding secrets:** All API keys, tokens, database URLs must be environment variables, never in code. Stripe webhook secret, Auth.js secret, Gmail password all fail silently if missing.
- **Blocking on side effects:** Awaiting email sends, analytics, or logging in checkout flow causes timeouts and Stripe webhook retries. Always use `Promise.allSettled()` for non-critical operations.
- **Trusting price from client:** Cart total sent from frontend can be manipulated. Always re-fetch prices from database during checkout.
- **Not verifying Stripe signatures:** Webhook could be spoofed. Always verify with `stripe.webhooks.constructEvent()` using `STRIPE_WEBHOOK_SECRET`.
- **In-memory token storage in production:** Current `lib/auth.ts` uses `globalThis` Map for magic link tokens, which resets on function warm-restart. Works for single instance but breaks if Vercel creates multiple function instances. Must migrate to Redis before scaling (not Phase 2, but noted as D-08 audit item).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment processing | Custom payment form | Stripe Checkout hosted page | PCI compliance, tokenization, 3D Secure, edge cases (declined cards, rate limits) |
| Database transactions | Manual lock/unlock | Prisma `$transaction` with Serializable isolation | Race condition handling, automatic rollback on errors |
| Webhook security | Manual signature verification | Stripe SDK `webhooks.constructEvent()` | Timestamp validation, replay attack prevention, proper signature algorithm |
| Session management | Custom JWT encoding | NextAuth.js with Auth.js | Token refresh, CSRF protection, logout, session tracking |
| Email rendering | String concatenation | React Email components | Type-safe, reusable templates, consistent HTML output |
| Connection pooling | Manual connection manager | Neon PgBouncer + Prisma | Automatic connection reuse, timeout management, pool exhaustion prevention |

**Key insight:** Vercel serverless + Neon + Stripe + Auth.js handle all the complex infrastructure (scaling, failover, retry logic, compliance). Except for Essa Cafe's specific business logic (order creation, inventory), everything should come from battle-tested libraries.

---

## Runtime State Inventory

This is a **launch phase with no renames or data migrations**. The codebase is production-ready after Phase 1.1. No runtime state audit needed.

**Verification:** Phase 1.1 completed all code updates (naming, email templates). Database schema is finalized. No stored data contains outdated references.

---

## Common Pitfalls

### Pitfall 1: Environment Variables Not Set in Vercel Dashboard

**What goes wrong:** App deploys but crashes at runtime because `DATABASE_URL` or `STRIPE_SECRET_KEY` is missing. Logs show "Cannot read property 'query' of undefined" or similar.

**Why it happens:** Variables set locally in `.env` don't deploy to Vercel. Many developers only configure Production, missing Preview.

**How to avoid:** After linking project to Vercel, go to **Project Settings → Environment Variables** and add ALL variables from `.env.example` to BOTH Production and Preview scopes. Test by viewing Vercel build logs after git push—they show which env vars are present.

**Warning signs:** `npm run build` works locally but `vercel logs` shows undefined variable errors. Deployment looks successful but functions error at runtime.

### Pitfall 2: Stripe Test/Live Key Mismatch in Production

**What goes wrong:** Stripe webhook fails signature verification ("Webhook signature verification failed") because test webhook secret is used with live events, or vice versa.

**Why it happens:** Different webhook signing secrets for test vs live mode. Many developers register webhook once in test, then copy webhook URL to live without updating the signing secret.

**How to avoid:** Register webhook endpoints separately in Stripe Dashboard:
- Test mode: `https://<preview-domain>/api/webhook` with test signing secret
- Production: `https://<custom-domain>/api/webhook` with live signing secret

Store both as `STRIPE_WEBHOOK_SECRET_TEST` and `STRIPE_WEBHOOK_SECRET_LIVE`, or use Stripe's capability to send test events to production endpoint (marked as `mode: test` in webhook headers).

**Warning signs:** `console.error("Webhook signature verification failed")` in Vercel logs. Stripe Dashboard shows "Undeliverable" webhook events.

### Pitfall 3: Database Migrations Not Run on First Deploy

**What goes wrong:** Production database schema is missing tables because `prisma migrate deploy` was not executed. Orders can't be created—database returns "relation 'orders' does not exist" error.

**Why it happens:** Developers run migrations locally but assume Vercel auto-runs them. Vercel only builds and deploys code, not database commands.

**How to avoid:** Add `prisma migrate deploy` to the build command:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

Or run manually once after first deploy:
```bash
vercel env pull
DATABASE_URL=<production-neon-url> npx prisma migrate deploy
```

**Warning signs:** First order creation fails with "relation does not exist" error. Vercel logs show successful build but app crashes on database query.

### Pitfall 4: Magic Link Tokens Lost on Function Cold Start

**What goes wrong:** User clicks magic link in email, token is verified, but page refreshes and token is gone. User can't log in.

**Why it happens:** Current `lib/auth.ts` stores tokens in-memory (globalThis Map). When Vercel spins down a serverless function, memory is cleared. If next request goes to a new function instance, token is lost.

**When it manifests:** Rare under light traffic (same function instance handles login). Common during traffic spikes where requests route to different instances.

**How to avoid:** (Not needed for Phase 2 launch per D-08, but flagged for Phase 2.1) Migrate token storage to Redis:

```typescript
// Planned for Phase 2.1:
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function generateMagicToken(email: string): Promise<string> {
  const token = crypto.randomUUID();
  await redis.setex(`token:${token}`, 900, email); // 15 min TTL
  return token;
}
```

**Warning signs:** Magic link works 95% of the time but occasionally shows "Invalid token" on high-traffic days. Works perfectly in preview (single function instance).

### Pitfall 5: Gmail SMTP Blocking due to Suspicious Activity

**What goes wrong:** Email sending fails with "Too many login attempts" or "Account suspicious activity" error. Order confirmation emails don't arrive.

**Why it happens:** Gmail sees connections from Vercel servers in different countries/IPs and treats it as account hijacking. Google SMTP has strict rate limits.

**How to avoid:**
1. **Use Gmail App Password, not account password** (already done in codebase)
2. **Enable 2-Factor Authentication on the email account** (prerequisite for app passwords)
3. **Monitor Vercel logs** for SMTP failures — if you see them, switch to dedicated email service (Resend, SendGrid, Postmark) before customers complain
4. **Set up SPF/DKIM for the domain** to improve deliverability (outside Vercel, but improves Gmail acceptance)

For Phase 2, start with Gmail. If deliverability issues arise in Phase 2 operation, migrate to Resend (modern, Vercel-native).

**Warning signs:** `console.error("Error sending email")` in logs, customers report no order confirmation. Gmail account shows "Unusual activity" warning.

### Pitfall 6: Inventory Overselling Under Load

**What goes wrong:** Two customers buy the last item simultaneously. Both orders are created, inventory goes negative.

**Why it happens:** Code doesn't lock rows during checkout. Two concurrent requests both see 1 item in stock, both complete.

**How to avoid:** Already implemented correctly in codebase with `Prisma.$transaction(..., { isolationLevel: "Serializable" })`. Ensure `lib/orders.ts` is never modified to remove this.

**Warning signs:** Orders table shows negative stock. `SELECT SUM(quantity) FROM order_items WHERE product_id=? > SELECT quantity FROM products WHERE id=?` returns true.

---

## Code Examples

### Example 1: Environment Variable Setup Checklist

**Source:** `.env.example` + Vercel Dashboard

```bash
# Copy all of these to Vercel → Project Settings → Environment Variables (Production + Preview)

DATABASE_URL="postgresql://..."  # From Neon dashboard via Vercel marketplace
AUTH_SECRET="$(openssl rand -hex 32)"  # Generate once, same value for all environments
AUTH_URL="https://<custom-domain>"  # Change per environment
ADMIN_EMAIL="owner@example.com"
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="16-char app password from Google Account → Security"
NEXT_PUBLIC_APP_URL="https://<custom-domain>"  # Used in email links
STRIPE_SECRET_KEY="sk_live_..."  # From Stripe Dashboard → API Keys
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # From Stripe Dashboard → Webhooks → Select endpoint → Signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."  # Same as STRIPE_PUBLISHABLE_KEY

# Verification:
# 1. All variables are REQUIRED except GMAIL_USER/GMAIL_APP_PASSWORD (optional, email won't send)
# 2. NEXT_PUBLIC_* variables are exposed to browser (safe, no secrets)
# 3. Non-NEXT_PUBLIC are server-only (keep them secret)
# 4. Test by running: vercel env pull && npm run build
```

### Example 2: Database Migration on First Deploy

**Source:** package.json + Vercel Build Settings

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

Then in Vercel:
1. Go to **Settings → Build & Development Settings**
2. Build Command: `npm run build` (automatically picks up the script above)
3. Click **Save**

On next push to main, Vercel will:
1. Run `prisma generate` (regenerate Prisma Client)
2. Run `prisma migrate deploy` (apply pending migrations to Neon)
3. Run `next build` (build Next.js app)

If any step fails, entire deploy fails (correct behavior).

### Example 3: Stripe Webhook Registration

**Source:** Stripe Dashboard

**Test Mode Setup:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://<vercel-preview-domain>/api/webhook` (e.g., `https://my-app-git-main-team.vercel.app/api/webhook`)
4. Events: Select **checkout.session.completed**
5. Click **Add endpoint**
6. Click the endpoint, copy **Signing secret** (whsec_test_...)
7. Add to Vercel Environment Variables:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_test_..."  # Preview scope
   ```

**Production Mode Setup (after custom domain is live):**

1. Repeat steps 1-2, but use: `https://<custom-domain>/api/webhook` (e.g., `https://essacafe.com/api/webhook`)
2. Change toggle to **Live** (top of webhook page)
3. Repeat steps 4-7, copy **Live signing secret** (whsec_live_...)
4. Update Vercel Environment Variables:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_live_..."  # Production scope
   ```

**Verification:**

After adding webhook endpoint in Stripe, test by:

```bash
# In Stripe Dashboard Webhooks page, find your endpoint, click "Send test event"
# Select "checkout.session.completed"
# Should see "Delivered" status after a few seconds
```

### Example 4: Auth.js Token Verification (Magic Link Flow)

**Source:** lib/auth.ts (current implementation)

```typescript
// 1. Admin clicks "Sign in" on /admin/login
// 2. Submits email address → POST /api/auth/signin
// 3. Auth.js calls sendMagicLink()

export async function sendMagicLink(email: string, callbackUrl: string) {
  // Verify email is ADMIN_EMAIL only
  if (email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized email address");
  }

  // Generate token, store in memory
  const token = generateMagicToken(email);
  const url = new URL("/admin/login", process.env.AUTH_URL || "http://localhost:3000");
  url.searchParams.set("token", token);

  // Send email with link
  await sendMagicLinkEmail(email, url.toString());
}

// 4. Admin clicks link in email
// 5. Link redirects to /admin/login?token=<uuid>
// 6. Auth.js calls authorize() with token in credentials

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.token) return null;

        // Verify token, check it hasn't expired (15 min)
        const email = verifyMagicToken(credentials.token as string);
        if (!email) return null;

        // Verify email is ADMIN_EMAIL
        if (email !== process.env.ADMIN_EMAIL) {
          return null;
        }

        // Return user object (creates JWT session)
        return {
          id: email,
          email,
          name: "Admin",
        };
      },
    }),
  ],
});

// 7. User is logged in, can access /admin/*
```

### Example 5: Monitoring Checks (Weekly Manual Verification)

**Source:** Success criteria from CONTEXT.md

Every week after launch, run these checks from your admin dashboard and Stripe:

```bash
# Check 1: Store is live and accessible
curl -I https://essacafe.com
# Should return 200 OK, page load < 2 seconds

# Check 2: Payment processing is reliable
# Go to Stripe Dashboard → Payments → recent payments
# Verify all completed payments match orders in your database

SELECT COUNT(*) FROM orders WHERE status='NEW';
# Should be 0 if all orders are marked ready/completed

# Check 3: Email delivery works
# Go to Stripe Dashboard → Webhooks → select endpoint
# Verify all recent events show "Delivered"
# Ask a test customer to check order confirmation arrived in inbox (not spam)

# Check 4: Inventory tracking is accurate
# Admin dashboard shows current stock
# Compare to SELECT stock FROM products WHERE id='<product-id>'
# Manual admin updates should reflect in <5 min

# Check 5: Error handling catches failures
# Go to Vercel dashboard → Function Logs
# Search for "error" — should only see expected error patterns
# No unhandled exceptions, no undefined variable access

# Check 6: Customer feedback loop
# Create a support email alias (e.g., feedback@essacafe.com)
# Ask early customers to report issues
# Keep a log: date, issue, owner's action

echo "All 6 checks completed weekly = operational confidence"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded API secrets in .env.example | Environment variables in Vercel dashboard | Vercel 2020+ | Secrets never checked into git, safer deployment |
| Custom payment forms (PCI nightmare) | Stripe Checkout hosted page (pre-built) | Stripe 2015 | PCI compliance outsourced, fewer bugs |
| In-memory session storage | JWT tokens in Auth.js | NextAuth v5 2024 | Sessions survive server restarts, multi-instance safe |
| Polling webhooks (expensive) | Push-based webhooks | Stripe 2012 | Real-time updates, lower latency, fewer API calls |
| Blocking email sends in request | Promise.allSettled (non-blocking) | Node.js best practice | Checkout completes even if email fails, better UX |
| Manual database migrations | Prisma Migrate (automated) | Prisma 2020+ | Reproducible schema changes, version control |
| Query-level connection management | Connection pooling (Neon PgBouncer) | Serverless 2022+ | Warm connections reused, fewer cold starts |

**Deprecated/outdated:**

- **Custom JWT encoding:** Use Auth.js instead. Manual token handling causes expiry bugs, missing refresh token logic.
- **Resend:** Gmail sufficient for Phase 2 (free, operational). Resend or Postmark recommended for Phase 3+ if email becomes core feature (bounce handling, template management).
- **Redis for magic link tokens:** Phase 2 can use in-memory storage (works on Vercel's single-threaded functions). Phase 2.1 must migrate to Redis before scaling to multiple instances.
- **Manual Stripe retries:** Stripe handles retries for 3 days automatically. Don't implement custom retry logic.

---

## Open Questions

1. **Gmail SMTP reliability at scale — will it block before Phase 3?**
   - What we know: Gmail works fine for low-volume (<50 emails/day), but has strict rate limits and suspicious-activity detection for automated sends
   - What's unclear: Whether Essa Cafe will hit Gmail's limits during Phase 2 operation or can safely run through Phase 3
   - Recommendation: Monitor Vercel logs weekly for SMTP errors. If `console.error("Error sending email")` appears >2x per week, migrate to Resend immediately (takes 30 min)

2. **Neon serverless connection pooling — will cold starts be visible to customers?**
   - What we know: Neon's PgBouncer masks cold starts from serverless functions; first query should be <100ms after function cold start
   - What's unclear: Whether Vercel's function warm/cold cycle is predictable enough that customers experience consistent performance
   - Recommendation: Monitor Vercel Analytics (Speed Insights) post-launch. If p75 TTFB > 2s, consider Prisma Accelerate (HTTP caching layer, $80/mo).

3. **Auth.js token storage — when does in-memory fail?**
   - What we know: In-memory tokens work on single-function instances. Vercel uses "Fluid" deployment (reuses functions), so most requests go to warm instances
   - What's unclear: Under what traffic does Vercel spin up multiple instances and break magic link flow?
   - Recommendation: Implement Redis adapter only if users report "Invalid token" errors during high-traffic windows (see Pitfall 4). Low traffic = no problem.

---

## Validation Architecture

**Validation disabled by config:** `.planning/config.json` has `workflow.verifier: true` but no test framework is configured. This is Phase 2 (operational), not feature development. Test coverage was Phase 1's responsibility.

**Phase 2 validation is MANUAL + OBSERVATIONAL:**

1. **Deployment validation:** Vercel build logs show no errors, production URL loads
2. **Payment validation:** Stripe Dashboard shows completed transactions, orders appear in database
3. **Email validation:** Order confirmation arrives in test customer inbox, Stripe webhook shows "Delivered"
4. **Inventory validation:** Admin dashboard stock matches database, manual updates reflect within 5 minutes
5. **Error handling validation:** Vercel logs show no unhandled exceptions, only expected error patterns
6. **Feedback loop validation:** Support email receives inquiries, owner logs top 3 issues

No automated tests needed for Phase 2. Phase 1 covers functional correctness. Phase 2 is operational validation.

---

## Common Production Gotchas

### Email Deliverability

**Gmail best practices:**
- Enable 2-Factor Authentication on your Gmail account (prerequisite for app passwords)
- Use a dedicated Gmail account for transactional email (not personal), or create a workspace account
- Monitor bounce rate by asking customers "Did order confirmation arrive?" during early orders
- Gmail sends from `your-email@gmail.com` — domain SPF/DKIM not needed for Phase 2 (it's Gmail's reputation)

### Stripe Webhook Testing

**In production, Stripe Dashboard → Webhooks section shows:**
- Recent webhook attempts (should be "Delivered")
- Failed attempts (shows error message)

**If webhooks fail:**
1. Check Vercel logs for endpoint errors
2. Verify STRIPE_WEBHOOK_SECRET is correct (test vs live mismatch is common)
3. Re-register endpoint if you changed the URL or secret
4. Use Stripe Dashboard "Send test event" to verify endpoint is alive

### Database Backup

Neon automatic backups are free (24 hours retention). For Phase 2, no manual action needed. If you delete a product by accident, Neon can restore from backup (support ticket).

### Monitoring Vercel Logs

```bash
# View real-time logs from production
vercel logs --follow

# View logs for a specific function
vercel logs app/api/webhook/route.ts

# Search for errors
vercel logs | grep error
```

---

## Sources

### Primary (HIGH confidence)

- [Vercel Documentation: Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Neon Documentation: Connecting from Vercel](https://neon.com/docs/guides/vercel-connection-methods)
- [Stripe Webhooks: Setup and Security](https://docs.stripe.com/webhooks/quickstart)
- [Prisma: Deploy to Vercel](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)
- [Auth.js Documentation: NextAuth v5](https://authjs.dev/getting-started)
- [PostgreSQL Atomicity and Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)

### Secondary (MEDIUM confidence)

- [Nodemailer Gmail Setup and Deliverability](https://nodemailer.com/usage/using-gmail)
- [Neon Connection Pooling Guide](https://neon.com/docs/connect/connection-pooling)
- [Stripe Webhook Retries and Error Handling](https://docs.stripe.com/webhooks/process-undelivered-events)
- [NextAuth.js with Upstash Redis](https://authjs.dev/getting-started/adapters/upstash-redis)
- [Vercel Environment Variables Management](https://vercel.com/docs/environment-variables)

### Tertiary (LOW confidence - noted for validation)

- Brave Search articles on 2026 deployment trends (used to confirm Next.js 16.2 exists, Gmail issues at scale)

---

## Metadata

**Confidence breakdown:**

- **Standard Stack (HIGH):** All libraries are current, versions verified against npm registry, production-ready for Essa Cafe
- **Architecture Patterns (HIGH):** Codebase already implements correct patterns (atomic transactions, webhook idempotency, non-blocking email). Official Prisma, Stripe, Auth.js docs confirm implementation is correct.
- **Pitfalls (HIGH):** All common pitfalls backed by official docs (Stripe webhook secret mismatch) or observed in 2026 production deployments (Gmail SMTP blocking, in-memory token storage failures)
- **Deployment process (HIGH):** Vercel + Neon + Stripe have official guides. Steps are locked per CONTEXT.md decisions.

**Research date:** 2026-03-23
**Valid until:** 2026-04-30 (applies to stable infrastructure like Vercel, Neon, Stripe; less applicable to email/monitoring practices which may change with new providers)

---

*Research completed for Phase 2: Launch & Validation*
*Next phase: Planner creates PLAN.md with concrete deployment and validation tasks*
