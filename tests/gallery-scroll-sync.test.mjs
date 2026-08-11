import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");

test("gallery scrollport and slides are measurable from the component", () => {
  assert.match(app, /const galleryRef = useRef<HTMLUListElement \| null>\(null\)/);
  assert.match(
    app,
    /<ul\s+className="[^"]*\bgallery\b[^"]*"\s+ref=\{galleryRef\}/,
  );
  assert.match(app, /slideRefs\.current\[index\] = node/);
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
    /if \(isProgrammaticScroll\.current\) \{\s*markProgrammaticScroll\(\);\s*return;\s*\}/,
  );
  assert.match(app, /selectionSource\.current === "scroll"/);
});

test("scroll settle timing and centering behavior respect reduced motion", () => {
  assert.match(app, /reduceMotion \? \d+ : \d+/);
  assert.match(
    app,
    /centerSlide\(\s*selectedIndex,\s*hasCenteredInitial\.current && !reduceMotion \? "smooth" : "auto",\s*\)/,
  );
});
