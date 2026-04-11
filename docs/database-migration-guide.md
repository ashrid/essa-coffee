# Database Migration Guide: Order Number Format Change

## Overview
Changed order number generation from random CUID strings to simple incremental format (ORD-001, ORD-002, etc.).

## Changes Made

### 1. Schema Changes
**File:** `prisma/schema.prisma`

```prisma
// Before
orderNumber     String        @unique @default(cuid())

// After
orderNumber     String        @unique
```

### 2. Application Code Changes
**File:** `lib/orders.ts`

Added `generateOrderNumber()` function that:
- Finds the latest order by creation date
- Extracts the number from the last order number
- Increments and formats with leading zeros (ORD-001, ORD-002, etc.)
- Uses database transaction for atomicity

## Migration Process

### Step 1: Verify Production Schema State

Before deploying, check the production database schema:

```bash
# Pull production environment variables
vercel env pull --environment=production .env.production

# Extract DATABASE_URL and check production schema
export DATABASE_URL=$(grep -E '^DATABASE_URL=' .env.production | sed 's/^DATABASE_URL=//' | tr -d '"' | tr -d "'")
npx prisma db pull --print
```

### Step 2: Check Column Defaults

Verify if the orderNumber column has a default value:

```bash
export DATABASE_URL=$(grep -E '^DATABASE_URL=' .env.production | sed 's/^DATABASE_URL=//' | tr -d '"' | tr -d "'")
npx prisma db execute --url "$DATABASE_URL" --stdin <<'SQL'
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name = 'orderNumber';
SQL
```

### Step 3: Deploy to Vercel

```bash
vercel --prod
```

The build command (`npm run build`) now only generates Prisma Client and builds Next.js:
```json
"build": "prisma generate && next build"
```

Production migrations should be applied explicitly before deployment:

```bash
npm run db:migrate:deploy
```

The build step now:
1. Generates Prisma Client
2. Builds the Next.js application

## Key Commands Reference

### Environment Variables
```bash
# List all environment variables
vercel env ls

# Pull production variables
vercel env pull --environment=production .env.production
```

### Database Operations
```bash
# Check schema differences
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script

# Deploy migrations to production
export DATABASE_URL=$(grep -E '^DATABASE_URL=' .env.production | sed 's/^DATABASE_URL=//' | tr -d '"' | tr -d "'")
npx prisma migrate deploy

# Pull current database schema
npx prisma db pull
```

### Deployment
```bash
# Apply migrations first
npm run db:migrate:deploy

# Deploy to production
vercel --prod

# Check deployment status
vercel inspect <deployment-url>
```

## Handling Schema Drift

If you encounter schema drift errors like:
```
The migration `xxx` was modified after it was applied.
We need to reset the "public" schema
```

### Option 1: Fix Minor Drift (Indexes Only)
```bash
export DATABASE_URL=<production-db-url>
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
# Review the SQL output, then apply manually if safe
```

### Option 2: Baseline the Database
If the production schema is correct but migrations are out of sync:
```bash
export DATABASE_URL=<production-db-url>
npx prisma migrate resolve --applied <migration-name>
```

### Option 3: Reset (Development Only - Destructive)
```bash
export DATABASE_URL=<dev-db-url>
npx prisma migrate reset --force
```

## Critical Considerations

### Production Safety
- **Never run `migrate reset` on production** - it drops all data
- Always verify schema state before deploying
- Use `prisma db pull` to inspect production schema
- Test migrations on a staging database first

### Order Number Generation
- The generation happens in a database transaction
- Uses `Serializable` isolation level to prevent race conditions
- Existing orders keep their old format (backward compatible)
- New orders get ORD-XXX format automatically

### Build Process
- Vercel build should not mutate the production schema
- Apply migrations explicitly before deployment
- If migrations fail, stop the release before running `vercel --prod`

## Troubleshooting

### Migration Lock Errors
If a migration gets stuck:
```bash
# Check migration status
npx prisma migrate status

# Resolve a failed migration
npx prisma migrate resolve --rolled-back <migration-name>
```

### Connection Issues
```bash
# Test database connection
npx prisma db execute --url "$DATABASE_URL" --stdin <<'SQL'
SELECT 1;
SQL
```

## Verification After Deploy

1. Create a test order via the website
2. Check the order number format in:
   - Order confirmation email
   - Admin panel
   - Database directly: `SELECT orderNumber FROM orders ORDER BY createdAt DESC LIMIT 5;`

## Rollback Strategy

If issues occur:
1. Revert the code changes in Git
2. Push to trigger a new deployment
3. If database schema changes need reverting, create a new migration

## Related Files

- `prisma/schema.prisma` - Database schema
- `lib/orders.ts` - Order creation logic with generateOrderNumber()
- `app/api/checkout/route.ts` - Checkout endpoint
- `app/api/webhook/route.ts` - Stripe webhook handler

## Lessons Learned

1. **Check first, migrate second** - Always verify production schema before assuming migrations are needed
2. **Schema drift happens** - Index naming differences are common and usually harmless
3. **Separate migration from build** - apply schema changes before deployment rather than during `next build`
4. **Environment variables** - Use `vercel env pull` to get production DATABASE_URL for local inspection
