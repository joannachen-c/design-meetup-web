# Paid member portal — implementation plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`)
> syntax for tracking. Follow
> `docs/superpowers/specs/2026-09-21-paid-member-portal-design.md` exactly for
> product/architecture decisions unless the team updates that spec first.

**Goal:** Ship authenticated membership with `$10/mo` Community and `$35/mo`
Core tiers via Stripe, plus a gated `/portal` on the existing Next.js site.

**Architecture:** Supabase Auth (identity) + Stripe Checkout / Customer Portal /
webhooks (billing) + `profiles` / `memberships` tables (access). Public marketing
pages stay open.

**Tech stack:** Next.js App Router, React 19, TypeScript, Tailwind 4, Supabase
(`@supabase/supabase-js` + `@supabase/ssr`), Stripe Node SDK, Node test runner.

## Global constraints

- Do not redesign the public home page as a SaaS dashboard.
- Do not replace Luma RSVP in v1.
- Do not build custom cancel/update-card UI — use Stripe Customer Portal.
- Webhooks are the source of truth for paid status; never trust client-only flags.
- Commit after each completed task.
- Price ids and Stripe secrets live in env only (test keys on Preview, live on Production).

## Open product inputs (block copy / gating, not scaffolding)

Resolve with the team before Task 7 (portal UI polish) at latest:

1. Exact Community vs Core benefits
2. Trial length (default: none)
3. Open signup vs invite-only
4. Grace period on `past_due` (default: access while `past_due` until Stripe cancels)

---

## File structure (target)

