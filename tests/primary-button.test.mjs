import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const primary = await readFile(
  new URL("../src/components/Primary.tsx", import.meta.url),
  "utf8",
);

test("Primary exposes loading and disabled states", () => {
  assert.match(primary, /loading\?: boolean/);
  assert.match(primary, /disabled\?: boolean/);
  assert.match(primary, /const isDisabled = disabled \|\| loading/);
  assert.match(primary, /aria-busy=\{loading \|\| undefined\}/);
});

test("Primary prevents button and link interaction while unavailable", () => {
  assert.match(primary, /disabled=\{isDisabled\}/);
  assert.match(primary, /href=\{isDisabled \? undefined : href\}/);
  assert.match(primary, /aria-disabled=\{isDisabled \|\| undefined\}/);
  assert.match(primary, /tabIndex=\{isDisabled \? -1 : undefined\}/);
});

test("Primary has polished hover focus loading and disabled visuals", () => {
  assert.match(primary, /hover:bg-accent-hover/);
  assert.match(primary, /disabled:hover:bg-accent-primary/);
  assert.match(primary, /aria-disabled:hover:bg-accent-primary/);
  assert.match(primary, /hover:bg-gray-200/);
  assert.match(
    primary,
    /disabled:hover:bg-surface-muted/,
  );
  assert.match(primary, /focus-visible:outline-2/);
  assert.match(primary, /disabled:cursor-not-allowed/);
  assert.match(primary, /aria-disabled:cursor-not-allowed/);
  assert.match(primary, /animate-spin/);
  assert.match(primary, /motion-reduce:animate-none/);
});

test("Primary uses medium-weight text", () => {
  assert.match(primary, /\btext-medium\b/);
  assert.doesNotMatch(primary, /\bfont-medium\b/);
});

test("secondary buttons tighten padding on the icon side", () => {
  assert.match(primary, /Children\.toArray\(children\)/);
  assert.match(primary, /hasLeadingIcon/);
  assert.match(primary, /hasTrailingIcon/);
  assert.match(primary, /pl-\[14px\]/);
  assert.match(primary, /pr-\[14px\]/);
});

test("Primary supports a typed ghost variant with restrained interaction states", () => {
  assert.match(primary, /variant\?: "primary" \| "secondary" \| "ghost" \| "ink"/);
  assert.match(
    primary,
    /ghost:\s*"bg-transparent text-gray-500 hover:bg-surface-muted active:bg-gray-200 disabled:hover:bg-transparent disabled:active:bg-transparent aria-disabled:hover:bg-transparent aria-disabled:active:bg-transparent"/,
  );
  assert.match(primary, /focus-visible:outline-2/);
  assert.match(primary, /disabled:active:scale-100/);
  assert.match(primary, /aria-disabled:active:scale-100/);
});

test("Primary supports a typed ink variant with a visible gray hover", () => {
  assert.match(primary, /variant\?: "primary" \| "secondary" \| "ghost" \| "ink"/);
  assert.match(
    primary,
    /ink: "bg-ink text-white hover:bg-gray-800 disabled:hover:bg-ink aria-disabled:hover:bg-ink"/,
  );
  assert.match(primary, /variantClassName\[variant\]/);
});
