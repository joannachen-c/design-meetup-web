import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const header = await readFile(
  new URL("../src/components/SiteHeader.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const pageGutter = "px-[clamp(20px,6vw,96px)]";

test("major page sections share one responsive horizontal gutter", () => {
  assert.match(
    header,
    new RegExp(
      `className="[^"]*\\bsite-header\\b[^"]*${pageGutter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"]*"`,
    ),
    "site-header should use the shared page gutter",
  );

  for (const classHook of [
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

test("every top-level content region uses the shared twelve-column grid", () => {
  for (const classHook of [
    "site-header",
    "intro",
    "gallery-toolbar",
    "detail-grid",
    "upcoming-events",
    "about-grid",
    "partner-cta",
  ]) {
    assert.match(
      css,
      new RegExp(
        `\\.${classHook}\\s*\\{[^}]*display:\\s*grid;[^}]*grid-template-columns:\\s*repeat\\(12,\\s*minmax\\(0,\\s*1fr\\)\\);[^}]*column-gap:\\s*clamp\\(16px,\\s*2vw,\\s*28px\\);`,
        "s",
      ),
      `${classHook} should use the shared twelve-column grid`,
    );
  }

  assert.match(
    css,
    /footer\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);[^}]*column-gap:\s*clamp\(16px,\s*2vw,\s*28px\);/s,
  );
});

test("major marketing sections use 60px block padding at the mobile breakpoint", () => {
  assert.match(
    app,
    /className="[^"]*\bevent-detail\b[^"]*pb-\[clamp\(56px,9vw,128px\)\][^"]*"/,
  );

  for (const classHook of ["upcoming-events", "about-section", "partner-cta"]) {
    assert.match(
      app,
      new RegExp(
        `className="[^"]*\\b${classHook}\\b[^"]*py-\\[120px\\][^"]*max-\\[820px\\]:py-\\[60px\\][^"]*"`,
      ),
      `${classHook} should preserve 120px desktop padding and use 60px mobile padding`,
    );
  }
});
