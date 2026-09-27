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
});

test("a present Stripe secret is treated as configured only when it looks like a key", async () => {
  const service = await read("src/lib/membership-service.ts");
  assert.match(
    service,
    /process\.env\.STRIPE_SECRET_KEY\?\.trim\(\)\.startsWith\("sk_"\)/,
  );
});

test("manage billing never follows a mock stripe portal url", async () => {
  const button = await read("src/components/portal/ManageBillingButton.tsx");
  const page = await read("app/portal/page.tsx");
  assert.doesNotMatch(button, /mock_portal/);
  assert.match(button, /payload\.mock/);
  assert.doesNotMatch(page, /mock_portal/);
});
