import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("cards retain perspective through the list wrapper", () => {
  assert.match(
    css,
    /\.gallery li\s*\{[^}]*transform-style:\s*preserve-3d/s,
  );
});

test("page uses a white background without an outer frame", () => {
  assert.match(app, /<main className="[^"]*\bbg-white\b/);
  assert.match(css, /main\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /main\s*\{[^}]*margin:\s*0;/s);
  assert.match(app, /<main className="[^"]*\bborder-0\b[^"]*\bshadow-none\b/);
});

test("cards use a pronounced perspective transform and spring to flat", () => {
  assert.match(app, /perspective\(\d+px\) rotateY\(/);
  assert.match(app, /type:\s*"spring"/);
});

test("cards use a tight square treatment without selection outlines", () => {
  assert.match(app, /event-card[^"]*rounded-md border-0/);
  assert.match(css, /\.event-card\s*\{[^}]*appearance:\s*none;/s);
  assert.match(app, /event-card[^"]*outline-none/);
  assert.match(app, /<img\s+className="border-0 outline-none"/);
  assert.doesNotMatch(
    css,
    /\.event-card\[aria-pressed="true"\]\s*\{[^}]*0 0 0/s,
  );
});

test("desktop cards overlap to keep four neighbors visible per side", () => {
  assert.match(css, /\.gallery li \+ li\s*\{[^}]*margin-left:\s*clamp\(/s);
});

test("selected title and date live in the gallery without a divider", () => {
  assert.match(app, /className="[^"]*\bgallery-caption\b[^"]*"/);
  assert.match(app, /selectedEvent\.date_label/);
  assert.doesNotMatch(css, /\.gallery-section\s*\{[^}]*border-block/s);
});

test("gallery caption tracks the centered cover size responsively", () => {
  assert.match(app, /gallery-caption[^"]*\bmx-auto\b/);
  assert.match(app, /w-\[clamp\(168px,16vw,236px\)\]/);
  assert.match(app, /max-\[820px\]:w-\[min\(58vw,220px\)\]/);
  assert.match(app, /gallery-caption[^"]*\btext-center\b/);
  assert.match(
    app,
    /<p[^>]*className="[^"]*\bw-full\b[^"]*\btext-pretty\b[^"]*\bfont-bold\b[^"]*"[^>]*id="selected-event-title"[^>]*>[\s\S]*?<\/p>/,
  );
  assert.doesNotMatch(app, /<h2[^>]*id="selected-event-title"/);
  assert.doesNotMatch(
    app,
    /className="[^"]*\btracking-[^"]*"[^>]*id="selected-event-title"/,
  );
  assert.match(
    app,
    /aria-labelledby=\{selectedEvent \? "selected-event-title" : undefined\}/,
  );
});

test("side cards mirror in depth with straight vertical edges", () => {
  assert.match(
    app,
    /const slant = selected \? 0 : distance < 0 \? 42 : -42;/,
  );
  assert.doesNotMatch(app, /rotateZ\(/);
  assert.match(app, /style=\{\{ zIndex: events\.length - Math\.abs\(distance\) \}\}/);
});

test("card shadows stay restrained and inside the gallery scrollport", () => {
  assert.match(app, /shadow-\[0_3px_10px_rgba\(0,0,0,0\.12\)\]/);
  assert.match(app, /aria-pressed:shadow-\[0_12px_28px_rgba\(0,0,0,0\.18\)\]/);
  assert.match(app, /pb-\[clamp\(40px,4vw,56px\)\]/);
});

test("edge cards have enough scroll rail to center in the viewport", () => {
  assert.match(css, /\.gallery::before,\s*\.gallery::after\s*\{/s);
  assert.match(
    css,
    /flex:\s*0 0 calc\(50% - \(var\(--card-size\) \/ 2\)\)/,
  );
  assert.match(
    app,
    /cardRefs\.current\[selectedIndex\]\?\.scrollIntoView\(/,
  );
});
