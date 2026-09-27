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

test("manage billing posts to stripe portal and never uses mock_portal", async () => {
  const button = await read("src/components/portal/ManageBillingButton.tsx");
  const page = await read("app/portal/page.tsx");
  assert.doesNotMatch(button, /mock_portal/);
  assert.match(button, /action="\/api\/stripe\/portal"/);
  assert.doesNotMatch(page, /mock_portal/);
});

test("preview workflow upserts stripe env with teamId and skips the unused publishable key", async () => {
  const workflow = await read(".github/workflows/vercel-preview.yml");
  const envExample = await read(".env.example");
  assert.match(workflow, /teamId=\$VERCEL_ORG_ID/);
  assert.match(workflow, /upsert STRIPE_SECRET_KEY/);
  assert.match(workflow, /upsert STRIPE_WEBHOOK_SECRET/);
  assert.match(workflow, /upsert STRIPE_PRICE_STUDENT_MONTHLY/);
  assert.match(workflow, /upsert STRIPE_PRICE_PROFESSIONAL_MONTHLY/);
  assert.match(workflow, /copy_prod_to_preview SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(workflow, /delete_preview NEXT_PUBLIC_SITE_URL/);
  assert.match(workflow, /delete_preview NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(workflow, /upsert NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/);
  assert.match(envExample, /STRIPE_PRICE_STUDENT_MONTHLY=price_1UIVFiRTgiLNfq1Kv7KyAwmF/);
  assert.match(
    envExample,
    /STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1UIVG2RTgiLNfq1KTLqH7jof/,
  );
});

test("preview workflow price ids decode to the catalog defaults", async () => {
  const workflow = await read(".github/workflows/vercel-preview.yml");
  const encoded = [...workflow.matchAll(/decode '([A-Za-z0-9+/=]+)'/g)].map(
    (match) => match[1],
  );
  const decoded = encoded.map((value) =>
    Buffer.from(value, "base64").toString("utf8"),
  );
  assert.equal(
    decoded.includes("price_1UIVFiRTgiLNfq1Kv7KyAwmF"),
    true,
  );
  assert.equal(
    decoded.includes("price_1UIVG2RTgiLNfq1KTLqH7jof"),
    true,
  );
  assert.equal(
    decoded.includes("price_1UIVG2RTgiLNfq1KTlqH7jof"),
    false,
  );
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
  assert.match(route, /\/portal\/billing/);
  assert.match(route, /invalid api key/i);
  assert.doesNotMatch(route, /STRIPE_SECRET_KEY/);
  assert.doesNotMatch(button, /STRIPE_SECRET_KEY/);
  assert.match(page, /cancel at period end/);
});

test("the billing page has a home breadcrumb, cards, and invoices", async () => {
  const page = await read("app/portal/billing/page.tsx");
  const button = await read("src/components/portal/ManageBillingButton.tsx");
  const route = await read("app/api/stripe/portal/route.ts");
  assert.match(page, /aria-label="Breadcrumb"/);
  assert.match(page, /href="\/portal"/);
  assert.match(page, /<ChevronLeftIcon/);
  assert.match(page, />\s*home\s*</);
  assert.match(page, /text-muted/);
  assert.match(page, /payment method/);
  assert.match(page, /invoices/);
  assert.match(page, /label="update card" flow="payment_method_update"/);
  assert.match(page, /label="view in Stripe"/);
  assert.match(page, /normal-case">Stripe</);
  assert.match(page, /renews automatically, every month/);
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
  assert.match(service, /saveStripeCustomerId\(userId, customerId\)/);
  assert.match(checkout, /changeMembershipTier\(user\.id, tier\)/);
  assert.doesNotMatch(checkout, /activateMockMembership/);
  assert.match(billing, /\/portal\/billing\?error=1/);
  assert.match(webhook, /syncMembershipFromStripeSubscription/);
});
