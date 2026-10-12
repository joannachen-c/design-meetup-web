import assert from "node:assert/strict";
import test from "node:test";
import {
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

test("Luma links inside summary HTML get the invite code", () => {
  const html =
    '<a href="https://luma.com/notion-ny">Notion NY</a> <a href="https://rivet.design/">Rivet</a> <a href="https://luma.com/x?a=1&amp;b=2">x</a>';
  assert.equal(
    withLumaInviteInHtml(html),
    '<a href="https://luma.com/notion-ny?invite=ilyssayan">Notion NY</a> <a href="https://rivet.design/">Rivet</a> <a href="https://luma.com/x?a=1&amp;b=2&amp;invite=ilyssayan">x</a>',
  );
});
