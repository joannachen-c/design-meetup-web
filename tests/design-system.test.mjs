import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readSource = (path) => readFile(new URL(path, root), "utf8");

const [app, designSystem, iconButton, designSystemPage, styles] =
  await Promise.all([
    readSource("src/components/HomePage.tsx").catch(() =>
      readSource("src/App.tsx"),
    ),
    readSource("src/DesignSystem.tsx").catch(() => ""),
    readSource("src/components/IconButton.tsx").catch(() => ""),
    readSource("app/design-system/page.tsx").catch(() => ""),
    readSource("app/globals.css").catch(() => readSource("src/styles.css")),
  ]);

test("the design system is available at its own App Router route", () => {
  assert.match(designSystemPage, /DesignSystem/);
  assert.match(designSystemPage, /from ["']@\/DesignSystem["']|from ["']\.\.\/\.\.\/src\/DesignSystem["']|from ["']@\/src\/DesignSystem["']/);
});

test("the specimen page documents foundations and production components", () => {
  for (const section of [
    "Colors",
    "Typography",
    "Layout",
    "Borders",
    "Shadows",
    "Buttons",
    "Links",
    "Inputs",
    "Tooltips",
  ]) {
    assert.match(designSystem, new RegExp(`>\\s*${section}\\s*<`));
  }
  assert.match(designSystem, /<Primary/);
  assert.match(designSystem, /<Link/);
  assert.match(designSystem, /<Input/);
  assert.match(designSystem, /<Tooltip/);
  assert.match(designSystem, /loading/);
  assert.match(designSystem, /disabled/);
});

test("layout foundations document gutters and the practical spacing scale", () => {
  assert.match(designSystem, /\{ id: "layout", label: "Layout" \}/);
  assert.match(
    designSystem,
    /id="layout"[\s\S]*aria-labelledby="layout-title"/,
  );
  assert.match(designSystem, />\s*Responsive page gutter\s*</);
  assert.match(designSystem, /px-\[clamp\(20px,6vw,96px\)\]/);

  for (const value of ["8px", "16px", "24px", "32px", "48px", "64px"]) {
    assert.match(designSystem, new RegExp(`label: "${value}"`));
  }

  assert.match(designSystem, /48px vertical padding/);
  assert.match(designSystem, /64px at tablet widths/);
});

