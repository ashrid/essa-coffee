# Phase 2: Launch & Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 02-launch-validation
**Areas discussed:** Hosting & database platform, Monitoring & error tracking

---

## Hosting & database platform

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel | Optimal for Next.js, zero-config, auto-deploy, free tier | ✓ |
| Railway | General-purpose, app + database together | |
| Render | Free tier with cold-starts | |
| Already have hosting | Existing platform or VPS | |

**App hosting choice:** Vercel

---

| Option | Description | Selected |
|--------|-------------|----------|
| Neon | Serverless PostgreSQL, free tier, Vercel marketplace integration | ✓ |
| Supabase | Hosted PostgreSQL, pauses after 7 days inactive | |
| Railway | Good managed PostgreSQL, $5/mo | |
| Render | Free tier expires after 90 days | |

**Database choice:** Neon

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-deploy on push to main | Every git push to main triggers a Vercel build | ✓ |
| Manual deploys only | Use vercel --prod CLI | |
| Deploy from release branch | Auto-deploy on release branch only | |

**CI/CD choice:** Auto-deploy on push to main

---

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel dashboard manually | Set env vars in Vercel project settings UI | ✓ |
| Vercel CLI (vercel env add) | Manage from terminal | |
| Secrets manager | Doppler, 1Password, etc. | |

**Env var management:** Vercel dashboard manually

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, enable previews | Each PR gets its own preview URL | ✓ |
| No, production only | Disable preview deployments | |

**Preview deployments:** Enabled

---

## Monitoring & error tracking

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel logs + Stripe dashboard only | Zero extra setup, passive monitoring | ✓ |
| Add Sentry (free tier) | Catches silent JS/API errors | |
| Add Vercel Analytics | Page views and performance metrics | |

**Error tracking choice:** Vercel logs + Stripe dashboard only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Email alerts from Stripe/Vercel | Passive — alerts come to you | ✓ |
| Add uptime monitoring (UptimeRobot) | Pings every 5 min, emails if down | |
| Check manually | Log into dashboards periodically | |

**Alerting choice:** Email alerts from Stripe/Vercel

---

## Claude's Discretion

- Neon connection string format (pooled vs direct for different use cases)
- Stripe webhook endpoint registration steps
- Order of environment variable setup
- Production database migration strategy

## Folded Todos

- **Auth.js v4→v5 audit** — folded into Phase 2 scope (D-08). Verify magic link flow works in production before launch.

## Deferred Ideas

- **Apple Pay support** — user raised this during discussion. New payment method feature, not part of Phase 2 deployment. Capture for Phase 3 backlog.
