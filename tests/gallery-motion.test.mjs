import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const image = await readFile(new URL("../src/lib/image.ts", import.meta.url), "utf8");
const loader = await readFile(
  new URL("../src/components/PageLoader.tsx", import.meta.url),
  "utf8",
);
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("cards retain perspective through the list wrapper", () => {
  assert.match(
    css,
    /\.gallery li\s*\{[^}]*transform-style:\s*preserve-3d/s,
  );
});

// The slots overlap and carry the stacking order, so a bare slot rectangle sits
// over its right-hand neighbours' covers. Left-wing covers shear left into those
// slots, so if the slot is a hit target it swallows their clicks.
test("only the covers take clicks, never the slots they shear over", () => {
  assert.match(css, /\.gallery li\s*\{[^}]*pointer-events:\s*none;/s);
  assert.match(css, /\.event-card\s*\{[^}]*pointer-events:\s*auto;/s);
});

test("page uses the cream surface background without an outer frame", () => {
  assert.match(app, /<main className="[^"]*\bbg-surface\b/);
  assert.match(css, /main\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /main\s*\{[^}]*margin:\s*0;/s);
  assert.match(app, /<main className="[^"]*\bborder-0\b[^"]*\bshadow-none\b/);
});

// A white curtain over the cream page reads as a flash on load; the overlay,
// html canvas, and is-loading body all have to share the surface token.
test("the loader curtain uses the same surface as the page", () => {
  assert.match(loader, /className="page-loader[^"]*\bbg-surface\b/);
  assert.doesNotMatch(loader, /\bbg-white\b/);
  // SVG stays sharp on retina phones; the 200px PNG went soft at the mobile size.
  assert.match(loader, /src="\/design-meetup-logo\.svg"/);
  assert.match(
    css,
    /mask:\s*url\("\/design-meetup-logo\.svg"\) center \/ contain no-repeat/,
  );
  assert.match(layout, /<html[^>]*\bclassName="[^"]*\bbg-surface\b/);
  assert.match(layout, /<body[^>]*\bclassName="[^"]*\bbg-surface\b/);
  assert.doesNotMatch(
    css,
    /html\s*\{[^}]*background-color:\s*var\(--color-surface\)/s,
  );
  assert.doesNotMatch(
    css,
    /\.page-loader\s*\{[^}]*background-color:\s*var\(--color-surface\)/s,
  );
});

test("cards use a pronounced perspective transform and spring to flat", () => {
  assert.match(app, /perspective\(\d+px\) translateX\([^)]*\) translateZ\(/);
  assert.match(app, /type:\s*"spring"/);
});

