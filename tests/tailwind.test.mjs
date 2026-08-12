import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const componentPaths = [
  "src/DesignSystem.tsx",
  ...(await readdir(new URL("src/components/", root), { recursive: true }))
    .filter((entry) => entry.endsWith(".tsx"))
    .map((entry) => `src/components/${entry}`),
];
const app = await readFile(new URL("src/components/HomePage.tsx", root), "utf8");
const css = await readFile(new URL("app/globals.css", root), "utf8");
const layout = await readFile(new URL("app/layout.tsx", root), "utf8").catch(() => "");
const primary = await readFile(
  new URL("src/components/Primary.tsx", root),
  "utf8",
);
const packageJson = JSON.parse(
  await readFile(new URL("package.json", root), "utf8"),
);
const postcssConfig = await readFile(
  new URL("postcss.config.mjs", root),
  "utf8",
).catch(() => "");

test("Tailwind v4 is integrated through the Next PostCSS plugin", () => {
  assert.match(packageJson.dependencies.tailwindcss, /^\^4\./);
  assert.ok(
    packageJson.dependencies["@tailwindcss/postcss"] ||
      packageJson.devDependencies["@tailwindcss/postcss"],
  );
  assert.doesNotMatch(
    JSON.stringify(packageJson),
    /@tailwindcss\/vite/,
  );
  assert.match(postcssConfig, /@tailwindcss\/postcss/);
  assert.match(css, /@import ["']tailwindcss["']/);
  assert.match(layout, /globals\.css/);
});

test("the primary accent token colors buttons and text selection", () => {
  assert.match(css, /--color-accent-primary:\s*#ecf26d/);
  assert.match(
    css,
    /::selection\s*\{[^}]*background-color:\s*var\(--color-accent-primary\)/s,
  );
  assert.match(primary, /\bbg-accent-primary\b/);
});

test("requested style categories live in Tailwind utilities", () => {
  assert.match(app, /text-\[clamp\(/);
  assert.match(app, /px-\[clamp\(/);
  assert.match(app, /rounded-\[/);
  assert.match(app, /bg-\[#/);
  // A pseudo-element cannot carry a utility class, so tracking the radius its
  // owner sets in Tailwind is the one radius the stylesheet may declare: it
  // states no value of its own and so cannot drift from the utility.
  for (const [, value] of css.matchAll(/^\s*border-radius:\s*([^;]+);/gm)) {
    assert.equal(value, "inherit");
  }

  assert.doesNotMatch(
    css
      .replace(/@font-face\s*\{[^}]*\}/gs, "")
      .replace(/::selection\s*\{[^}]*\}/gs, "")
      .replace(/^\s*border-radius:\s*inherit;$/gm, "")
      // Gallery padding is tied to --rail-underhang in the stylesheet so the
      // focused cover's shadow and Luma hint can paint into the rail safely.
      .replace(/\.gallery\s*\{[\s\S]*?\n\}/g, "")
      // Slot keeps a line open under the cover for the Luma hint.
      .replace(/\.detail-cover-slot\s*\{[\s\S]*?\n\}/, ""),
    /^\s*(?:padding(?:-(?:top|right|bottom|left|block|inline))?|border-radius|color|background(?:-color)?|font-size|font-weight|line-height|letter-spacing|text-align|text-decoration|text-transform)\s*:/m,
  );
});

test("global text wrapping prevents typographic orphans", () => {
  assert.match(
    css,
    /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*text-wrap:\s*balance;/s,
  );
  assert.match(css, /p\s*\{[^}]*text-wrap:\s*pretty;/s);
});

test("design system colors are referenced by token, never re-spelled as literals", async () => {
  const theme = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  const tokens = [...theme.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map(
    ([, name, value]) => ({ name, value: value.trim() }),
  );
  assert.ok(tokens.length >= 8);

  const sources = await Promise.all(
    componentPaths.map((path) => readFile(new URL(path, root), "utf8")),
  );

  for (const { name, value } of tokens) {
    // Tailwind arbitrary values swap spaces for underscores, so check both forms.
    for (const spelling of [value, value.replace(/ /g, "_")]) {
      for (const [index, source] of sources.entries()) {
        assert.ok(
          !source.includes(spelling),
          `${componentPaths[index]} hardcodes ${spelling}; use the --color-${name} token utility instead`,
        );
      }
    }
  }
});

test("gray surfaces share the muted surface token", async () => {
  const sources = await Promise.all(
    componentPaths.map((path) => readFile(new URL(path, root), "utf8")),
  );
  const input = await readFile(new URL("src/components/Input.tsx", root), "utf8");

  // Inputs set the reference gray; tiles, chips and photo wells must match it
  // rather than drifting to a near-identical one-off like #f5f5f5.
  assert.match(input, /\bbg-surface-muted\b/);
  assert.match(app, /partner-tile[^"]*\bbg-surface-muted\b/);
  for (const [index, source] of sources.entries()) {
    assert.ok(
      !/-\[#(?:f5f5f5|f4f4f4|f2f2f2|fafafa|ececec|eee|e5e5e5)\b/i.test(source),
      `${componentPaths[index]} uses a one-off light gray; use bg-surface-muted or the gray-100..300 ramp`,
    );
  }
});

test("browser favicon uses the existing Design Meetup logo", async () => {
  assert.match(
    layout,
    /design-meetup-logo\.png/,
  );
  assert.doesNotMatch(layout, /vite\.svg/i);
  await access(new URL("public/design-meetup-logo.png", root));
});

test("only headings use the tight tracking value", () => {
  assert.doesNotMatch(
    app,
    /<main className="[^"]*tracking-\[-0\.06em\][^"]*"/,
  );
  const headings = [...app.matchAll(/<h[1-6][^>]*className="([^"]*)"/g)];
  assert.ok(headings.length > 0);
  assert.ok(
    headings.every(([, className]) =>
      className.includes("tracking-[-0.06em]"),
    ),
  );
  assert.doesNotMatch(app, /<p className="[^"]*tracking-\[-0\.06em\]/);
});
