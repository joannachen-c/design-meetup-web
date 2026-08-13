import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const ticker = await readFile(
  new URL("../src/components/FilmTickerLines.tsx", import.meta.url),
  "utf8",
);

test("gallery scrollport and slides are measurable from the component", () => {
  assert.match(app, /const galleryRef = useRef<HTMLUListElement \| null>\(null\)/);
  assert.match(
    app,
    /<ul[\s\S]*?className="[^"]*\bgallery\b[^"]*"[\s\S]*?ref=\{setGalleryRail\}/,
  );
  assert.match(app, /slideRefs\.current\[index\] = node/);

  // A view swap tears the rail down and builds a new one a beat later, so
  // anything that measures or scrolls it has to wait on the node rather than on
  // the view state that changed before the node existed.
  assert.match(
    app,
    /const setGalleryRail = useCallback\(\(rail: HTMLUListElement \| null\) => \{\s*galleryRef\.current = rail;\s*setGalleryElement\(rail\);\s*\}, \[\]\);/s,
  );
  assert.match(app, /const gallery = galleryElement;/);
});

// The rebuilt rail starts at scrollLeft 0 with the selected cover off to the
// right, and the reader sees that as a shelf shoved sideways.
test("a rail rebuilt by a view swap centres before it is painted", () => {
  assert.match(
    app,
    /useLayoutEffect\(\(\) => \{\s*if \(!galleryElement \|\| status !== "ready" \|\| events\.length === 0\) return;\s*markProgrammaticScroll\(\);\s*centerSlide\(selectedIndex, "auto"\);\s*hasCenteredInitial\.current = true;/s,
  );
  // Centring scrolls the rail, and a scroll the reader did not make must not be
  // read back as a change of selection.
  assert.match(
    app,
    /markProgrammaticScroll\(\);\s*centerSlide\(selectedIndex, "auto"\);/,
  );
  // The selection effect waits on the rail too, so a swap cannot leave the
  // covers keyed to a rail that has since been thrown away.
  assert.match(
    app,
    /\}, \[\s*centerSlide,\s*events\.length,\s*galleryElement,\s*markProgrammaticScroll,\s*reduceMotion,\s*selectedIndex,\s*status,\s*view,\s*\]\);/s,
  );
});

// Only the rail's scroll handler refreshes the focus the ticker reads, and a
// rail rebuilt by a view swap onto a cover that is already centred never
// scrolls. The ticker then held the position the rail had before the swap, so
// coming back from the pack onto one of the first covers left the active tick
// out at the edge of the row.
test("a rail rebuilt by a view swap hands the ticker a fresh focus", () => {
  assert.match(
    app,
    /centerSlide\(selectedIndex, "auto"\);\s*hasCenteredInitial\.current = true;[\s\S]*?const focus = measureGalleryFocus\(\);\s*galleryFocus\.current\.index = focus\?\.focal \?\? selectedIndex;\s*galleryFocus\.current\.velocity = 0;\s*\}, \[galleryElement\]\);/,
  );
});

// A rail that is hidden or not yet laid out measures zero, which collapses
// every slide onto the same point and reads as a focus on the first of them.
test("focus measurement ignores a scrollport with no width", () => {
  assert.match(app, /const rect = gallery\.getBoundingClientRect\(\);\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*if \(rect\.width === 0\) return null;/);
  assert.match(ticker, /viewport && rail && viewport\.clientWidth > 0/);
});

test("manual scrolling selects the slide nearest the scrollport center", () => {
  assert.match(app, /measureGalleryFocus = useCallback/);
  assert.match(app, /getBoundingClientRect\(\)/);
  assert.match(app, /rect\.left \+ rect\.width \/ 2/);
  assert.match(app, /Math\.abs\(/);
  assert.match(app, /addEventListener\("scroll", handleScroll, \{ passive: true \}\)/);
});

test("the ticker reads fractional scroll progress without re-rendering the page", () => {
  assert.match(app, /galleryFocus = useRef<FilmTickerFocus>/);
  assert.match(app, /readGalleryFocus = useCallback\(\(\) => galleryFocus\.current, \[\]\)/);
  assert.match(app, /galleryFocus\.current\.index = focus\.focal/);
  assert.match(app, /pitch > 0 \? nearestIndex - nearestOffset \/ pitch : nearestIndex/);
  assert.match(app, /galleryFocus\.current\.velocity =/);
  assert.match(app, /readFocus=\{readGalleryFocus\}/);
});

// Ticks are bottom-anchored, so a content-sized row grew on hover and pushed
// every tick — and the page below it — down by the hover bonus.
test("the ticker row reserves its tallest state so hover moves nothing", () => {
  assert.match(
    ticker,
    /const ROW_HEIGHT = MAX_TICK_HEIGHT \+ TICK_HIT_PAD_Y \* 2;/,
  );
  assert.match(ticker, /height: ROW_HEIGHT,/);
  assert.doesNotMatch(ticker, /minHeight: MAX_TICK_HEIGHT/);
  // An inline-level rail adds a baseline descender under the row, which shifts
  // with the row's content height.
  assert.doesNotMatch(ticker, /className="inline-block[^"]*will-change-transform/);
});

