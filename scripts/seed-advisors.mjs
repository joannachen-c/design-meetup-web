import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: ".env.local" });
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const advisorsPath = path.join(__dirname, "..", "src", "data", "advisors.json");

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
  const { error } = await supabase.from("advisors").select("id").limit(1);
  if (error) {
    console.error(
      "Could not read public.advisors. Run supabase/migrations/20261001000000_create_advisors.sql (or `supabase migration up` locally), then re-run npm run seed:advisors.",
    );
    console.error(error.message);
    process.exit(1);
  }
}

async function main() {
  await assertReady();

  const advisors = JSON.parse(await readFile(advisorsPath, "utf8"));
  const now = new Date().toISOString();

  const rows = advisors.map((advisor, index) => ({
    slug: advisor.slug,
    first_name: advisor.first_name,
    last_name: advisor.last_name,
    title: advisor.title,
    company: advisor.company,
    relationship: advisor.relationship ?? "advisor",
    fields: advisor.fields ?? [],
    locations: advisor.locations ?? [],
    bio: advisor.bio ?? null,
    photo_url: advisor.photo_url ?? null,
    website_url: advisor.website_url ?? null,
    linkedin_url: advisor.linkedin_url ?? null,
    x_url: advisor.x_url ?? null,
    sort_order: advisor.sort_order ?? index,
    is_published: true,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("advisors")
    .upsert(rows, { onConflict: "slug" })
    .select("id");

  if (error) {
    console.error("Advisor upsert failed:", error.message);
    process.exit(1);
  }

  const slugs = rows.map((row) => row.slug);
  const { data: removed, error: removeError } = await supabase
    .from("advisors")
    .delete()
    .not("slug", "in", `(${slugs.join(",")})`)
    .select("slug");

  if (removeError) {
    console.error("Removing advisors no longer in the list failed:", removeError.message);
    process.exit(1);
  }

  const withPhotos = rows.filter((row) => row.photo_url).length;
  console.log(
    `Seeded ${data.length} advisors (${withPhotos} with photos) into ${url}; removed ${removed.length} not in the list.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
