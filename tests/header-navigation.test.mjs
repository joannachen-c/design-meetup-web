import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const home = await readFile(
  new URL("../src/components/HomePage.tsx", import.meta.url),
  "utf8",
);
const designSystem = await readFile(
  new URL("../src/DesignSystem.tsx", import.meta.url),
  "utf8",
);
const header = await readFile(
  new URL("../src/components/SiteHeader.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("homepage and design system share SiteHeader", () => {
  assert.match(home, /import \{ SiteHeader \} from "\.\/SiteHeader"/);
  assert.match(home, /<SiteHeader\b/);
  assert.match(designSystem, /import \{ SiteHeader \} from "\.\/components\/SiteHeader"/);
  assert.match(designSystem, /<SiteHeader\b/);
  assert.doesNotMatch(home, /className="[^"]*\bsite-header\b/);
  assert.doesNotMatch(designSystem, /className="[^"]*\bsite-header\b/);
});

test("design system nav links are hidden on mobile while logo stays visible", () => {
  assert.match(
    designSystem,
    /<SiteHeader[\s\S]*navClassName="design-system-navigation max-\[820px\]:hidden"/,
  );
  assert.doesNotMatch(designSystem, /<div className="max-\[820px\]:hidden">\s*<SiteHeader/);
  assert.doesNotMatch(home, /max-\[820px\]:hidden[\s\S]*<SiteHeader\b/);
  assert.doesNotMatch(home, /<SiteHeader[\s\S]*max-\[820px\]:hidden/);
});

test("homepage header navigation uses sentence case labels", () => {
  for (const [label, target] of [
    ["Calendar", "calendar"],
    ["About", "about"],
    ["Sponsor", "sponsor"],
  ]) {
    assert.match(
      header,
      new RegExp(`\\{ href: "#${target}", label: "${label}" \\}`),
    );
    assert.match(home, new RegExp(`id="${target}"`));
  }

  assert.doesNotMatch(header, /label: "CALENDAR"/);
  assert.doesNotMatch(header, /label: "ABOUT"/);
  assert.doesNotMatch(header, /label: "SPONSOR"/);
  assert.doesNotMatch(home, />\s*Past events\s*</);
  assert.doesNotMatch(home, />\s*Upcoming\s*</);
  assert.doesNotMatch(home, /href="#events"[\s\S]*?>\s*EVENTS\s*<\/a>/);
});

test("design system header uses lowercase section labels via SiteHeader links", () => {
  assert.match(
    designSystem,
    /links=\{sections\.map\(\(\{ id, label \}\) => \(\{ href: `#\$\{id\}`, label \}\)\)\}/,
  );

  for (const [label, id] of [
    ["colors", "colors"],
    ["typography", "typography"],
    ["layout", "layout"],
    ["borders", "borders"],
    ["shadows", "shadows"],
    ["buttons", "buttons"],
    ["links", "links"],
    ["inputs", "inputs"],
    ["tooltips", "tooltips"],
  ]) {
    assert.match(
      designSystem,
      new RegExp(`\\{ id: "${id}", label: "${label}" \\}`),
    );
  }
});

test("shared header nav links use text-medium with logo sizing and reduced top padding", () => {
  assert.match(
    header,
    /<header className="[^"]*\bsite-header\b[^"]*\btext-base\b[^"]*">/,
  );
  assert.match(header, /pt-\[clamp\(16px,2vw,30px\)\]/);
  assert.match(header, /pb-\[clamp\(24px,3vw,46px\)\]/);
  assert.match(header, /className="wordmark-logo border-0 outline-none"/);
  assert.match(header, /width=\{60\}/);
  assert.match(header, /height=\{60\}/);
  assert.match(
    css,
    /\.wordmark\s*\{[^}]*display:\s*flex;[^}]*height:\s*60px;/s,
  );
  assert.match(
    css,
    /\.wordmark-logo\s*\{[^}]*width:\s*auto;[^}]*height:\s*100%;/s,
  );
  assert.match(
    header,
    /const navLinkClassName =\s*"text-medium text-base text-subtle/
  );
  assert.match(
    css,
    /\.text-medium\s*\{[^}]*text-shadow:\s*-0\.25px 0 currentColor,\s*0\.25px 0 currentColor;/s,
  );
  assert.doesNotMatch(header, /text-\[0\.78rem\]/);
});
