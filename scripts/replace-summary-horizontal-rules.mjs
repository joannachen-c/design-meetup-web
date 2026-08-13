/**
 * Strip Luma horizontal rules (and any leftover detail-summary-gap spacers)
 * from stored event summary HTML, then write local JSON. Supabase is skipped
 * unless --push-supabase is passed and credentials are present.
 *
 * Usage:
 *   node scripts/replace-summary-horizontal-rules.mjs
 *   node scripts/replace-summary-horizontal-rules.mjs --dry-run
 *   node scripts/replace-summary-horizontal-rules.mjs --push-supabase
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { stripHorizontalRules } from "./lib/tiptap.mjs";
import { buildSummaryBundle } from "./refresh-event-summaries.mjs";

config({ path: ".env.local" });
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const eventsPath = path.join(__dirname, "data", "past-events.json");
const summaryBundlePath = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "event-summaries.json",
);

const dryRun = process.argv.includes("--dry-run");
const pushSupabase = process.argv.includes("--push-supabase");

async function main() {
  const events = JSON.parse(await readFile(eventsPath, "utf8"));
  let rewritten = 0;

  const nextEvents = events.map((event) => {
    const before = event.summary_html ?? "";
    const after = stripHorizontalRules(before);
    if (after !== before) rewritten += 1;
    return { ...event, summary_html: after };
  });

  console.log(
    `${rewritten} of ${events.length} local summaries had <hr> / gap spacers to strip.`,
  );

  if (dryRun) {
    console.log("Dry run — no files or Supabase rows written.");
    return;
  }

  await writeFile(
    eventsPath,
    `${JSON.stringify(nextEvents, null, 2)}\n`,
    "utf8",
  );

  const bundle = buildSummaryBundle(nextEvents);
  await writeFile(
    summaryBundlePath,
    `${JSON.stringify(bundle, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote ${path.relative(process.cwd(), eventsPath)}`);
  console.log(`Wrote ${path.relative(process.cwd(), summaryBundlePath)}`);

  if (!pushSupabase) {
    console.log("Skipping Supabase update (pass --push-supabase to upload).");
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn(
      "Skipping Supabase update — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing.",
    );
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let updated = 0;
  for (const event of nextEvents) {
    if (!event.luma_event_id || !event.summary_html) continue;
    const { error } = await supabase
      .from("events")
      .update({
        summary_html: event.summary_html,
        updated_at: new Date().toISOString(),
      })
      .eq("luma_event_id", event.luma_event_id);
    if (error) {
      throw new Error(
        `Failed to update ${event.title}: ${error.message}`,
      );
    }
    updated += 1;
  }

  console.log(`Updated ${updated} Supabase event summaries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
