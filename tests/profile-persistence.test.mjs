import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("graduation is stored on the existing profiles.year text column", async () => {
  const migration = await read(
    "supabase/migrations/20260927043000_profiles_directory_fields.sql",
  );
  const service = await read("src/lib/membership-service.ts");
  const route = await read("app/api/portal/profile/route.ts");
  assert.match(migration, /add column if not exists year text/);
  assert.match(service, /persistGraduation\(input\.year\)/);
  assert.match(service, /if \(input\.year !== undefined\) patch\.year = year/);
  assert.match(route, /persistGraduation\(/);
  assert.match(route, /form\.get\("gradMonth"\)/);
  assert.match(route, /form\.get\("gradYear"\)/);
});

test("saving a profile does not unconfirm the login email", async () => {
  const service = await read("src/lib/membership-service.ts");
  assert.match(service, /email !== existing\?\.email/);
  assert.match(
    service,
    /admin\.auth\.admin\.updateUserById\([\s\S]*email_confirm:\s*true/,
  );
});

test("ensureProfile does not wipe a saved profile on later logins", async () => {
  const service = await read("src/lib/membership-service.ts");
  const store = await read("src/lib/membership-store.ts");
  assert.match(service, /if \(existing\) \{/);
  assert.match(service, /return mapped;/);
  assert.doesNotMatch(
    store,
    /if \(existing\.email !== input\.email\) \{\s*existing\.email = input\.email/,
  );
  assert.match(store, /Do not overwrite a/);
});

test("graduated students persist a professional membership instead of a local fake", async () => {
  const service = await read("src/lib/membership-service.ts");
  const layout = await read("app/portal/layout.tsx");
  const cron = await read("app/api/cron/graduation-upgrades/route.ts");
  const vercel = await read("vercel.json");
  assert.match(service, /export async function maybeUpgradeGraduatedStudent/);
  assert.match(service, /changeMembershipTier\(input\.userId, "professional"\)/);
  assert.match(service, /if \(!upgraded\) return null/);
  assert.match(service, /tier: "professional"/);
  assert.match(layout, /maybeUpgradeGraduatedStudent/);
  assert.match(cron, /listStudentMemberIds/);
  assert.match(cron, /maybeUpgradeGraduatedStudent/);
  assert.match(vercel, /\/api\/cron\/graduation-upgrades/);
});

test("portal home keeps billing cards under membership", async () => {
  const page = await read("app/portal/page.tsx");
  const membership = page.indexOf("mb-6 text-xl font-bold tracking-[-0.04em]");
  const cards = page.indexOf("mt-12 grid gap-4 sm:grid-cols-3");
  assert.ok(membership > 0 && cards > membership);
  assert.match(page, /<h2[\s\S]*?>\s*membership\s*</);
  assert.match(page, /<SubscribeButtons currentTier=\{membership\?\.tier \?\? null\} \/>/);
});

test("checkout captures user id before nested error handling", async () => {
  const checkout = await read("app/api/stripe/checkout/route.ts");
  assert.match(checkout, /const userId = user\.id;/);
  assert.match(checkout, /userHasPortalAccess\(userId\)/);
});
