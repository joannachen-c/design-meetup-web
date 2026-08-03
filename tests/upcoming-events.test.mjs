import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("Upcoming events section sits above the partner CTA with a Luma calendar embed", () => {
  assert.match(
    app,
    /<section[\s\S]*className="[^"]*\bupcoming-events\b[^"]*"[\s\S]*UPCOMING EVENTS[\s\S]*<\/section>\s*<section[\s\S]*className="[^"]*\bpartner-cta\b/,
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
  assert.match(app, /href="#calendar"/);
  assert.doesNotMatch(
    app,
    /href="https:\/\/luma\.com\/designmeetup"[\s\S]{0,80}Upcoming/,
  );
});

test("Upcoming events links to the Luma calendar with the supplied logo", () => {
  assert.match(
    app,
    /<Primary[\s\S]*href="https:\/\/luma\.com\/designmeetup"[\s\S]*variant="secondary"[\s\S]*className="size-5"[\s\S]*src="\/luma-logo\.svg"[\s\S]*alt=""[\s\S]*Follow our Luma[\s\S]*<\/Primary>/,
  );
  assert.doesNotMatch(app, /src="\/luma-logo\.svg"[^>]*\b(?:bg-|p-)/);
});

test("Luma calendar embed clips to rounded corners", () => {
  assert.match(
    app,
    /className="[^"]*\bupcoming-events-embed\b[^"]*\boverflow-hidden\b[^"]*rounded-\[11px\][^"]*"/,
  );
});

test("Upcoming events uses a responsive two-column layout", () => {
  assert.match(
    css,
    /\.upcoming-events\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(280px,\s*0\.64fr\)\s*minmax\(0,\s*1\.36fr\);/s,
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
