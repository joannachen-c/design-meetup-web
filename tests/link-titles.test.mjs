import assert from "node:assert/strict";
import test from "node:test";
import { isTitleHost, titleFromHtml } from "../src/lib/link-titles.ts";
import { isUnnamed } from "../src/lib/planning.ts";

test("page titles lose the app suffix and decode entities", () => {
  assert.equal(
    titleFromHtml("<html><head><title>Design Meetup Long Term Sponsorship Plan - Google Docs</title></head>"),
    "Design Meetup Long Term Sponsorship Plan",
  );
  assert.equal(titleFromHtml("<title>Budget &amp; Venue - Google Sheets</title>"), "Budget & Venue");
  assert.equal(titleFromHtml("<title>Event poster – Figma</title>"), "Event poster");
  assert.equal(
    titleFromHtml('<meta property="og:title" content="Run of show"><title>Notion</title>'),
    "Run of show",
  );
});

test("sign-in and app-only titles are ignored", () => {
  for (const html of [
    "<title>Google Docs</title>",
    "<title>Sign-in</title>",
    "<title>Figma</title>",
    "<title>   </title>",
    "<p>no title</p>",
  ]) {
    assert.equal(titleFromHtml(html), null, html);
  }
});

test("only public https document hosts are fetched", () => {
  for (const url of [
    "https://docs.google.com/document/d/abc",
    "https://www.figma.com/design/x",
    "https://team.notion.site/page",
  ]) {
    assert.equal(isTitleHost(new URL(url)), true, url);
  }
  for (const url of [
    "http://docs.google.com/document/d/abc",
    "https://docs.google.com:8443/document",
    "https://localhost/doc",
    "https://169.254.169.254/latest/meta-data",
    "https://example.com/brief",
    "https://notion.site.evil.com/page",
  ]) {
    assert.equal(isTitleHost(new URL(url)), false, url);
  }
});

test("typed labels are kept; blank or hostname labels get named", () => {
  assert.equal(isUnnamed({ label: "", url: "https://docs.google.com/document/d/a" }), true);
  assert.equal(isUnnamed({ label: "docs.google.com", url: "https://docs.google.com/document/d/a" }), true);
  assert.equal(isUnnamed({ label: "www.figma.com", url: "https://www.figma.com/design/a" }), true);
  assert.equal(isUnnamed({ label: "Sponsor deck", url: "https://docs.google.com/presentation/d/a" }), false);
});
