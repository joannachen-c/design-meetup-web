import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");

test("header navigation links to the single-page site sections", () => {
  for (const [label, target] of [
    ["CALENDAR", "calendar"],
    ["ABOUT", "about"],
    ["SPONSOR", "sponsor"],
  ]) {
    assert.match(app, new RegExp(`href="#${target}"[\\s\\S]*?>\\s*${label}\\s*</a>`));
    assert.match(app, new RegExp(`id="${target}"`));
  }

  assert.doesNotMatch(app, />\s*Past events\s*</);
  assert.doesNotMatch(app, />\s*Upcoming\s*</);
  assert.doesNotMatch(app, /href="#events"[\s\S]*?>\s*EVENTS\s*<\/a>/);
});

test("header text uses the base Tailwind size without changing the logo", () => {
  assert.match(app, /<header className="[^"]*\bsite-header\b[^"]*\btext-base\b[^"]*">/);
  assert.equal(
    (app.match(/<a\s+className="text-base text-\[oklch\(53%_0\.025_250\)\]/g) ?? [])
      .length,
    3,
  );
  assert.doesNotMatch(app, /<a\s+className="text-\[0\.78rem\]/);
  assert.match(app, /className="wordmark-logo border-0 outline-none"/);
  assert.match(app, /width=\{60\}/);
  assert.match(app, /height=\{60\}/);
});
