import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildSummaryBundle,
  normalizeTipTapDescription,
  stripLiabilityContent,
  stripLiabilityFromHtml,
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
  assert.doesNotMatch(summaryHtml, /<hr\s*\/?>|detail-summary-gap/);
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
  assert.doesNotMatch(summaryHtml, /<hr\s*\/?>|detail-summary-gap/);
});

test("Luma description parsing strips full-capacity calendar notices", () => {
  const description = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "We're at full capacity for this event, please subscribe to our calendars for future gatherings from Notion NY & Design Meetup.",
            marks: [{ type: "italic" }],
          },
        ],
      },
      { type: "horizontal_rule" },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "In this candid panel, designers will share:",
            marks: [{ type: "bold" }],
          },
        ],
      },
    ],
  };

  const summary = tipTapToPlainText(description);
  const summaryHtml = tipTapToHtml(description);

  assert.match(summary, /In this candid panel/);
  assert.doesNotMatch(summary, /full capacity|subscribe to our calendars/i);
  assert.doesNotMatch(
    summaryHtml,
    /full capacity|subscribe to our calendars|<hr\s*\/>/i,
  );

  const alreadyRendered = stripLiabilityFromHtml(
    `<p><em>We're at full capacity for this event, please subscribe to our calendars for future gatherings from <a href="https://luma.com/notion-ny">Notion NY</a> &amp; Design Meetup.</em></p><hr /><p><strong>In this candid panel, designers will share:</strong></p>`,
  );
  assert.match(alreadyRendered, /In this candid panel/);
  assert.doesNotMatch(
    alreadyRendered,
    /full capacity|subscribe to our calendars|<hr\s*\/>/i,
  );
});

test("Luma description parsing strips Figma Edu eligibility and capacity RSVP footnotes", () => {
  const description = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Speakers will share short talks about the behind-the-scenes process.",
          },
        ],
      },
      { type: "horizontal_rule" },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "This event is open to current interns and students based in the Bay Area. A verified Figma for Education email is required to register. Visit https://www.figma.com/education/apply to verify your email.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Capacity is limited to 100 attendees. RSVPs will be reviewed and selected based on the quality of responses, so take a moment to share a little about your background!",
          },
        ],
      },
    ],
  };

  const summary = tipTapToPlainText(description);
  const summaryHtml = tipTapToHtml(description);

  assert.match(summary, /Speakers will share short talks/);
  assert.doesNotMatch(
    summary,
    /Figma for Education|Capacity is limited|RSVPs will be reviewed|education\/apply/i,
  );
  assert.doesNotMatch(
    summaryHtml,
    /Figma for Education|Capacity is limited|RSVPs will be reviewed|education\/apply|<hr\s*\/>/i,
  );

  const alreadyRendered = stripLiabilityFromHtml(
    `<p>Speakers will share short talks about the behind-the-scenes process.</p><hr /><p>This event is open to current interns and students based in the Bay Area. A verified Figma for Education email is required to register. Visit <a href="https://www.figma.com/education/apply">https://www.figma.com/education/apply</a> to verify your email.</p><p>Capacity is limited to 100 attendees. RSVPs will be reviewed and selected based on the quality of responses, so take a moment to share a little about your background!</p>`,
  );
  assert.match(alreadyRendered, /Speakers will share short talks/);
  assert.doesNotMatch(
    alreadyRendered,
    /Figma for Education|Capacity is limited|RSVPs will be reviewed|education\/apply|<hr\s*\/>/i,
  );
});

