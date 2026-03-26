# Essa Cafe — Online Pickup Store

A Next.js storefront for pickup orders. Customers browse products, pay online (Stripe) or on pickup, receive order confirmation emails with QR codes for quick pickup, and track order status in real-time. Admin panel with mobile-responsive design for managing orders, products, and categories.

**Status:** v1.0 MVP Released (March 2026)

**Tech stack:** Next.js 15 · Prisma · PostgreSQL (Neon) · Stripe · Gmail SMTP · NextAuth v5 · Tailwind CSS · Zustand

---

## Features

- **Pickup Orders** — Browse products, add to cart, choose pickup time
- **Payment Options** — Pay online via Stripe or cash/card on pickup
- **QR Code Pickup** — Customers receive a unique QR code in their confirmation email for quick order pickup verification
- **Order Status Tracking** — Real-time order status updates with customer lookup page and status history
- **Mobile-Responsive Admin** — Manage orders, products, and categories from any device
- **Email Notifications** — Automated order confirmations and status updates via Gmail SMTP
- **Multi-Currency Support** — Configurable currency (default: AED)

---

## Prerequisites

- [Node.js 18+](https://nodejs.org)
- A [Neon](https://neon.tech) Postgres database (free tier works)
- A [Stripe](https://stripe.com) account
- A Gmail account with [App Password](https://myaccount.google.com/apppasswords) enabled

---

## Local Development

**1. Clone and install**

```bash
git clone https://github.com/ashrid/essa-coffee.git
cd essa-coffee
npm install
```

**2. Set up environment variables**

```bash
cp .env.example .env.local
```

Fill in `.env.local` — see [Environment Variables](#environment-variables) below.

**3. Set up the database**

```bash
npx prisma generate
npx prisma db push
```

**4. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Deploy to Vercel

### Step 1 — Create a Neon database

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the **Connection string** — you'll need it as `DATABASE_URL`

### Step 2 — Push your code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin master
```

### Step 3 — Create a Vercel project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Leave build settings as default — Vercel auto-detects Next.js
4. **Do not deploy yet** — add environment variables first

### Step 4 — Add environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add each variable from the table below.

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection string |
| `AUTH_SECRET` | Run `openssl rand -hex 32` in your terminal |
| `AUTH_URL` | Your Vercel production URL (e.g. `https://essa-cafe.vercel.app`) |
| `ADMIN_EMAIL` | Your Gmail address — this receives order notifications and is used to log in |
| `ADMIN_EMAILS` | *(Optional)* Comma-separated extra admin emails for login |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Gmail → Security → 2-Step Verification → App passwords |
| `NEXT_PUBLIC_APP_URL` | Your Vercel production URL |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same as `STRIPE_PUBLISHABLE_KEY` |
| `STRIPE_WEBHOOK_SECRET` | See Step 5 below |
| `SHOP_ADDRESS_LINE1` | Your shop name (e.g. `Essa Cafe`) |
| `SHOP_ADDRESS_LINE2` | Your shop address (e.g. `Dubai, UAE`) |
| `SHOP_PHONE` | Your contact number |
| `GOOGLE_MAPS_EMBED_URL` | Google Maps → Share → Embed a map → copy the `src` URL |
| `NEXT_PUBLIC_PICKUP_WARNING_MESSAGE` | *(Optional)* Custom message shown when customers select pickup times outside business hours |

### Step 5 — Set up Stripe webhook

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. URL: `https://YOUR_VERCEL_URL/api/webhook`
4. Select event: `checkout.session.completed`
5. After saving, click **Reveal** under Signing secret
6. Copy the `whsec_...` value → add as `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 6 — Deploy

Go to Vercel → **Deployments** → click **Redeploy** (or push a new commit to trigger auto-deploy).

### Step 7 — Run database migrations

After first deploy, run this once to set up the database schema:

```bash
npx prisma db push
```

Or connect to the Neon console and run the schema manually.

---

## Environment Variables

See `.env.example` for a full template with descriptions.

---

## Admin Panel

Access at `/admin` — login uses a magic link sent to `ADMIN_EMAIL`.

| Route | Description |
|---|---|
| `/admin/orders` | View and update order status |
| `/admin/products` | Add, edit, delete products |
| `/admin/categories` | Manage product categories |
| `/admin/scan` | **QR Code Scanner** — Scan customer QR codes for instant order lookup and verification |

The admin panel is fully responsive and works on mobile devices for on-the-go management.

---

## Customer Features

| Feature | Description |
|---|---|
| Browse & Search | Filter products by category, search by name |
| Shopping Cart | Add/remove items, adjust quantities |
| Checkout | Two-step checkout with contact details and payment selection |
| Pickup Time Selection | Choose pickup time (today/tomorrow) with 5-minute increments |
| QR Code | Unique QR code sent via email for quick pickup verification |
| Order Tracking | Check order status anytime via `/order-status` with email + order ID |

---

## Currency

Prices are stored and displayed in **AED (UAE Dirham)**. To change currency, update `CURRENCY` references in `lib/utils.ts`.

---

## Code Walkthrough

Want to understand how the codebase works? Open `course.html` in your browser for an interactive guide that explains the architecture, components, and data flow — no coding experience required.