test("layout foundations show the responsive twelve-column 8/4 grid", () => {
  assert.match(
    designSystem,
    /Array\.from\(\{ length: 12 \}, \(_, index\) => index \+ 1\)/,
  );
  assert.match(
    designSystem,
    /grid-cols-6[^"]*min-\[821px\]:grid-cols-12/,
  );
  assert.match(
    designSystem,
    /grid-cols-1[^"]*min-\[821px\]:grid-cols-12[\s\S]*min-\[821px\]:col-span-8[\s\S]*min-\[821px\]:col-span-4/,
  );
  assert.match(designSystem, /8\/4 columns/);
  assert.match(designSystem, /820px and below/);
});

test("visible layout specimens share the tooltip card radius", () => {
  assert.match(
    designSystem,
    /mt-5 rounded-\[11px\] bg-surface-muted px-\[clamp\(20px,6vw,96px\)\] py-6/,
  );
  assert.match(
    designSystem,
    /min-h-20 items-center justify-center rounded-\[11px\] bg-white/,
  );
  assert.match(
    designSystem,
    /aspect-square items-center justify-center rounded-\[11px\] bg-surface-muted/,
  );
  assert.match(
    designSystem,
    /min-h-20 rounded-\[11px\] bg-ink[\s\S]*min-h-20 rounded-\[11px\] bg-surface-muted/,
  );
});

test("layout spacing-scale bars use the smaller radius", () => {
  assert.match(
    designSystem,
    /className=\{`\$\{space\.className\} h-3 rounded-sm bg-ink`\}/,
  );
  assert.doesNotMatch(
    designSystem,
    /className=\{`\$\{space\.className\} h-3 rounded-\[11px\] bg-ink`\}/,
  );
});

test("borders and shadows are linked foundations sections", () => {
  for (const [label, id] of [
    ["Borders", "borders"],
    ["Shadows", "shadows"],
  ]) {
    assert.match(
      designSystem,
      new RegExp(`\\{ id: "${id}", label: "${label}" \\}`),
    );
    assert.match(
      designSystem,
      new RegExp(
        `id="${id}"[\\s\\S]*aria-labelledby="${id}-title"[\\s\\S]*id="${id}-title"[\\s\\S]*>\\s*${label}\\s*<`,
      ),
    );
  }
});

test("the expanded design system navigation wraps in the header grid", () => {
  assert.match(
    designSystem,
    /className="primary-navigation design-system-navigation"/,
  );
  assert.match(
    styles,
    /\.site-header > \.design-system-navigation\s*\{[\s\S]*grid-column: 5 \/ span 8;[\s\S]*flex-wrap: wrap;[\s\S]*justify-content: flex-end;/,
  );
});

test("border specimens document production corner radii", () => {
  const bordersSection =
    designSystem.match(/<section\s+id="borders"[\s\S]*?<\/section>/)?.[0] ?? "";

  for (const [label, className] of [
    ["Small", "rounded-sm"],
    ["Medium", "rounded-md"],
    ["Control", "rounded-\\[10px\\]"],
    ["Surface", "rounded-\\[11px\\]"],
    ["Full", "rounded-full"],
  ]) {
    assert.match(bordersSection, new RegExp(`>${label}<`));
    assert.match(bordersSection, new RegExp(className));
  }
});

test("shadow specimens use production elevation classes", () => {
  const shadowsSection =
    designSystem.match(/<section\s+id="shadows"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(shadowsSection, /shadow-none/);
  assert.match(
    shadowsSection,
    /shadow-\[0_3px_10px_rgba\(0,0,0,0\.12\)\]/,
  );
  assert.match(shadowsSection, /shadow-lg/);
  assert.match(shadowsSection, /hover:shadow-xl/);
});

test("the page title is lowercase and stays on one line", () => {
  assert.match(
    designSystem,
    /<h1 className="[^"]*\bwhitespace-nowrap\b[^"]*">\s*design system\s*<\/h1>/,
  );
  assert.doesNotMatch(
    designSystem,
    /<h1 className="[^"]*\bmax-w-\[[^"]*">/,
  );
  assert.doesNotMatch(designSystem, />\s*Mini design system\s*</);
});

test("the intro uses the homepage grid relationship and revised copy", () => {
  const introCopy =
    /The foundations behind the Design Meetup website\.\s+These examples\s+use the same production components as the site\./g;

  assert.match(
    designSystem,
    /className="[^"]*\bgrid-cols-12\b[^"]*\bmax-\[820px\]:grid-cols-1\b[^"]*"[\s\S]*<h1 className="[^"]*\bcol-span-8\b[^"]*\bmax-\[820px\]:col-span-1\b[^"]*">/,
  );
  assert.match(
    designSystem,
    /<p className="[^"]*\bcol-start-9\b[^"]*\bcol-span-4\b[^"]*\bmax-\[820px\]:col-start-1\b[^"]*\bmax-\[820px\]:col-span-1\b[^"]*">/,
  );
  assert.equal(designSystem.match(introCopy)?.length, 1);
  assert.doesNotMatch(
    designSystem,
    /The foundations and reusable interface pieces behind the Design Meetup website\./,
  );
});

test("semantic color tokens back shared component styling", () => {
  for (const token of [
    "--color-ink",
    "--color-muted",
    "--color-subtle",
    "--color-surface",
    "--color-surface-muted",
    "--color-accent-primary",
    "--color-accent-hover",
  ]) {
    assert.match(styles, new RegExp(token));
  }

  assert.match(designSystem, /bg-ink/);
  assert.match(designSystem, /bg-muted/);
  assert.match(designSystem, /bg-surface-muted/);
  assert.match(designSystem, /bg-accent-primary/);
});

test("color swatches use gap-4 before tightly grouped copy", () => {
  assert.match(
    designSystem,
    /const colorItemClassName = "grid gap-4"/,
  );
  assert.equal(
    designSystem.match(/className=\{colorItemClassName\}/g)?.length,
    4,
  );
  assert.equal(
    designSystem.match(/className="m-0 mt-1 text-sm text-subtle"/g)?.length,
    4,
  );
});

test("the display specimen stays on one line without a narrow width cap", () => {
  assert.match(
    designSystem,
    /<p className="[^"]*\bwhitespace-nowrap\b[^"]*">\s*Growth happens together\.\s*<\/p>/,
  );
  assert.doesNotMatch(
    designSystem,
    /<p className="[^"]*\bmax-w-\[12ch\][^"]*">\s*Growth happens together\.\s*<\/p>/,
  );
});

test("gallery arrows use an accessible shared icon button", () => {
  assert.match(iconButton, /export function IconButton/);
  assert.match(iconButton, /aria-label/);
  assert.match(iconButton, /disabled/);
  assert.match(iconButton, /focus-visible:outline-2/);
  assert.match(app, /import \{ IconButton \} from "\.\/components\/IconButton"/);
  assert.match(app, /<IconButton/);
  assert.doesNotMatch(app, /const iconButtonClassName/);
});

test("button and link specimens use white surfaces", () => {
  assert.match(
    designSystem,
    /const whiteSpecimenClassName = `\$\{specimenClassName\} gap-3 bg-white py-5 sm:py-8`/,
  );
  assert.match(
    designSystem,
    /aria-labelledby="buttons-title"[\s\S]*whiteSpecimenClassName/,
  );
  assert.match(
    designSystem,
    /aria-labelledby="links-title"[\s\S]*className=\{linksSpecimenClassName\}/,
  );
});

test("button and link specimen rows omit horizontal padding", () => {
  assert.match(
    designSystem,
    /const specimenClassName =\s*"flex min-h-32 flex-wrap items-center rounded-\[11px\]"/,
  );
  assert.match(
    designSystem,
    /const whiteSpecimenClassName = `\$\{specimenClassName\} gap-3 bg-white py-5 sm:py-8`/,
  );
  assert.match(
    designSystem,
    /const linksSpecimenClassName = `\$\{specimenClassName\} gap-6 bg-white py-5 sm:py-8`/,
  );
  assert.match(
    designSystem,
    /className=\{`\$\{specimenClassName\} gap-3 bg-surface-muted p-5 sm:p-8`\}/,
  );
});

test("button states include a disabled icon button specimen", () => {
  assert.match(
    designSystem,
    /<IconButton aria-label="Disabled icon button" disabled>[\s\S]*<ArrowIcon \/>[\s\S]*<\/IconButton>/,
  );
});

test("tooltip specimen uses a centered SVG help icon", () => {
  assert.match(
    designSystem,
    /function HelpIcon\(\)[\s\S]*<svg className="size-5"[\s\S]*aria-hidden="true"/,
  );
  assert.match(
    designSystem,
    /<IconButton aria-label="More information">\s*<HelpIcon \/>\s*<\/IconButton>/,
  );
  assert.doesNotMatch(
    designSystem,
    /<IconButton aria-label="More information">\s*\?\s*<\/IconButton>/,
  );
});

test("design system header logo links home and sections have sub-nav anchors", () => {
  assert.match(designSystem, /className="[^"]*\bsite-header\b/);
  assert.match(
    designSystem,
    /href="\/"[\s\S]*?aria-label="Design Meetup home"/,
  );
  assert.match(designSystem, /src="\/design-meetup-logo\.png"/);
  assert.match(designSystem, /className="wordmark-logo border-0 outline-none"/);
  assert.match(
    designSystem,
    /aria-label="Design system sections"/,
  );
  assert.match(
    designSystem,
    /<a key=\{id\} className=\{navLinkClassName\} href=\{`#\$\{id\}`\}>[\s\S]*\{label\}[\s\S]*<\/a>/,
  );

  for (const [label, id] of [
    ["Colors", "colors"],
    ["Typography", "typography"],
    ["Layout", "layout"],
    ["Borders", "borders"],
    ["Shadows", "shadows"],
    ["Buttons", "buttons"],
    ["Links", "links"],
    ["Inputs", "inputs"],
    ["Tooltips", "tooltips"],
  ]) {
    assert.match(
      designSystem,
      new RegExp(`\\{ id: "${id}", label: "${label}" \\}`),
    );
    assert.match(designSystem, new RegExp(`id="${id}"`));
  }

  assert.doesNotMatch(
    designSystem,
    /<p className="[^"]*uppercase text-muted[^"]*">\s*Design Meetup\s*<\/p>/,
  );
});
