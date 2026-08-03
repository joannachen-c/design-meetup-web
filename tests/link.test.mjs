import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const link = await readFile(
  new URL("../src/components/Link.tsx", import.meta.url),
  "utf8",
);
const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

test("Link supports navigation links and button actions", () => {
  assert.match(link, /href\?: string/);
  assert.match(link, /return href \?/);
  assert.match(link, /<a/);
  assert.match(link, /<button/);
});

test("Link darkens on hover without adding an underline", () => {
  assert.match(link, /text-\[oklch\(53%_0\.025_250\)\]/);
  assert.match(link, /hover:text-\[oklch\(22%_0\.025_250\)\]/);
  assert.match(link, /no-underline/);
  assert.doesNotMatch(link, /hover:underline/);
  assert.match(link, /focus-visible:underline/);
});

test("See more uses the shared Link component as a button", () => {
  assert.match(app, /import \{ Link \} from "\.\/components\/Link"/);
  assert.match(link, /\btext-medium\b/);
  assert.match(
    app,
    /<Link[\s\S]*aria-expanded=\{isExpanded\}[\s\S]*aria-controls=\{contentId\}[\s\S]*>\s*See more\s*<\/Link>/,
  );
});
