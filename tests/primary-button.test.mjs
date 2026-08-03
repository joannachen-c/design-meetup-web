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
  assert.match(primary, /hover:bg-\[#e3e95f\]/);
  assert.match(primary, /disabled:hover:bg-accent-primary/);
  assert.match(primary, /aria-disabled:hover:bg-accent-primary/);
  assert.match(primary, /hover:bg-gray-300/);
  assert.match(
    primary,
    /disabled:hover:bg-\[oklch\(96\.7%_0\.003_264\.542\)\]/,
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

test("Primary supports a transparent ghost variant with a subtle hover surface", () => {
  assert.match(primary, /variant\?: "primary" \| "secondary" \| "ghost"/);
  assert.match(
    primary,
    /variant === "ghost"[\s\S]*bg-transparent[\s\S]*text-gray-500[\s\S]*hover:bg-gray-100/,
  );
});
