import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(
  new URL("../src/components/HomePage.tsx", import.meta.url),
  "utf8",
);
const note = await readFile(
  new URL("../src/components/FoundersNote.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("the founders note sits between the partner CTA and the apply CTA", () => {
  assert.match(
    app,
    /<FoundersNote \/>\s*<section[\s\S]*className="[^"]*\bapply-cta\b/,
  );
  assert.match(app, /import \{ FoundersNote \} from "\.\/FoundersNote";/);
});

// The photo marquee now occupies the gap above the footer hairline, so
// apply only needs a short inset before the strip rather than the
// doubled padding that used to hold the follow CTAs off the line.
test("the apply CTA leaves a short inset above the photo marquee", () => {
  const applyPadding = app.match(
    /className="[^"]*\bapply-cta\b[^"]*\spb-(\[[^\]]+\])/,
  )?.[1];
  assert.equal(applyPadding, "[clamp(48px,6vw,80px)]");
});

test("the note carries the community copy in centered text", () => {
  assert.ok(
    note.includes(
      "We created Design Meetup to build the design community our younger",
    ),
    "expected the note to include the community copy",
  );
  assert.ok(
    note.includes(
      "We’d love to grow it alongside partners who believe in the future of",
    ),
    "expected the note to invite partners",
  );
  // Keep the colon glued to "curated" on mobile; force a new line on desktop only.
  assert.match(
    note,
    /existed:\{\s*"\\u00A0"\s*\}\s*<br className="hidden min-\[821px\]:block" \/>\s*curated, ambitious, and focused on/,
  );
  assert.doesNotMatch(
    note,
    /existed:\s*<br\s*\/>/,
    "expected no unconditional break after the colon",
  );
  assert.ok(
    !note.includes(
      "The world might change, but we will always have our community.",
    ),
    "expected the world-might-change tagline to be removed",
  );
  assert.match(note, /text-center/);
});

test("each signature links out to LinkedIn and darkens on hover", () => {
  for (const [name, href] of [
    ["Ilyssa", "https://www.linkedin.com/in/ilyssayan/"],
    ["Brandon", "https://www.linkedin.com/in/brandonjoshlee/"],
    ["Joanna", "https://www.linkedin.com/in/joannachen1014/"],
    ["Michelle", "https://www.linkedin.com/in/michelletliu/"],
  ]) {
    assert.ok(note.includes(`"${name}"`), `expected a signature for ${name}`);
    assert.ok(note.includes(href), `expected ${name} to link to ${href}`);
  }

  assert.match(note, /hover:text-black/);
  assert.match(note, /target="_blank"/);
  assert.match(note, /rel="noreferrer"/);
  assert.match(note, /aria-label=\{`\$\{person\.fullName\} on LinkedIn`\}/);
});

test("the roles label each pair of signatures in gray", () => {
  for (const role of ["Founders", "Directors, Events & Partnerships"]) {
    assert.ok(note.includes(role), `expected the role “${role}”`);
  }
  assert.match(note, /\{group\.role\}<\/p>/);
  assert.match(note, /text-subtle/);
  assert.doesNotMatch(note, /text-muted/);
});

test("the two signed pairs sit side by side, wrapping only when cramped", () => {
  assert.match(note, /<figcaption className="[^"]*\bflex-wrap\b/);
  assert.doesNotMatch(note, /<figcaption className="[^"]*\bflex-col\b/);
  // Desktop keeps both groups on one row; narrow viewports can still wrap.
  assert.match(note, /min-\[821px\]:flex-nowrap/);
  // Tighter between the two names than between the pairs, so each pair still
  // reads as one signed line once they share a row.
  assert.match(note, /gap-x-\[clamp\(24px,4vw,56px\)\]/);
  assert.match(note, /gap-x-\[clamp\(14px,2\.5vw,28px\)\]/);
});

