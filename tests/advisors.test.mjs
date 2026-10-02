import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const {
  ADVISOR_RELATIONSHIPS,
  EMPTY_ADVISOR_FILTERS,
  advisorFieldOptions,
  advisorLocationOptions,
  advisorFiltersFromSearchParams,
  advisorFromRow,
  filterAdvisors,
  hasActiveAdvisorFilters,
  sortAdvisors,
  writeAdvisorFiltersToSearchParams,
} = await import("../src/lib/advisor-directory.ts");

const migration = await readFile(
  new URL("../supabase/migrations/20261001000000_create_advisors.sql", import.meta.url),
  "utf8",
);
const seedRows = JSON.parse(
  await readFile(new URL("../src/data/advisors.json", import.meta.url), "utf8"),
);
const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

const advisors = [
  {
    slug: "ada-lovelace",
    first_name: "Ada",
    last_name: "Lovelace",
    title: "Head of Design",
    company: "Analytical",
    relationship: "mentor",
    fields: ["Design Systems", "AI"],
    locations: ["SF"],
    linkedin_url: "https://www.linkedin.com/in/ada",
  },
  {
    slug: "zoe-ardèche",
    first_name: "Zoë",
    last_name: "Ardèche",
    title: "Partner",
    company: "Brandworks",
    relationship: "advisor",
    fields: ["Brand"],
    locations: ["NYC", "LA"],
  },
  {
    slug: "bo-chen",
    first_name: "Bo",
    last_name: "Chen",
    title: "Recruiter",
    company: "Acme",
    relationship: "hiring_partner",
    fields: ["Brand", "AI"],
    locations: ["NYC"],
    x_url: "https://x.com/bo",
    website_url: "https://bo.design",
  },
].map(advisorFromRow);

const slugs = (list) => list.map((advisor) => advisor.slug);

test("advisorFromRow maps columns and falls back safely", () => {
  const advisor = advisorFromRow({
    slug: "x",
    first_name: "X",
    last_name: "Y",
    title: "T",
    company: "C",
    relationship: "unknown",
    fields: null,
    website_url: null,
  });
  assert.equal(advisor.relationship, "advisor");
  assert.deepEqual(advisor.fields, []);
  assert.equal(advisor.href, "#");
  assert.equal(advisor.photoUrl, null);
  assert.deepEqual(advisor.locations, []);
  assert.equal(advisor.linkedinUrl, null);
  assert.equal(advisor.xUrl, null);
});

test("advisor href prefers website, then LinkedIn, then X", () => {
  assert.equal(advisors[0].href, "https://www.linkedin.com/in/ada");
  assert.equal(advisors[1].href, "#");
  assert.equal(advisors[2].href, "https://bo.design");
  assert.equal(advisors[2].xUrl, "https://x.com/bo");
});

test("filterAdvisors with no filters returns everyone in order", () => {
  assert.deepEqual(slugs(filterAdvisors(advisors, EMPTY_ADVISOR_FILTERS)), [
    "ada-lovelace",
    "zoe-ardèche",
    "bo-chen",
  ]);
});

test("search matches name, company, title, field and relationship label, ignoring accents", () => {
  const search = (query) => slugs(filterAdvisors(advisors, { ...EMPTY_ADVISOR_FILTERS, query }));
  assert.deepEqual(search("zoe"), ["zoe-ardèche"]);
  assert.deepEqual(search("ARDECHE"), ["zoe-ardèche"]);
  assert.deepEqual(search("acme"), ["bo-chen"]);
  assert.deepEqual(search("design systems"), ["ada-lovelace"]);
  assert.deepEqual(search("hiring partner"), ["bo-chen"]);
  assert.deepEqual(search("brand partner"), ["zoe-ardèche", "bo-chen"]);
  assert.deepEqual(search("nobody"), []);
});

test("relationship and field filters combine with search", () => {
  const filter = (filters) => slugs(filterAdvisors(advisors, { ...EMPTY_ADVISOR_FILTERS, ...filters }));
  assert.deepEqual(filter({ relationship: "mentor" }), ["ada-lovelace"]);
  assert.deepEqual(filter({ field: "AI" }), ["ada-lovelace", "bo-chen"]);
  assert.deepEqual(filter({ field: "Brand", relationship: "advisor" }), ["zoe-ardèche"]);
  assert.deepEqual(filter({ field: "AI", query: "acme" }), ["bo-chen"]);
  assert.deepEqual(filter({ field: "AI", relationship: "advisor" }), []);
  assert.deepEqual(filter({ location: "NYC" }), ["zoe-ardèche", "bo-chen"]);
  assert.deepEqual(filter({ location: "LA" }), ["zoe-ardèche"]);
  assert.deepEqual(filter({ location: "SF", field: "Brand" }), []);
});

