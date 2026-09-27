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
  assert.match(webhook, /syncSubscription/);
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
