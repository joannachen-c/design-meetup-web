# Paid member portal — design

## Goal

Add authenticated membership on the Design Meetup site with two paid tiers
charged monthly through Stripe:

- **Community** — `$10 / month`
- **Core** — `$35 / month`

Logged-in members with an active subscription can access a members portal and
tier-gated benefits. The public marketing site stays free.

## Non-goals (v1)

- Application / cohort review workflow replacing the apply waitlist
- Per-event paid tickets (Luma remains the event RSVP surface unless later decided)
- Usage-based or annual billing (monthly only for launch)
- Native mobile apps
- Building a custom billing UI for cancel / card update (use Stripe Customer Portal)

## Current state

Today the site is Next.js App Router + Supabase for events / waitlist / partner
inquiries. There is **no member auth**, no Stripe integration, and no gated
content. Apply is a waitlist email form (`ApplyNotifyForm` → `/api/apply`).

## Product decisions still needed

Lock these before or during Phase 0 — engineering can scaffold without them,
but launch copy and gating depend on them:

| Decision | Options / notes |
|---|---|
| What Community ($10) includes | e.g. Discord, newsletter extras, member directory |
| What Core ($35) includes | e.g. everything in Community + priority RSVP, office hours, merch |
| Free trial? | 0 / 7 / 14 days |
| Student discount? | Coupon, separate Price, or none |
| Cancel policy | Immediate vs end-of-period access |
| Who can join | Open signup vs invite / approved applicants only |
| Portal home content | Links, upcoming events, resources, Discord invite |

## Architecture

```text
Browser
  ├─ Public site (unchanged)
  ├─ /login, /signup          → Supabase Auth
  ├─ /portal                  → gated; reads membership from DB
  └─ Subscribe / Manage       → Stripe Checkout / Customer Portal

Next.js API
  ├─ POST /api/stripe/checkout   create Checkout Session (auth required)
  ├─ POST /api/stripe/portal     create Customer Portal Session
  └─ POST /api/stripe/webhook    Stripe → update membership rows

Supabase
  ├─ auth.users                  identity
  ├─ public.profiles             display name, stripe_customer_id
  └─ public.memberships          tier, status, stripe ids, period end

Stripe
  ├─ Product: Design Meetup Membership
  ├─ Price: community_monthly ($10)
  ├─ Price: core_monthly ($35)
  └─ Customer Portal enabled
```

### Auth

Use **Supabase Auth** (email magic link first; OAuth later if needed). Session
cookies via `@supabase/ssr` so Server Components and route handlers can read
the user. Do not invent a parallel auth system.

### Billing

Use **Stripe Checkout** (subscription mode) + **Stripe Customer Portal** +
**webhooks**. Never trust the browser for “paid” status. Source of truth after
checkout is webhook-updated `memberships.status`.

Recommended webhook events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### Membership model

One active membership per user for v1. Tier is derived from Stripe Price id.

Suggested statuses mirrored from Stripe: `active`, `trialing`, `past_due`,
`canceled`, `incomplete`. Portal access when status is `active` or `trialing`
(and optionally `past_due` during a short grace period).

### Access control

| Surface | Rule |
|---|---|
| Public pages | Always open |
| `/login`, `/signup` | Open; redirect if already signed in |
| `/portal/**` | Requires signed-in user + qualifying membership |
| `/portal/subscribe` | Signed-in; no active membership (or upgrade path) |
| Admin / Stripe secrets | Server-only env; webhook signature verified |

Server Components and API routes check membership via service role or RLS
policies that only return the caller’s row. Client UI may hide CTAs but must
not be the only gate.

## Data

### `public.profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `= auth.users.id` |
| `email` | text | denormalized for admin convenience |
| `display_name` | text nullable | |
| `stripe_customer_id` | text unique nullable | |
| `created_at` / `updated_at` | timestamptz | |

Created on first signup (trigger or app upsert).

### `public.memberships`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | unique for v1 |
| `tier` | text | `community` \| `core` |
| `status` | text | see above |
| `stripe_subscription_id` | text unique nullable | |
| `stripe_price_id` | text | |
| `current_period_end` | timestamptz nullable | |
| `cancel_at_period_end` | boolean default false | |
| `updated_at` | timestamptz | |

RLS: users can `select` their own row; only service role writes (webhooks).

## UX (v1)

1. Marketing CTA → “Become a member” → signup / login
2. After auth → choose Community ($10) or Core ($35) → Stripe Checkout
3. Return URL → `/portal` with success state
4. Portal shows tier, renewal date, Manage billing, benefit links
5. Failed payment → banner + link to Customer Portal; revoke after grace if desired

Keep portal UI in the existing Design Meetup visual language (no separate SaaS
dashboard aesthetic). Prefer one clear composition per page over card grids.

## Config / env

Add (never commit secrets):

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_COMMUNITY_MONTHLY=
STRIPE_PRICE_CORE_MONTHLY=
NEXT_PUBLIC_SITE_URL=
```

Stripe Price ids differ for test vs live mode; document both in Vercel env
(Preview = test keys, Production = live keys).

## Security

- Verify Stripe webhook signatures
- Create Checkout / Portal sessions only for the authenticated user
- Store `stripe_customer_id` on the profile; never accept a client-supplied
  customer id as authoritative
- Rate-limit auth and checkout session creation if abuse appears
- Log membership changes for support (user id, event type, subscription id)

## Fees (ops context)

Stripe: no monthly platform fee on standard pricing. Rough all-in on domestic
cards with Billing ≈ **3.6% + $0.30** per successful charge.

| Tier | Charge | Approx. net / member / month |
|---|---|---|
| Community | $10 | ~$9.30 |
| Core | $35 | ~$33.40 |

## Launch checklist

- [ ] Stripe account verified; Products + Prices created (test + live)
- [ ] Customer Portal configured (cancel, update payment method)
- [ ] Webhook endpoint registered + secret in Vercel
- [ ] Supabase Auth email templates / redirect URLs set for prod domain
- [ ] Terms / cancel policy linked from checkout and portal
- [ ] Support path for failed payments and refunds
- [ ] Test: signup → pay → access; cancel → lose access; upgrade $10 → $35
