import assert from "node:assert/strict";
import test from "node:test";
import {
  eventPlatformName,
  LUMA_PAST_EVENTS_URL,
  LUMA_PROFILE_URL,
  withLumaInvite,
  withLumaInviteInHtml,
} from "../src/lib/luma.ts";

test("Luma links carry the ilyssayan invite code", () => {
  assert.equal(withLumaInvite("http://luma.com/"), "http://luma.com/?invite=ilyssayan");
  assert.equal(
    withLumaInvite("https://luma.com/b0l7tzxd"),
    "https://luma.com/b0l7tzxd?invite=ilyssayan",
  );
  assert.equal(withLumaInvite("https://lu.ma/abc"), "https://lu.ma/abc?invite=ilyssayan");
  assert.equal(LUMA_PROFILE_URL, "https://luma.com/designmeetup?invite=ilyssayan");
  assert.equal(
    LUMA_PAST_EVENTS_URL,
    "https://luma.com/designmeetup?period=past&invite=ilyssayan",
  );
});

test("withLumaInvite is idempotent and leaves other links alone", () => {
  const once = withLumaInvite("https://luma.com/designmeetup");
  assert.equal(withLumaInvite(once), once);
  assert.equal(
    withLumaInvite("https://substack.com/?utm_source=luma"),
    "https://substack.com/?utm_source=luma",
  );
  assert.equal(withLumaInvite("not a url"), "not a url");
});

test("Partiful events are labelled as Partiful, not Luma", () => {
  assert.equal(
    eventPlatformName("https://partiful.com/e/B8wY6jWjggnDI1y9AjDH"),
    "Partiful",
  );
  assert.equal(eventPlatformName("https://go.partiful.com/TC3uhP1f"), "Partiful");
  assert.equal(eventPlatformName("https://luma.com/a3c052xo?invite=ilyssayan"), "Luma");
  assert.equal(eventPlatformName("not a url"), "Luma");
  assert.equal(
    withLumaInvite("https://partiful.com/e/B8wY6jWjggnDI1y9AjDH"),
    "https://partiful.com/e/B8wY6jWjggnDI1y9AjDH",
  );
});

test("Luma links inside summary HTML get the invite code", () => {
  const html =
    '<a href="https://luma.com/notion-ny">Notion NY</a> <a href="https://rivet.design/">Rivet</a> <a href="https://luma.com/x?a=1&amp;b=2">x</a>';
  assert.equal(
    withLumaInviteInHtml(html),
    '<a href="https://luma.com/notion-ny?invite=ilyssayan">Notion NY</a> <a href="https://rivet.design/">Rivet</a> <a href="https://luma.com/x?a=1&amp;b=2&amp;invite=ilyssayan">x</a>',
  );
});