test("advisorLocationOptions returns unique sorted locations", () => {
  assert.deepEqual(advisorLocationOptions(advisors), ["LA", "NYC", "SF"]);
});

test("sortAdvisors sorts by last name or company without mutating input", () => {
  assert.deepEqual(slugs(sortAdvisors(advisors, "name")), ["zoe-ardèche", "bo-chen", "ada-lovelace"]);
  assert.deepEqual(slugs(sortAdvisors(advisors, "company")), ["bo-chen", "ada-lovelace", "zoe-ardèche"]);
  assert.deepEqual(slugs(advisors), ["ada-lovelace", "zoe-ardèche", "bo-chen"]);
  assert.equal(sortAdvisors(advisors, "default"), advisors);
});

test("advisorFieldOptions returns unique sorted fields", () => {
  assert.deepEqual(advisorFieldOptions(advisors), ["AI", "Brand", "Design Systems"]);
});

test("filters round-trip through URL search params", () => {
  const params = new URLSearchParams("v=2");
  writeAdvisorFiltersToSearchParams(params, {
    query: " ada ",
    relationship: "mentor",
    field: "Design Systems",
    location: "SF",
  });
  assert.equal(params.get("v"), "2");
  assert.equal(params.get("loc"), "SF");
  assert.deepEqual(advisorFiltersFromSearchParams(params), {
    query: "ada",
    relationship: "mentor",
    field: "Design Systems",
    location: "SF",
  });
  writeAdvisorFiltersToSearchParams(params, EMPTY_ADVISOR_FILTERS);
  assert.equal(params.toString(), "v=2");
  assert.equal(advisorFiltersFromSearchParams(new URLSearchParams("rel=bogus")).relationship, "all");
  assert.equal(hasActiveAdvisorFilters(EMPTY_ADVISOR_FILTERS), false);
  assert.equal(hasActiveAdvisorFilters({ ...EMPTY_ADVISOR_FILTERS, query: "  " }), false);
  assert.equal(hasActiveAdvisorFilters({ ...EMPTY_ADVISOR_FILTERS, field: "AI" }), true);
  assert.equal(hasActiveAdvisorFilters({ ...EMPTY_ADVISOR_FILTERS, location: "LA" }), true);
});

test("migration check constraint matches the app's relationship list", () => {
  const constraint = migration.match(/relationship in \(([^)]+)\)/);
  assert.ok(constraint, "relationship check constraint exists");
  const values = constraint[1].split(",").map((value) => value.trim().replace(/'/g, ""));
  assert.deepEqual(values, [...ADVISOR_RELATIONSHIPS]);
});

test("migration only exposes published advisors to the public", () => {
  assert.match(migration, /alter table public\.advisors enable row level security/);
  assert.match(migration, /for select\s+to anon, authenticated\s+using \(is_published\)/);
  assert.doesNotMatch(migration, /on public\.advisors\s+for (insert|update|delete|all)/);
});

test("seed data is valid for the advisors table", async () => {
  assert.ok(seedRows.length > 0);
  assert.equal(new Set(seedRows.map((row) => row.slug)).size, seedRows.length);
  for (const row of seedRows) {
    assert.ok(ADVISOR_RELATIONSHIPS.includes(row.relationship), `${row.slug} relationship`);
    assert.ok(row.fields.length > 0, `${row.slug} has fields`);
    assert.ok(row.locations.length > 0, `${row.slug} has a location`);
    assert.match(row.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(row.email, undefined, `${row.slug} must not ship an email`);
    if (row.linkedin_url) assert.match(row.linkedin_url, /^https:\/\/www\.linkedin\.com\/in\/[^/]+\/?$/);
    if (row.x_url) assert.match(row.x_url, /^https:\/\/x\.com\/[A-Za-z0-9_]+$/);
    if (row.website_url) assert.match(row.website_url, /^https?:\/\//);
    if (row.photo_url) {
      assert.equal(row.photo_url, `/advisors/${row.slug}.jpg`);
      await access(new URL(`../public${row.photo_url}`, import.meta.url));
    }
  }
  assert.equal(pkg.scripts["seed:advisors"], "node scripts/seed-advisors.mjs");
});

test("advisors directory renders inside the real homepage, right after About", async () => {
  const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
  const home = await read("../app/page.tsx");
  const prototype = await read("../app/prototypes/board-of-advisors/page.tsx");
  const loader = await read("../src/lib/home-page-data.ts");

  assert.match(loader, /fetchAdvisors\(\)/);
  assert.match(home, /advisorsSection=\{\s*<BoardOfAdvisorsSection /);
  assert.match(prototype, /<HomePage[\s\S]*advisorsSection=\{\s*<BoardOfAdvisorsPrototype /);
});
