import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const pageGutter = "px-[clamp(20px,6vw,96px)]";

test("major page sections share one responsive horizontal gutter", () => {
  for (const classHook of [
    "site-header",
    "intro",
    "gallery-toolbar",
    "event-detail",
    "upcoming-events",
    "partner-cta",
  ]) {
    assert.match(
      app,
      new RegExp(`className="[^"]*\\b${classHook}\\b[^"]*${pageGutter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"]*"`),
      `${classHook} should use the shared page gutter`,
    );
  }

  assert.match(
    app,
    new RegExp(`<footer[\\s\\S]*?className="[^"]*${pageGutter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"]*"`),
    "footer should use the shared page gutter",
  );

  const statusClasses = [
    ...app.matchAll(/className="([^"]*\bgallery-status\b[^"]*)"/g),
  ].map((match) => match[1]);

  assert.ok(statusClasses.length > 0, "expected gallery status surfaces");
  assert.ok(
    statusClasses.every((className) => className.includes(pageGutter)),
    "gallery status surfaces should use the shared page gutter",
  );
});

test("event detail and upcoming sections use generous boundary spacing", () => {
  assert.match(
    app,
    /className="[^"]*\bevent-detail\b[^"]*pb-\[clamp\(56px,9vw,128px\)\][^"]*"/,
  );
  assert.match(
    app,
    /className="[^"]*\bupcoming-events\b[^"]*py-\[120px\][^"]*max-\[820px\]:py-36[^"]*"/,
  );
});
