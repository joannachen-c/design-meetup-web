import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildSummaryBundle,
  normalizeTipTapDescription,
  stripLiabilityContent,
  tipTapToHtml,
  tipTapToPlainText,
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

test("Luma description parsing strips photography, safety, and consent liability copy", () => {
  const description = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Join us for lightning talks and dinner." }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Who this is for",
            marks: [{ type: "bold" }],
          },
          { type: "hard_break" },
          { type: "text", text: "Students and early career designers." },
        ],
      },
      { type: "horizontal_rule" },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Photography and Filming",
            marks: [{ type: "bold" }],
          },
          { type: "hard_break" },
          { type: "hard_break" },
          {
            type: "text",
            text: "Please be aware that this event will be photographed and filmed. Figma reserves the right to use these images and videos for marketing and communications purposes. By attending, you consent to the use of your likeness for these purposes.",
          },
        ],
      },
      { type: "horizontal_rule" },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Safety and Inclusivity",
            marks: [{ type: "bold" }],
          },
          { type: "hard_break" },
          { type: "hard_break" },
          {
            type: "text",
            text: "All Figma events are inclusive and welcoming of all genders, sexualities, races, and abilities. Discrimination of any kind will not be tolerated. This event is governed by the Figma Code of Conduct.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "By attending, you give your consent to be photographed or filmed. If you prefer not to be included, please notify us during check-in or adjust your RSVP.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "See you soon!" }],
      },
    ],
  };

  const cleaned = stripLiabilityContent(description);
  const summary = tipTapToPlainText(cleaned);
  const summaryHtml = tipTapToHtml(cleaned);

  assert.match(summary, /Join us for lightning talks and dinner/);
  assert.match(summary, /Who this is for/);
  assert.match(summary, /See you soon!/);
  assert.doesNotMatch(summary, /Photography and Filming|Safety and Inclusivity|Code of Conduct|consent to|reserves the right|Discrimination/i);
  assert.doesNotMatch(
    summaryHtml,
    /Photography and Filming|Safety and Inclusivity|Code of Conduct|consent to|reserves the right|Discrimination/i,
  );
  assert.doesNotMatch(summaryHtml, /<hr\s*\/>\s*$/);
});

test("Luma description parsing strips Figma Edu and Design Meetup partner intros", () => {
  const description = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Join us for an afternoon of making." }],
      },
      { type: "horizontal_rule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          {
            type: "text",
            text: "\u200bWhat is Figma for Edu?",
            marks: [{ type: "bold" }],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Figma for Education is the team at Figma that empowers educators and students to make the most out of Figma’s tools. Through the Figma for Education program, qualifying educators and students can access Figma’s professional tools for free.",
          },
        ],
      },
      { type: "horizontal_rule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          {
            type: "text",
            text: "\u200bWhat is Design Meetup?",
            marks: [{ type: "bold" }],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Your role as a product, brand, and visual designer is changing with next-gen tools. Design Meetup is a place for designers who want to continuously upskill while making meaningful friendships, bringing together the world’s most ambitious designers.",
          },
        ],
      },
    ],
  };

  const summary = tipTapToPlainText(description);
  const summaryHtml = tipTapToHtml(description);

  assert.match(summary, /Join us for an afternoon of making/);
  assert.doesNotMatch(
    summary,
    /What is Figma for Edu|What is Design Meetup|empowers educators|continuously upskill/i,
  );
  assert.doesNotMatch(
    summaryHtml,
    /What is Figma for Edu|What is Design Meetup|empowers educators|continuously upskill/i,
  );
  assert.doesNotMatch(summaryHtml, /<hr\s*\/>\s*$/);
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
  assert.equal(events.length, 20);
  for (const event of events) {
    assert.match(event.summary, /\n/);
    assert.match(event.summary_html, /<(?:p|h2|ul|blockquote)\b/);
    assert.doesNotMatch(event.summary, /MadiJiabao|open6:00/);
    assert.doesNotMatch(
      event.summary,
      /Photography and Filming|Safety and Inclusivity|By attending, you (give your )?consent|reserves the right to use these images|Discrimination of any kind|What is Figma for Edu|What is Design Meetup|empowers educators and students|continuously upskill while making meaningful friendships/i,
    );
    assert.doesNotMatch(
      event.summary_html,
      /Photography and Filming|Safety and Inclusivity|By attending, you (give your )?consent|reserves the right to use these images|Discrimination of any kind|What is Figma for Edu|What is Design Meetup|empowers educators and students|continuously upskill while making meaningful friendships/i,
    );
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
