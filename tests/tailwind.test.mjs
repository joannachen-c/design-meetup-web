import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
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
  assert.doesNotMatch(
    css
      .replace(/@font-face\s*\{[^}]*\}/gs, "")
      .replace(/::selection\s*\{[^}]*\}/gs, ""),
    /^\s*(?:padding(?:-(?:top|right|bottom|left|block|inline))?|border-radius|color|background(?:-color)?|font-size|font-weight|line-height|letter-spacing|text-align|text-decoration|text-transform|text-wrap)\s*:/m,
  );
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
