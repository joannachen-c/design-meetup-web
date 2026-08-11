import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const eventListRow = await readFile(
  new URL("../src/components/EventListRow.tsx", import.meta.url),
  "utf8",
);

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
  assert.match(app, /perspective\(\d+px\) translateX\([^)]*\) translateZ\(/);
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

test("desktop covers overlap in proportion to the cover, not the viewport", () => {
  assert.match(
    css,
    /\.gallery li \+ li\s*\{[^}]*margin-left:\s*calc\(var\(--event-cover-size\) \* -0\.591\);/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*820px\)\s*\{[\s\S]*?\.gallery li \+ li\s*\{[^}]*margin-left:\s*calc\(var\(--event-cover-size\) \* -0\.42\);/s,
  );
});

test("the rail fades into the page instead of hard-cutting at the edges", () => {
  assert.match(app, /className="gallery-viewport"/);
  assert.match(
    css,
    /\.gallery-viewport::before,\s*\.gallery-viewport::after\s*\{[^}]*position:\s*absolute;[^}]*pointer-events:\s*none;/s,
  );
  assert.match(
    css,
    /\.gallery-viewport::before\s*\{[^}]*background-image:\s*linear-gradient\(\s*to right,/s,
  );
  assert.match(
    css,
    /\.gallery-viewport::after\s*\{[^}]*background-image:\s*linear-gradient\(\s*to left,/s,
  );
});

test("gallery title and date live only in the detail section below", () => {
  assert.doesNotMatch(app, /\bgallery-caption\b/);
  assert.doesNotMatch(css, /\.gallery-caption\b/);
  assert.match(app, /selectedEvent\.date_label/);
  assert.doesNotMatch(css, /\.gallery-section\s*\{[^}]*border-block/s);
});

test("the selected title id lives on the detail heading the region points at", () => {
  assert.match(
    app,
    /<h2[\s\S]*id=\{SELECTED_TITLE_ID\}[\s\S]*>\s*\{selectedEvent\.title\}\s*<\/h2>/,
  );
  assert.match(
    app,
    /aria-labelledby=\{selectedEvent \? SELECTED_TITLE_ID : undefined\}/,
  );
  assert.doesNotMatch(app, /titleId=/);
  assert.doesNotMatch(eventListRow, /\btitleId\b/);
  assert.match(
    css,
    /\.events-layout\s*\{[^}]*--event-cover-size:\s*clamp\(184px,\s*18vw,\s*272px\);/s,
  );
  assert.match(
    css,
    /\.gallery li\s*\{[^}]*flex:\s*0 0 var\(--event-cover-size\);/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*820px\)\s*\{[\s\S]*?\.events-layout\s*\{[^}]*--event-cover-size:\s*min\(64vw,\s*252px\);/s,
  );
});

test("focused cover projection still uses the measured stacked perspectives", () => {
  assert.doesNotMatch(css, /--event-cover-scale/);

  // Depth and scale were measured against these three stacked perspectives.
  // Changing any of them requires re-measuring the painted cover.
  assert.match(css, /\.gallery\s*\{[^}]*perspective:\s*2400px;/s);
  assert.match(css, /\.gallery li\s*\{[^}]*perspective:\s*2200px;/s);
  assert.match(app, /const depth = selected \? 26 : hovered \? 2 : -14;/);
  assert.match(app, /const rest = selected \? 1\.03 : hovered \? 0\.87 : 0\.85;/);
  assert.match(
    app,
    /`perspective\(2200px\) translateX\(\$\{part\}%\) translateZ\(\$\{depth\}px\) scaleX\(\$\{squeeze\}\) skewY\(\$\{shear\}deg\) scale\(\$\{scale\}\) translate\(0px, \$\{lift\}px\)`/,
  );
});

test("every unfocused cover faces the same way on a shared diagonal", () => {
  assert.match(app, /const CARD_SQUEEZE = 0\.68;/);
  assert.match(app, /const CARD_SHEAR_DEG = 13;/);
  assert.match(app, /const squeeze = selected \? 1 : CARD_SQUEEZE;/);
  assert.match(app, /const shear = selected \? 0 : CARD_SHEAR_DEG;/);
  // A shear keeps the covers' vertical edges vertical; a rotation would tip
  // them over with the diagonal. A squeeze keeps the painted box centred on the
  // cover; rotateY runs it through perspective and pushes it off-centre, which
  // breaks the even gap either side of the focused cover.
  assert.doesNotMatch(app, /rotateZ\(|rotateY\(/);
  assert.doesNotMatch(app, /distance < 0 \? 42 : -42/);
  // Every cover sits on the one to its right, so the stack leans with the shear
  // across the whole rail rather than mirroring at the centre. Only the focused
  // cover breaks that order.
  assert.match(
    app,
    /zIndex: selected\s*\?\s*events\.length \+ 1\s*:\s*events\.length - index,/s,
  );
  assert.doesNotMatch(app, /events\.length - Math\.abs\(distance\)/);
});

test("hovering a cover eases it out from under the cover to its left", () => {
  // A nudge, not a leap: the pull stays well under the part that clears the
  // focused cover, so the hovered cover never escapes the shelf.
  assert.match(app, /const CARD_PULL_PCT = 5;/);
  const pull = Number(app.match(/const CARD_PULL_PCT = ([\d.]+);/)[1]);
  const part = Number(app.match(/const CARD_PART_PCT = ([\d.]+);/)[1]);
  assert.ok(pull * 3 < part, "the hover pull should stay a fraction of the part");
  assert.match(
    app,
    /const shelf = selected\s*\?\s*0\s*:\s*away \* \(CARD_PART_PCT \+ \(hovered \? CARD_PULL_PCT : 0\)\);/s,
  );
  // The hovered cover keeps its place in the rail's order, so its left-hand
  // neighbour still paints over it while it slides.
  assert.doesNotMatch(app, /zIndex: hovered/);
  assert.match(app, /onPointerEnter=\{\(event\) =>\s*hoverCard\(index, event\.pointerType\)/s);
  assert.match(app, /onPointerLeave=\{\(event\) =>\s*hoverCard\(null, event\.pointerType\)/s);
  // The row covers grow in place on hover rather than sliding sideways.
  assert.match(
    css,
    /@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\.event-row:hover \.event-row-thumb\s*\{[^}]*transform:\s*scale\(1\.06\);/s,
  );
  assert.doesNotMatch(css, /\.event-row-thumb\s*\{[^}]*translateX/s);
});

test("covers fade up in place once the loader lifts, sweeping right to left", () => {
  assert.match(
    app,
    /transform: isGalleryReady\s*\?\s*transform\s*:\s*entranceTransform/s,
  );
  assert.match(app, /opacity: isGalleryReady \? 1 : 0/);
  assert.match(
    app,
    /const entranceDelay = hasGalleryEntered\s*\?\s*0\s*:\s*cardEntranceDelay\(distance\);/s,
  );
  assert.match(app, /<PageLoader onDone=\{revealGallery\} \/>/);

  // The entrance pose is the resting pose, so nothing turns, unfolds, or
  // travels across the shelf on the way in.
  assert.match(
    app,
    /const entranceTransform = cardTransform\(\{\s*distance,\s*selected,\s*hovered: false,\s*entering: true,\s*\}\);/s,
  );
  assert.match(app, /const part = entering \? shelf \+ CARD_ENTRANCE_SHIFT_PCT : shelf;/);
  assert.match(app, /const scale = entering \? rest \* CARD_ENTRANCE_SCALE : rest;/);
});

test("the entrance is a short settle rather than a spring or a long slide", () => {
  const shift = Number(
    app.match(/const CARD_ENTRANCE_SHIFT_PCT = ([\d.]+);/)[1],
  );
  const entranceScale = Number(
    app.match(/const CARD_ENTRANCE_SCALE = ([\d.]+);/)[1],
  );
  const part = Number(app.match(/const CARD_PART_PCT = ([\d.]+);/)[1]);
  assert.ok(shift > 0, "covers should come up from right of their slot");
  assert.ok(
    shift * 4 < part,
    "the entrance step should stay well under a shelf part so covers settle rather than fly in",
  );
  assert.ok(
    entranceScale > 0.9 && entranceScale < 1,
    "the entrance scale should be a touch under the resting scale",
  );

  const stagger = Number(
    app.match(/const CARD_ENTRANCE_STAGGER_S = ([\d.]+);/)[1],
  );
  const maxDelay = Number(
    app.match(/const CARD_ENTRANCE_MAX_DELAY_S = ([\d.]+);/)[1],
  );
  const handOffMs = Number(app.match(/setHasGalleryEntered\(true\), (\d+)\)/)[1]);
  assert.ok(stagger > 0, "covers should not all arrive at once");
  assert.ok(
    maxDelay > stagger,
    "the sweep needs room for several covers before it caps",
  );
  assert.match(
    app,
    /return Math\.min\(\s*Math\.max\(CARD_ENTRANCE_LEAD_SLOTS - distance, 0\) \* CARD_ENTRANCE_STAGGER_S,\s*CARD_ENTRANCE_MAX_DELAY_S,\s*\);/s,
  );

  // Easing, not a spring: an overshoot at the end of the entrance is what makes
  // a cover look like it spun out of its slot.
  assert.match(
    app,
    /: \{\s*duration: CARD_ENTRANCE_DURATION_S,\s*ease: CARD_ENTRANCE_EASE,\s*delay: entranceDelay,\s*\}/s,
  );
  assert.match(
    app,
    /: hasGalleryEntered\s*\?\s*\{\s*type: "spring",/s,
  );
  const duration = Number(
    app.match(/const CARD_ENTRANCE_DURATION_S = ([\d.]+);/)[1],
  );
  assert.ok(
    handOffMs >= (maxDelay + duration) * 1000,
    "the spring should only take over once the entrance has finished",
  );
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
  assert.match(app, /centerSlide\(\s*selectedIndex,/);
});

// A cover only paints where its slide sits once it is the focused one: until
// then cardTransform pushes it out by CARD_PART_PCT of its own width. Centring
// the card element centred that pushed box, overshot by the push, and scroll
// snap rounded the overshoot up to a whole slide of error, so the scroll target
// has to come from the slide's layout box.
test("centering targets the selected slide's layout box, not the transformed cover", () => {
  assert.match(
    app,
    /const centerSlide = useCallback\(\s*\(index: number, behavior: ScrollBehavior\) => \{[\s\S]*?slideCenterOffset\(index, rect\.left \+ rect\.width \/ 2\)[\s\S]*?gallery\.scrollTo\(\{ left: gallery\.scrollLeft \+ offset, behavior \}\)/,
  );
  assert.doesNotMatch(app, /\.scrollIntoView\(\{[^}]*inline: "center"/s);
});

// scrollIntoView scrolls every ancestor scrollport, so keeping the selected row
// visible also dragged the page down as soon as list view mounted. The list has
// to scroll its own container and nothing above it.
test("list view keeps the selected row visible without scrolling the page", () => {
  assert.doesNotMatch(app, /rowRefs\.current\[selectedIndex\]\?\.scrollIntoView/);
  assert.match(
    app,
    /if \(view !== "list"\) return;[\s\S]*?listScrollElement\.scrollBy\(\{\s*top: offset,/,
  );
});
