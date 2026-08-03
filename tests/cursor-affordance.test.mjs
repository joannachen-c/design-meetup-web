import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readSource = (path) => readFile(new URL(path, root), "utf8");

const [app, designSystem, primary, link, iconButton, input] = await Promise.all(
  [
    readSource("src/components/HomePage.tsx"),
    readSource("src/DesignSystem.tsx"),
    readSource("src/components/Primary.tsx"),
    readSource("src/components/Link.tsx"),
    readSource("src/components/IconButton.tsx"),
    readSource("src/components/Input.tsx"),
  ],
);

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
    app.match(/className="event-card[^"]*"/)?.[0] ?? "";

  assert.match(eventCard, /\bcursor-pointer\b/);
});

test("scroll regions and tooltip triggers are not styled as clickable", () => {
  const photoRail =
    app.match(/className="detail-photo-list[^"]*"/)?.[0] ?? "";
  const sponsorTrigger =
    app.match(/className="inline-flex rounded-sm focus-visible:outline-2[^"]*"/)
      ?.[0] ?? "";

  assert.notEqual(photoRail, "");
  assert.notEqual(sponsorTrigger, "");
  assert.doesNotMatch(photoRail, /\bcursor-pointer\b/);
  assert.doesNotMatch(sponsorTrigger, /\bcursor-pointer\b/);
});

test("pointer affordances come from shared components, not one-off anchors", () => {
  for (const [name, source] of [
    ["HomePage", app],
    ["DesignSystem", designSystem],
  ]) {
    const pointerUsages = source.match(/\bcursor-pointer\b/g)?.length ?? 0;
    assert.ok(
      pointerUsages <= 1,
      `${name} should not hand-roll pointer classes (found ${pointerUsages})`,
    );
  }

  assert.doesNotMatch(designSystem, /\bcursor-pointer\b/);
});
