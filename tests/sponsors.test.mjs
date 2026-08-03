import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL(
    "../supabase/migrations/20260802240000_create_sponsors.sql",
    import.meta.url,
  ),
  "utf8",
);
const supabase = await readFile(
  new URL("../src/lib/supabase.ts", import.meta.url),
  "utf8",
);
const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const tooltip = await readFile(
  new URL("../src/components/Tooltip.tsx", import.meta.url),
  "utf8",
).catch(() => "");
const sponsors = JSON.parse(
  await readFile(
    new URL("../scripts/data/sponsors.json", import.meta.url),
    "utf8",
  ),
);
const mappings = JSON.parse(
  await readFile(
    new URL("../scripts/data/event-sponsors.json", import.meta.url),
    "utf8",
  ),
);

test("sponsor schema normalizes reusable sponsors and event links", () => {
  assert.match(migration, /create table if not exists public\.sponsors/);
  assert.match(migration, /slug text not null unique/);
  assert.match(migration, /logo_url text/);
  assert.match(migration, /website_url text/);
  assert.match(migration, /create table if not exists public\.event_sponsors/);
  assert.match(migration, /references public\.events \(id\) on delete cascade/);
  assert.match(migration, /references public\.sponsors \(id\) on delete cascade/);
  assert.match(migration, /unique \(event_id, sponsor_id\)/);
  assert.match(migration, /'sponsor-logos'/);
  assert.match(migration, /Public read sponsors/);
  assert.match(migration, /Public read event sponsors/);
});

test("all 16 events map to known reusable sponsor records", () => {
  const slugs = new Set(sponsors.map((sponsor) => sponsor.slug));
  assert.equal(sponsors.length, 15);
  assert.equal(mappings.length, 16);
  for (const mapping of mappings) {
    assert.ok(mapping.sponsor_slugs.length > 0);
    for (const slug of mapping.sponsor_slugs) {
      assert.ok(slugs.has(slug), `Unknown sponsor slug ${slug}`);
    }
  }
});

test("all sponsor logos are staged for one-time upload", async () => {
  const files = await readdir(
    new URL("../scripts/data/sponsor-logos", import.meta.url),
  );
  assert.deepEqual(
    files.sort(),
    [
      "apple.png",
      "arch-partner.png",
      "clay.png",
      "cursor.png",
      "entrepreneurs-first.png",
      "figma.png",
      "framer.png",
      "google.png",
      "nexus.png",
      "notion.png",
      "phia.svg",
      "ramp.png",
      "reve.png",
      "tiat-place.png",
      "tiktok.png",
    ],
  );
});

test("event fetch joins ordered sponsors and frontend renders logos or names", () => {
  assert.match(supabase, /event_sponsors:event_sponsors/);
  assert.match(supabase, /sponsor:sponsors/);
  assert.match(supabase, /event_sponsors:[\s\S]*sort\(/);
  assert.match(app, /selectedEvent\?\.event_sponsors/);
  assert.match(app, /sponsor\.logo_url/);
  assert.match(app, /className="[^"]*\bsponsor-logo\b[^"]*"/);
  assert.match(app, /className="[^"]*\bsponsor-placeholder\b[^"]*"/);
});

test("the Phia event remains stored but is hidden from the site", () => {
  assert.match(supabase, /const HIDDEN_EVENT_IDS = new Set\(\["evt-QuvB1PVOsKysNp7"\]\)/);
  assert.match(
    supabase,
    /\.filter\(\(event\) => !HIDDEN_EVENT_IDS\.has\(event\.luma_event_id\)\)/,
  );
});

test("sponsor logos show an accessible name tooltip on hover and focus", () => {
  assert.match(tooltip, /@radix-ui\/react-tooltip/);
  assert.match(tooltip, /delayDuration=\{300\}/);
  assert.match(tooltip, /rounded-md/);
  assert.match(tooltip, /bg-ink/);
  assert.match(tooltip, /text-sm/);
  assert.match(tooltip, /text-surface/);
  assert.doesNotMatch(tooltip, /TooltipPrimitive\.Arrow/);
  assert.match(app, /<TooltipProvider>/);
  assert.match(app, /<Tooltip content=\{sponsor\.name\}>/);
  assert.match(app, /tabIndex=\{0\}/);
});
