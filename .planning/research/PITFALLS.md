# Domain Pitfalls: Small E-Commerce Store

**Domain:** Local plant/seed store with local pickup, online + pay-on-pickup payments
**Researched:** 2026-02-16
**Confidence:** HIGH

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Building Shipping From Day One

**What goes wrong:** You decide to add shipping "just in case." Design the database for it, add complexity to checkout. Then shipping fails silently because plants are fragile, and you spent 3 months rebuilding to remove shipping.

**Why it happens:** Scope creep. "What if we want to ship later?" feels reasonable, but adds complexity upfront.

**Consequences:**
- Checkout becomes 5+ steps instead of 2-3
- Database schema has unnecessary fields
- Payment logic handles both pickup + shipped states
- Testing is harder (two fulfillment paths)
- If you launch shipping, dead plants + chargebacks
- If you don't, you wasted weeks on unnecessary features

**Prevention:**
- Commit to "local pickup only" in v1
- Database schema reflects pickup-only: no address fields, no carrier tracking
- If shipping becomes critical later (you have proof), refactor at that time
- Ship > iterate > learn. Don't anticipate 6 months of features.

**Detection:** Asking "should we add shipping?" → Answer: No. Not in v1.

---

### Pitfall 2: Not Validating Input on API Routes

**What goes wrong:** Frontend validates form data, so you think server is safe. User submits malformed order with negative quantity or invalid productId. Order record corrupts. Admin can't process it. Or worse: SQL injection (if using raw queries, not Prisma).

**Why it happens:** Trust the client. Works 99% of the time. Until a bot or clever user breaks it.

**Consequences:**
- Corrupt data in database
- Admin confusion (order shows impossible state)
- Security vulnerability (injection attacks)
- Hard to debug (where did bad data come from?)
- Customers lose trust if orders are wrong

**Prevention:**
- Validate EVERY input on server with Zod (see STACK.md)
- Don't trust client validation alone
- Use Prisma for queries (prevents SQL injection)
- Test with invalid payloads: negative quantities, missing fields, wrong types

**Detection:**
- Code review: Check API routes for `await req.json()` without `.safeParse()`
- Add unit tests for validation schemas

---

### Pitfall 3: Handling Payments Manually

**What goes wrong:** You try to store Stripe tokens or handle partial refunds yourself. Tokens expire. Refund logic breaks mid-transaction. Customer's money is stuck. You're liable for PCI compliance (nightmare).

**Why it happens:** Stripe documentation seems complex. "I'll just handle it myself" feels simpler.

**Consequences:**
- PCI compliance violations (legal liability)
- Stripe refunds don't sync with your records
- Chargebacks because you can't prove you processed the payment correctly
- Tokens expire, payment processing breaks silently
- Months of work debugging payment issues

**Prevention:**
- Use Stripe's pre-built Checkout (don't build custom payment form)
- Handle only webhook events, let Stripe own payment state
- Store ONLY Stripe transaction ID, never raw token
- Test webhook signature verification
- Document payment flow with comments

**Detection:**
- Code review: Searching for raw card data or tokens in database
- Check if you're storing anything other than Stripe session ID

---

### Pitfall 4: Over-Engineering the Admin Panel

**What goes wrong:** You build a full-featured admin dashboard with charts, filters, export, bulk operations. Takes 3 weeks. Then you launch and realize admin only needs to see 5 orders per day and mark them "ready." You built 30x more than needed.

**Why it happens:** You're a developer. Features are fun. You imagine all the admin might want.

**Consequences:**
- Wasted time (weeks of dev for unused features)
- Complex code = more bugs
- Admin confused by too many options
- Maintenance burden

**Prevention:**
- Build absolute minimum: list orders, change status, that's it
- If admin asks for more, add it then
- Principle: One button per action. Nothing fancy in v1.

**Detection:**
- Timeline: Admin panel taking >2 days of dev work? Too much.

---

### Pitfall 5: Not Testing Checkout Fully

