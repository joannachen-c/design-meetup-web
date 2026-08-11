import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readSource = (path) => readFile(new URL(path, root), "utf8");

const [app, designSystem, iconButton, designSystemPage, styles, input] =
  await Promise.all([
    readSource("src/components/HomePage.tsx"),
    readSource("src/DesignSystem.tsx").catch(() => ""),
    readSource("src/components/IconButton.tsx").catch(() => ""),
    readSource("app/design-system/page.tsx").catch(() => ""),
    readSource("app/globals.css"),
    readSource("src/components/Input.tsx").catch(() => ""),
  ]);

test("the design system is available at its own App Router route", () => {
  assert.match(designSystemPage, /DesignSystem/);
  assert.match(designSystemPage, /from ["']@\/DesignSystem["']|from ["']\.\.\/\.\.\/src\/DesignSystem["']|from ["']@\/src\/DesignSystem["']/);
});

test("the specimen page documents foundations and production components", () => {
  for (const section of [
    "colors",
    "typography",
    "layout",
    "borders",
    "shadows",
    "buttons",
    "links",
    "inputs",
    "tooltips",
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

test("design-system section and group headers are lowercase without changing specimen copy", () => {
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
      new RegExp(
        `id="${id}-title"[^>]*>\\s*${label}\\s*<\\/h2>`,
      ),
    );
  }

  for (const label of [
    "ink",
    "muted",
    "soft gray",
    "meetup lime",
    "tailwind neutrals",
    "display",
    "heading",
    "body",
    "responsive page gutter",
    "spacing scale",
    "12-column grid",
    "small",
    "medium",
    "control",
    "surface",
    "full",
    "base",
    "soft",
    "raised",
    "variants",
    "states",
  ]) {
    assert.match(
      designSystem,
      new RegExp(`<SpecimenLabel>${label}<\\/SpecimenLabel>`),
    );
  }

  assert.doesNotMatch(
    designSystem,
    /function SpecimenLabel[\s\S]*?className="[^"]*\buppercase\b/,
  );
  assert.match(designSystem, /<Primary>Primary<\/Primary>/);
  assert.match(designSystem, /Growth happens together\./);
  assert.match(designSystem, /Design Meetup website/);
});

test("the inputs specimen renders the shared production Input component", () => {
  const inputsSection =
    designSystem.match(/<section\s+id="inputs"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(designSystem, /import \{ Input \} from "\.\/components\/Input"/);
  assert.match(app, /import \{ Input \} from "\.\/Input"/);
  assert.equal(inputsSection.match(/<Input[\s\n]/g)?.length, 2);
  assert.doesNotMatch(inputsSection, /<input[\s\n>]/);
});

test("the inputs specimen documents the dropdown built on the input surface", () => {
  const inputsSection =
    designSystem.match(/<section\s+id="inputs"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(designSystem, /import \{ Select \} from "\.\/components\/Select"/);
  assert.match(inputsSection, /<SelectSpecimen \/>/);
  assert.match(inputsSection, />\s*Dropdown\s*</);
  assert.match(designSystem, /function SelectSpecimen\(\)[\s\S]*?<Select\b/);
  assert.doesNotMatch(designSystem, /<select[\s\n>]/);
});

test("inputs specimen field labels do not cascade bold into the control", () => {
  const inputsSection =
    designSystem.match(/<section\s+id="inputs"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.doesNotMatch(inputsSection, /<label className="[^"]*\bfont-bold\b/);
  assert.equal(
    inputsSection.match(/<span className="font-bold">/g)?.length,
    3,
  );
  assert.match(input, /\bfont-normal\b/);
});

test("layout foundations document gutters and the practical spacing scale", () => {
  assert.match(designSystem, /\{ id: "layout", label: "layout" \}/);
  assert.match(
    designSystem,
    /id="layout"[\s\S]*aria-labelledby="layout-title"/,
  );
  assert.match(designSystem, />\s*responsive page gutter\s*</);
  assert.match(designSystem, /px-\[clamp\(20px,6vw,96px\)\]/);

  for (const value of ["8px", "16px", "24px", "32px", "48px", "64px"]) {
    assert.match(designSystem, new RegExp(`label: "${value}"`));
  }

  assert.match(designSystem, /56px vertical padding/);
  assert.match(designSystem, /80px at tablet widths/);
  assert.match(
    designSystem,
    /text-pretty text-base leading-\[1\.5\] text-muted">\s*Design-system sections use 56px vertical padding/,
  );
});

test("sections omit horizontal dividers while preserving vertical rhythm", () => {
  const sectionClassName =
    designSystem.match(/const sectionClassName =\s*"([^"]+)"/)?.[1] ?? "";

  assert.equal(
    sectionClassName,
    "grid gap-8 py-14 md:grid-cols-[minmax(150px,0.32fr)_minmax(0,1fr)] md:gap-16 md:py-20",
  );
  assert.doesNotMatch(sectionClassName, /\bborder-(?:t|b)\b/);
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
  assert.match(
    designSystem,
    /<p className="m-0 text-2xl font-bold leading-\[1\.02\] tracking-\[-0\.06em\]">\s*Display\s*<\/p>\s*<p className="m-0 mt-1 text-sm font-normal leading-\[1\.5\]">\s*8 columns\s*<\/p>/,
  );
  assert.match(
    designSystem,
    /<p className="m-0 text-base font-normal leading-\[1\.5\] text-muted">\s*Body\s*<\/p>\s*<p className="m-0 mt-1 text-sm font-normal leading-\[1\.5\] text-muted">\s*4 columns\s*<\/p>/,
  );
  assert.doesNotMatch(designSystem, /Heading · 8 columns/);
  assert.doesNotMatch(designSystem, /Copy · 4 columns/);
});

test("layout specimens share the same column gutter", () => {
  assert.match(
    designSystem,
    /const layoutGridGapClassName = "gap-2"/,
  );
  assert.equal(
    designSystem.match(/\$\{layoutGridGapClassName\}/g)?.length,
    2,
  );
});

test("the annotated 8/4 layout surfaces double vertical padding only", () => {
  const displaySurface =
    designSystem.match(
      /<div className="([^"]*)">\s*<p className="[^"]*">\s*Display\s*<\/p>/,
    )?.[1] ?? "";
  const bodySurface =
    designSystem.match(
      /<div className="([^"]*)">\s*<p className="[^"]*">\s*Body\s*<\/p>/,
    )?.[1] ?? "";

  for (const surface of [displaySurface, bodySurface]) {
    assert.match(surface, /\bmin-h-20\b/);
    assert.match(surface, /\bpx-4\b/);
    assert.match(surface, /\bpy-8\b/);
    assert.doesNotMatch(surface, /\bp-4\b/);
    assert.doesNotMatch(surface, /\bpy-4\b/);
  }
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
    /layoutColumns\.map\(\(column\) => \([\s\S]*aspect-\[3\/4\] items-center justify-center rounded-\[11px\] bg-surface-muted[\s\S]*\{column\}[\s\S]*\)\)/,
  );
  assert.doesNotMatch(designSystem, /\bflex aspect-square items-center justify-center/);
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
    ["borders", "borders"],
    ["shadows", "shadows"],
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
    /navClassName="design-system-navigation"/,
  );
  assert.match(
    styles,
    /\.site-header > \.design-system-navigation\s*\{[\s\S]*grid-column: 5 \/ span 8;[\s\S]*flex-wrap: wrap;[\s\S]*justify-content: flex-end;/,
  );
});

