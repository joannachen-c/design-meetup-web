/**
 * Reconcile scripts/data/past-events.json with the public Luma calendar.
 *
 * Adds events that have happened but were never written down, scraping their
 * descriptions the same way refresh:summaries does, then renumbers sort_order
 * by date. Curated fields on events we already track are never overwritten —
 * timing or title drift is reported so a human can decide.
 *
 * Usage:
 *   npm run sync:luma              # write past-events.json + summary bundle
 *   npm run sync:luma -- --dry-run # report only
 *
 * Publishing to Supabase is still `npm run seed:events`.
 */

import { config } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  diffCalendar,
  fetchCalendarEvents,
  sortEvents,
} from "./lib/luma-calendar.mjs";
import { applyPastTenseToEvent } from "./lib/past-tense.mjs";
import { scrapeDescription, writeSummaryBundle } from "./refresh-event-summaries.mjs";

config({ path: ".env.local" });
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const eventsPath = path.join(__dirname, "data", "past-events.json");

function describe(event) {
  return `${event.title} (${event.date_label}, ${event.luma_event_id})`;
}

function reportDiff({ upcoming, localOnly, drift }) {
  for (const event of upcoming) {
    console.log(
      `  upcoming, left to the calendar embed: ${describe(event)}`,
    );
  }
  for (const event of localOnly) {
    console.log(
      `  on the site but no longer in the Luma feed, kept: ${describe(event)}`,
    );
  }
  for (const entry of drift) {
    for (const change of entry.changes) {
      console.log(
        `  drift on ${entry.title} — ${change.field}: ${change.local} → ${change.luma} (not applied)`,
      );
    }
  }
}

async function buildEventRecord(event) {
  process.stdout.write(`  scraping ${event.title}... `);
  const { summary, summary_html } = await scrapeDescription(
    event.luma_url,
    event.title,
  );
  console.log("ok");
  return applyPastTenseToEvent({
    ...event,
    summary,
    // sort_order is assigned by sortEvents once the full list is assembled.
    sort_order: 0,
    summary_html,
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const existing = JSON.parse(await readFile(eventsPath, "utf8"));

  const [past, future] = await Promise.all([
    fetchCalendarEvents("past"),
    fetchCalendarEvents("future"),
  ]);
  const calendar = [...past, ...future];
  console.log(
    `Luma calendar: ${calendar.length} events. past-events.json: ${existing.length}.`,
  );

  const diff = diffCalendar(existing, calendar);
  reportDiff(diff);

  if (diff.missingPast.length === 0) {
    console.log("Every past Luma event is already on the site.");
  } else {
    console.log(`Missing ${diff.missingPast.length} past event(s):`);
    for (const event of diff.missingPast) console.log(`  + ${describe(event)}`);
  }

  if (dryRun) {
    console.log("Dry run: past-events.json untouched.");
    return;
  }

  const added = [];
  for (const event of diff.missingPast) {
    added.push(await buildEventRecord(event));
  }

  const merged = sortEvents([...existing, ...added]);
  const reordered = merged.filter((event, index) => {
    const before = existing.find(
      (candidate) => candidate.luma_event_id === event.luma_event_id,
    );
    return before && before.sort_order !== index;
  });

  await writeFile(eventsPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  await writeSummaryBundle(merged);

  console.log(
    `Wrote ${merged.length} events (${added.length} added, ${reordered.length} renumbered).`,
  );
  if (added.length > 0 || reordered.length > 0) {
    console.log("Run npm run seed:events to publish to Supabase.");
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