**What goes wrong:** You test happy path (correct payment, order created, email sent). But you don't test edge cases: user closes browser mid-payment, network fails, Stripe webhook doesn't fire. On launch day, 10% of orders fail silently and customers don't know. Chargebacks flood in.

**Why it happens:** Testing is tedious. "It works in my local environment" feels sufficient.

**Consequences:**
- Silent payment failures (customer charged, order not created)
- Lost sales (no one knows what happened)
- Chargebacks (customers are refunded by bank, you lose money)
- Trust issues (customer support nightmare)
- Refunds manually, no way to trace root cause

**Prevention:**
- Test with Stripe test cards (provided by Stripe for all scenarios)
- Simulate network failures using Stripe CLI
- Test webhook delivery (Stripe CLI can replay webhooks)
- Document expected behavior: payment success → email → order visible
- Manual testing checklist before launch

**Detection:**
- Launch day: Monitoring Stripe dashboard + email logs + order database in real-time

---

### Pitfall 6: Inventory Overselling

**What goes wrong:** Two users buy the same plant simultaneously. Both orders go through. You only have 1 plant left. Someone gets an order you can't fulfill. You're scrambling to refund, explain, lose customer trust.

**Why it happens:** Race condition. Checking inventory and creating order aren't atomic (happen in separate steps with a gap).

**Consequences:**
- Angry customers
- Manual refunds
- Reputation damage
- Chargebacks