test("border specimens document production corner radii", () => {
  const bordersSection =
    designSystem.match(/<section\s+id="borders"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.doesNotMatch(
    bordersSection,
    /Corner radii follow the role and scale of each production element/,
  );

  for (const [label, className] of [
    ["small", "rounded-sm"],
    ["medium", "rounded-md"],
    ["control", "rounded-\\[10px\\]"],
    ["surface", "rounded-\\[11px\\]"],
    ["full", "rounded-full"],
  ]) {
    assert.match(bordersSection, new RegExp(`>${label}<`));
    assert.match(bordersSection, new RegExp(className));
  }
});

test("border metadata shares the shadow description typography", () => {
  const bordersSection =
    designSystem.match(/<section\s+id="borders"[\s\S]*?<\/section>/)?.[0] ?? "";
  const shadowsSection =
    designSystem.match(/<section\s+id="shadows"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(
    designSystem,
    /const specimenDescriptionClassName =\s*"m-0 mt-1 text-pretty text-sm leading-\[1\.5\] text-muted"/,
  );
  assert.equal(
    bordersSection.match(
      /<p className=\{specimenDescriptionClassName\}>/g,
    )?.length,
    5,
  );
  assert.equal(
    shadowsSection.match(
      /<p className=\{specimenDescriptionClassName\}>/g,
    )?.length,
    3,
  );
  assert.doesNotMatch(bordersSection, /<code[\s>]/);
  assert.doesNotMatch(bordersSection, /\bfont-mono\b/);
});

test("border specimens use equal gray squares in a responsive uncarded grid", () => {
  const bordersSection =
    designSystem.match(/<section\s+id="borders"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(
    bordersSection,
    /m-0 grid[^"]*grid-cols-2[^"]*lg:grid-cols-5/,
  );
  assert.equal(
    bordersSection.match(/size-20[^"]*bg-gray-200/g)?.length,
    5,
  );
  assert.equal(
    bordersSection.match(/<li className="grid justify-items-start gap-4">/g)
      ?.length,
    5,
  );
  assert.doesNotMatch(
    bordersSection,
    /size-20[^"]*\bborder\b/,
  );
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

test("shadow specimens use equal white squares in an uncarded grid", () => {
  const shadowsSection =
    designSystem.match(/<section\s+id="shadows"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(shadowsSection, /grid-cols-2[^"]*lg:grid-cols-3/);
  assert.equal(
    shadowsSection.match(/size-24[^"]*rounded-\[11px\][^"]*bg-white/g)
      ?.length,
    3,
  );
  assert.equal(
    shadowsSection.match(/<li className="grid justify-items-start gap-4">/g)
      ?.length,
    3,
  );
  assert.match(
    shadowsSection,
    /<SpecimenLabel>base<\/SpecimenLabel>[\s\S]*?size-24[^"]*shadow-none/,
  );
  assert.match(
    shadowsSection,
    /<SpecimenLabel>soft<\/SpecimenLabel>[\s\S]*?size-24[^"]*shadow-\[0_3px_10px_rgba\(0,0,0,0\.12\)\]/,
  );
  assert.match(
    shadowsSection,
    /<SpecimenLabel>raised<\/SpecimenLabel>[\s\S]*?size-24[^"]*shadow-lg[^"]*hover:shadow-xl/,
  );
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

test("semantic color swatches use two mobile columns and four desktop columns", () => {
  const colorsSection =
    designSystem.match(/<section\s+id="colors"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(
    colorsSection,
    /className="grid[^"]*\bgrid-cols-2\b[^"]*\blg:grid-cols-4\b[^"]*"/,
  );
  assert.doesNotMatch(colorsSection, /\bsm:grid-cols-2\b/);
});

test("colors document only production Tailwind utility colors as small chips", () => {
  const colorsSection =
    designSystem.match(/<section\s+id="colors"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(colorsSection, />\s*tailwind neutrals\s*</);
  for (const shade of ["100", "200", "300", "400", "500"]) {
    assert.match(colorsSection, new RegExp(`>\\s*gray-${shade}\\s*<`));
    assert.match(colorsSection, new RegExp(`\\bbg-gray-${shade}\\b`));
  }
  assert.equal(colorsSection.match(/\bsize-12\b/g)?.length, 5);
  assert.match(
    colorsSection,
    /grid-cols-2[^"]*sm:grid-cols-3[^"]*lg:grid-cols-5/,
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
  assert.match(app, /import \{ IconButton \} from "\.\/IconButton"/);
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
    /const linksSpecimenClassName = `\$\{specimenClassName\} gap-6 bg-white`/,
  );
  const linksSpecimenClassName =
    designSystem.match(
      /const linksSpecimenClassName = `\$\{specimenClassName\}([^`]*)`/,
    )?.[1] ?? "";
  assert.doesNotMatch(linksSpecimenClassName, /\b(?:p|py)-/);
  assert.match(
    designSystem,
    /className=\{`\$\{specimenClassName\} gap-3 bg-surface-muted p-5 sm:p-8`\}/,
  );
});

test("responsive gutter content surface is white rather than cream", () => {
  const gutterContentClassName =
    designSystem.match(
      /<div className="mt-5 rounded-\[11px\] bg-surface-muted px-\[clamp\(20px,6vw,96px\)\] py-6">\s*<div className="([^"]*)">\s*Content/,
    )?.[1] ?? "";

  assert.match(gutterContentClassName, /\bbg-white\b/);
  assert.doesNotMatch(gutterContentClassName, /\bbg-surface(?:-muted)?\b/);
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
  assert.match(designSystem, /import \{ SiteHeader \} from "\.\/components\/SiteHeader"/);
  assert.match(
    designSystem,
    /<SiteHeader[\s\S]*homeHref="\/"[\s\S]*navAriaLabel="Design system sections"/,
  );
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
    assert.match(designSystem, new RegExp(`id="${id}"`));
  }

  assert.doesNotMatch(
    designSystem,
    /<p className="[^"]*uppercase text-muted[^"]*">\s*Design Meetup\s*<\/p>/,
  );
});