test("the leads sit under the card, names above their roles", () => {
  for (const [firstName, fullName, href] of [
    ["Matthew", "Matthew Hope", "https://www.linkedin.com/in/matthewhope1/"],
    ["Yufei", "Yufei Wang", "https://www.linkedin.com/in/yufei-wang-5b1138253/"],
    ["Emily", "Emily Shen", "https://www.linkedin.com/in/emilyshenucla/"],
  ]) {
    assert.ok(
      note.includes(`firstName: "${firstName}"`),
      `expected a first name for ${firstName}`,
    );
    assert.ok(note.includes(`"${fullName}"`), `expected an entry for ${fullName}`);
    assert.ok(note.includes(href), `expected ${fullName} to link to ${href}`);
  }

  for (const role of ["Graphics Leads", "Internal Community Lead"]) {
    assert.ok(note.includes(role), `expected the role “${role}”`);
  }

  // Both roles share one row below the card rather than sitting in the
  // signature caption, and their names match the Handflair signatures.
  assert.match(note, /<\/motion\.figure>\s*<motion\.div/);
  assert.match(note, /teamGroups\.map/);
  assert.match(
    note,
    /const teamNameClassName = \[[\s\S]*font-\['Handflair',cursive\]/,
  );
  assert.match(note, /gap-x-\[clamp\(56px,10vw,140px\)\]/);
  assert.match(note, /\{person\.firstName\}/);
});

test("the heart sign-off is temporarily hidden from the card", () => {
  assert.doesNotMatch(note, /className="founders-heart/);
  assert.doesNotMatch(note, /src="\/heart\.png"/);
  assert.doesNotMatch(note, /from,<\/p>/);
  // Quote → signatures, with no heart row between them.
  assert.ok(
    note.indexOf("We created Design Meetup") < note.indexOf("signatureGroups.map") &&
      note.indexOf("signatureGroups.map") < note.indexOf("</motion.figure>"),
    "expected the signatures to follow the quote inside the card",
  );
});

test("the heart asset remains available for when the sign-off returns", async () => {
  await access(new URL("../public/heart.png", import.meta.url));
});

test("the stamp sits centered above the quote at 100x100", () => {
  const stamp = note.match(/<motion\.img[\s\S]*?\/>/)?.[0] ?? "";
  assert.match(stamp, /src="\/design-meetup-stamp\.png"/);
  assert.match(stamp, /size-\[100px\]/);
  assert.match(stamp, /width=\{100\}/);
  assert.match(stamp, /height=\{100\}/);
  // Decorative mark, so it stays out of the accessibility tree.
  assert.match(stamp, /alt=""/);
  // The card centers its children and reads tighter without the heart row,
  // while staying wide enough for both signature groups on desktop.
  assert.match(note, /className="founders-card[^"]*\bmax-w-\[720px\]/);
  assert.match(note, /<motion\.figure[\s\S]*?className="founders-card[^"]*\bitems-center\b/);
  // Stamp → quote → signatures, all inside the card.
  assert.ok(
    note.indexOf("design-meetup-stamp") < note.indexOf("<blockquote") &&
      note.indexOf("<blockquote") < note.indexOf("signatureGroups.map") &&
      note.indexOf("design-meetup-stamp") > note.indexOf("<motion.figure"),
    "expected the stamp above the quote and inside the card",
  );
});

test("the stamp dissolves in instead of pressing down", () => {
  const stamp = note.match(/<motion\.img[\s\S]*?\/>/)?.[0] ?? "";
  // The blur clearing and the fade carry the entrance, so the mark reads as
  // resolving into focus rather than being struck onto the card.
  assert.match(
    note,
    /const stampHidden = \{ opacity: 0, scale: 1\.02, filter: "blur\(6px\)" \};/,
  );
  assert.match(
    note,
    /const stampShown = \{ opacity: 1, scale: 1, filter: "blur\(0px\)" \};/,
  );

  // Keyframe arrays are how the old press approached oversized, squashed on
  // impact and rebounded. A dissolve travels straight to its resting value, so
  // there is no intermediate frame to overshoot through.
  for (const property of ["opacity", "scale", "rotate", "times"]) {
    assert.doesNotMatch(
      stamp,
      new RegExp(`${property}: \\[`),
      `expected no ${property} keyframes on a dissolve`,
    );
  }
  // No rotation at all: a mark that arrives askew and rights itself is a stamp
  // landing, which is exactly the bounce this replaces.
  assert.doesNotMatch(stamp, /rotate:/);
  assert.doesNotMatch(note, /const stamp(?:Hidden|Shown) = \{[^}]*rotate/);
  // Springs overshoot by construction, so the dissolve runs on a fixed duration.
  assert.doesNotMatch(stamp, /type: "spring"/);

  // The scale settle stays inside 3%: any wider and it reads as a pop rather
  // than the mark coming into focus.
  const hiddenScale = Number(
    note.match(/const stampHidden = \{[^}]*scale: ([\d.]+)/)?.[1],
  );
  const shownScale = Number(
    note.match(/const stampShown = \{[^}]*scale: ([\d.]+)/)?.[1],
  );
  assert.ok(
    hiddenScale > 1 && hiddenScale <= 1.03,
    `expected a soft scale settle, got ${hiddenScale}`,
  );
  assert.equal(shownScale, 1, "expected the stamp to rest at true size");

  // A long-tailed curve that decelerates the whole way in. Unlike the old
  // easeIn/easeOut press it never passes its destination and comes back.
  assert.match(
    note,
    /const dissolveEase: \[number, number, number, number\] = \[0\.22, 1, 0\.36, 1\];/,
  );
  assert.match(stamp, /ease: dissolveEase/);

  // Still sequenced after the card settles, but unhurried now: a dissolve needs
  // room to read as one, where the press deliberately did not.
  const duration = Number(stamp.match(/duration: ([\d.]+), delay/)?.[1]);
  const delay = Number(stamp.match(/delay: ([\d.]+)/)?.[1]);
  assert.ok(delay > 0, "expected the stamp to wait for the card");
  assert.ok(
    duration >= 0.5 && duration <= 0.9,
    `expected an unhurried dissolve, got ${duration}s`,
  );

  // Reduced motion keeps the mark but drops the dissolve: its arm of the
  // ternary is a plain fade, with the blur left on the full-motion branch.
  assert.match(stamp, /initial=\{reduceMotion \? \{ opacity: 0 \} : stampHidden\}/);
  assert.match(stamp, /reduceMotion\s*\?\s*\{ opacity: inView \? 1 : 0 \}/);
  assert.match(stamp, /\{ duration: 0\.3, ease: "easeOut" \}/);
});

