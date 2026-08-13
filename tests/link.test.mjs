import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const link = await readFile(
  new URL("../src/components/Link.tsx", import.meta.url),
  "utf8",
);
const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");

test("Link supports navigation links and button actions", () => {
  assert.match(link, /href\?: string/);
  assert.match(link, /return href \?/);
  assert.match(link, /<a/);
  assert.match(link, /<button/);
});

test("Link darkens on hover without adding an underline", () => {
  assert.match(link, /text-muted/);
  assert.match(link, /hover:text-ink/);
  assert.match(link, /no-underline/);
  assert.doesNotMatch(link, /hover:underline/);
  assert.match(link, /focus-visible:underline/);
});

test("Link shows a pointer when enabled and not-allowed when disabled", () => {
  assert.match(link, /\bcursor-pointer\b/);
  assert.match(link, /\bdisabled:cursor-not-allowed\b/);
  assert.match(link, /\baria-disabled:cursor-not-allowed\b/);
  assert.match(link, /\bdisabled:hover:text-muted\b/);
  assert.match(link, /\baria-disabled:hover:text-muted\b/);
});

test("See more uses the shared Link component as a button", () => {
  assert.match(app, /import \{ Link \} from "\.\/Link"/);
  assert.match(link, /\btext-medium\b/);
  assert.match(
    app,
    /<Link[\s\S]*aria-expanded=\{isExpanded\}[\s\S]*aria-controls=\{contentId\}[\s\S]*onClick=\{toggleExpanded\}[\s\S]*>\s*\{isExpanded \? "See less" : "See more"\}\s*<\/Link>/,
  );
});

test("View on Luma is no longer a Link in the metadata rows", () => {
  assert.match(link, /bg-transparent p-0 text-left/);
  // The cover opens Luma; the hint under it is not a Link.
  assert.doesNotMatch(
    app,
    /<Link[^>]*href=\{selectedEvent\.luma_url\}/,
  );
  assert.doesNotMatch(app, /<Chip[^>]*href=\{selectedEvent\.luma_url\}/);
  assert.match(app, /cover-luma-hint/);
  assert.equal((app.match(/View on Luma/g) ?? []).length, 3);
});
