import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("signup never auto-grants membership; demo login still can", async () => {
  const route = await read("app/api/auth/route.ts");
  const actions = await read("src/lib/auth-actions.ts");
  const service = await read("src/lib/membership-service.ts");
  assert.doesNotMatch(route, /activateMockMembership/);
  assert.doesNotMatch(actions, /activateMockMembership/);
  assert.match(route, /ensureDemoMembership/);
  assert.match(actions, /ensureDemoMembership/);
  assert.match(route, /mode === "signup"[\s\S]*\/portal\/subscribe/);
  assert.match(actions, /redirect\(next.includes\("subscribe"\) \? next : "\/portal\/subscribe"\)/);
  assert.match(service, /ensureDemoMembership/);
  assert.match(service, /demo@designmeetup.info/);
});

test("unpaid members are sent to the plan picker, not the dashboard", async () => {
  const access = await read("src/lib/portal-access.ts");
  const home = await read("app/portal/page.tsx");
  const subscribe = await read("app/portal/subscribe/page.tsx");
  const login = await read("app/login/page.tsx");
  const signup = await read("app/signup/page.tsx");
  assert.match(access, /export async function requirePaidMembership/);
  assert.match(access, /redirect\("\/portal\/subscribe"\)/);
  assert.match(home, /if \(!\(await userHasPortalAccess\(user\.id\)\)\)/);
  assert.match(home, /redirect\("\/portal\/subscribe"\)/);
  assert.match(subscribe, /Choose a membership/);
  assert.match(subscribe, /<SubscribeButtons \/>/);
  assert.doesNotMatch(
    subscribe,
    /student is \$10 \/ month\. professional is \$35 \/ month/,
  );
  assert.doesNotMatch(subscribe, /pay with/);
  assert.match(login, /redirect\("\/portal\/subscribe"\)/);
  assert.match(signup, /redirect\("\/portal\/subscribe"\)/);
});

test("profile, billing, community, and membership require a paid plan", async () => {
  const profile = await read("app/portal/profile/page.tsx");
  const billing = await read("app/portal/billing/page.tsx");
  const community = await read("app/portal/community/page.tsx");
  const membership = await read("app/portal/membership/page.tsx");
  assert.match(profile, /requirePaidMembership\("\/portal\/profile"\)/);
  assert.match(billing, /requirePaidMembership\("\/portal\/billing"\)/);
  assert.match(community, /requirePaidMembership\("\/portal\/community"\)/);
  assert.match(membership, /requirePaidMembership\("\/portal\/membership"\)/);
});

test("mock memberships do not unlock the dashboard except for the demo account", async () => {
  const service = await read("src/lib/membership-service.ts");
  assert.match(service, /isLiveStripeSubscriptionId\(membership\?\.stripeSubscriptionId\)/);
  assert.match(
    service,
    /return \(profile\?\.email \|\| ""\)\.trim\(\)\.toLowerCase\(\) === DEMO_EMAIL/,
  );
});

test("unpaid portal chrome hides dashboard nav until a plan is paid", async () => {
  const header = await read("src/components/portal/PortalHeader.tsx");
  const layout = await read("app/portal/layout.tsx");
  assert.match(layout, /paid=\{paid\}/);
  assert.match(header, /showMemberNav \? "\/portal" : "\/portal\/subscribe"/);
  assert.match(header, /\{showMemberNav \? \(/);
});

test("member portal pages use sentence case instead of forcing lowercase", async () => {
  const files = [
    "app/portal/page.tsx",
    "app/portal/billing/page.tsx",
    "app/portal/profile/page.tsx",
    "app/portal/subscribe/page.tsx",
    "app/login/page.tsx",
    "app/signup/page.tsx",
    "app/reset-password/page.tsx",
    "src/components/portal/LoginForm.tsx",
    "src/components/portal/ResetPasswordForm.tsx",
    "src/components/portal/SubscribeButtons.tsx",
  ];
  for (const file of files) {
    assert.doesNotMatch(await read(file), /\blowercase\b/, file);
  }
  const home = await read("app/portal/page.tsx");
  assert.match(home, /Welcome back,/);
  assert.doesNotMatch(home, /firstName\.toLowerCase\(\)/);
});
