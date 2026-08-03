import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: ".env.local" });
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const eventsPath = path.join(__dirname, "data", "past-events.json");

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
  const { error } = await supabase.from("events").select("id").limit(1);
  if (error) {
    console.error(
      "Could not read public.events. Paste and run supabase/migrations/20260802160000_create_events.sql in the Supabase SQL editor, then re-run npm run seed:events.",
    );
    console.error(error.message);
    process.exit(1);
  }

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("Could not list storage buckets:", bucketError.message);
    process.exit(1);
  }

  if (!buckets?.some((bucket) => bucket.id === "event-covers")) {
    const { error: createError } = await supabase.storage.createBucket(
      "event-covers",
      { public: true },
    );
    if (createError) {
      console.error(
        "Missing event-covers bucket. Create a public Storage bucket named event-covers, or run the migration SQL.",
      );
      console.error(createError.message);
      process.exit(1);
    }
  }
}

async function uploadCover(event) {
  const response = await fetch(event.image_url);
  if (!response.ok) {
    throw new Error(`Failed to download ${event.image_url}: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const extension = contentType.includes("jpeg")
    ? "jpg"
    : contentType.includes("webp")
      ? "webp"
      : "png";
  const bytes = Buffer.from(await response.arrayBuffer());
  const objectPath = `${event.luma_event_id}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("event-covers")
    .upload(objectPath, bytes, {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });

  if (uploadError) {
    throw new Error(`Upload failed for ${event.title}: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("event-covers").getPublicUrl(objectPath);
  return data.publicUrl;
}

async function main() {
  await assertReady();

  const events = JSON.parse(await readFile(eventsPath, "utf8"));
  console.log(`Seeding ${events.length} events...`);

  const rows = [];
  for (const event of events) {
    const imageUrl = await uploadCover(event);
    rows.push({
      luma_event_id: event.luma_event_id,
      luma_url: event.luma_url,
      title: event.title,
      date_label: event.date_label,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      timezone: event.timezone,
      location: event.location,
      hosts: event.hosts,
      summary: event.summary,
      summary_html: event.summary_html ?? null,
      image_url: imageUrl,
      guest_count: event.guest_count ?? 0,
      sort_order: event.sort_order,
      updated_at: new Date().toISOString(),
    });
    console.log(`✓ ${event.title}`);
  }

  const { error } = await supabase.from("events").upsert(rows, {
    onConflict: "luma_event_id",
  });

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`Done. Upserted ${rows.length} events.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
