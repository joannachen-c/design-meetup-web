import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

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
  assert.match(
    css,
    /\.gallery li \+ li\s*\{[^}]*margin-left:\s*clamp\(-64px,\s*-4\.3vw,\s*-38px\);/s,
  );
});

test("selected title and date live in the gallery without a divider", () => {
  assert.match(app, /className="[^"]*\bgallery-caption\b[^"]*"/);
  assert.match(app, /selectedEvent\.date_label/);
  assert.doesNotMatch(css, /\.gallery-section\s*\{[^}]*border-block/s);
});

test("gallery caption tracks the centered cover size responsively", () => {
  assert.match(app, /gallery-caption[^"]*\bmx-auto\b/);
  assert.match(
    css,
    /\.gallery-section\s*\{[^}]*--event-cover-size:\s*clamp\(168px,\s*16vw,\s*236px\);/s,
  );
  assert.match(
    css,
    /\.gallery li\s*\{[^}]*flex:\s*0 0 var\(--event-cover-size\);/s,
  );
  assert.match(
    css,
    /\.gallery-caption\s*\{[^}]*width:\s*calc\(\s*var\(--event-cover-size\)\s*\*\s*var\(--event-cover-scale\)\s*\);/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*820px\)\s*\{[\s\S]*?\.gallery-section\s*\{[^}]*--event-cover-size:\s*min\(58vw,\s*220px\);/s,
  );
  assert.doesNotMatch(
    app,
    /gallery-caption[^"]*(?:w-\[clamp|max-\[820px\]:w-\[min)/,
  );
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

test("caption width matches the focused cover's projected width, not its layout width", () => {
  assert.match(
    css,
    /\.gallery-section\s*\{[^}]*--event-cover-scale:\s*1\.2422;/s,
  );
  assert.doesNotMatch(
    css,
    /\.gallery-caption\s*\{[^}]*width:\s*var\(--event-cover-size\);/s,
  );

  // 1.2422 was measured against these three stacked perspectives and the
  // focused card's depth/scale. Changing any of them requires re-measuring.
  assert.match(css, /\.gallery\s*\{[^}]*perspective:\s*1200px;/s);
  assert.match(css, /\.gallery li\s*\{[^}]*perspective:\s*900px;/s);
  assert.match(app, /const depth = selected \? 48 : -24;/);
  assert.match(app, /const scale = selected \? 1\.06 : 0\.96;/);
  assert.match(
    app,
    /`perspective\(900px\) rotateY\(\$\{slant\}deg\) translateZ\(\$\{depth\}px\) scale\(\$\{scale\}\) translateY\(\$\{lift\}px\)`/,
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
    /flex:\s*0 0 calc\(50% - \(var\(--event-cover-size\) \/ 2\)\)/,
  );
  assert.match(
    app,
    /cardRefs\.current\[selectedIndex\]\?\.scrollIntoView\(/,
  );
});
