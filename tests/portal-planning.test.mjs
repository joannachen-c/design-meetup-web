import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("organizers live in a service-role-only Supabase table, not in code", async () => {
  const migration = await read("supabase/migrations/20261020120000_create_organizers.sql");
  assert.match(migration, /create table if not exists public\.organizers/);
  assert.match(migration, /references public\.profiles \(id\) on delete cascade/);
  assert.match(migration, /alter table public\.organizers enable row level security;/);
  assert.doesNotMatch(migration, /create policy/i);

  const service = await read("src/lib/membership-service.ts");
  assert.match(service, /\.from\("organizers"\)\s*\.select\("user_id"\)\s*\.eq\("user_id", userId\)/);
});

test("forged local sessions never count as organizers", async () => {
  const access = await read("src/lib/portal-access.ts");
  assert.match(access, /isLocalSessionToken\(jar\.get\(ACCESS_COOKIE\)\?\.value\)/);
  assert.match(access, /return isOrganizer\(user\.id\);/);
});

test("the Planning tab is the third tab and only for organizers", async () => {
  const header = await read("src/components/portal/PortalHeader.tsx");
  const layout = await read("app/portal/layout.tsx");
  assert.match(
    header,
    /\.\.\.memberNav,\s*\{ href: "\/portal\/planning", label: "Planning" \}/,
  );
  assert.match(header, /const nav = organizer \? organizerNav : memberNav;/);
  assert.match(layout, /organizer=\{organizer\}/);
});

test("the planning route is gated server-side", async () => {
  const page = await read("app/portal/planning/page.tsx");
  assert.match(page, /await requireOrganizer\("\/portal\/planning"\)/);
  assert.doesNotMatch(page, /iframe/);
  const access = await read("src/lib/portal-access.ts");
  assert.match(access, /if \(!\(await isOrganizerSession\(user\)\)\) notFound\(\);/);
});

test("every planning API handler checks the caller before touching data", async () => {
  for (const path of ["app/api/portal/planning/route.ts", "app/api/portal/planning/[id]/route.ts"]) {
    const source = await read(path);
    const handlers = source.match(/export async function \w+\([^)]*\) \{[^]*?\n\}/g) ?? [];
    assert.ok(handlers.length >= 2, path);
    for (const handler of handlers) {
      assert.match(handler, /await planningActor\(request\)/, `${path}: ${handler.slice(0, 40)}`);
    }
  }
});

test("planning items are stored in a service-role-only table", async () => {
  const migration = await read("supabase/migrations/20261021120000_create_planning_items.sql");
  assert.match(migration, /create table if not exists public\.planning_items/);
  assert.match(migration, /alter table public\.planning_items enable row level security;/);
  assert.doesNotMatch(migration, /create policy|insert into/i);

  const statuses = await read("supabase/migrations/20261021130000_planning_items_backlog_status.sql");
  assert.match(statuses, /drop constraint if exists planning_items_status_check/);
  assert.match(statuses, /'attention', 'motion', 'backlog', 'done'/);
});
