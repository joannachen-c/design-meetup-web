import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildSummaryBundle,
  normalizeTipTapDescription,
  tipTapToHtml,
} from "../scripts/refresh-event-summaries.mjs";

const seed = await readFile(
  new URL("../scripts/refresh-event-summaries.mjs", import.meta.url),
  "utf8",
);
const migration = await readFile(
  new URL(
    "../supabase/migrations/20260802250000_add_event_summary_html.sql",
    import.meta.url,
  ),
  "utf8",
);
const events = JSON.parse(
  await readFile(
    new URL("../scripts/data/past-events.json", import.meta.url),
    "utf8",
  ),
);
const summaryBundle = JSON.parse(
  await readFile(
    new URL("../src/data/event-summaries.json", import.meta.url),
    "utf8",
  ),
);
const dataLayer = await readFile(
  new URL("../src/lib/supabase.ts", import.meta.url),
  "utf8",
);

test("TipTap descriptions retain paragraphs and list breaks", () => {
  const description = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Opening paragraph." }],
      },
      {
        type: "heading",
        content: [{ type: "text", text: "Agenda" }],
      },
      {
        type: "bullet_list",
        content: [
          {
            type: "list_item",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Doors open" }],
              },
            ],
          },
          {
            type: "list_item",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Talks begin" }],
              },
            ],
          },
        ],
      },
    ],
  };

  assert.equal(
    normalizeTipTapDescription(description),
    "Opening paragraph.\n\nAgenda\n\n• Doors open\n• Talks begin",
  );
  assert.equal(
    tipTapToHtml(description),
    "<p>Opening paragraph.</p><h2>Agenda</h2><ul><li><p>Doors open</p></li><li><p>Talks begin</p></li></ul>",
  );
});

test("summary refresh updates plain and html summary fields in Supabase", () => {
  assert.match(migration, /add column if not exists summary_html text/);
  assert.match(seed, /\.from\("events"\)\s*\.update\(\{/);
  assert.match(seed, /\.eq\("luma_event_id", event\.luma_event_id\)/);
  assert.match(seed, /summary:\s*event\.summary/);
  assert.match(seed, /summary_html:\s*event\.summary_html/);
  assert.doesNotMatch(seed, /\.storage/);
});

test("all local event summaries contain retained line breaks and html", () => {
  assert.equal(events.length, 16);
  for (const event of events) {
    assert.match(event.summary, /\n/);
    assert.match(event.summary_html, /<(?:p|h2|ul|blockquote)\b/);
    assert.doesNotMatch(event.summary, /MadiJiabao|open6:00/);
  }
});

test("bundled summary html matches the scraped events and reaches the app", () => {
  assert.deepEqual(summaryBundle, buildSummaryBundle(events));
  for (const event of events) {
    assert.equal(summaryBundle[event.luma_event_id], event.summary_html);
  }
  assert.match(dataLayer, /event-summaries\.json/);
  assert.match(dataLayer, /event\.summary_html \?\? fallbackSummaryHtml\(event\)/);
});
