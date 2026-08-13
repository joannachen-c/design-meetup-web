import assert from "node:assert/strict";
import test from "node:test";

import {
  applyPastTenseToEvent,
  eventHasEnded,
  rewritePastEventSummary,
  rewritePastEventSummaryHtml,
} from "../scripts/lib/past-tense.mjs";

test("eventHasEnded uses ends_at when present", () => {
  const event = {
    starts_at: "2026-07-17T00:30:00.000Z",
    ends_at: "2026-07-17T03:00:00.000Z",
  };
  assert.equal(eventHasEnded(event, new Date("2026-07-17T02:00:00.000Z")), false);
  assert.equal(eventHasEnded(event, new Date("2026-07-17T04:00:00.000Z")), true);
});

test("rewrites future event narrative into past tense", () => {
  const input =
    "We'll start the night with food and drinks. Our speakers will dive into the behind-the-scenes of projects they've built.";
  const output = rewritePastEventSummary(input);
  assert.match(output, /We started the night with food and drinks/);
  assert.match(output, /Our speakers dove into the behind-the-scenes/);
  assert.doesNotMatch(output, /\bwill\b|['’]ll\b/i);
});

test("rewrites simple-present event framing into past tense", () => {
  assert.match(
    rewritePastEventSummary(
      "This panel brings together designers spanning mobile consumer and TV.",
    ),
    /This panel brought together designers/,
  );
  assert.match(
    rewritePastEventSummary(
      "This night is built around a shared curiosity about craft.",
    ),
    /This night was built around a shared curiosity/,
  );
  assert.match(
    rewritePastEventSummary(
      "Whether you’re early career, this event is designed to help you navigate.",
    ),
    /this event was designed to help you navigate/,
  );
});

test("keeps invitation phrasing in present tense", () => {
  const output = rewritePastEventSummary(
    "Join us at TIAT for artist talks. Each artist will share how they work. After the talks, stick around to meet the artists.",
  );
  assert.match(output, /^Join us at TIAT/);
  assert.match(output, /stick around to meet/);
  assert.match(output, /Each artist shared how they work/);
});

test("keeps About / sponsor descriptions in present tense", () => {
  const output = rewritePastEventSummary(
    [
      "We'll gather for food and drinks.",
      "About Rivet",
      "Rivet helps you explore dozens of design directions from your agent",
      "About Cursor",
      "Cursor is an AI-powered workspace where designers can collaborate with agents.",
    ].join("\n\n"),
  );
  assert.match(output, /We gathered for food and drinks/);
  assert.match(output, /About Rivet/);
  assert.match(output, /Rivet helps you explore/);
  assert.match(output, /Cursor is an AI-powered workspace/);
  assert.doesNotMatch(output, /Rivet helped|Cursor was an AI/);
});

test("rewrites mixed org + event paragraphs without past-tensing the org sentence", () => {
  const output = rewritePastEventSummary(
    "Design Meetup is a community for builders. For this makeathon, we're partnering with Reve. Together, we are bridging the gap.",
  );
  assert.match(output, /^Design Meetup is a community for builders\./);
  assert.match(output, /we partnered with Reve/);
  assert.match(output, /we bridged the gap/);
});

test("coordinates verbs under a shared will", () => {
  assert.match(
    rewritePastEventSummary(
      "Speakers will share short talks and give you a chance to ask questions.",
    ),
    /Speakers shared short talks and gave you a chance/,
  );
  assert.match(
    rewritePastEventSummary(
      "Everyone will be paired into small groups and share their projects and bounce ideas.",
    ),
    /Everyone was paired into small groups and shared their projects and bounced ideas/,
  );
});

test("strips forward-looking sign-offs", () => {
  const output = rewritePastEventSummary(
    "We started strong.\n\nSee you at AT SCALE — Google x Design Meetup! ✨",
  );
  assert.doesNotMatch(output, /See you|can['’]t wait/i);
  assert.match(output, /We started strong/);
});

test("rewrites html text while preserving tags and About blocks", () => {
  const html = [
    "<p>We&#39;ll start the night with food and drinks.</p>",
    "<p><strong>About </strong><strong><a href=\"https://rivet.design/\">Rivet</a></strong></p>",
    "<p>Rivet helps you explore dozens of design directions from your agent</p>",
    "<p>See you soon! ✨</p>",
  ].join("");
  const output = rewritePastEventSummaryHtml(html);
  assert.match(output, /We started the night/);
  assert.match(output, /href="https:\/\/rivet\.design\/"/);
  assert.match(output, /Rivet helps you explore/);
  assert.doesNotMatch(output, /See you soon|We&#39;ll start|We'll start/i);
});

test("applyPastTenseToEvent only rewrites ended events", () => {
  const future = {
    starts_at: "2026-12-01T00:00:00.000Z",
    ends_at: "2026-12-01T03:00:00.000Z",
    summary: "We'll start the night with food.",
    summary_html: "<p>We'll start the night with food.</p>",
  };
  const past = {
    ...future,
    starts_at: "2026-07-01T00:00:00.000Z",
    ends_at: "2026-07-01T03:00:00.000Z",
  };
  const now = new Date("2026-08-13T00:00:00.000Z");
  assert.equal(applyPastTenseToEvent(future, now).summary, future.summary);
  assert.match(applyPastTenseToEvent(past, now).summary, /We started the night/);
});
