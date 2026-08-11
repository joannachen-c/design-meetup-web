import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const footer = await readFile(
  new URL("../src/components/SiteFooter.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const scrollReveal = await readFile(
  new URL("../src/components/ScrollReveal.tsx", import.meta.url),
  "utf8",
);
const replayReveal = await readFile(
  new URL("../src/lib/replay-reveal.ts", import.meta.url),
  "utf8",
);

test("major site content uses the shared scroll reveal", () => {
  assert.match(app, /import \{ ScrollReveal \} from "\.\/ScrollReveal";/);
  assert.match(footer, /import \{ ScrollReveal \} from "\.\/ScrollReveal";/);
  assert.ok(
    ((app.match(/<ScrollReveal\b/g) ?? []).length +
      (footer.match(/<ScrollReveal\b/g) ?? []).length) >= 10,
    "expected scroll reveals across the page",
  );
});

test("scroll reveal animates compositor properties and respects reduced motion", () => {
  assert.match(css, /\.scroll-reveal\s*\{[^}]*opacity:\s*0;[^}]*transform:/s);
  assert.match(css, /\.scroll-reveal\.is-visible\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*translateY\(0\)/s);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.scroll-reveal\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none/s,
  );
});

test("a replaying reveal rewinds at a different edge than it reveals at", () => {
  // Regression. Revealing and rewinding at one shared boundary lets an entrance
  // transform push its own element back across that boundary: the transform
  // changes how much of the element overlaps the viewport, which is the same
  // measurement the trigger reads. Everywhere else on the page the next scroll
  // event settles it, but at the very bottom the scroll offset is pinned at its
  // maximum and cannot move away, so the element alternates between revealed and
  // rewound for as long as the reader stays there. Two observers at two
  // different edges are what make that tie impossible.
  assert.match(scrollReveal, /import \{ observeReplayReveal \} from "\.\.\/lib\/replay-reveal";/);
  assert.match(replayReveal, /const enterObserver = new IntersectionObserver/);
  assert.match(replayReveal, /const exitObserver = new IntersectionObserver/);

  // The reveal fires early, against the margin-expanded viewport.
  assert.match(replayReveal, /rootMargin: `\$\{margin\}px`/);
  // The rewind waits for the element to clear the real viewport entirely, so it
  // must not borrow the reveal's expanded boundary.
  assert.doesNotMatch(
    replayReveal,
    /const exitObserver[\s\S]*?rootMargin/,
    "expected the rewind to use the unexpanded viewport",
  );
  assert.match(
    replayReveal,
    /const exitObserver = new IntersectionObserver\(\s*\(\[entry\]\) => \{\s*if \(!entry\.isIntersecting\) set\(false\);\s*\},\s*\{ threshold: 0 \},\s*\);/,
  );

  // An element close enough to the end of the document runs the page out of
  // scroll before it can ever show `amount` of itself, so passing the top of the
  // viewport has to count as arrived too — otherwise a reader who lands straight
  // at the bottom would find it stuck in its hidden state.
  assert.match(replayReveal, /entry\.boundingClientRect\.top <= 0/);

  // Repeated notifications are normal; only genuine changes may reach the
  // caller, or the reveal would restart mid-flight on every threshold crossing.
  assert.match(replayReveal, /if \(next === revealed\) return;/);
});
