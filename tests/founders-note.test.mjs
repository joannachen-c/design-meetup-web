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

test("the founders note sits between the partner section and the footer", () => {
  assert.match(app, /<FoundersNote \/>\s*<footer/);
  assert.match(app, /import \{ FoundersNote \} from "\.\/FoundersNote";/);
});

test("the note carries the community copy in centered text", () => {
  assert.ok(
    note.includes(
      "We created Design Meetup as a space for young designers to learn",
    ),
    "expected the note to include the community copy",
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

test("a heart sign-off sits inside the card below the quote", () => {
  const signoff = note.match(/<div className="founders-heart[\s\S]*?<\/div>/)?.[0] ?? "";
  assert.match(signoff, /src="\/heart\.png"/);
  assert.match(signoff, /from,<\/p>/);
  // Quote → heart → signatures, all inside the card.
  assert.ok(
    note.indexOf("We created Design Meetup") < note.indexOf("founders-heart") &&
      note.indexOf("founders-heart") < note.indexOf("signatureGroups.map") &&
      note.indexOf("founders-heart") < note.indexOf("</motion.figure>"),
    "expected the sign-off between the quote and the signatures inside the card",
  );
});

test("the heart is served from the app", async () => {
  await access(new URL("../public/heart.png", import.meta.url));
});

test("the lead names share the signature hover treatment", () => {
  assert.match(
    note,
    /const nameLinkClassName = \[[\s\S]*hover:text-black[\s\S]*\]\.join\(" "\)/,
  );
  assert.match(note, /const signatureClassName = \[\s*nameLinkClassName,/);
});

test("the card settles out of a tilt on every scroll into view", () => {
  assert.match(note, /initial=\{reduceMotion \? false : \{ opacity: 0, y: 24, rotate: -1\.6 \}\}/);
  assert.match(note, /whileInView=\{reduceMotion \? undefined : \{ opacity: 1, y: 0, rotate: 0 \}\}/);
  assert.match(note, /viewport=\{\{ once: false, amount: 0\.35 \}\}/);
  assert.match(note, /useReducedMotion/);
  // The replaying tilt is why this card animates itself instead of leaning on
  // the shared reveal, which only fires once.
  assert.doesNotMatch(note, /ScrollReveal/);
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