| Path | Responsibility |
|---|---|
| `supabase/migrations/*_profiles_memberships.sql` | Tables, RLS, signup trigger |
| `src/lib/supabase/server.ts` | Server Supabase client (cookies) |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/admin.ts` | Service-role client (webhooks only) |
| `src/lib/stripe.ts` | Stripe SDK singleton + Price id helpers |
| `src/lib/membership.ts` | Tier/status helpers, access checks |
| `app/login/page.tsx` | Magic-link / email login |
| `app/signup/page.tsx` | Signup (or shared auth page) |
| `app/auth/callback/route.ts` | Auth code exchange |
| `app/portal/page.tsx` | Member home (gated) |
| `app/portal/subscribe/page.tsx` | Tier picker → Checkout |
| `app/api/stripe/checkout/route.ts` | Create Checkout Session |
| `app/api/stripe/portal/route.ts` | Create Customer Portal Session |
| `app/api/stripe/webhook/route.ts` | Stripe event handler |
| `src/components/portal/*` | Portal UI pieces |
| `.env.example` | Document new env vars |
| `tests/membership.test.mjs` | Tier / access helper tests |
| `tests/stripe-webhook.test.mjs` | Webhook mapping tests (no live Stripe) |

---

### Task 0: Team / Stripe prep (ops, not code)

**Files:** none

**Interfaces:** Produces Stripe test Product + two Prices; notes Price ids for env.

- [ ] **Step 1: Create Stripe test Product** “Design Meetup Membership”
- [ ] **Step 2: Create Prices** `$10/month` (Community) and `$35/month` (Core)
- [ ] **Step 3: Enable Customer Portal** (cancel at period end, update payment method)
- [ ] **Step 4: Record Price ids** for `.env.local` / Vercel Preview

---

### Task 1: Dependencies + env scaffolding

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Adds: `stripe`, `@supabase/ssr`
- Env keys as in the design spec

- [ ] **Step 1: Install packages**

```bash
npm install stripe @supabase/ssr
```

- [ ] **Step 2: Extend `.env.example`** with Stripe + document Supabase Auth redirect note
- [ ] **Step 3: Commit** `chore: add stripe and supabase ssr deps for membership`

---

### Task 2: Database — profiles + memberships

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_create_profiles_memberships.sql`

**Interfaces:**
- Produces: `profiles`, `memberships`, RLS, `on auth.users` insert → profile row

- [ ] **Step 1: Write migration** matching the design spec columns
- [ ] **Step 2: RLS** — users select own profile/membership; service role writes memberships
- [ ] **Step 3: Apply in Supabase** (SQL editor or CLI) on the shared project
- [ ] **Step 4: Commit** `feat: add profiles and memberships tables`

---

### Task 3: Supabase Auth clients + callback

**Files:**
- Create: `src/lib/supabase/server.ts`, `client.ts`, `admin.ts`
- Create: `app/auth/callback/route.ts`
- Create: `app/login/page.tsx` (and signup if separate)
- Optionally slim: keep `src/lib/supabase.ts` for public event reads

**Interfaces:**
- Server helpers: `createClient()`, `createAdminClient()`, `getSessionUser()`
- Callback exchanges code and redirects to `/portal` or `/portal/subscribe`

- [ ] **Step 1: Implement cookie-based server/browser clients**
- [ ] **Step 2: Auth callback route**
- [ ] **Step 3: Minimal login UI** (email magic link; reuse existing Input/Primary)
- [ ] **Step 4: Configure Supabase Auth redirect URLs** for localhost + prod
- [ ] **Step 5: Commit** `feat: add supabase auth login and callback`

---

### Task 4: Membership helpers + tests

**Files:**
- Create: `src/lib/membership.ts`
- Create: `tests/membership.test.mjs`

**Interfaces:**

```ts
export type Tier = "community" | "core";
export type MembershipStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export function tierFromPriceId(priceId: string): Tier | null;
export function hasPortalAccess(status: MembershipStatus | null): boolean;
export function canUpgrade(tier: Tier | null): boolean;
```

- [ ] **Step 1: Implement helpers** (map env Price ids → tier; access rules)
- [ ] **Step 2: Unit tests** for access matrix and price mapping
- [ ] **Step 3: Commit** `feat: add membership access helpers`

---

### Task 5: Stripe Checkout + Customer Portal APIs

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `app/api/stripe/checkout/route.ts`
- Create: `app/api/stripe/portal/route.ts`

**Interfaces:**
- `POST /api/stripe/checkout` body: `{ tier: "community" | "core" }`
  - Requires auth
  - Ensures Stripe Customer exists; saves `stripe_customer_id` on profile
  - Returns `{ url }` Checkout Session (mode `subscription`, success/cancel URLs)
- `POST /api/stripe/portal`
  - Requires auth + existing customer
  - Returns Customer Portal `{ url }`

- [ ] **Step 1: Stripe singleton** (secret key, apiVersion pinned)
- [ ] **Step 2: Checkout route** with metadata `supabase_user_id`
- [ ] **Step 3: Portal route**
- [ ] **Step 4: Manual smoke** with Stripe test mode + test card `4242…`
- [ ] **Step 5: Commit** `feat: add stripe checkout and billing portal routes`

---

### Task 6: Stripe webhook → memberships

**Files:**
- Create: `app/api/stripe/webhook/route.ts`
- Create: `tests/stripe-webhook.test.mjs` (pure mapping / status updates if extracted)

**Interfaces:**
- Raw body + `stripe.webhooks.constructEvent`
- Upserts `memberships` by `user_id` / `stripe_subscription_id`
- Idempotent on replay

- [ ] **Step 1: Webhook handler** for events listed in the design spec
- [ ] **Step 2: Map Price id → tier; Stripe status → membership status**
- [ ] **Step 3: Local forward** via Stripe CLI: `stripe listen --forward-to localhost:5001/api/stripe/webhook`
- [ ] **Step 4: Verify** row updates after test Checkout
- [ ] **Step 5: Commit** `feat: sync memberships from stripe webhooks`

---

### Task 7: Portal UI + gating

**Files:**
- Create: `app/portal/page.tsx`, `app/portal/subscribe/page.tsx`, `app/portal/layout.tsx`
- Create: `src/components/portal/*` as needed
- Modify: `src/components/SiteHeader.tsx` (Login / Portal / Become a member)
- Modify: marketing CTA section if product wants apply → paid path (confirm with team)

**Interfaces:**
- Layout: redirect unauthenticated → `/login?next=/portal`
- Portal page: if no access → redirect `/portal/subscribe`
- Subscribe page: two tiers, CTA posts to checkout API
- Show Manage billing when `stripe_customer_id` exists

- [ ] **Step 1: Portal layout auth gate**
- [ ] **Step 2: Subscribe tier picker** ($10 / $35)
- [ ] **Step 3: Portal home** (tier, period end, manage billing, placeholder benefits)
- [ ] **Step 4: Header entry points**
- [ ] **Step 5: Commit** `feat: add gated member portal and subscribe flow`

---

### Task 8: Upgrade / downgrade path

**Files:**
- Prefer Customer Portal subscription update if enabled; else Checkout with
  `subscription` update API in a small route

**Interfaces:**
- Community member can move to Core; Core can move to Community (proration via Stripe defaults)

- [ ] **Step 1: Enable portal subscription updates** in Stripe Dashboard **or** add `POST /api/stripe/change-tier`
- [ ] **Step 2: UI on portal** for “Switch plan”
- [ ] **Step 3: Confirm webhook updates `tier`
- [ ] **Step 4: Commit** `feat: support membership tier changes`

---

### Task 9: Production hardening

**Files:**
- Modify: `docs/vercel-github-actions.md` or short `docs/membership.md` runbook
- Vercel env (manual): live Stripe keys, live Price ids, webhook secret
- Supabase Auth: production site URL allowlist

- [ ] **Step 1: Register live webhook** `https://<prod>/api/stripe/webhook`
- [ ] **Step 2: Set Vercel Production env**; Preview stays on test mode
- [ ] **Step 3: End-to-end checklist** from design spec (pay, cancel, upgrade, failed card)
- [ ] **Step 4: Support runbook** — where to look up customer, refund policy link
- [ ] **Step 5: Commit** `docs: membership ops runbook`

---

## Suggested implementation order

```text
Task 0 (ops) → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
```

Tasks 5–6 can be developed against Stripe test mode in parallel with Task 7 UI
once helpers exist, but webhook must land before calling portal “done.”

## Scope risk notes

| Area | Risk | Mitigation |
|---|---|---|
| Auth cookie + App Router | Easy to misconfigure SSR session | Use official `@supabase/ssr` Next patterns; test callback on Preview |
| Webhook races | Duplicate events | Upsert by subscription id; ignore stale timestamps if needed |
| Tier benefits undefined | Portal feels empty | Ship portal with clear placeholders until product locks benefits |
| Apply waitlist vs paid | Confusing funnels | Keep apply waitlist until team picks open-paid vs cohort gate |

## Definition of done (v1)

- User can sign up, pay Community or Core in Stripe test mode, land in `/portal`
- Cancel via Customer Portal removes access after Stripe status updates
- Upgrade Community → Core updates tier without losing auth
- No Stripe secrets in the client bundle
- Unit tests cover access helpers; manual Stripe CLI path documented