**Prevention:**
- Use database transactions: check inventory AND update it in one atomic operation
- Stripe payment fails if inventory runs out (don't charge user if item not available)
- For <30 products, overselling is rare (manual updates once/day), but the principle matters
- Prisma transactions ensure atomicity

**Detection:**
- Monitor orders for quantity mismatches
- Alert if order quantity > current inventory

---

## Moderate Pitfalls

### Pitfall 1: Email Deliverability Issues

**What goes wrong:** Order confirmation email goes to spam or doesn't deliver. Customer never sees "your order is confirmed." They think order didn't go through and charge back.

**Prevention:**
- Use reputable email service (SendGrid, Resend, AWS SES)
- Set up SPF/DKIM/DMARC DNS records
- Test email templates in major clients (Gmail, Outlook)
- Monitor delivery rates
- Clear subject lines (avoid spam filters)

---

### Pitfall 2: Not Handling Stripe Rate Limits

**What goes wrong:** During a surge in orders, your API hits Stripe's rate limit. Some payments fail. You don't retry with exponential backoff. Orders are lost.

**Prevention:**
- Implement retry logic for Stripe API calls
- Exponential backoff (wait 1s, 2s, 4s, 8s before retrying)
- Log all Stripe errors for debugging

---

### Pitfall 3: Mobile Checkout is Broken

**What goes wrong:** Checkout works on desktop. Mobile users can't click the button, form is hard to read, payment fails. 50% of users are mobile. You just lost half your sales.

**Prevention:**
- Build mobile-first
- Test checkout on real phones (iPhone + Android)
- Touch targets 48x48px minimum
- No horizontal scrolling

---

### Pitfall 4: Pickup Instructions Are Unclear

**What goes wrong:** Order confirmation says "pick up at location" but no hours, no address, no directions. Customer is confused. They show up at wrong time or place.

**Prevention:**
- Clear pickup instructions in email AND on order confirmation page
- Include: exact address, hours, map link, parking info, contact phone
- Make it obvious

---

### Pitfall 5: Product Images Are Low Quality

**What goes wrong:** You use blurry phone photos from your desk. Customers think plants are dying, product quality is low. They don't buy.

**Prevention:**
- High-quality images: 2-3 angles per plant, good lighting
- Consistent background (plain wall or studio)
- Show size reference (ruler, hand for scale)

---

## Minor Pitfalls

### Pitfall 1: Forgetting to Set Up Domain Email

**What goes wrong:** Confirmation emails come from `noreply@vercel.app` instead of `orders@shopseeds.com`. Looks unprofessional. Might go to spam.

**Prevention:**
- Set up custom domain email (simple in SendGrid/Resend)
- Test that confirmation emails pass SPF/DKIM checks

---

### Pitfall 2: Missing Error Messages

**What goes wrong:** User enters invalid email, clicks checkout. No feedback. They click again. Again. Three times. Frustrated, they leave.

**Prevention:**
- Show validation errors immediately (as user types)
- Red outline + error text for each field
- Disable submit button until form is valid

---

### Pitfall 3: Not Backing Up Database

**What goes wrong:** Database corrupts (rare but happens). You have no backup. All customer orders are gone.

**Prevention:**
- Vercel Postgres includes automated backups
- Manual backup to S3 monthly (easy with Prisma: `prisma db seed`)
- Test restore process once per quarter

---

### Pitfall 4: Not Logging Errors

**What goes wrong:** A customer says their order didn't go through. You have no logs. Can't trace what happened. Can't debug or explain to customer.

**Prevention:**
- Log all API calls (input + output)
- Log all Stripe webhooks
- Use Sentry or similar for error tracking

---

### Pitfall 5: Breaking Changes Without Testing

**What goes wrong:** You add a required field to product schema. Forget to update the API. Old requests fail silently. Frontend doesn't know what happened.

**Prevention:**
- Versioning: new required fields should be optional first, then required in next version
- Test API backwards compatibility
- Document all schema changes

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Design/Schema** | Designing for shipping when you're not shipping. | Commit to pickup-only in schema. Refactor if shipping comes later. |
| **Payment Integration** | Handling payment validation on client. | Validate EVERYTHING on server with Zod. Let Stripe handle payment state. |
| **Checkout Flow** | Building custom payment form instead of Stripe Checkout. | Use Stripe's pre-built checkout. Massive security difference. |
| **Inventory** | No rate limiting on inventory queries. Database gets slammed. | For <30 items, manual daily update is fine. Add atomic transactions for concurrent safety. |
| **Admin Panel** | Building full-featured dashboard nobody uses. | Bare minimum v1. Add features when admin asks. |
| **Testing** | Only testing happy path. | Test edge cases: network failures, webhook failures, concurrent orders. Use Stripe test cards. |
| **Launch** | Deploying without monitoring Stripe/emails in real-time. | Watch Stripe dashboard + email logs + database during first hours. |
| **Post-Launch** | Ignoring error logs. Customers lose orders, you don't know why. | Set up Sentry or basic error logging. Check daily. |

---

## Debugging Quick Reference

| Problem | Check These | Solution |
|---------|-------------|----------|
| Orders not being created | Zod validation, API logs, Stripe session creation | Check server logs for validation errors. Test with Stripe CLI. |
| Payment succeeds but order doesn't exist | Webhook handling, Stripe webhook signature | Verify webhook secret. Check `/api/stripe/webhook` logs. Replay webhook via CLI. |
| Confirmation email not sending | Email service logs, sender email setup | Check SendGrid/Resend dashboard. Verify DNS records (SPF/DKIM). Test with Stripe CLI. |
| Checkout page blank | Browser console errors, API errors | Check browser dev tools (Network tab). Check server logs. |
| Mobile checkout broken | Viewport meta tag, button size, form inputs | Test on real device. Check media queries. Ensure 48x48px touch targets. |
| High bounce rate on checkout | Form validation UX, clarity of steps | Add error messages. Reduce form fields. Show progress (step 1 of 2). |
| Users can't find products | Search not working, categories confusing | Test search. Rename categories to user language. Add "featured" section. |

---

## Sources

- **Stripe Best Practices** (https://stripe.com/docs) — Payment handling, webhook patterns, error handling
- **OWASP Web Security** — Input validation, injection prevention
- **E-Commerce Post-Mortems** — Common failure modes (archived case studies, interviews with founders)
- **PostgreSQL Transaction Docs** — Concurrency control, atomicity
- **Next.js Error Handling** — Server-side validation patterns
- **Email Deliverability** — SPF/DKIM/DMARC setup, spam prevention

---

*Pitfall research for: ShopSeeds e-commerce plant store*
*Researched: 2026-02-16*
