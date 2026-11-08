import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const pill = await read("../src/components/Pill.tsx");
const designSystem = await read("../src/DesignSystem.tsx");

const variants = ["neutral", "white", "accent", "ink"];

test("pill ships every variant as a filled, borderless label", () => {
  for (const variant of variants) {
    assert.match(pill, new RegExp(`\\n\\s*${variant}: "bg-`));
  }
  assert.match(pill, /neutral: "bg-surface-muted text-gray-700"/);
  assert.match(pill, /rounded-full/);
  assert.doesNotMatch(pill, /\bborder\b/);
});

test("design system documents each pill variant", () => {
  assert.match(designSystem, /import \{ Pill \} from "\.\/components\/Pill"/);
  assert.match(designSystem, /<Pill>Neutral<\/Pill>/);
  for (const variant of ["white", "accent", "ink"]) {
    assert.match(designSystem, new RegExp(`<Pill variant="${variant}">`));
  }
});
