import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

test("gallery scrollport and slides are measurable from the component", () => {
  assert.match(app, /const galleryRef = useRef<HTMLUListElement \| null>\(null\)/);
  assert.match(
    app,
    /<ul\s+className="[^"]*\bgallery\b[^"]*"\s+ref=\{galleryRef\}/,
  );
  assert.match(app, /slideRefs\.current\[index\] = node/);
});

test("manual scrolling selects the slide nearest the scrollport center", () => {
  assert.match(app, /function nearestSlideIndexToCenter|nearestSlideIndexToCenter = useCallback/);
  assert.match(app, /getBoundingClientRect\(\)/);
  assert.match(app, /rect\.left \+ rect\.width \/ 2/);
  assert.match(app, /Math\.abs\(/);
  assert.match(app, /addEventListener\("scroll", handleScroll, \{ passive: true \}\)/);
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
    /behavior:\s*\n?\s*hasCenteredInitial\.current && !reduceMotion \? "smooth" : "auto"/,
  );
});
