import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("stripe portal never redirects members into the mock billing notice", async () => {
  const route = await read("app/api/stripe/portal/route.ts");
  assert.doesNotMatch(route, /mock_portal/);
  assert.match(route, /createBillingPortalSession/);
  assert.match(route, /ensureStripeCustomer/);
});

test("stripe helpers provision a customer and a portal configuration", async () => {
  const stripe = await read("src/lib/stripe.ts");
  assert.match(stripe, /export async function ensureStripeCustomer/);
  assert.match(stripe, /export async function createBillingPortalSession/);
  assert.match(stripe, /billingPortal\.configurations\.create/);
  assert.match(stripe, /billingPortal\.sessions\.create/);
  assert.match(stripe, /stripe portal configuration failed/);
  assert.match(stripe, /invoice_history: \{ enabled: true \}/);
  assert.match(stripe, /payment_method_update: \{ enabled: true \}/);
  assert.match(stripe, /subscription_update/);
  assert.match(stripe, /invoice_settings\.default_payment_method/);
  assert.match(stripe, /flow_data: \{ type: input\.flow \}/);
  assert.match(stripe, /export async function getCustomerBillingOverview/);
  assert.match(stripe, /apiVersion: "2026-04-22\.dahlia"/);
});

test("a present Stripe secret is treated as configured only when it looks like a key", async () => {
  const service = await read("src/lib/membership-service.ts");
  assert.match(
    service,
    /process\.env\.STRIPE_SECRET_KEY\?\.trim\(\)\.startsWith\("sk_"\)/,
  );
});

