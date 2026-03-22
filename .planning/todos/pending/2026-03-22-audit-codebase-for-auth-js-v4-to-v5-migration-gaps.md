---
created: 2026-03-22T16:18:06.613Z
title: Audit codebase for Auth.js v4 to v5 migration gaps
area: auth
files:
  - lib/auth.ts
  - lib/auth-edge.ts
  - .env.example
  - package.json
---

## Problem

The project uses next-auth@5.0.0-beta.25 (Auth.js v5 API) but was scaffolded with v4 conventions. During magic link debugging, several v4 patterns surfaced that needed patching:

- `.env.example` used `NEXTAUTH_SECRET` instead of v5's `AUTH_SECRET`
- `.env.example` used `NEXTAUTH_URL` instead of v5's `AUTH_URL`
- Two separate `NextAuth()` instances (`lib/auth.ts` + `lib/auth-edge.ts`) with no explicit shared secret — in dev mode they may auto-generate different secrets, breaking session cookie decoding in middleware
- `@auth/prisma-adapter` is installed but not wired into either NextAuth config

There may be other v4 patterns elsewhere — in API routes, session type usage, or callback signatures — that cause silent failures in production.

## Solution

1. Grep for `NEXTAUTH_` prefix usage across all files to find remaining v4 env var references
2. Check if `@auth/prisma-adapter` should be wired in or removed
3. Review session/JWT callback signatures for v5 compatibility (v5 uses `auth()` wrapper differently)
4. Verify all env vars in `.env.example` match v5 expectations (`AUTH_SECRET`, `AUTH_URL`)
5. Consider extracting a shared `authConfig` object to ensure both `auth.ts` and `auth-edge.ts` always use identical settings
