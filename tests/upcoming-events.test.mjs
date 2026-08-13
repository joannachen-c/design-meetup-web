import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const header = await readFile(
  new URL("../src/components/SiteHeader.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const luma = await readFile(new URL("../src/lib/luma.ts", import.meta.url), "utf8");
const panel = await readFile(
  new URL("../src/components/RecentEventsPanel.tsx", import.meta.url),
  "utf8",
);

test("Upcoming events section sits above the partner CTA with a Luma calendar embed", () => {
  assert.match(
    app,
    /<section[\s\S]*className="[^"]*\bupcoming-events\b[^"]*"[\s\S]*>\s*Calendar\s*<\/h2>[\s\S]*<\/section>\s*<section[\s\S]*className="[^"]*\bpartner-cta\b/,
  );
  assert.match(
    app,
    /src=\{LUMA_CALENDAR_EMBED_SRC\}/,
  );
  assert.match(
    app,
    /https:\/\/luma\.com\/embed\/calendar\/cal-HH5XBdHyWPt0yhB\/events\?lt=light/,
  );
  assert.match(app, /id="calendar"/);
  assert.match(header, /href: "#calendar"/);
  assert.doesNotMatch(
    app,
    /href="https:\/\/luma\.com\/designmeetup"[\s\S]{0,80}Calendar/,
  );
});

test("Upcoming events links to the Luma calendar with the supplied logo", () => {
  assert.match(
    app,
    /<Primary[\s\S]*className="gap-2 !bg-ink font-bold !text-white hover:!bg-black"[\s\S]*href="https:\/\/luma\.com\/designmeetup"[\s\S]*className="size-5 brightness-0 invert"[\s\S]*src="\/luma-logo\.svg"[\s\S]*alt=""[\s\S]*Follow our Luma[\s\S]*<\/Primary>/,
  );
  assert.doesNotMatch(app, /src="\/luma-logo\.svg"[^>]*\b(?:bg-|p-)/);
});

test("Luma calendar embed clips to rounded corners", () => {
  assert.match(
    app,
    /className="[^"]*\bupcoming-events-embed\b[^"]*\boverflow-hidden\b[^"]*rounded-\[20px\][^"]*"/,
  );
  assert.match(
    panel,
    /className="[^"]*\brecent-events\b[^"]*rounded-\[20px\][^"]*\bbg-surface-muted\b/,
  );
});

test("Empty Luma calendar falls back to the past events list", () => {
  assert.match(luma, /calendar_api_id: LUMA_CALENDAR_API_ID/);
  assert.match(luma, /period,/);
  assert.match(page, /fetchLumaCalendarEvents\("future"\)/);
  // Only a confirmed empty calendar swaps the embed out: an unreachable Luma
  // returns null, which must leave the embed in place.
  assert.match(luma, /if \(!response\.ok\) return null;/);
  assert.match(
    page,
    /upcomingEvents\?\.length === 0\s*\?\s*\(\(await fetchLumaCalendarEvents\("past"\)\) \?\? \[\]\)\s*:\s*\[\]/s,
  );
  assert.match(app, /const showRecentEvents = recentEvents\.length > 0;/);
  assert.match(
    app,
    /\{showRecentEvents \? \(\s*<RecentEventsPanel events=\{recentEvents\} \/>\s*\) : \(\s*<iframe/,
  );
  assert.match(panel, /https:\/\/luma\.com\/designmeetup\?period=past/);
  assert.match(panel, /Past events/);
});

test("Past events fallback holds the embed's block in the layout", () => {
  assert.match(css, /\.recent-events\s*\{[^}]*min-height:\s*520px;/s);
});

test("Upcoming events uses the shared responsive twelve-column layout", () => {
  assert.match(
    css,
    /\.upcoming-events\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);/s,
  );
  assert.match(
    css,
    /\.upcoming-events-copy\s*\{[^}]*grid-column:\s*1\s*\/\s*span 4;/s,
  );
  assert.match(
    css,
    /\.upcoming-events-embed\s*\{[^}]*grid-column:\s*6\s*\/\s*span 7;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.upcoming-events\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  );
  assert.match(
    css,
    /\.upcoming-events-frame\s*\{[^}]*min-height:\s*520px;[^}]*height:\s*min\(60vh,\s*640px\);/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.upcoming-events-frame\s*\{[^}]*min-height:\s*620px;[^}]*height:\s*min\(72vh,\s*760px\);/s,
  );
});