test("cards use a tight square treatment without selection outlines", () => {
  assert.match(app, /event-card[^"]*rounded-lg border-0/);
  assert.match(css, /\.event-card\s*\{[^}]*appearance:\s*none;/s);
  assert.match(app, /event-card[^"]*outline-none/);
  // The cover cannot clip its overflow, so the image rounds its own corners.
  assert.match(app, /<img\s+className="rounded-\[inherit\] border-0 outline-none"/);
  assert.doesNotMatch(
    css,
    /\.event-card\[aria-pressed="true"\]\s*\{[^}]*0 0 0/s,
  );
});

test("desktop covers overlap in proportion to the cover, not the viewport", () => {
  assert.match(
    css,
    /\.gallery li \+ li\s*\{[^}]*margin-left:\s*calc\(var\(--event-cover-size\) \* -0\.59\);/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*820px\)\s*\{[\s\S]*?\.gallery li \+ li\s*\{[^}]*margin-left:\s*calc\(var\(--event-cover-size\) \* -0\.5\);/s,
  );
});

// The phone shelf is tuned against the same three settings as the desktop one,
// but for a cover and a half a side instead of four covers: a viewport half only
// has room for the part, the nearest cover whole, and half of the next.
test("phone shelf shows a cover and a half on each side of the focused one", () => {
  const part = Number(app.match(/const CARD_PART_PCT = ([\d.]+);/)[1]) / 100;
  const rest = Number(
    app.match(/const rest = selected \? 1\.03 : hovered \? [\d.]+ : ([\d.]+);/)[1],
  );
  const phone = css.match(/@media \(max-width:\s*820px\)\s*\{[\s\S]*$/)[0];
  const overlap = Number(
    phone.match(
      /\.gallery li \+ li\s*\{[^}]*margin-left:\s*calc\(var\(--event-cover-size\) \* (-[\d.]+)\);/s,
    )[1],
  );
  const coverVw =
    Number(phone.match(/--event-cover-size:\s*min\(([\d.]+)vw,/)[1]) / 100;

  const pitch = 1 + overlap;
  // Cover widths from the focused cover's centre, so this holds at every phone
  // width the cover is sized by the viewport at.
  const half = 0.5 / coverVw;
  const paintedEdge = (distance) => distance * pitch + part + rest / 2;

  assert.ok(
    paintedEdge(1) < half,
    "the cover next to the focused one should paint whole inside the rail",
  );
  // Each shelf cover is painted over by its left-hand neighbour, so what shows
  // of the cover two slots out starts where the cover one slot out ends.
  assert.ok(
    half - paintedEdge(1) > 0.3,
    "the cover two slots out should show about half of itself, not a hairline",
  );
  assert.ok(
    paintedEdge(2) >= half,
    "a third cover would mean the shelf is denser than a cover and a half",
  );

  // Same rule as desktop: the shelf has to stand clear of the focused cover, or
  // the covers beside it are swallowed rather than tucked behind it.
  const gap = (pitch + part - rest / 2 - 1.03 / 2) * coverVw * 375;
  assert.ok(
    gap > 8,
    "the focused cover should keep a visible gap either side on a phone too",
  );
});

// Pitch, part and resting scale only make sense together: a shelf cover paints
// from distance * pitch + (part - rest / 2) to distance * pitch + (part + rest /
// 2) of a cover away from centre. The desktop shelf is tuned so the fourth cover
// on each side clears the viewport half whole and the fifth runs off the edge.
test("desktop shelf shows four whole covers on each side of the focused one", () => {
  const part = Number(app.match(/const CARD_PART_PCT = ([\d.]+);/)[1]) / 100;
  const rest = Number(
    app.match(/const rest = selected \? 1\.03 : hovered \? [\d.]+ : ([\d.]+);/)[1],
  );
  const overlap = Number(
    css.match(
      /\.gallery li \+ li\s*\{[^}]*margin-left:\s*calc\(var\(--event-cover-size\) \* (-[\d.]+)\);/s,
    )[1],
  );

  // The reference viewport, where clamp(184px, 18vw, 272px) resolves to 18vw.
  const viewport = 1470;
  const cover = viewport * 0.18;
  const pitch = (1 + overlap) * cover;
  const paintedEdge = (distance) => distance * pitch + (part + rest / 2) * cover;

  assert.ok(
    paintedEdge(4) <= viewport / 2,
    "the fourth cover on each side should paint whole inside the rail",
  );
  assert.ok(
    paintedEdge(5) > viewport / 2,
    "a fifth whole cover would mean the shelf is denser than intended",
  );

  // The focused cover paints at 1.03x, so the part has to carry its neighbours
  // clear of it: without a gap either side the shelf swallows the focused cover.
  const gap = pitch + (part - rest / 2) * cover - (1.03 / 2) * cover;
  assert.ok(gap > 8, "the focused cover should keep a visible gap either side");
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

test("desktop hover washes the carousel edges and overlays muted chevrons", () => {
  assert.match(app, /id="event-carousel"/);
  assert.match(
    app,
    /className="gallery-edge gallery-edge-start"[\s\S]*?aria-label="Previous event"[\s\S]*?aria-controls="event-carousel"[\s\S]*?disabled=\{selectedIndex <= 0\}[\s\S]*?<ArrowIcon direction="left" \/>/,
  );
  assert.match(
    app,
    /className="gallery-edge gallery-edge-end"[\s\S]*?aria-label="Next event"[\s\S]*?aria-controls="event-carousel"[\s\S]*?disabled=\{selectedIndex >= events\.length - 1\}[\s\S]*?<ArrowIcon direction="right" \/>/,
  );
  assert.match(app, /onClick=\{\(event\) => \{\s*selectEvent\(selectedIndex - 1\);/);
  assert.match(app, /onClick=\{\(event\) => \{\s*selectEvent\(selectedIndex \+ 1\);/);
  assert.match(app, /if \(event\.detail > 0\) \{\s*event\.currentTarget\.blur\(\);/);

  // Phones and coarse pointers keep the swipe; the overlay is a desktop hover.
  // The band passes events through so covers under the wash (2nd/3rd from the
  // edge) stay clickable; only the chevron is a hit target.
  assert.match(css, /\.gallery-edge\s*\{[^}]*display:\s*none;/s);
  assert.match(
    css,
    /@media \(min-width:\s*821px\)\s*\{[\s\S]*?@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\.gallery-edge\s*\{[^}]*pointer-events:\s*none;/s,
  );
  assert.match(
    css,
    /@media \(min-width:\s*821px\)\s*\{[\s\S]*?@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\.gallery-edge-button\s*\{[^}]*pointer-events:\s*auto;/s,
  );
  assert.match(
    app,
    /className="gallery-edge gallery-edge-start"[\s\S]*?onPointerEnter=\{\(event\) =>\s*hoverCard\(null, event\.pointerType\)/,
  );
  assert.match(
    app,
    /className="gallery-edge gallery-edge-end"[\s\S]*?onPointerEnter=\{\(event\) =>\s*hoverCard\(null, event\.pointerType\)/,
  );
  assert.match(
    css,
    /\.gallery-edge::before\s*\{[^}]*opacity:\s*0;[^}]*backdrop-filter:\s*blur\(8px\);[^}]*transition:\s*opacity 180ms ease;/s,
  );
  assert.match(
    css,
    /\.gallery-edge-start::before\s*\{[^}]*background-image:\s*linear-gradient\(\s*to right,\s*var\(--color-surface\)/s,
  );
  assert.match(
    css,
    /\.gallery-edge-end::before\s*\{[^}]*background-image:\s*linear-gradient\(\s*to left,\s*var\(--color-surface\)/s,
  );
  assert.match(
    app,
    /className="gallery-edge-button bg-transparent p-0 text-muted"/,
  );
  assert.doesNotMatch(
    css,
    /\.gallery-edge-button\s*\{[^}]*color:\s*var\(--color-(?:body|ink|muted)\);/s,
  );
  assert.match(
    css,
    /\.gallery-edge-button svg\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s,
  );
  assert.match(css, /\.gallery-edge-button svg path\s*\{[^}]*stroke-width:\s*2;/s);
  // Chevrons sit in the outer fade, not centered across the whole edge band.
  assert.match(
    css,
    /\.gallery-edge\s*\{[^}]*z-index:\s*5;/s,
  );
  assert.match(
    css,
    /\.gallery-edge-start\s*\{[^}]*padding-left:\s*clamp\(8px, 0\.8vw, 14px\);/s,
  );
  assert.match(
    css,
    /\.gallery-edge-end\s*\{[^}]*padding-right:\s*clamp\(8px, 0\.8vw, 14px\);/s,
  );
  assert.match(
    css,
    /\.gallery-edge-button\s*\{[^}]*flex:\s*0 0 auto;[^}]*width:\s*44px;/s,
  );
  assert.doesNotMatch(
    css,
    /\.gallery-edge-button\s*\{[^}]*width:\s*100%;/s,
  );
  // Opacity on the fade itself, not an ancestor, so backdrop-filter still
  // samples the covers. Side / shelf hover shows the wash; the focused centre
  // cover does not (is-center-hovered). Do not require hovering the edge for
  // the wash. Viewport focus-within would stick after a click.
  assert.doesNotMatch(
    css,
    /\.gallery-viewport:hover \.gallery-edge\s*\{[^}]*opacity:\s*1;/s,
  );
  assert.doesNotMatch(css, /\.gallery-viewport:focus-within/);
  assert.doesNotMatch(
    css,
    /\.gallery-edge:hover:has\(\.gallery-edge-button:not\(:disabled\)\)::before/,
  );
  assert.match(
    css,
    /\.gallery-viewport:hover:not\(:has\(\.event-card\.is-center-hovered\)\)\s*\.gallery-edge::before,[\s\S]*?\.gallery-edge:has\(\.gallery-edge-button:focus-visible\)::before\s*\{[^}]*opacity:\s*1;/s,
  );
  assert.match(
    css,
    /\.gallery-viewport:hover:not\(:has\(\.event-card\.is-center-hovered\)\)\s*\.gallery-edge-button:not\(:disabled\),[\s\S]*?\.gallery-edge-button:focus-visible:not\(:disabled\)\s*\{[^}]*opacity:\s*1;/s,
  );
  // Plain viewport:hover must not reveal the chrome — that lit the edges while
  // the pointer sat on the focused centre cover.
  assert.doesNotMatch(
    css,
    /\.gallery-viewport:hover \.gallery-edge::before/,
  );
  assert.doesNotMatch(
    css,
    /\.gallery-viewport:hover \.gallery-edge-button:not\(:disabled\)/,
  );
  assert.match(
    css,
    /\.gallery-edge-button:disabled\s*\{[^}]*pointer-events:\s*none;/s,
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
    /@media \(max-width:\s*820px\)\s*\{[\s\S]*?\.events-layout\s*\{[^}]*--event-cover-size:\s*min\(25vw,\s*130px\);/s,
  );
});

test("focused cover projection still uses the measured stacked perspectives", () => {
  assert.doesNotMatch(css, /--event-cover-scale/);

  // Depth and scale were measured against these stacked perspectives.
  // Changing any of them requires re-measuring the painted cover.
  assert.match(css, /\.gallery\s*\{[^}]*perspective:\s*2800px;/s);
  assert.match(css, /\.gallery li\s*\{[^}]*perspective:\s*2800px;/s);
  assert.match(app, /const depth = selected \? 12 : hovered \? 2 : -6;/);
  assert.match(app, /const rest = selected \? 1\.03 : hovered \? 0\.93 : 0\.9;/);
  assert.match(
    app,
    /`perspective\(2800px\) translateX\(\$\{part\}%\) translateZ\(\$\{depth\}px\) scaleX\(\$\{squeeze\}\) skewY\(\$\{shear\}deg\) scale\(\$\{scale\}\) translate\(0px, \$\{lift\}px\)`/,
  );
});

test("every unfocused cover faces the same way on a shared diagonal", () => {
  assert.match(app, /const CARD_SQUEEZE = 1;/);
  assert.match(app, /const CARD_SHEAR_DEG = 8;/);
  assert.match(app, /const squeeze = selected \? 1 : CARD_SQUEEZE;/);
  assert.match(app, /const shearRest = selected \? 0 : CARD_SHEAR_DEG;/);
  // A shear keeps the covers' vertical edges vertical; a rotation would tip
  // them over with the diagonal. Squeeze stays at 1 so the resting scale is the
  // only thing sizing a shelf cover; rotateY would push the box off-centre and
  // break the even gap either side of the focused cover.
  assert.doesNotMatch(app, /rotateZ\(|rotateY\(/);
  assert.doesNotMatch(app, /distance < 0 \? 42 : -42/);
  // Every cover sits on the one to its right, so the stack leans with the shear
  // across the whole rail rather than mirroring at the centre. Selection must
  // not raise a cover or it pops over its left-hand neighbour mid-scroll.
  assert.match(app, /zIndex: events\.length - index,/);
  assert.doesNotMatch(app, /events\.length - Math\.abs\(distance\)/);
  assert.doesNotMatch(
    app,
    /zIndex: selected\s*\?\s*events\.length \+ 1/s,
  );
});

test("hovering a cover eases it out from under the cover to its left", () => {
  // A nudge, not a leap: the pull stays well under the part that clears the
  // focused cover, so the hovered cover never escapes the shelf.
  assert.match(app, /const CARD_PULL_PCT = 5;/);
  const pull = Number(app.match(/const CARD_PULL_PCT = ([\d.]+);/)[1]);
  const part = Number(app.match(/const CARD_PART_PCT = ([\d.]+);/)[1]);
  assert.ok(pull * 3 < part, "the hover pull should stay a fraction of the part");
  // The part mirrors across the focused cover, the pull does not: the rail
  // leans one way, so out from under the left-hand neighbour is rightward on
  // both wings.
  assert.match(
    app,
    /const shelf = selected\s*\?\s*0\s*:\s*away \* CARD_PART_PCT \+ \(hovered \? CARD_PULL_PCT : 0\);/s,
  );
  // Hover grows the cover a touch out of its resting size but never up to the
  // focused one, so the shelf keeps a single card in focus.
  const [, selectedScale, hoverScale, restScale] = app
    .match(/const rest = selected \? ([\d.]+) : hovered \? ([\d.]+) : ([\d.]+);/)
    .map(Number);
  assert.ok(
    restScale < hoverScale && hoverScale < selectedScale,
    "resting covers should sit under hovered covers, and both under the focused one",
  );
  // The hovered cover keeps its place in the rail's order, so its left-hand
  // neighbour still paints over it while it slides.
  assert.doesNotMatch(app, /zIndex: hovered/);
  assert.match(app, /onPointerOver=\{\(event\) =>\s*hoverCard\(index, event\.pointerType\)/s);
  // Clearing lives on the rail, not on each cover: overlapping sheared covers
  // miss paired leave events, which used to leave hoveredIndex stuck while the
  // CSS hover: shadow correctly followed the pointer.
  assert.match(
    app,
    /className="gallery[^"]*"[\s\S]*?onPointerLeave=\{\(event\) =>\s*hoverCard\(null, event\.pointerType\)/s,
  );
  assert.doesNotMatch(
    app,
    /event-card[\s\S]{0,800}onPointerLeave=\{\(event\) =>\s*hoverCard\(null/s,
  );
  // Covers still use over/rail-leave only. The edge band may clear hover on
  // enter so a cover under the wash settles while the reader aims for a chevron.
  assert.doesNotMatch(
    app,
    /event-card[\s\S]{0,800}onPointerEnter=\{\(event\) =>\s*hoverCard/,
  );
  // Grid covers grow in place on hover rather than sliding sideways.
  assert.match(
    css,
    /@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\.event-grid-cover:hover\s*\{[^}]*transform:\s*scale\(1\.06\);/s,
  );
  assert.doesNotMatch(css, /\.event-grid-cover\s*\{[^}]*translateX/s);
});

// Clicking a left-wing cover used to select the cover to its right. The pull
// mirrored with the part, so hovering a left-wing cover drove it further under
// its left-hand neighbour: the right-edge sliver the reader was pointing at
// slid out from under the pointer, the pointer dropped onto the cover behind,
// and the click landed on that one instead.
test("hovering a cover never pulls its sliver out from under the pointer", () => {
  const part = Number(app.match(/const CARD_PART_PCT = ([\d.]+);/)[1]) / 100;
  const pull = Number(app.match(/const CARD_PULL_PCT = ([\d.]+);/)[1]) / 100;
  const [, , hoverScale, restScale] = app
    .match(/const rest = selected \? ([\d.]+) : hovered \? ([\d.]+) : ([\d.]+);/)
    .map(Number);
  const overlap = Number(
    css.match(
      /\.gallery li \+ li\s*\{[^}]*margin-left:\s*calc\(var\(--event-cover-size\) \* (-[\d.]+)\);/s,
    )[1],
  );
  const pitch = 1 + overlap;

  // Painted edges in cover widths from the focused cover's centre.
  const edges = (distance, hovered) => {
    const away = distance < 0 ? -1 : 1;
    const shelf = away * part + (hovered ? pull : 0);
    const scale = hovered ? hoverScale : restScale;
    const centre = distance * pitch + shelf;
    return { left: centre - scale / 2, right: centre + scale / 2 };
  };

  // Every cover is painted over by its left-hand neighbour, so its right edge
  // is the only part of it a reader can see or click. Hovering has to widen
  // that sliver on both wings, never retreat across it.
  for (const distance of [-4, -2, -1, 1, 2, 4]) {
    assert.ok(
      edges(distance, true).right > edges(distance, false).right,
      `hovering the cover ${distance} slots out should widen its sliver, not retreat from the pointer`,
    );
  }

  // What the pull does walk away from is the cover's left edge, which is
  // exposed on the cover just right of the focused one. The hit pad holds the
  // resting box while the cover is pulled so that edge keeps the pointer.
  const pad = css.match(
    /\.event-card:not\(\[aria-pressed="true"\]\):hover::after\s*\{[^}]*inset:\s*(\S+) (\S+) -([\d.]+)% -([\d.]+)%;/s,
  );
  assert.ok(pad, "hovered covers need a hit pad holding their resting box");
  const [, padTop, padRight, , padLeft] = pad;
  // Reaching right would take clicks off the sliver of the next cover along.
  assert.equal(padTop, "0");
  assert.equal(padRight, "0");
  assert.ok(
    (Number(padLeft) / 100) * hoverScale >=
      edges(1, true).left - edges(1, false).left,
    "the hit pad has to reach back at least as far as the pull retreats",
  );

  // The pad lives outside the cover, so the cover cannot clip its overflow.
  assert.doesNotMatch(css, /\.event-card\s*\{[^}]*overflow:\s*hidden;/s);
});

// A rail that opens on its first cover is a wing running off one edge rather
// than a shelf: the focused cover needs covers tucked behind it on both sides
// from the first frame.
test("the rail opens on the sixth cover, or the newest when there is no sixth", () => {
  assert.match(image, /export const DEFAULT_FOCUS_SLOT = 5;/);
  assert.match(app, /const initialIndex = initialFocusIndex\(initialEvents\.length\);/);
  // The shelf, the ticker and the detail all read the selection from here, so
  // none of them can open on a different cover than the others.
  assert.match(app, /useState\(initialIndex\)/);
  assert.match(app, /index: initialIndex,/);
});

test("covers deal in from under their left-hand neighbour, left to right", () => {
  assert.match(
    app,
    /transform: isGalleryReady\s*\?\s*transform\s*:\s*entranceTransform/s,
  );
  assert.match(app, /opacity: isGalleryReady \? 1 : 0/);
  assert.match(
    app,
    /const entranceDelay = settled\s*\?\s*0\s*:\s*cardEntranceDelay\(distance\) \* pace;/s,
  );
  assert.match(
    app,
    /<PageLoader onDone=\{revealGallery\} waitForImages=\{firstPaintCovers\} \/>/,
  );

  assert.match(
    app,
    /const entranceTransform = cardTransform\(\{\s*distance,\s*selected,\s*hovered: false,\s*entering: true,\s*\}\);/s,
  );
  // The entrance pose steps the cover along the shelf it will rest on and turns
  // it further than the shelf rests, so it squares up as it lands.
  assert.match(app, /const part = entering \? shelf \+ CARD_ENTRANCE_SHIFT_PCT : shelf;/);
  assert.match(app, /const scale = entering \? rest \* CARD_ENTRANCE_SCALE : rest;/);
  assert.match(
    app,
    /const shear = entering \? shearRest \+ CARD_ENTRANCE_SHEAR_DEG : shearRest;/,
  );
  assert.match(
    app,
    /const lift = entering \? liftRest \+ CARD_ENTRANCE_LIFT_PX : liftRest;/,
  );

  // The step out is measured against the shelf's own slot pitch, so a cover
  // starts where its neighbour rests rather than an arbitrary nudge away.
  const slotPitch = Number(app.match(/const CARD_SLOT_PITCH_PCT = ([\d.]+);/)[1]);
  const slotOverlap = Number(
    css.match(
      /\.gallery li \+ li \{[^}]*margin-left: calc\(var\(--event-cover-size\) \* -([\d.]+)\)/s,
    )[1],
  );
  assert.equal(
    slotPitch,
    Math.round((1 - slotOverlap) * 100),
    "the entrance step has to be measured against the shelf's own slot pitch",
  );
  const shift = Number(app.match(/const CARD_ENTRANCE_SHIFT_PCT = (-?[\d.]+);/)[1]);
  assert.ok(shift < 0, "covers should come in from the left");
  assert.ok(
    Math.abs(shift) > slotPitch / 2 && Math.abs(shift) <= slotPitch,
    "covers should come up from about a slot to the left, and never past one",
  );
});

test("the entrance is a staggered deal rather than a spring", () => {
  const entranceScale = Number(
    app.match(/const CARD_ENTRANCE_SCALE = ([\d.]+);/)[1],
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
  assert.ok(stagger > 0, "covers should not all arrive at once");
  assert.ok(
    maxDelay > stagger,
    "the sweep needs room for several covers before it caps",
  );
  // Left to right: the covers on the left lead in together, then the sweep
  // steps rightward a slot at a time.
  assert.match(
    app,
    /return Math\.min\(\s*Math\.max\(CARD_ENTRANCE_LEAD_SLOTS \+ distance, 0\) \* CARD_ENTRANCE_STAGGER_S,\s*CARD_ENTRANCE_MAX_DELAY_S,\s*\);/s,
  );

  // The sweep is counted from the focused cover, so it travels with the focus
  // wherever the rail opens. What that costs is a longer right wing, and the cap
  // has to bite before the cover at the far end of it or the deal outlasts the
  // hand-off to the selection spring.
  const lead = Number(app.match(/const CARD_ENTRANCE_LEAD_SLOTS = ([\d.]+);/)[1]);
  const focusSlot = Number(image.match(/export const DEFAULT_FOCUS_SLOT = ([\d.]+);/)[1]);
  assert.ok(
    (lead + focusSlot) * stagger > maxDelay,
    "the cap has to bite before the cover furthest right of the opening focus",
  );

  // Easing, not a spring: an overshoot at the end of the entrance is what makes
  // a cover look like it spun out of its slot.
  assert.match(
    app,
    /: \{\s*duration: CARD_ENTRANCE_DURATION_S \* pace,\s*ease: CARD_ENTRANCE_EASE,\s*delay: entranceDelay,\s*\}/s,
  );
  assert.match(app, /: settled\s*\?\s*\{\s*type: "spring",/s);

  // The hand-off is derived from the sweep rather than guessed, so the spring
  // cannot take over a cover that is still travelling.
  assert.match(
    app,
    /const CARD_ENTRANCE_TOTAL_MS = Math\.ceil\(\s*\(CARD_ENTRANCE_MAX_DELAY_S \+ CARD_ENTRANCE_DURATION_S\) \* 1000,\s*\);/s,
  );
  assert.match(app, /setHasGalleryEntered\(true\),\s*CARD_ENTRANCE_TOTAL_MS,/s);
  const duration = Number(
    app.match(/const CARD_ENTRANCE_DURATION_S = ([\d.]+);/)[1],
  );
  assert.ok(
    duration > maxDelay,
    "a cover should spend longer travelling than the sweep spends waiting on it",
  );
});

// Swapping views used to cut: the grid vanished and a finished shelf appeared in
// its place, with nothing to tie the two together.
test("swapping views hands over instead of cutting", () => {
  assert.match(app, /<AnimatePresence mode="wait" initial=\{false\}>/);
  assert.match(app, /key="carousel"/);
  assert.match(app, /key="grid"/);
  // The rail is built fresh on the way back in, so it deals out again rather
  // than springing from a pose it never held.
  assert.match(app, /if \(nextView === "carousel"\) setIsDealing\(true\);/);
  assert.match(app, /const settled = hasGalleryEntered && !isDealing;/);
  assert.match(
    app,
    /initial=\{\s*isDealing && !reduceMotion \? entrancePose : false\s*\}/s,
  );
  assert.match(
    app,
    /setIsDealing\(false\),\s*reduceMotion \? 0 : CARD_SWAP_TOTAL_MS,/s,
  );

  // The replay is the same sweep run faster: the reader pressed a control and is
  // waiting on it, and the far end of the sweep is empty rail until it lands.
  const speedup = Number(app.match(/const CARD_SWAP_SPEEDUP = ([\d.]+);/)[1]);
  assert.ok(
    speedup > 0 && speedup < 1,
    "a view swap should not deal slower than a first load",
  );
  assert.match(app, /const pace = isDealing \? CARD_SWAP_SPEEDUP : 1;/);
  assert.match(app, /cardEntranceDelay\(distance\) \* pace/);
  assert.match(app, /duration: CARD_ENTRANCE_DURATION_S \* pace,/);
  // The hand-off has to cover the swap it is waiting on, not just the sweep.
  assert.match(
    app,
    /const CARD_SWAP_TOTAL_MS =\s*VIEW_SWAP_DURATION_MS \+ Math\.ceil\(CARD_ENTRANCE_TOTAL_MS \* CARD_SWAP_SPEEDUP\);/s,
  );

  // The swap itself is dead time in front of the view you asked for, so it stays
  // shorter than either view's own entrance.
  const swapMs = Number(app.match(/const VIEW_SWAP_DURATION_MS = (\d+);/)[1]);
  const gridDuration = Number(
    app.match(/const GRID_TILE_DURATION_S = ([\d.]+);/)[1],
  );
  assert.ok(swapMs > 0 && swapMs <= 200, "the crossfade should stay a beat, not a wipe");
  assert.ok(swapMs / 1000 < gridDuration, "the swap should be shorter than the pack's own reveal");

  // The pack fills in reading order and caps, so a long archive still lands in
  // about the same time as a short one.
  assert.match(
    app,
    /return Math\.min\(index \* GRID_TILE_STAGGER_S, GRID_TILE_MAX_DELAY_S\);/,
  );
  assert.match(app, /delay: reduceMotion \? 0 : gridTileDelay\(index\)/);
  assert.match(
    app,
    /initial=\{\s*reduceMotion\s*\?\s*false\s*:\s*\{\s*opacity: 0,\s*x: -GRID_TILE_RISE_PX\s*\}\s*\}/s,
  );
  const tileRise = Number(app.match(/const GRID_TILE_RISE_PX = (\d+);/)[1]);
  assert.ok(tileRise <= 16, "grid covers should slide a step, not fly across the column");
});

// A filter of any kind keeps every cover on its own raster layer, which the rail
// pays for on every scroll, so the softness has to leave with the entrance.
test("the entrance softness is reduced-motion aware and does not outlive it", () => {
  assert.match(
    app,
    /filter:\s*settled \|\| reduceMotion\s*\?\s*"none"\s*:\s*isGalleryReady\s*\?\s*"blur\(0px\)"\s*:\s*`blur\(\$\{CARD_ENTRANCE_BLUR_PX\}px\)`/s,
  );
  assert.match(app, /mass: 0\.85,\s*filter: \{ duration: 0 \},/s);
  const blur = Number(app.match(/const CARD_ENTRANCE_BLUR_PX = ([\d.]+);/)[1]);
  assert.ok(blur > 0 && blur <= 10, "the softness should read as travel, not fog");
});

test("card shadows stay restrained and inside the gallery scrollport", () => {
  assert.match(app, /shadow-\[0_3px_10px_rgba\(0,0,0,0\.12\)\]/);
  assert.match(app, /aria-pressed:shadow-\[0_12px_28px_rgba\(0,0,0,0\.18\)\]/);
  // Bottom padding lives in CSS so it can include the rail underhang the
  // focused cover's shadow (and Luma hint) paint into.
  assert.match(
    css,
    /\.gallery\s*\{[^}]*padding-bottom:\s*calc\(clamp\(40px,\s*4vw,\s*56px\) \+ var\(--rail-underhang\)\);/s,
  );
  assert.match(css, /--rail-underhang:\s*28px;/);
});

// The hairline lives on one shared rule so a cover can never gain the outer
// drop shadow of a card without the inner edge that makes it read as one.
test("every cover and the video carry the shared inset media edge", () => {
  assert.match(
    css,
    /--media-inset-edge:\s*inset 0 0 0 2px rgb\(0 0 0 \/ 0\.05\);/,
  );
  assert.match(
    css,
    /--media-inset-edge-focused:\s*inset 0 0 0 2px rgb\(0 0 0 \/ 0\.02\);/,
  );
  const rule = css.match(
    /\.event-card::before,\s*\.event-grid-cover::after,\s*\.detail-cover::after,\s*\.about-video-shell::after,\s*\.media-inset-edge::after,\s*\.media-inset-edge-focused::after,\s*\.media-inset-edge-soft::after\s*\{[^}]*\}/s,
  )?.[0];

  assert.ok(rule, "expected one shared media inset edge rule");
  assert.match(rule, /box-shadow:\s*var\(--media-inset-edge\);/);
  assert.match(rule, /inset:\s*0;/);
  assert.match(rule, /pointer-events:\s*none/);
  assert.match(rule, /transition:\s*box-shadow 240ms ease;/);

  // Inheriting the radius is what keeps the edge on the corner curve of
  // whichever cover it traces, so the covers can be rounded without it
  // squaring off or clipping.
  assert.match(rule, /border-radius:\s*inherit;/);
  assert.match(app, /event-card[^"]*rounded-lg/);
  assert.match(app, /event-grid-cover[^"]*rounded-lg/);
  assert.match(app, /detail-cover[^"]*rounded-lg/);

  // The carousel cover does not clip, and its image is a later sibling of the
  // pseudo-element, so only the raised layer paints the hairline over the art.
  assert.match(rule, /z-index:\s*1;/);

  // Focused covers paint at full opacity, so they take the lighter edge via
  // aria-pressed rather than a hardcoded index.
  assert.match(
    css,
    /\.event-card\[aria-pressed="true"\]::before,\s*\.event-grid-cover\[aria-pressed="true"\]::after,\s*\.detail-cover::after,\s*\.media-inset-edge-focused::after\s*\{[^}]*box-shadow:\s*var\(--media-inset-edge-focused\);/s,
  );

  for (const selector of [/\.event-grid-cover\s*\{/, /\.detail-cover\s*\{/]) {
    const owner = css.match(
      new RegExp(`${selector.source}[^}]*\\}`, "s"),
    )?.[0];
    assert.match(owner, /position:\s*relative;/);
  }
});

// Video letterboxes to near-white, where the cover weight reads as a drawn
// frame, so it takes a lighter edge derived from the same family of tokens.
test("the about video takes the lighter media edge and no drawn border", () => {
  assert.match(
    css,
    /--media-inset-edge-soft:\s*inset 0 0 0 1px rgb\(0 0 0 \/ 0\.03\);/,
  );
  assert.match(
    css,
    /\.about-video-shell::after,\s*\.media-inset-edge-soft::after\s*\{[^}]*box-shadow:\s*var\(--media-inset-edge-soft\);/s,
  );
  assert.match(app, /about-video [^"]*rounded-\[20px\] border-0/);
  assert.doesNotMatch(app, /about-video[^"]*\bborder-gray-200\b/);
  assert.doesNotMatch(css, /\.about-video(?:-shell)?\s*\{[^}]*border:/s);
});

// Regression. The shell scales from 0.55 as it scrolls in, and a shadow is
// painted in the element's own space before that scale is applied: at the small
// end the whole cloud compressed into a tight dark ring against the edge, which
// read as the drawn border the inset edge had just replaced. Holding the
// lengths against the live scale keeps the shadow the same size on screen.
test("the about video's drop shadow does not compress into an edge as it scales", () => {
  const shadow = app.match(
    /function aboutVideoShadowAt\(scale: number\) \{[\s\S]*?\n\}/,
  )[0];
  assert.match(
    shadow,
    /const held = \(length: number\) => Math\.round\(\(length \/ scale\) \* 100\) \/ 100;/,
  );
  // Lengths are held against scale, but the opacities ride the edge reveal so
  // the whole shadow fades in over the last stretch rather than sitting at full
  // weight against a shrunk video — a heavy cloud at the small end reads as the
  // drawn border the inset edge just replaced.
  assert.match(
    shadow,
    /const alpha = \(weight: number\) =>\s*Math\.round\(weight \* aboutVideoEdgeReveal\(scale\) \* 1000\) \/ 1000;/s,
  );
  for (const weight of ["0.02", "0.07", "0.18"]) {
    assert.match(shadow, new RegExp(`rgba\\(15, 15, 15, \\$\\{alpha\\(${weight}\\)\\}\\)`));
  }
  assert.doesNotMatch(shadow, /held\(0\.\d+\)/);
  assert.match(app, /const aboutVideoShadow = useTransform\(aboutVideoScale, aboutVideoShadowAt\);/);
  assert.match(
    app,
    /: \(\{\s*scale: aboutVideoScale,\s*boxShadow: aboutVideoShadow,\s*"--media-edge-reveal": aboutVideoEdgeOpacity,\s*\} as MotionStyle\)/s,
  );
});

// The inset edge is painted in the shell's own space too, so it thickens as the
// video shrinks. It is held back on the same curve as the shadow: nothing at all
// for the whole approach, fading in only over the last stretch of the scale.
test("the about video's inset edge only appears once the video reaches full width", () => {
  assert.match(app, /const ABOUT_VIDEO_EDGE_FROM_SCALE = 0\.9;/);
  assert.match(
    app,
    /function aboutVideoEdgeReveal\(scale: number\) \{\s*const travelled =\s*\(scale - ABOUT_VIDEO_EDGE_FROM_SCALE\) \/ \(1 - ABOUT_VIDEO_EDGE_FROM_SCALE\);\s*return Math\.min\(Math\.max\(travelled, 0\), 1\);/s,
  );
  assert.match(
    app,
    /const aboutVideoEdgeOpacity = useTransform\(\s*aboutVideoScale,\s*aboutVideoEdgeReveal,\s*\);/s,
  );
  // Anything else wearing the soft edge, and the pre-hydration paint, gets the
  // edge outright: only the shell's reveal can hold it back.
  assert.match(
    css,
    /\.about-video-shell::after,\s*\.media-inset-edge-soft::after \{\s*box-shadow: var\(--media-inset-edge-soft\);\s*opacity: var\(--media-edge-reveal, 1\);\s*\}/s,
  );
});

// Regression. The server renders the travelling pose because it cannot know the
// reader's motion preference, and React leaves the mismatched inline styles it
// finds on hydration alone. Motion writes its own values to the DOM, so the
// arrived pose must be spelled in motion values: plain ones left the video
// wearing the server's faded-out shadow and reveal, with no frame at all.
test("the about video arrives fully framed under reduced motion", () => {
  assert.match(app, /const ABOUT_VIDEO_ARRIVED_SHADOW = aboutVideoShadowAt\(1\);/);
  assert.match(app, /const arrivedScale = useMotionValue\(1\);/);
  assert.match(app, /const arrivedShadow = useMotionValue\(ABOUT_VIDEO_ARRIVED_SHADOW\);/);
  assert.match(app, /const arrivedEdgeOpacity = useMotionValue\(1\);/);
  assert.match(
    app,
    /reduceMotion\s*\?\s*\(\{\s*scale: arrivedScale,\s*boxShadow: arrivedShadow,\s*"--media-edge-reveal": arrivedEdgeOpacity,\s*\} as MotionStyle\)/s,
  );
});

// Hover must be single-source: the cover under the pointer is the only one in
// the elevated pose, and leaving the rail clears it. Enter/leave pairs on
// overlapping covers cannot guarantee that. Scroll and programmatic centres
// refuse new hovers so a cover sliding under a parked cursor cannot claim the
// focused cover's Luma label.
test("carousel hover tracks the cover under the pointer, not a sticky enter", () => {
  assert.match(app, /onPointerOver=\{\(event\) =>\s*hoverCard\(index, event\.pointerType\)/s);
  assert.match(
    app,
    /className="gallery[^"]*"[\s\S]*?onPointerLeave=\{\(event\) =>\s*hoverCard\(null, event\.pointerType\)/s,
  );
  assert.doesNotMatch(
    app,
    /event-card[\s\S]{0,800}onPointerEnter=\{\(event\) =>\s*hoverCard/,
  );
  assert.match(
    app,
    /const hoverCard = useCallback\(\(index: number \| null, pointerType: string\) => \{\s*if \(pointerType !== "mouse"\) return;\s*pendingHoverIndex\.current = index;\s*if \(\s*index !== null &&\s*\(railScrolling\.current \|\| isProgrammaticScroll\.current\)\s*\) \{\s*return;\s*\}\s*setHoveredIndex\(index\);/s,
  );
});

// The Luma label under the focused cover used CSS :hover, so scrolling the
// shelf under a pointer parked on a side cover lit the label whenever the
// focused cover passed through. It is class-driven from a still center hover
// (CENTER_HOVER_REVEAL_MS) instead, and only while that hover is the focused
// cover. Scroll clears it; settle re-applies pending hover so a parked cursor
// can start the wait without a mouse twitch.
test("View on Luma waits for a still hover on the focused cover", () => {
  assert.match(app, /const CENTER_HOVER_REVEAL_MS = 200;/);
  assert.match(app, /const centerHovered = selected && centerHoverRevealed;/);
  assert.match(app, /centerHovered \? " is-center-hovered" : ""/);
  assert.match(
    app,
    /centerHoverTimer\.current = window\.setTimeout\(\(\) => \{\s*setCenterHoverRevealed\(true\);[\s\S]*?\}, CENTER_HOVER_REVEAL_MS\);/s,
  );
  assert.match(
    app,
    /if \(hoveredIndex === null \|\| hoveredIndex !== selectedIndex\) \{\s*setCenterHoverRevealed\(false\);/s,
  );
  assert.match(
    css,
    /\.event-card\[aria-pressed="true"\]\.is-center-hovered \+ \.cover-luma-hint/,
  );
  assert.doesNotMatch(
    css,
    /\.event-card\[aria-pressed="true"\]:hover \+ \.cover-luma-hint/,
  );
  assert.match(app, /railScrolling\.current = true;/);
  assert.match(app, /setCenterHoverRevealed\(false\);/);
  assert.match(app, /setHoveredIndex\(\(current\) => \(current === null \? current : null\)\);/);
  assert.match(
    app,
    /railScrolling\.current = false;\s*if \(isProgrammaticScroll\.current\) return;\s*const pending = pendingHoverIndex\.current;\s*if \(pending !== null\) \{\s*setHoveredIndex\(pending\);\s*\}/s,
  );
  assert.match(
    app,
    /useEffect\(\(\) => \{\s*setHoveredIndex\(null\);\s*setCenterHoverRevealed\(false\);\s*\}, \[selectedIndex\]\);/s,
  );
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

// The grid stands at full height, so every cover is already on the page and
// selection never has to move a scrollport. scrollIntoView in particular would
// scroll every ancestor and drag the page down the moment grid view mounted.
test("grid view never scrolls anything to reveal the selected cover", () => {
  assert.doesNotMatch(app, /coverRefs/);
  assert.doesNotMatch(app, /gridScrollElement/);
});

// The cards sit at opacity 0 behind the loader, so the browser otherwise treats
// their images as low-priority and the shelf deals in as empty white squares.
test("first-paint covers are preloaded and hold the loader until they decode", () => {
  assert.match(page, /preloadFirstPaintCovers\(pastResult\.events\)/);
  assert.match(page, /from ["']react-dom["']/);
  assert.match(page, /preload\(cover\.src, \{/);
  assert.match(page, /as: "image"/);
  assert.match(page, /fetchPriority: "high"/);
  assert.match(page, /imageSrcSet: cover\.srcSet/);

  assert.match(app, /firstPaintCoverImages\(events, initialIndex\)/);
  assert.match(app, /waitForImages=\{firstPaintCovers\}/);
  assert.match(app, /eventCoverImage\(item\.image_url\)/);
  assert.match(app, /VISIBLE_COVER_RADIUS/);
  assert.match(app, /fetchPriority=\{/);

  assert.match(loader, /whenImagesReady\(waitForImages\)/);
  assert.match(loader, /MAX_VISIBLE_WITH_IMAGES_MS/);
  assert.match(image, /export const VISIBLE_COVER_RADIUS = 4;/);
});
