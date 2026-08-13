import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

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
const chip = await readFile(
  new URL("../src/components/Chip.tsx", import.meta.url),
  "utf8",
);
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

test("all 20 events map to known reusable sponsor records", () => {
  const slugs = new Set(sponsors.map((sponsor) => sponsor.slug));
  assert.equal(sponsors.length, 17);
  assert.equal(mappings.length, 20);
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
      "rivet.png",
      "spotify.png",
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

test("the shared tooltip primitive keeps its styling for other surfaces", () => {
  assert.match(tooltip, /@radix-ui\/react-tooltip/);
  assert.match(tooltip, /delayDuration=\{300\}/);
  assert.match(tooltip, /sideOffset=\{4\}/);
  assert.match(tooltip, /rounded-\[10px\]/);
  assert.match(tooltip, /bg-ink/);
  assert.match(tooltip, /text-sm/);
  assert.match(tooltip, /text-surface/);
  assert.doesNotMatch(tooltip, /TooltipPrimitive\.Arrow/);
});

test("sponsor chips name the sponsor in text instead of relying on a tooltip", () => {
  assert.match(app, /<span className="sr-only">Sponsor: <\/span>/);
  assert.match(app, /\{sponsor\.name\}/);
  assert.doesNotMatch(app, /<Tooltip content=\{sponsor\.name\}>/);
  assert.doesNotMatch(app, /alt=\{sponsor\.name\}/);
});

test("sponsor chips open the sponsor site when a URL is known", () => {
  assert.match(
    app,
    /sponsor\.website_url \? \(\s*<Chip\s+href=\{sponsor\.website_url\}\s+target="_blank"\s+rel="noreferrer"\s*>/,
  );
  // Sponsors without a known site stay inert rather than linking nowhere.
  assert.match(app, /\) : \(\s*<Chip>\{chipContent\}<\/Chip>\s*\)/);
  assert.match(chip, /hover:bg-gray-200/);
  assert.match(chip, /active:scale-\[0\.97\]/);
  assert.match(chip, /transition-\[background-color,transform\]/);
});

test("every sponsor with a public site carries its URL", () => {
  const missing = sponsors
    .filter((sponsor) => !sponsor.website_url)
    .map((sponsor) => sponsor.slug);

  // Only the unnamed Arch partner has no confirmed site yet.
  assert.deepEqual(missing, ["arch-partner"]);
});

test("sponsor logos ship without baked-in padding around the mark", async () => {
  const dir = new URL("../scripts/data/sponsor-logos/", import.meta.url);
  const files = (await readdir(dir)).filter((name) => name.endsWith(".png"));

  for (const filename of files) {
    const source = await readFile(new URL(filename, dir));
    const before = await sharp(source).metadata();
    const { info } = await sharp(source)
      .trim({ threshold: 2 })
      .toBuffer({ resolveWithObject: true });

    assert.equal(
      `${filename} ${info.width}×${info.height}`,
      `${filename} ${before.width}×${before.height}`,
      `${filename} has empty margins; run npm run trim:sponsor-logos`,
    );
  }
});
