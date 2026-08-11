import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const footer = await readFile(
  new URL("../src/components/SiteFooter.tsx", import.meta.url),
  "utf8",
);
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
    footer,
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

test("major marketing sections use 80px block padding at the mobile breakpoint", () => {
  assert.match(
    app,
    /className="[^"]*\bevent-detail\b[^"]*pb-\[clamp\(56px,9vw,128px\)\][^"]*"/,
  );

  assert.match(
    app,
    /className="[^"]*\bupcoming-events\b[^"]*py-\[160px\][^"]*max-\[820px\]:py-\[80px\][^"]*"/,
    "upcoming-events should use 160px desktop padding and 80px mobile padding",
  );

  // The partner CTA runs deeper than its neighbours: it closes the page's
  // marketing run, so the extra block padding is what sets it apart from the
  // sections stacked above it rather than an inconsistency with them.
  assert.match(
    app,
    /className="[^"]*\bpartner-cta\b[^"]*py-\[200px\][^"]*max-\[820px\]:py-\[96px\][^"]*"/,
    "partner-cta should use 200px desktop padding and 96px mobile padding",
  );

  assert.match(
    app,
    /className="[^"]*\babout-section\b[^"]*pt-\[160px\][^"]*pb-\[80px\][^"]*max-\[820px\]:pt-\[80px\][^"]*max-\[820px\]:pb-\[40px\][^"]*"/,
    "about-section should keep 160px top padding and half the bottom padding",
  );
});
