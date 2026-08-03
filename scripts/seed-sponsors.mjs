import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: ".env.local" });
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sponsorsPath = path.join(__dirname, "data", "sponsors.json");
const mappingsPath = path.join(__dirname, "data", "event-sponsors.json");

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL / VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function assertReady() {
  const { error } = await supabase.from("sponsors").select("id").limit(1);
  if (error) {
    console.error(
      "Could not read public.sponsors. Paste and run supabase/migrations/20260802240000_create_sponsors.sql in the Supabase SQL editor, then re-run npm run seed:sponsors.",
    );
    console.error(error.message);
    process.exit(1);
  }
}

async function main() {
  await assertReady();

  const sponsors = JSON.parse(await readFile(sponsorsPath, "utf8"));
  const mappings = JSON.parse(await readFile(mappingsPath, "utf8"));

  const sponsorRows = sponsors.map((sponsor) => ({
    slug: sponsor.slug,
    name: sponsor.name,
    website_url: sponsor.website_url,
    updated_at: new Date().toISOString(),
  }));

  const { data: upsertedSponsors, error: sponsorError } = await supabase
    .from("sponsors")
    .upsert(sponsorRows, { onConflict: "slug" })
    .select("id, slug");

  if (sponsorError) {
    console.error("Sponsor upsert failed:", sponsorError.message);
    process.exit(1);
  }

  const sponsorIdBySlug = new Map(
    (upsertedSponsors ?? []).map((row) => [row.slug, row.id]),
  );

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, luma_event_id");

  if (eventsError) {
    console.error("Could not read events:", eventsError.message);
    process.exit(1);
  }

  const eventIdByLuma = new Map(
    (events ?? []).map((row) => [row.luma_event_id, row.id]),
  );

  const linkRows = [];
  for (const mapping of mappings) {
    const eventId = eventIdByLuma.get(mapping.luma_event_id);
    if (!eventId) {
      console.warn(`Skipping missing event ${mapping.luma_event_id}`);
      continue;
    }

    mapping.sponsor_slugs.forEach((slug, index) => {
      const sponsorId = sponsorIdBySlug.get(slug);
      if (!sponsorId) {
        throw new Error(`Unknown sponsor slug: ${slug}`);
      }
      linkRows.push({
        event_id: eventId,
        sponsor_id: sponsorId,
        sort_order: index,
      });
    });
  }

  const mappedEventIds = [...new Set(linkRows.map((row) => row.event_id))];
  const { error: deleteError } = await supabase
    .from("event_sponsors")
    .delete()
    .in("event_id", mappedEventIds);

  if (deleteError) {
    console.error("Could not clear event_sponsors:", deleteError.message);
    process.exit(1);
  }

  const { error: linkError } = await supabase
    .from("event_sponsors")
    .insert(linkRows);

  if (linkError) {
    console.error("event_sponsors insert failed:", linkError.message);
    process.exit(1);
  }

  console.log(
    `Seeded ${sponsorRows.length} sponsors and ${linkRows.length} event-sponsor links.`,
  );
  console.log(
    "Logo files still needed (place under scripts/data/sponsor-logos/):",
  );
  for (const sponsor of sponsors) {
    console.log(`  - ${sponsor.slug}.svg  (or ${sponsor.slug}.png)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
