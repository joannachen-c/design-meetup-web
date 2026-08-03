import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("Figma partner section appears immediately before the footer", () => {
  assert.match(
    app,
    /<section[\s\S]*className="[^"]*\bpartner-cta\b[^"]*"[\s\S]*WE’VE WORKED WITH[\s\S]*Reach out[\s\S]*<\/section>\s*<footer\b/,
  );
  assert.match(app, /className="[^"]*\bpartner-grid\b[^"]*"/);
  assert.match(app, /\/partners\/figma\.png/);
  assert.match(app, /\/partners\/google\.png/);
});

test("Alte Haas Grotesk local fonts are wired globally", async () => {
  assert.match(css, /@font-face\s*\{[^}]*font-family:\s*"Alte Haas Grotesk";[^}]*font-weight:\s*400;[^}]*font-display:\s*swap;/s);
  assert.match(css, /@font-face\s*\{[^}]*font-family:\s*"Alte Haas Grotesk";[^}]*font-weight:\s*700;[^}]*font-display:\s*swap;/s);
  assert.match(
    app,
    /font-\['Alte_Haas_Grotesk',sans-serif\]/,
  );
  assert.match(css, /@import "tailwindcss";/);
  assert.doesNotMatch(css, /fonts\.googleapis\.com|Manrope/);
  await access(
    new URL("../public/fonts/AlteHaasGroteskRegular.ttf", import.meta.url),
  );
  await access(
    new URL("../public/fonts/AlteHaasGroteskBold.ttf", import.meta.url),
  );
});

test("partner logos use stable optical adjustment hooks", () => {
  for (const slug of [
    "figma",
    "cursor",
    "notion",
    "ramp",
    "apple",
    "tiktok",
    "framer",
    "google",
    "rainbow",
  ]) {
    assert.match(app, new RegExp(`partner-logo--\\$\\{partner\\.slug\\}`));
    assert.match(app, new RegExp(`slug: "${slug}"`));
  }
  assert.match(
    css,
    /\.partner-logo--cursor\s*\{[^}]*width:\s*66px;[^}]*height:\s*90px;/s,
  );
  assert.match(css, /\.partner-logo--tiktok\s*\{[^}]*width:\s*72px;/s);
  assert.match(css, /\.partner-logo--google\s*\{[^}]*width:\s*54px;/s);
  assert.match(css, /\.partner-logo--apple\s*\{[^}]*width:\s*54px;/s);
  assert.match(
    css,
    /\.partner-logo--ramp\s*\{[^}]*transform:\s*translateX\(-2px\);/s,
  );
  assert.match(
    css,
    /\.partner-logo--framer\s*\{[^}]*transform:\s*translateY\(5px\);/s,
  );
});

test("partner logo tiles preserve Figma geometry responsively", () => {
  assert.match(
    css,
    /\.partner-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*101px\)/s,
  );
  assert.match(
    css,
    /\.partner-tile\s*\{[^}]*width:\s*101px;[^}]*height:\s*101px;/s,
  );
  assert.match(app, /partner-tile rounded-lg bg-\[#f5f5f5\]/);
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.partner-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
  );
});

test("partner CTA uses generous vertical padding without changing horizontal padding", () => {
  assert.match(app, /partner-cta[^"]*px-\[clamp\(20px,6vw,96px\)\]/);
  assert.match(app, /partner-cta[^"]*py-\[120px\]/);
  assert.match(app, /partner-cta[^"]*max-\[820px\]:py-36/);
  assert.doesNotMatch(css, /\.partner-cta\s*\{[^}]*padding(?:-block)?:/s);
});

test("partner description uses the shared base text size", () => {
  assert.match(
    app,
    /<p className="[^"]*\btext-base\b[^"]*">\s*We’d love to chat if you’re interested in partnering with us\./,
  );
});
