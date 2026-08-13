import assert from "node:assert/strict";
import test from "node:test";

import {
  stripHorizontalRules,
  tipTapToHtml,
  tipTapToPlainText,
} from "../scripts/lib/tiptap.mjs";

const artistTalksDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Join us at " },
        {
          type: "text",
          text: "TIAT",
          marks: [{ type: "link", attrs: { href: "https://www.tiat.place/" } }],
        },
        { type: "text", text: " for artist talks." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Featured Speakers", marks: [{ type: "bold" }] },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Halim Madi",
              marks: [
                { type: "link", attrs: { href: "https://www.halimmadi.com/" } },
              ],
            },
            { type: "hard_break" },
            {
              type: "text",
              text: "Jiabao Li",
              marks: [
                { type: "link", attrs: { href: "https://www.jiabaoli.org/" } },
              ],
            },
            { type: "hard_break" },
            {
              type: "text",
              text: "Althea Rao",
              marks: [
                {
                  type: "link",
                  attrs: { href: "https://altheamrao.github.io/" },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Agenda", marks: [{ type: "bold" }] },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "6:00 PM: Doors open" },
            { type: "hard_break" },
            { type: "text", text: "6:00 - 6:30 PM: Light bites" },
          ],
        },
      ],
    },
    {
      type: "bullet_list",
      content: [
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Food and drinks" }],
            },
          ],
        },
      ],
    },
  ],
};

test("TipTap HTML preserves hard breaks so speaker names do not smash", () => {
  const html = tipTapToHtml(artistTalksDoc);
  assert.match(
    html,
    /Halim Madi<\/a><br \/><a[^>]*>Jiabao Li<\/a><br \/><a[^>]*>Althea Rao/,
  );
  assert.doesNotMatch(html, /MadiJiabao|open6:00/);
  assert.match(html, /Doors open<br \/>6:00 - 6:30 PM: Light bites/);
  assert.match(html, /<strong>Featured Speakers<\/strong>/);
  assert.match(
    html,
    /<a href="https:\/\/www\.tiat\.place\/" target="_blank" rel="noreferrer">TIAT<\/a>/,
  );
  assert.match(html, /<ul><li><p>Food and drinks<\/p><\/li><\/ul>/);
});

test("TipTap plain text retains agenda line breaks and bold section titles as text", () => {
  const plain = tipTapToPlainText(artistTalksDoc);
  assert.match(plain, /Halim Madi\nJiabao Li\nAlthea Rao/);
  assert.match(plain, /6:00 PM: Doors open\n6:00 - 6:30 PM: Light bites/);
  assert.doesNotMatch(plain, /MadiJiabao|open6:00/);
  assert.match(plain, /• Food and drinks/);
});

test("TipTap horizontal rules are omitted (no line, no gap)", () => {
  const html = tipTapToHtml({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Intro." }],
      },
      { type: "horizontal_rule" },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Featured Speakers", marks: [{ type: "bold" }] },
        ],
      },
    ],
  });

  assert.equal(
    html,
    "<p>Intro.</p><p><strong>Featured Speakers</strong></p>",
  );
  assert.doesNotMatch(html, /<hr\s*\/?>|detail-summary-gap/);
});

test("stripHorizontalRules removes hrs and leftover gap spacers", () => {
  const html =
    '<p>A</p><hr /><div class="detail-summary-gap" aria-hidden="true"></div><p>B</p>';
  assert.equal(stripHorizontalRules(html), "<p>A</p><p>B</p>");
});

test("TipTap HTML keeps Featuring list speaker name bold", () => {
  const html = tipTapToHtml({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Featuring:" }],
      },
      {
        type: "bullet_list",
        content: [
          {
            type: "list_item",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Jennifer Jing",
                    marks: [{ type: "bold" }],
                  },
                  {
                    type: "text",
                    text: ", Senior Product Designer for GenAI Experiences @ YouTube",
                  },
                ],
              },
            ],
          },
          {
            type: "list_item",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Sönke Rohde",
                    marks: [{ type: "bold" }],
                  },
                  {
                    type: "text",
                    text: ", Principal UX Designer @ Cloud AI",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Join us at " },
          {
            type: "text",
            text: "Clay’s NYC office",
            marks: [{ type: "bold" }],
          },
          { type: "text", text: " tonight." },
        ],
      },
    ],
  });

  assert.match(
    html,
    /<li><p><strong>Jennifer Jing<\/strong>, Senior Product Designer/,
  );
  assert.match(
    html,
    /<li><p><strong>Sönke Rohde<\/strong>, Principal UX Designer/,
  );
  assert.doesNotMatch(html, /<strong>Clay’s NYC office<\/strong>/);
  assert.match(html, /Join us at Clay’s NYC office tonight/);
});