test("Luma parse drops redundant titles, perk headings, social footers, and incidental bold", () => {
  const clayTitle = "Design Meetup x Clay NYC: Sharpen Your Design Toolkit";
  const description = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Design Meetup × Clay NYC ✨" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Join us for a fun evening at " },
          {
            type: "text",
            text: "Clay’s NYC office",
            marks: [{ type: "bold" }],
          },
          { type: "text", text: " with lightning talks, and great conversation." },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Speakers" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Elizabeth Lin — Design Programs @ Ramp",
            marks: [{ type: "bold" }],
          },
          { type: "hard_break" },
          {
            type: "text",
            text: "Personalized Operating Systems",
            marks: [{ type: "italic" }],
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          {
            type: "text",
            text: "Special Perk for Attendees",
            marks: [{ type: "bold" }],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "We are excited to partner with " },
          { type: "text", text: "v0 ", marks: [{ type: "bold" }] },
          { type: "text", text: "and" },
          { type: "text", text: " Cursor", marks: [{ type: "bold" }] },
          { type: "text", text: " to provide exclusive credits for all attendees!" },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          { type: "text", text: "Schedule", marks: [{ type: "bold" }] },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "6:00 PM", marks: [{ type: "bold" }] },
          { type: "text", text: " — Doors open · Food + drinks" },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Instagram:", marks: [{ type: "bold" }] },
          { type: "text", text: " @designmeetup" },
          { type: "hard_break" },
          { type: "text", text: "X:", marks: [{ type: "bold" }] },
          { type: "text", text: " @designmeetuphq" },
        ],
      },
    ],
  };

  const options = { eventTitle: clayTitle };
  const summary = tipTapToPlainText(description, options);
  const summaryHtml = tipTapToHtml(description, options);

  assert.doesNotMatch(summary, /Design Meetup × Clay NYC|Special Perk|Instagram:|@designmeetuphq/i);
  assert.match(summary, /Join us for a fun evening at Clay’s NYC office/);
  assert.match(summary, /Elizabeth Lin — Design Programs @ Ramp/);
  assert.match(summary, /partner with v0 and Cursor/);
  assert.match(summary, /6:00 PM/);

  assert.doesNotMatch(
    summaryHtml,
    /Design Meetup × Clay NYC|Special Perk|Instagram:|@designmeetuphq/i,
  );
  assert.match(
    summaryHtml,
    /Join us for a fun evening at Clay’s NYC office with lightning talks/,
  );
  assert.doesNotMatch(summaryHtml, /<strong>Clay’s NYC office<\/strong>/);
  assert.doesNotMatch(summaryHtml, /<strong>v0\s*<\/strong>|<strong>\s*Cursor<\/strong>/);
  assert.match(
    summaryHtml,
    /<p><strong>Elizabeth Lin — Design Programs @ Ramp<\/strong><br \/>/,
  );
  assert.match(summaryHtml, /<h2>Schedule<\/h2>/);
  assert.doesNotMatch(summaryHtml, /<h2><strong>Schedule<\/strong><\/h2>/);
  assert.match(summaryHtml, /<strong>6:00 PM<\/strong>/);

  const alreadyRendered = stripLiabilityFromHtml(
    `<h2>Design Meetup × Clay NYC ✨</h2><p>Join us for a fun evening at <strong>Clay’s NYC office</strong> with lightning talks, and great conversation.</p><h2><strong>Special Perk for Attendees</strong></h2><p>We are excited to partner with <strong>v0 </strong>and<strong> Cursor</strong> to provide exclusive credits for all attendees!</p><h2><strong>Schedule</strong></h2><p><strong>6:00 PM</strong> — Doors open</p><p><strong>Instagram:</strong> @designmeetup<br /><strong>X:</strong> @designmeetuphq</p>`,
    options,
  );
  assert.doesNotMatch(
    alreadyRendered,
    /Design Meetup × Clay NYC|Special Perk|Instagram:|@designmeetuphq|<strong>Clay’s NYC office<\/strong>|<strong>v0|Cursor<\/strong>|<strong>Schedule<\/strong>/i,
  );
  assert.match(alreadyRendered, /Clay’s NYC office with lightning talks/);
  assert.match(alreadyRendered, /<h2>Schedule<\/h2>/);
  assert.match(alreadyRendered, /<strong>6:00 PM<\/strong>/);

  const featuringHtml = stripLiabilityFromHtml(
    `<p>Featuring:</p><ul><li><p><strong>Jennifer Jing</strong>, Senior Product Designer for GenAI Experiences @ YouTube</p></li><li><p><strong>Zhengnan Zhao</strong>, Designer, Creator, Builder @ YouTube</p></li></ul><p>Join us at <strong>Clay’s NYC office</strong> with lightning talks.</p>`,
  );
  assert.match(
    featuringHtml,
    /<strong>Jennifer Jing<\/strong>, Senior Product Designer/,
  );
  assert.match(
    featuringHtml,
    /<strong>Zhengnan Zhao<\/strong>, Designer, Creator, Builder/,
  );
  assert.doesNotMatch(featuringHtml, /<strong>Clay’s NYC office<\/strong>/);
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
      /Photography and Filming|Safety and Inclusivity|By attending, you (give your )?consent|reserves the right to use these images|Discrimination of any kind|What is Figma for Edu|What is Design Meetup|empowers educators and students|continuously upskill while making meaningful friendships|full capacity|subscribe to our calendars|verified Figma for Education|Figma for Education email|Capacity is limited to \d+ attendees[\s\S]{0,160}RSVPs? will be reviewed|Special Perk for Attendees|^Design Meetup × Clay NYC|Instagram:\s*@designmeetup/i,
    );
    assert.doesNotMatch(
      event.summary_html,
      /Photography and Filming|Safety and Inclusivity|By attending, you (give your )?consent|reserves the right to use these images|Discrimination of any kind|What is Figma for Edu|What is Design Meetup|empowers educators and students|continuously upskill while making meaningful friendships|full capacity|subscribe to our calendars|verified Figma for Education|Figma for Education email|Capacity is limited to \d+ attendees[\s\S]{0,160}RSVPs? will be reviewed|Special Perk for Attendees|<h2>Design Meetup × Clay NYC|Instagram:\s*@designmeetup|<h2><strong>/i,
    );
  }

  const google = events.find(
    (event) => event.luma_event_id === "evt-je6T5n6VZCj2SoI",
  );
  assert.ok(google);
  assert.match(
    google.summary_html,
    /<strong>Jennifer Jing<\/strong>, Senior Product Designer/,
  );
});

test("bundled summary html matches the scraped events and reaches the app", () => {
  assert.deepEqual(summaryBundle, buildSummaryBundle(events));
  for (const event of events) {
    assert.equal(summaryBundle[event.luma_event_id], event.summary_html);
  }
  assert.match(dataLayer, /event-summaries\.json/);
  assert.match(dataLayer, /event\.summary_html \?\? fallbackSummaryHtml\(event\)/);
});
