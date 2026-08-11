import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  normalizeTipTapDescription,
  stripLiabilityContent,
  stripLiabilityFromHtml,
  stripLiabilityFromPlainText,
  tipTapToHtml,
  tipTapToPlainText,
} from "./lib/tiptap.mjs";

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

export {
  normalizeTipTapDescription,
  stripLiabilityContent,
  stripLiabilityFromHtml,
  stripLiabilityFromPlainText,
  tipTapToHtml,
  tipTapToPlainText,
};

export function buildSummaryBundle(events) {
  return Object.fromEntries(
    events
      .filter((event) => event.luma_event_id && event.summary_html)
      .map((event) => [event.luma_event_id, event.summary_html]),
  );
}

export async function writeSummaryBundle(events) {
  const bundle = buildSummaryBundle(events);
  await writeFile(
    summaryBundlePath,
    `${JSON.stringify(bundle, null, 2)}\n`,
    "utf8",
  );
  return bundle;
}

function extractDescriptionMirror(html) {
  const marker = '"description_mirror":';
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error("description_mirror not found in Luma HTML");
  }

  let index = start + marker.length;
  while (index < html.length && /\s/.test(html[index])) index += 1;
  if (html[index] !== "{") {
    throw new Error("description_mirror is not an object");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let cursor = index; cursor < html.length; cursor += 1) {
    const char = html[cursor];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(index, cursor + 1));
      }
    }
  }

  throw new Error("Failed to parse description_mirror JSON");
}

async function scrapeDescription(lumaUrl) {
  const response = await fetch(lumaUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; DesignMeetupBot/1.0; +https://designmeetup.com)",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${lumaUrl}: ${response.status}`);
  }
  const html = await response.text();
  const doc = stripLiabilityContent(extractDescriptionMirror(html));
  const summary = tipTapToPlainText(doc);
  const summary_html = tipTapToHtml(doc);
  if (!summary || !summary_html) {
    throw new Error(`Empty summary for ${lumaUrl}`);
  }
  return { summary, summary_html };
}

async function refreshLocalSummaries() {
  const events = JSON.parse(await readFile(eventsPath, "utf8"));
  const refreshed = [];

  for (const event of events) {
    process.stdout.write(`Scraping ${event.title}... `);
    const { summary, summary_html } = await scrapeDescription(event.luma_url);
    refreshed.push({ ...event, summary, summary_html });
    console.log(
      `ok (${summary.split("\n").length} lines, ${summary_html.length} html chars)`,
    );
  }

  await writeFile(eventsPath, `${JSON.stringify(refreshed, null, 2)}\n`, "utf8");
  await writeSummaryBundle(refreshed);
  return refreshed;
}

async function upsertSummaries(events) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let warnedMissingHtml = false;
  for (const event of events) {
    let { error } = await supabase
      .from("events")
      .update({
        summary: event.summary,
        summary_html: event.summary_html,
        updated_at: new Date().toISOString(),
      })
      .eq("luma_event_id", event.luma_event_id);

    if (error && /summary_html/i.test(error.message)) {
      const fallback = await supabase
        .from("events")
        .update({
          summary: event.summary,
          updated_at: new Date().toISOString(),
        })
        .eq("luma_event_id", event.luma_event_id);
      error = fallback.error;
      if (!error && !warnedMissingHtml) {
        warnedMissingHtml = true;
        console.warn(
          "summary_html column missing; updated plain summaries only. Run supabase/migrations/20260802250000_add_event_summary_html.sql then re-run npm run refresh:summaries.",
        );
      }
    }

    if (error) {
      throw new Error(
        `Summary update failed for ${event.luma_event_id}: ${error.message}`,
      );
    }
  }

  console.log(
    warnedMissingHtml
      ? `Updated ${events.length} plain summaries. HTML pending migration.`
      : `Updated ${events.length} summaries (plain + html).`,
  );
}

async function main() {
  const events = await refreshLocalSummaries();
  await upsertSummaries(events);
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