// The viewport clips the rail horizontally, so it also has to hold the tallest
// tick and its focus ring or the fix trades a shift for a crop.
test("the ticker viewport leaves room for the focus ring it clips against", () => {
  assert.match(ticker, /const FOCUS_RING_ROOM = 4;/);
  assert.match(ticker, /paddingBlock: FOCUS_RING_ROOM/);
  assert.match(ticker, /focus-visible:outline-2 focus-visible:outline-offset-2/);
});

test("scroll-driven selection is throttled with requestAnimationFrame", () => {
  assert.match(
    app,
    /const handleScroll = \(\) => \{[\s\S]*requestAnimationFrame\(/,
  );
  assert.match(app, /cancelAnimationFrame\(frame\)/);
  assert.match(app, /removeEventListener\("scroll", handleScroll\)/);
});

test("programmatic centering never feeds back into scroll-driven selection", () => {
  assert.match(app, /isProgrammaticScroll = useRef\(false\)/);
  assert.match(app, /markProgrammaticScroll/);
  assert.match(
    app,
    /if \(isProgrammaticScroll\.current\) \{[\s\S]*?holdProgrammaticScroll\(\);\s*return;/,
  );
  assert.match(app, /selectionSource\.current === "scroll"/);
});

// Switching to the pack shrinks the rail into the left column before the
// scroll effect re-runs. Layout scroll would otherwise pick a new centre and
// rewrite the event the reader just carried over from the carousel.
test("leaving the carousel freezes scroll-driven selection", () => {
  assert.match(app, /const viewRef = useRef<GalleryView>\(view\);/);
  assert.match(app, /viewRef\.current = view;/);
  assert.match(
    app,
    /viewRef\.current = nextView;\s*pendingHoverIndex\.current = null;/s,
  );
  const handler = app.match(
    /const handleScroll = \(\) => \{[\s\S]*?\n {4}\};/,
  )[0];
  assert.match(handler, /if \(viewRef\.current !== "carousel"\) return;/);
});

// A smooth centre outlasts one settle window, so the rail's own scroll frames
// extend the suppression that keeps the centre from reading as a selection.
// That extension used to be unconditional, and a flick that landed while the
// rail was still centring renewed it on every frame of its own momentum: the
// rail ran the length of the shelf while the focused cover stayed pinned to the
// cover the centre had been aiming at, scale and all.
test("a flick that lands mid-centre still moves the selection", () => {
  // The reader touching the rail ends the centre outright. Every way in has to
  // be covered: a trackpad flick never fires pointerdown, and a scrollbar drag
  // never fires wheel.
  assert.match(app, /const takeOverScroll = \(\) => releaseProgrammaticScroll\(\);/);
  for (const event of ["wheel", "touchstart", "pointerdown"]) {
    assert.match(
      app,
      new RegExp(
        `gallery\\.addEventListener\\("${event}", takeOverScroll`,
      ),
      `the rail should hand scroll back to the reader on ${event}`,
    );
    assert.match(
      app,
      new RegExp(`gallery\\.removeEventListener\\("${event}", takeOverScroll\\)`),
      `the ${event} takeover listener should be torn down with the rail`,
    );
  }

  // And the suppression carries its own ceiling, so input the rail cannot see
  // still frees it rather than leaving the selection latched for good.
  assert.match(app, /const PROGRAMMATIC_SCROLL_MAX_MS = (\d+);/);
  const ceiling = Number(
    app.match(/const PROGRAMMATIC_SCROLL_MAX_MS = (\d+);/)[1],
  );
  const settle = Number(app.match(/reduceMotion \? \d+ : (\d+),/)[1]);
  assert.ok(
    ceiling > settle,
    "the ceiling has to outlast a single settle window or a centre never finishes",
  );
  assert.ok(
    ceiling <= 1500,
    "a latch the reader cannot clear should not outlive a flick",
  );
  assert.match(
    app,
    /programmaticScrollUntil\.current =\s*performance\.now\(\) \+ PROGRAMMATIC_SCROLL_MAX_MS;/,
  );
  assert.match(
    app,
    /if \(performance\.now\(\) < programmaticScrollUntil\.current\) \{\s*holdProgrammaticScroll\(\);\s*return;\s*\}\s*releaseProgrammaticScroll\(\);/,
  );

  // Re-arming the ceiling from inside the scroll handler would put the latch
  // straight back to renewing itself for as long as the reader keeps scrolling.
  const handler = app.match(
    /const handleScroll = \(\) => \{[\s\S]*?\n {4}\};/,
  )[0];
  assert.doesNotMatch(handler, /markProgrammaticScroll\(\)/);

  // Releasing has to drop the pending settle too: a timer left running would
  // clear a flag the next centre has since set.
  assert.match(
    app,
    /const releaseProgrammaticScroll = useCallback\(\(\) => \{\s*isProgrammaticScroll\.current = false;\s*programmaticScrollUntil\.current = 0;\s*if \(scrollSettleTimer\.current !== null\) \{\s*window\.clearTimeout\(scrollSettleTimer\.current\);\s*scrollSettleTimer\.current = null;/,
  );
});

test("scroll settle timing and centering behavior respect reduced motion", () => {
  assert.match(app, /reduceMotion \? \d+ : \d+/);
  assert.match(
    app,
    /centerSlide\(\s*selectedIndex,\s*hasCenteredInitial\.current && !reduceMotion \? "smooth" : "auto",\s*\)/,
  );
});