test("manage billing posts to stripe portal and follows the Stripe URL", async () => {
  const button = await read("src/components/portal/ManageBillingButton.tsx");
  const page = await read("app/portal/page.tsx");
  assert.doesNotMatch(button, /mock_portal/);
  assert.match(button, /action="\/api\/stripe\/portal"/);
  assert.match(button, /window\.location\.assign\(next\.href\)/);
  assert.match(button, /\/portal\/billing\?error=1/);
  assert.doesNotMatch(button, /form\.submit\(/);
  assert.doesNotMatch(page, /mock_portal/);
});

test("preview workflow copies production stripe env and skips the unused publishable key", async () => {
  const workflow = await read(".github/workflows/vercel-preview.yml");
  const envExample = await read(".env.example");
  assert.match(workflow, /teamId=\$VERCEL_ORG_ID/);
  assert.match(workflow, /copy_prod_to_preview STRIPE_SECRET_KEY/);
  assert.match(workflow, /copy_prod_to_preview STRIPE_WEBHOOK_SECRET/);
  assert.match(workflow, /copy_prod_to_preview STRIPE_PRICE_STUDENT_MONTHLY/);
  assert.match(workflow, /copy_prod_to_preview STRIPE_PRICE_PROFESSIONAL_MONTHLY/);
  assert.match(workflow, /copy_prod_to_preview STRIPE_COUPON_FREE_MEMBERSHIP/);
  assert.match(workflow, /copy_prod_to_preview STRIPE_COMP_EMAILS/);
  assert.match(workflow, /copy_prod_to_preview SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(workflow, /copy_prod_to_preview GMAIL_USER/);
  assert.match(workflow, /copy_prod_to_preview GMAIL_APP_PASSWORD/);
  assert.match(workflow, /delete_preview NEXT_PUBLIC_SITE_URL/);
  assert.match(workflow, /delete_preview NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(workflow, /upsert NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(workflow, /decode '/);
  assert.doesNotMatch(workflow, /sk_test_/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/);
  assert.match(envExample, /STRIPE_PRICE_STUDENT_MONTHLY=price_1UIVFiRTgiLNfq1Kv7KyAwmF/);
  assert.match(
    envExample,
    /STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1UIVG2RTgiLNfq1KTLqH7jof/,
  );
});

test("preview workflow never deletes an env var shared with production", async () => {
  const workflow = await read(".github/workflows/vercel-preview.yml");
  assert.match(workflow, /already shared by Production and Preview; leaving it alone/);
  assert.match(workflow, /rest = \[t for t in targets if t != "preview"\]/);
  assert.match(workflow, /-X PATCH/);
  assert.doesNotMatch(
    workflow,
    /"preview" in \(e\.get\("target"\) or \[\]\)\)\)'\)\s*\n\s*for id in \$ids/,
  );
});

test("portal access recovers a missing membership from the live Stripe subscription", async () => {
  const service = await read("src/lib/membership-service.ts");
  assert.match(service, /async function recoverMembershipFromStripe/);
  assert.match(service, /stripe\.customers\.list\(\{ email, limit: 10 \}\)/);
  assert.match(service, /owner === userId/);
  assert.match(
    service,
    /\(await getMembership\(userId\)\) \?\? \(await recoverMembershipFromStripe\(userId\)\)/,
  );
});

test("the member nav shows on every paid portal page, even right after checkout", async () => {
  const header = await read("src/components/portal/PortalHeader.tsx");
  assert.match(
    header,
    /const showMemberNav = paid \|\| !pathname\.startsWith\("\/portal\/subscribe"\)/,
  );
  assert.match(header, /\{showMemberNav \? \(\s*<nav/);
  assert.match(header, /href="\/portal\/profile"/);
});

test("this branch ships the stripe checkout, portal, and webhook routes", async () => {
  const checkout = await read("app/api/stripe/checkout/route.ts");
  const portal = await read("app/api/stripe/portal/route.ts");
  const webhook = await read("app/api/stripe/webhook/route.ts");
  assert.match(checkout, /export async function POST/);
  assert.match(portal, /export async function POST/);
  assert.match(webhook, /export async function POST/);
  assert.match(webhook, /syncMembershipFromStripeSubscription/);
  assert.match(webhook, /invoice\.paid/);
  assert.match(webhook, /invoice\.payment_failed/);
  assert.match(webhook, /STRIPE_WEBHOOK_SECRET\?\.trim\(\)/);
});

test("invalid stripe keys fall through to in-app billing instead of a secret-key error", async () => {
  const route = await read("app/api/stripe/portal/route.ts");
  const button = await read("src/components/portal/ManageBillingButton.tsx");
  const page = await read("app/portal/billing/page.tsx");
  assert.match(route, /\/portal\/billing\?error=1/);
  assert.match(route, /sendError/);
  assert.match(route, /content-type/);
  assert.doesNotMatch(route, /STRIPE_SECRET_KEY/);
  assert.doesNotMatch(button, /STRIPE_SECRET_KEY/);
  assert.doesNotMatch(button, /form\.submit\(/);
  assert.match(button, /\/portal\/billing\?error=1/);
  assert.match(page, /Cancel at period end/);
});

test("the billing page has a home breadcrumb, cards, and invoices", async () => {
  const page = await read("app/portal/billing/page.tsx");
  const button = await read("src/components/portal/ManageBillingButton.tsx");
  const route = await read("app/api/stripe/portal/route.ts");
  assert.match(page, /aria-label="Breadcrumb"/);
  assert.match(page, /href="\/portal"/);
  assert.match(page, /<ChevronLeftIcon/);
  assert.match(page, />\s*Home\s*</);
  assert.match(page, /text-muted/);
  assert.match(page, /Payment method/);
  assert.match(page, /Invoices/);
  assert.match(page, /label="Update card" flow="payment_method_update"/);
  assert.match(page, /label="View in Stripe"/);
  assert.match(page, /Add or update your card in Stripe/);
  assert.match(page, /Renews automatically, every month/);
  assert.match(page, /rounded-\[20px\] bg-gray-100 p-6/);
  assert.match(page, /md:grid-cols-3/);
  assert.match(page, /md:grid-cols-2/);
  assert.doesNotMatch(page, /max-w-xl/);
  assert.doesNotMatch(page, /bg-gray-50/);
  assert.match(button, /name="flow"/);
  assert.match(route, /flow_data|flow,/);
  assert.match(route, /payment_method_update/);
});

test("real stripe subscriptions are canceled and switched in stripe, not only locally", async () => {
  const service = await read("src/lib/membership-service.ts");
  const checkout = await read("app/api/stripe/checkout/route.ts");
  const billing = await read("app/api/portal/billing/route.ts");
  const webhook = await read("app/api/stripe/webhook/route.ts");
  assert.match(service, /export function mockBillingAllowed/);
  assert.match(service, /VERCEL_ENV !== "production"/);
  assert.match(service, /export function isLiveStripeSubscriptionId/);
  assert.match(service, /stripe\.subscriptions\.update/);
  assert.match(service, /cancel_at_period_end: cancelAtPeriodEnd/);
  assert.match(service, /proration_behavior: "create_prorations"/);
  assert.match(service, /resolveCheckoutPriceId\(tier, stripe\)/);
  assert.match(service, /saveStripeCustomerId\(userId, customerId\)/);
  assert.match(checkout, /changeMembershipTier\(user\.id, tier\)/);
  assert.doesNotMatch(checkout, /activateMockMembership/);
  assert.match(billing, /\/portal\/billing\?error=1/);
  assert.match(webhook, /syncMembershipFromStripeSubscription/);
});

test("stripe checkout, portal, and customers are pinned to English", async () => {
  const stripe = await read("src/lib/stripe.ts");
  const checkout = await read("app/api/stripe/checkout/route.ts");
  assert.match(stripe, /export const STRIPE_LOCALE = "en"/);
  assert.match(stripe, /preferred_locales: \[STRIPE_LOCALE\]/);
  assert.match(stripe, /customers\s*\.update\(existing\.id, \{ preferred_locales/);
  assert.match(stripe, /return_url: input\.returnUrl,\s*locale: STRIPE_LOCALE/);
  assert.match(checkout, /customer: customerId,\s*locale: STRIPE_LOCALE/);
});
