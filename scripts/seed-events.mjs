import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: ".env.local" });
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const eventsPath = path.join(__dirname, "data", "past-events.json");

const onlyIndex = process.argv.indexOf("--event");
const onlyEventId = onlyIndex === -1 ? null : process.argv[onlyIndex + 1];

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
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

const CONTENT_TYPES_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  png: "image/png",
};

// A cover can either live on Luma or be checked in under data/event-covers,
// which is how we swap in artwork Luma never hosted.
async function readCover(event) {
  if (/^https?:\/\//.test(event.image_url)) {
    const response = await fetch(event.image_url);
    if (!response.ok) {
      throw new Error(
        `Failed to download ${event.image_url}: ${response.status}`,
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    return {
      contentType,
      bytes: Buffer.from(await response.arrayBuffer()),
    };
  }

  const localPath = path.join(repoRoot, event.image_url);
  const extension = path.extname(localPath).slice(1).toLowerCase();
  const contentType = CONTENT_TYPES_BY_EXTENSION[extension];
  if (!contentType) {
    throw new Error(`Unsupported cover format for ${event.image_url}`);
  }

  return { contentType, bytes: await readFile(localPath) };
}

async function uploadCover(event) {
  const { contentType, bytes } = await readCover(event);

  const extension = contentType.includes("jpeg")
    ? "jpg"
    : contentType.includes("webp")
      ? "webp"
      : "png";
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

  const allEvents = JSON.parse(await readFile(eventsPath, "utf8"));
  const events = onlyEventId
    ? allEvents.filter((event) => event.luma_event_id === onlyEventId)
    : allEvents;

  if (onlyEventId && events.length === 0) {
    console.error(`No event in past-events.json matches ${onlyEventId}`);
    process.exit(1);
  }

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
