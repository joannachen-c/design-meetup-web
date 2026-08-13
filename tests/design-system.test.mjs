import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readSource = (path) => readFile(new URL(path, root), "utf8");

const [app, designSystem, iconButton, designSystemPage, styles, input, newsletterForm] =
  await Promise.all([
    readSource("src/components/HomePage.tsx"),
    readSource("src/DesignSystem.tsx").catch(() => ""),
    readSource("src/components/IconButton.tsx").catch(() => ""),
    readSource("app/design-system/page.tsx").catch(() => ""),
    readSource("app/globals.css"),
    readSource("src/components/Input.tsx").catch(() => ""),
    readSource("src/components/NewsletterForm.tsx").catch(() => ""),
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
    "strokes",
    "shadows",
    "buttons",
    "links",
    "inputs",
    "tooltips",
  ]) {
    assert.match(designSystem, new RegExp(`>\\s*${section}\\s*<`));
  }
  assert.doesNotMatch(designSystem, />\s*icons\s*</);
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
    ["strokes", "strokes"],
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
  assert.doesNotMatch(designSystem, /id="icons-title"/);

  for (const label of [
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
    "email address",
    "disabled",
    "dropdown",
  ]) {
    assert.match(
      designSystem,
      new RegExp(`<SpecimenLabel>${label}<\\/SpecimenLabel>`),
    );
  }

  for (const label of [
    "ink",
    "muted",
    "subtle",
    "white",
    "surface",
    "surface muted",
    "skeleton",
    "meetup lime",
    "meetup lime hover",
  ]) {
    assert.match(designSystem, new RegExp(`label: "${label}"`));
  }
  assert.doesNotMatch(designSystem, /label: "body"/);

  assert.doesNotMatch(
    designSystem,
    /function SpecimenLabel[\s\S]*?className="[^"]*\buppercase\b/,
  );
  assert.match(designSystem, /<Primary>Primary<\/Primary>/);
  assert.match(designSystem, /<Primary variant="ink">Ink<\/Primary>/);
  assert.match(designSystem, /Growth happens together\./);
  assert.doesNotMatch(
    designSystem,
    /The foundations behind the Design Meetup website/,
  );
});

