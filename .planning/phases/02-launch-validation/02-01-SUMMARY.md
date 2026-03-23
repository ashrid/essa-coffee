---
phase: "02-launch-validation"
plan: "01"
subsystem: "email, auth, build"
tags: ["bugfix", "branding", "auth", "deployment", "prisma"]
dependency_graph:
  requires: []
  provides: ["correct-email-branding", "production-token-persistence", "auto-db-migration"]
  affects: ["lib/email.ts", "lib/auth.ts", "package.json"]
tech_stack:
  added: []
  patterns: ["globalThis singleton for serverless module re-instantiation", "prisma migrate deploy in CI build"]
key_files:
  created: []
  modified:
    - lib/email.ts
    - lib/auth.ts
    - package.json
decisions:
  - "Remove NODE_ENV guard from token store: unconditional globalThis assignment works correctly in all environments"
  - "prisma generate + prisma migrate deploy prepended to build: safe to run on every deploy, skips applied migrations"
metrics:
  duration: "5 min"
  completed: "2026-03-23"
  tasks: 3
  files: 3
---

# Phase 02 Plan 01: Pre-launch Code Fixes Summary

**One-liner:** Three surgical pre-launch fixes — email rebranded to Essa Cafe, production token store bug eliminated, Neon DB auto-migration on every Vercel deploy.

---

## Objective

Fix three code issues that would break production before the first real customer visits:
1. Email branding still said "ShopSeeds" — wrong brand name for a coffee shop
2. Auth.js magic link tokens lost on every warm Vercel function invocation in production
3. No database migration in build — first deploy would fail with "relation does not exist"

---

## Tasks Completed

### Task 1: Email branding — lib/email.ts

Replaced all 8 "ShopSeeds" occurrences with "Essa Cafe":

| # | Location | Change |
|---|----------|--------|
| 1 | `sendOrderConfirmation` — `from` field | `"ShopSeeds"` → `"Essa Cafe"` |
| 2 | `sendOrderConfirmation` — `subject` | `Order Confirmed … — ShopSeeds` → `— Essa Cafe` |
| 3 | `sendAdminNewOrderNotification` — `from` field | `"ShopSeeds"` → `"Essa Cafe"` |
| 4 | `sendAdminNewOrderNotification` — `subject` | `New Order … — ShopSeeds` → `— Essa Cafe` |
| 5 | `sendMagicLinkEmail` — HTML `<title>` | `Sign in to ShopSeeds` → `Sign in to Essa Cafe` |
| 6 | `sendMagicLinkEmail` — HTML `<h1>` | `ShopSeeds Admin` → `Essa Cafe Admin` |
| 7 | `sendMagicLinkEmail` — body paragraph | `your ShopSeeds admin account` → `your Essa Cafe admin account` |
| 8 | `sendMagicLinkEmail` — `from` field | `"ShopSeeds"` → `"Essa Cafe"` |
| 9 | `sendMagicLinkEmail` — `subject` | `Sign in to ShopSeeds Admin` → `Sign in to Essa Cafe Admin` |

Verification: `grep "ShopSeeds" lib/email.ts` → no output (exit 1). `grep -c "Essa Cafe" lib/email.ts` → 9.

**Commit:** ec3fd7e

---

### Task 2: Auth.js token store production bug — lib/auth.ts

**Bug:** The token store assignment `globalForTokens.tokenStore = tokenStore` was guarded by `if (process.env.NODE_ENV !== "production")`. In production (Vercel), the assignment was skipped entirely. Every warm function invocation read `globalForTokens.tokenStore` as `undefined`, fell through to `?? new Map()`, and got a brand-new empty Map — all pending magic link tokens were lost on every warm restart.

**Fix applied:**
```typescript
// Before (broken in production):
const tokenStore =
  globalForTokens.tokenStore ?? new Map<string, { email: string; expires: number }>();
if (process.env.NODE_ENV !== "production") globalForTokens.tokenStore = tokenStore;

// After (correct in all environments):
if (!globalForTokens.tokenStore) {
  globalForTokens.tokenStore = new Map<string, { email: string; expires: number }>();
}
const tokenStore = globalForTokens.tokenStore;
```

The fix initializes `globalThis.tokenStore` exactly once on cold start and reuses it on all warm invocations — identical behavior in development and production.

Verification: `grep "NODE_ENV" lib/auth.ts` → no output. `grep "globalForTokens.tokenStore = " lib/auth.ts` → line 12 (unconditional).

**Commit:** f57a532

---

### Task 3: Build script — package.json

**Problem:** Build script was `next build` only. On first Vercel deploy to a fresh Neon database, no migrations had been applied — every API call would fail with "relation does not exist".

**Change:**
```json
// Before:
"build": "next build"

// After:
"build": "prisma generate && prisma migrate deploy && next build"
```

- `prisma generate` — regenerates the Prisma Client from schema (required in serverless; client must match schema)
- `prisma migrate deploy` — applies pending migrations to Neon; no-op if all migrations already applied (safe to run on every deploy)
- `next build` — unchanged, runs after DB is ready

**Build run confirmed:** `npm run build` exit 0. Output confirmed:
- Prisma Client generated (v6.19.2)
- "No pending migrations to apply" (local DB already migrated)
- Next.js compiled successfully, all routes built, TypeScript clean

**Commit:** 2f957e3

---

## Verification Output

```
PASS: no ShopSeeds in email.ts
PASS: no NODE_ENV in auth.ts
"build": "prisma generate && prisma migrate deploy && next build"
✓ Compiled successfully
ƒ Middleware 85.3 kB
(all routes built successfully)
```

`npm run build` — exit 0.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — all three fixes are complete and functional. No placeholder data or wired-but-empty paths.

## Self-Check: PASSED

- lib/email.ts — modified, committed ec3fd7e
- lib/auth.ts — modified, committed f57a532
- package.json — modified, committed 2f957e3
- All three grep verifications passed
- npm run build exit 0 confirmed
