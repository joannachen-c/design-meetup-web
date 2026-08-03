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

test("See more uses the shared Link component as a button", () => {
  assert.match(app, /import \{ Link \} from "\.\/Link"/);
  assert.match(link, /\btext-medium\b/);
  assert.match(
    app,
    /<Link[\s\S]*aria-expanded=\{isExpanded\}[\s\S]*aria-controls=\{contentId\}[\s\S]*onClick=\{\(\) => setIsExpanded\(!isExpanded\)\}[\s\S]*>\s*\{isExpanded \? "See less" : "See more"\}\s*<\/Link>/,
  );
});

test("View on Luma uses Link's zero-padding external anchor pattern", () => {
  assert.match(link, /bg-transparent p-0 text-left/);
  assert.match(
    app,
    /<Link[\s\S]*className="[^"]*\binline-flex\b[^"]*\bitems-center\b[^"]*\bgap-2\b[^"]*"[\s\S]*href=\{selectedEvent\.luma_url\}[\s\S]*target="_blank"[\s\S]*rel="noreferrer"[\s\S]*>[\s\S]*View on Luma[\s\S]*<ArrowUpRightIcon \/>[\s\S]*<\/Link>/,
  );
  assert.doesNotMatch(app, /<Link[^>]*className="[^"]*-ml-/);
  assert.equal((app.match(/View on Luma/g) ?? []).length, 1);
});