test("the stamp clears the copy by the same gap as the signatures", () => {
  const stamp = note.match(/<motion\.img[\s\S]*?\/>/)?.[0] ?? "";
  const captionGap = note.match(/<figcaption className="mt-\[([^\]]+)\]/)?.[1];
  assert.ok(captionGap, "expected the signatures to set their own top margin");
  // The quote sits evenly between the mark above it and the signatures below.
  assert.ok(
    stamp.includes(`mb-[${captionGap}]`),
    `expected the stamp to hold ${captionGap} above the copy, matching the signatures`,
  );
});

test("the stamp is served from the app", async () => {
  await access(new URL("../public/design-meetup-stamp.png", import.meta.url));
});

test("the lead names share the signature hover treatment", () => {
  assert.match(
    note,
    /const nameLinkClassName = \[[\s\S]*hover:text-black[\s\S]*\]\.join\(" "\)/,
  );
  assert.match(note, /const signatureClassName = \[\s*nameLinkClassName,/);
});

test("the card settles out of a tilt on every scroll into view", () => {
  // Far enough and loose enough to read as the note being laid down.
  assert.match(
    note,
    /const cardHidden = \{ opacity: 0, y: 64, rotate: -3\.5, scale: 0\.955 \};/,
  );
  assert.match(
    note,
    /const cardShown = \{ opacity: 1, y: 0, rotate: -1, scale: 1 \};/,
  );
  // It still replays on every pass, but off the note's shared in-view flag
  // rather than a viewport watcher of its own.
  assert.match(
    note,
    /animate=\{\s*reduceMotion \? \{ rotate: -1 \} : inView \? cardShown : cardHidden\s*\}/,
  );
  assert.match(note, /useReducedMotion/);
  // The replaying tilt is why this card animates itself instead of leaning on
  // the shared reveal, which only fires once.
  assert.doesNotMatch(note, /ScrollReveal/);
});

test("no entrance in the note watches the element it moves", () => {
  // Regression. The card used to watch itself with `whileInView` at a 35%
  // threshold while its own entrance slid it 64px upward. Scrolled to the very
  // bottom the card is clipped by the top of the viewport, so revealing it made
  // *less* of the card visible — it dropped back under the threshold, motion
  // rewound it to the hidden state, that pushed it back over the threshold, and
  // with the scroll offset pinned at its maximum there was no scroll left to
  // break the tie. The card animated forever. Every entrance now reads one flag
  // taken from the section, which nothing transforms, so an entrance can no
  // longer move the box its own trigger is measuring.
  assert.doesNotMatch(note, /whileInView/);
  assert.doesNotMatch(note, /viewport=\{/);
  assert.match(
    note,
    /const inView = useReplayInView\(noteRef, \{ amount: 0\.35 \}\);/,
  );
  assert.match(note, /<section\s+ref=\{noteRef\}/);

  // Each entrance still needs a hidden state to return to, or it would settle
  // after one pass instead of replaying.
  for (const [name, hidden, shown] of [
    ["card", "cardHidden", "cardShown"],
    ["stamp", "stampHidden", "stampShown"],
    ["team row", "teamHidden", "teamShown"],
  ]) {
    assert.match(
      note,
      new RegExp(`inView\\s*\\?\\s*${shown}\\s*:\\s*${hidden}`),
      `expected the ${name} to rewind to its hidden state off screen`,
    );
  }
});

test("the card rests off level, and reduced motion keeps that pose", () => {
  assert.match(note, /reduceMotion\s*\?\s*\{ rotate: -1 \}/);
  // A Tailwind rotate utility would emit the standalone `rotate` property and
  // compound with the transform the animation writes, doubling the tilt.
  assert.doesNotMatch(note, /<motion\.figure[\s\S]*?className="founders-card[^"]*rotate-\[/);
});

test("the signatures use the Handflair hand at their own angles", () => {
  assert.match(note, /font-\['Handflair',cursive\]/);
  assert.match(
    css,
    /@font-face\s*\{[^}]*font-family:\s*"Handflair"[^}]*url\("\/fonts\/Handflair\.otf"\)\s*format\("opentype"\)/s,
  );
  assert.match(note, /rotate\(\$\{person\.tiltDeg\}deg\)/);

  const tilts = [...note.matchAll(/tiltDeg:\s*(-?[\d.]+)/g)].map((match) =>
    Number(match[1]),
  );
  assert.equal(tilts.length, 4);
  assert.equal(new Set(tilts).size, 4, "expected four distinct angles");
});

test("the Handflair face is served from the app", async () => {
  await access(new URL("../public/fonts/Handflair.otf", import.meta.url));
});