test("the inputs specimen renders the shared production Input component", () => {
  const inputsSection =
    designSystem.match(/<section\s+id="inputs"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(designSystem, /import \{ Input \} from "\.\/components\/Input"/);
  assert.match(newsletterForm, /import \{ Input \} from "\.\/Input"/);
  assert.equal(inputsSection.match(/<Input[\s\n]/g)?.length, 2);
  assert.doesNotMatch(inputsSection, /<input[\s\n>]/);
});

test("the inputs specimen documents the dropdown built on the input surface", () => {
  const inputsSection =
    designSystem.match(/<section\s+id="inputs"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(designSystem, /import \{ Select \} from "\.\/components\/Select"/);
  assert.match(inputsSection, /<SelectSpecimen \/>/);
  assert.match(inputsSection, /<SpecimenLabel>dropdown<\/SpecimenLabel>/);
  assert.match(
    inputsSection,
    /id="inputs-title"[\s\S]*?<div className="grid gap-8">[\s\S]*email address[\s\S]*dropdown/,
  );
  assert.doesNotMatch(inputsSection, /Shares the input surface and radius/);
  assert.match(designSystem, /function SelectSpecimen\(\)[\s\S]*?<Select\b/);
  assert.doesNotMatch(designSystem, /<select[\s\n>]/);
});

test("inputs specimen field labels use SpecimenLabel like other subsections", () => {
  const inputsSection =
    designSystem.match(/<section\s+id="inputs"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.doesNotMatch(inputsSection, /<label className="[^"]*\bfont-bold\b/);
  assert.doesNotMatch(inputsSection, /<span className="font-bold">/);
  for (const label of ["email address", "disabled", "dropdown"]) {
    assert.match(
      inputsSection,
      new RegExp(`<SpecimenLabel>${label}<\\/SpecimenLabel>`),
    );
  }
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

  assert.doesNotMatch(designSystem, /56px vertical padding|120px rhythm/);
});

test("sections omit horizontal dividers while preserving vertical rhythm", () => {
  const sectionClassName =
    designSystem.match(/const sectionClassName =\s*"([^"]+)"/)?.[1] ?? "";

  assert.equal(
    sectionClassName,
    "grid min-w-0 gap-8 py-14 md:grid-cols-[minmax(150px,0.32fr)_minmax(0,1fr)] md:gap-16 md:py-20",
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
    /grid-cols-4[^"]*min-\[821px\]:grid-cols-12/,
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
    assert.match(surface, /\bmin-\[821px\]:py-16\b/);
    assert.doesNotMatch(surface, /\bp-4\b/);
    assert.doesNotMatch(surface, /(?:^|\s)py-16(?:\s|$)/);
  }
});

test("visible layout specimens share the tooltip card radius", () => {
  assert.match(
    designSystem,
    /@container relative mt-5 w-full min-w-0 max-w-full overflow-hidden rounded-\[11px\] bg-surface-muted/,
  );
  assert.match(
    designSystem,
    /px-\[clamp\(20px,6cqw,96px\)\] py-8 sm:py-12/,
  );
  assert.match(
    designSystem,
    /min-h-28 items-center justify-center rounded-\[11px\] bg-white[\s\S]*sm:min-h-40/,
  );
  assert.match(
    designSystem,
    /layoutColumns\.map\(\(column\) => \([\s\S]*aspect-square items-center justify-center rounded-\[11px\] bg-surface-muted[\s\S]*min-\[821px\]:aspect-\[3\/4\][\s\S]*\{column\}[\s\S]*\)\)/,
  );
  assert.match(
    designSystem,
    /min-h-20 rounded-\[11px\] bg-ink[\s\S]*min-h-20 rounded-\[11px\] bg-surface-muted/,
  );
});

test("layout spacing-scale bars use the smaller radius", () => {
  assert.match(
    designSystem,
    /className=\{`\$\{space\.className\} h-3 rounded-sm bg-gray-300`\}/,
  );
  assert.doesNotMatch(
    designSystem,
    /className=\{`\$\{space\.className\} h-3 rounded-\[11px\] bg-(?:ink|gray-300)`\}/,
  );
});

test("borders, strokes, and shadows are linked foundations sections", () => {
  for (const [label, id] of [
    ["borders", "borders"],
    ["strokes", "strokes"],
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
    /navClassName="design-system-navigation max-\[820px\]:hidden"/,
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
    ["large", "rounded-lg"],
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
  const strokesSection =
    designSystem.match(/<section\s+id="strokes"[\s\S]*?<\/section>/)?.[0] ?? "";
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
    6,
  );
  assert.equal(
    strokesSection.match(
      /<p className=\{specimenDescriptionClassName\}>/g,
    )?.length,
    3,
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
    /m-0 grid[^"]*grid-cols-2[^"]*lg:grid-cols-6/,
  );
  assert.equal(
    bordersSection.match(/size-20[^"]*bg-gray-200/g)?.length,
    6,
  );
  assert.equal(
    bordersSection.match(/<li className="grid justify-items-start gap-4">/g)
      ?.length,
    6,
  );
  assert.doesNotMatch(
    bordersSection,
    /size-20[^"]*\bborder\b/,
  );
  assert.doesNotMatch(bordersSection, /media-inset-edge/);
});

// Stroke edges are specimens of the production custom properties rather than
// re-spelled shadows, so the page cannot drift from what the covers paint.
test("the media inset edges are documented at their production weights", () => {
  const strokesSection =
    designSystem.match(/<section\s+id="strokes"[\s\S]*?<\/section>/)?.[0] ?? "";

  // Each specimen wears the production class, so the page paints whatever the
  // token paints and the three weights can be compared side by side.
  for (const [label, description, className] of [
    [
      "media inset edge",
      "2px · 5%",
      "media-inset-edge relative size-20 rounded-lg bg-white",
    ],
    [
      "media inset edge focused",
      "2px · 2%",
      "media-inset-edge-focused relative size-20 rounded-lg bg-white",
    ],
    [
      "media inset edge soft",
      "1px · 3%",
      "media-inset-edge-soft relative size-20 rounded-\\[20px\\] bg-white",
    ],
  ]) {
    assert.match(
      strokesSection,
      new RegExp(`<SpecimenLabel>${label}</SpecimenLabel>`),
    );
    assert.match(strokesSection, new RegExp(description));
    assert.match(strokesSection, new RegExp(`className="${className}"`));
  }

  assert.match(
    strokesSection,
    /className=\{`\$\{specimenClassName\} bg-surface-muted p-5 sm:p-8`\}/,
  );
  assert.doesNotMatch(strokesSection, /box-shadow|inset 0 0 0/);
  assert.match(styles, /--media-inset-edge:\s*inset 0 0 0 2px/);
  assert.match(styles, /--media-inset-edge-focused:\s*inset 0 0 0 2px/);
  assert.match(styles, /--media-inset-edge-soft:\s*inset 0 0 0 1px/);
});

test("shadow specimens use production elevation classes", () => {
  const shadowsSection =
    designSystem.match(/<section\s+id="shadows"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(shadowsSection, /shadow-none/);
  assert.match(
    shadowsSection,
    /media-inset-edge relative size-24 rounded-\[11px\] bg-white shadow-\[0_3px_10px_rgba\(0,0,0,0\.12\)\]/,
  );
  assert.match(shadowsSection, /shadow-lg/);
  assert.match(shadowsSection, /hover:shadow-xl/);
  assert.match(shadowsSection, /soft shadow \+ media inset edge/);
  assert.match(shadowsSection, /border only/);
  assert.match(shadowsSection, /team cards/);
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
    /<h1 className="[^"]*\bmax-\[820px\]:whitespace-normal\b[^"]*\bmin-\[821px\]:whitespace-nowrap\b[^"]*">\s*design system\s*<\/h1>/,
  );
  assert.doesNotMatch(
    designSystem,
    /<h1 className="[^"]*\bmax-w-\[[^"]*">/,
  );
  assert.doesNotMatch(designSystem, />\s*Mini design system\s*</);
});

test("the intro uses the homepage grid relationship without supporting copy", () => {
  // The reveal wrapper is the grid item, so the column spans live on it rather
  // than on the heading it wraps.
  assert.match(
    designSystem,
    /className="[^"]*\bgrid-cols-12\b[^"]*\bmax-\[820px\]:grid-cols-1\b[^"]*"[\s\S]*<ScrollReveal className="[^"]*\bcol-span-8\b[^"]*\bmax-\[820px\]:col-span-1\b[^"]*">/,
  );
  assert.doesNotMatch(
    designSystem,
    /The foundations behind the Design Meetup website/,
  );
  assert.doesNotMatch(
    designSystem,
    /same production components as the site/,
  );
  assert.doesNotMatch(
    designSystem,
    /col-start-9[^"]*col-span-4/,
  );
});

test("semantic color tokens back shared component styling", () => {
  for (const token of [
    "--color-ink",
    "--color-muted",
    "--color-subtle",
    "--color-surface",
    "--color-surface-muted",
    "--color-skeleton",
    "--color-accent-primary",
    "--color-accent-hover",
  ]) {
    assert.match(styles, new RegExp(token));
  }
  assert.doesNotMatch(styles, /--color-body/);

  assert.match(designSystem, /bg-ink/);
  assert.doesNotMatch(designSystem, /bg-body/);
  assert.match(designSystem, /bg-muted/);
  assert.match(designSystem, /bg-subtle/);
  assert.match(designSystem, /bg-white/);
  assert.match(designSystem, /className: "bg-surface"/);
  assert.match(designSystem, /bg-surface-muted/);
  assert.match(designSystem, /bg-skeleton/);
  assert.match(designSystem, /bg-accent-primary/);
  assert.match(designSystem, /bg-accent-hover/);
});

test("color swatches use gap-3 before tightly grouped copy", () => {
  assert.match(
    designSystem,
    /const colorItemClassName = "grid gap-3"/,
  );
  assert.match(
    designSystem,
    /semanticColors\.map\(\(color\) => \(\s*<div className=\{colorItemClassName\}/,
  );
  assert.match(
    designSystem,
    /className="m-0 mt-1 text-sm text-subtle"[\s\S]*\{color\.description\}/,
  );
  assert.equal(designSystem.match(/const semanticColors = \[/g)?.length, 1);
  assert.equal(
    [...designSystem.matchAll(/description: "/g)].length,
    9,
  );
});

test("semantic color swatches use a denser responsive grid", () => {
  const colorsSection =
    designSystem.match(/<section\s+id="colors"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(
    colorsSection,
    /className="grid[^"]*\bgrid-cols-3\b[^"]*\bgap-x-4\b[^"]*\bsm:grid-cols-3\b[^"]*\blg:grid-cols-5\b[^"]*"/,
  );
});

test("colors document only production Tailwind utility colors as small chips", () => {
  const colorsSection =
    designSystem.match(/<section\s+id="colors"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(colorsSection, />\s*tailwind neutrals\s*</);
  assert.match(designSystem, /const neutralColors = \[/);
  for (const shade of ["100", "200", "300", "400", "500"]) {
    assert.match(
      designSystem,
      new RegExp(`label: "gray-${shade}", className: "bg-gray-${shade}"`),
    );
  }
  assert.match(
    colorsSection,
    /neutralColors\.map\(\(color\) => \(\s*<li[\s\S]*size="chip"/,
  );
  assert.equal(
    [...designSystem.matchAll(/label: "gray-\d+"/g)].length,
    5,
  );
  assert.match(
    colorsSection,
    /grid-cols-2[^"]*sm:grid-cols-3[^"]*lg:grid-cols-5/,
  );
});

test("color swatches show hex in a tooltip and copy on click", () => {
  assert.match(designSystem, /function ColorSwatch\(/);
  assert.match(
    designSystem,
    /content=\{copied \? "Copied!" : hex\}/,
  );
  assert.match(
    designSystem,
    /await navigator\.clipboard\.writeText\(hex\)/,
  );
  assert.match(
    designSystem,
    /aria-label=\{`Copy \$\{label\} \$\{hex\}`\}/,
  );
  for (const hex of [
    "#121c26",
    "#6a7282",
    "#99a1af",
    "#ffffff",
    "#fcfdff",
    "#f3f4f6",
    "#e7e8eb",
    "#ecf26d",
    "#e3e95f",
    "#e5e7eb",
    "#d1d5dc",
  ]) {
    assert.match(designSystem, new RegExp(`hex: "${hex}"`));
  }
});

test("color swatches use the media inset edge on every chip", () => {
  assert.match(
    designSystem,
    /media-inset-edge relative border-0 p-0/,
  );
  assert.match(
    designSystem,
    /size === "card"\s*\?\s*"size-16 rounded-\[16px\] sm:size-20 sm:rounded-\[18px\] lg:size-28 lg:rounded-\[20px\]"/,
  );
});

test("the display specimen stays on one line without a narrow width cap", () => {
  assert.match(
    designSystem,
    /<p className="[^"]*\bwhitespace-normal\b[^"]*\bmin-\[821px\]:whitespace-nowrap\b[^"]*">\s*Growth happens together\.\s*<\/p>/,
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
    /id="links"\s+className=\{`\$\{sectionClassName\} md:items-end`\}\s+aria-labelledby="links-title"/,
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
    /const linksSpecimenClassName =\s*"flex flex-wrap items-center gap-6 rounded-\[11px\] bg-white"/,
  );
  assert.doesNotMatch(
    designSystem.match(
      /const linksSpecimenClassName =\s*"([^"]*)"/,
    )?.[1] ?? "",
    /\b(?:p|py|min-h)-/,
  );
  assert.match(
    designSystem,
    /className=\{`\$\{specimenClassName\} items-start gap-8 bg-surface-muted px-5 py-4\.5 sm:grid sm:grid-cols-2 sm:items-start sm:px-8 sm:py-7\.5`\}/,
  );
});

test("responsive gutter content surface is white rather than cream", () => {
  const gutterContentClassName =
    designSystem.match(
      /px-\[clamp\(20px,6cqw,96px\)\] py-8 sm:py-12">\s*<div className="([^"]*)">\s*Content/,
    )?.[1] ?? "";

  assert.match(gutterContentClassName, /\bbg-white\b/);
  assert.doesNotMatch(gutterContentClassName, /\bbg-surface(?:-muted)?\b/);
});

test("responsive gutter specimen is resizable with container-relative clamp", () => {
  assert.match(designSystem, /px-\[clamp\(20px,6vw,96px\)\]/);
  assert.match(designSystem, /px-\[clamp\(20px,6cqw,96px\)\]/);
  assert.match(
    designSystem,
    /aria-label="Resizable page gutter demonstration"/,
  );
  assert.match(designSystem, /function GutterResizeDemo\(/);
  assert.match(
    designSystem,
    /aria-label="Drag to resize gutter demonstration"/,
  );
  assert.match(designSystem, /cursor-col-resize/);
  assert.doesNotMatch(designSystem, /\bresize-x\b/);
  assert.match(designSystem, /@container/);
  assert.match(designSystem, /\bpy-12\b[\s\S]*\bmin-h-40\b/);
  assert.match(designSystem, /Math\.min\(\s*max,/);
  assert.match(designSystem, /GUTTER_DEMO_MIN_WIDTH_PX/);
  assert.match(
    designSystem,
    /function GutterResizeHandleIcon[\s\S]*?\bpr-2\b/,
  );
  assert.match(
    designSystem,
    /function GutterResizeHandleIcon[\s\S]*?\bh-3 w-\[2px\] /,
  );
  assert.doesNotMatch(
    designSystem,
    /Resize the frame to scrub width/,
  );
  assert.doesNotMatch(
    designSystem,
    /specimen mirrors that clamp/,
  );
});

test("button states include disabled ghost, ink, and ghost icon buttons", () => {
  assert.match(
    designSystem,
    /<Primary variant="ghost" disabled>\s*Disabled\s*<\/Primary>\s*<Primary variant="ink" disabled>/,
  );
  assert.match(
    designSystem,
    /<IconButton aria-label="Disabled icon button" disabled>[\s\S]*<ArrowIcon \/>[\s\S]*<\/IconButton>/,
  );
  assert.match(
    designSystem,
    /<IconButton\s+aria-label="Disabled ghost icon button"\s+variant="ghost"\s+disabled\s*>[\s\S]*<ArrowIcon \/>[\s\S]*<\/IconButton>/,
  );
});

test("button variants include a ghost icon button specimen", () => {
  assert.match(
    designSystem,
    /<IconButton aria-label="Ghost icon button" variant="ghost">\s*<ArrowIcon \/>\s*<\/IconButton>/,
  );
});

test("tooltip specimen uses a centered SVG help icon", () => {
  assert.match(
    designSystem,
    /function HelpIcon\(\{ className = "size-5" \}[\s\S]*<svg className=\{className\}[\s\S]*aria-hidden="true"/,
  );
  assert.match(
    designSystem,
    /function HelpIcon[\s\S]*?strokeWidth="2"/,
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

test("tooltips card stacks the help specimen and optically aligns icon glyphs", () => {
  const tooltipsSection =
    designSystem.match(/<section\s+id="tooltips"[\s\S]*?<\/section>/)?.[0] ??
    "";

  assert.match(tooltipsSection, /sm:grid-cols-2/);
  // Help glyph sits inset in the size-9 button; pull farther left than the
  // social row so the "?" optically lines up with the caption.
  assert.match(tooltipsSection, /-ml-4 w-fit/);
  assert.match(tooltipsSection, /-ml-2 flex w-fit items-center gap-2/);
  assert.match(
    tooltipsSection,
    /Tooltips add context on hover or focus\./,
  );
  assert.doesNotMatch(tooltipsSection, /replace a\s*label/);
  for (const label of ["Substack", "Instagram", "LinkedIn", "X"]) {
    assert.match(
      tooltipsSection,
      new RegExp(`<Tooltip content="${label}">`),
    );
  }
  assert.match(
    tooltipsSection,
    /Adjacent icon buttons each own a tooltip/,
  );
  assert.doesNotMatch(tooltipsSection, /footer contact icons/);
  // Same brand hover treatment as SiteFooter social icons.
  assert.match(
    tooltipsSection,
    /<SubstackIcon[\s\S]*?group-hover:text-\[#FF6719\][\s\S]*?group-focus-visible:text-\[#FF6719\]/,
  );
  assert.match(tooltipsSection, /<InstagramIcon\s+branded/);
  assert.match(
    tooltipsSection,
    /group-hover:opacity-0[\s\S]*?<InstagramIcon\s+branded[\s\S]*?group-hover:opacity-100/,
  );
  assert.match(
    tooltipsSection,
    /<LinkedInIcon[\s\S]*?group-hover:text-\[#0A66C2\][\s\S]*?group-focus-visible:text-\[#0A66C2\]/,
  );
  assert.match(
    tooltipsSection,
    /<XIcon[\s\S]*?group-hover:text-ink[\s\S]*?group-focus-visible:text-ink/,
  );
});

test("icons section is omitted from the design system page", () => {
  assert.doesNotMatch(designSystem, /<section\s+id="icons"/);
  assert.doesNotMatch(designSystem, /const designSystemIcons = \[/);
  assert.doesNotMatch(designSystem, /\{ id: "icons", label: "icons" \}/);
});

// The two pages link to each other, so an entrance on one and none on the
// other makes the crossing read as a jump. The design system page has nothing
// waiting on the reveal, so it takes the curtain without a done callback.
test("the design system page opens with the same entrance as the home page", () => {
  assert.match(
    designSystem,
    /import \{ PageLoader \} from "\.\/components\/PageLoader"/,
  );
  assert.match(designSystem, /<PageLoader \/>/);
  assert.match(designSystem, /<main className="[^"]*\bbg-surface\b/);
  assert.match(designSystem, /<SiteHeader[\s\S]*?\breveal\b[\s\S]*?\/>/);
  assert.match(
    designSystem,
    /import \{ ScrollReveal \} from "\.\/components\/ScrollReveal"/,
  );
});

test("design system header logo links home and sections have sub-nav anchors", () => {
  assert.match(designSystem, /import \{ SiteHeader \} from "\.\/components\/SiteHeader"/);
  assert.match(
    designSystem,
    /<SiteHeader[\s\S]*homeHref="\/"[\s\S]*navAriaLabel="Design system sections"[\s\S]*navClassName="design-system-navigation max-\[820px\]:hidden"/,
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
    ["strokes", "strokes"],
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

test("design system page reuses the shared footer with a home logo link", () => {
  assert.match(
    designSystem,
    /import \{ SiteFooter \} from "\.\/components\/SiteFooter"/,
  );
  assert.match(
    designSystem,
    /<SiteFooter\s+logoHref="\/"\s+logoAriaLabel="Design Meetup home"\s+hideDesignSystemPromo\s+\/>/,
  );
});
