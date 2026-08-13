import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readSource = (path) => readFile(new URL(path, root), "utf8");

const [app, designSystem, primary, link, iconButton, input, chipSource] =
  await Promise.all([
    readSource("src/components/HomePage.tsx"),
    readSource("src/DesignSystem.tsx"),
    readSource("src/components/Primary.tsx"),
    readSource("src/components/Link.tsx"),
    readSource("src/components/IconButton.tsx"),
    readSource("src/components/Input.tsx"),
    readSource("src/components/Chip.tsx"),
  ]);

const sharedControls = [
  ["Primary", primary],
  ["Link", link],
  ["IconButton", iconButton],
];

test("every shared button-like control offers a pointer affordance", () => {
  for (const [name, source] of sharedControls) {
    assert.match(source, /\bcursor-pointer\b/, `${name} is missing cursor-pointer`);
  }
});

test("every shared control that can be disabled blocks the pointer", () => {
  for (const [name, source] of sharedControls) {
    assert.match(
      source,
      /\bdisabled:cursor-not-allowed\b/,
      `${name} is missing disabled:cursor-not-allowed`,
    );
  }

  // Primary and Link can render as anchors, which ignore the :disabled pseudo-class.
  for (const [name, source] of [
    ["Primary", primary],
    ["Link", link],
  ]) {
    assert.match(
      source,
      /\baria-disabled:cursor-not-allowed\b/,
      `${name} is missing aria-disabled:cursor-not-allowed`,
    );
  }
});

test("text fields keep the text caret and never take a pointer", () => {
  assert.match(input, /\bdisabled:cursor-not-allowed\b/);
  assert.doesNotMatch(input, /\bcursor-pointer\b/);
});

test("the clickable event card carries an explicit pointer", () => {
  const eventCard =
    app.match(/className=\{`event-card[\s\S]*?`\}/)?.[0] ?? "";

  assert.match(eventCard, /\bcursor-pointer\b/);
});

test("scroll regions and static metadata chips are not styled as clickable", () => {
  const photoRail =
    app.match(/className="detail-photo-list[^"]*"/)?.[0] ?? "";
  const chipList = app.match(/className="detail-chips[^"]*"/)?.[0] ?? "";

  assert.notEqual(photoRail, "");
  assert.notEqual(chipList, "");
  assert.doesNotMatch(photoRail, /\bcursor-pointer\b/);
  assert.doesNotMatch(chipList, /\bcursor-pointer\b/);

  // Only the anchor branch of Chip earns a pointer; plain chips stay inert.
  const chip = chipSource.match(/if \(href === undefined\)[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.notEqual(chip, "");
  assert.doesNotMatch(chip, /\bcursor-pointer\b/);
  assert.match(chipSource, /<a\s+className=\{`\$\{chipClassName\} cursor-pointer/);
});

test("pointer affordances come from shared components, not one-off anchors", () => {
  // HomePage may mark the rail card and the grid detail cover — both are the
  // same "open this event" surface — but nowhere else should invent a pointer.
  for (const [name, source, max] of [
    ["HomePage", app, 2],
    ["DesignSystem", designSystem, 0],
  ]) {
    const pointerUsages = source.match(/\bcursor-pointer\b/g)?.length ?? 0;
    assert.ok(
      pointerUsages <= max,
      `${name} should not hand-roll pointer classes (found ${pointerUsages})`,
    );
  }

  assert.doesNotMatch(designSystem, /\bcursor-pointer\b/);
});
