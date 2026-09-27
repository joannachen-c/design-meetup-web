import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("member ID socials stay in the masthead on every breakpoint", async () => {
  const tsx = await read("src/components/portal/MemberIdCard.tsx");
  const css = await read("src/components/portal/MemberIdCard.module.css");
  assert.match(tsx, /className=\{styles\.masthead\}/);
  assert.match(tsx, /className=\{styles\.socials\}/);
  assert.doesNotMatch(tsx, /styles\.socialsMobile/);
  assert.doesNotMatch(css, /socialsMobile/);
  assert.doesNotMatch(css, /\.socialsDesktop\s*\{\s*display:\s*none/);
});

test("member since date uses secondary text", async () => {
  const css = await read("src/components/portal/MemberIdCard.module.css");
  assert.match(
    css,
    /\.sinceValue\s*\{[^}]*color:\s*var\(--color-muted\)/s,
  );
  assert.match(css, /\.sinceValue\s*\{[^}]*font-weight:\s*400/s);
});
