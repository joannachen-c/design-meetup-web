import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("Figma partner section appears immediately before the founders note and footer", () => {
  assert.match(
    app,
    /<section[\s\S]*className="[^"]*\bpartner-cta\b[^"]*"[\s\S]*Partner with us[\s\S]*<PartnerContactForm \/>[\s\S]*<\/section>\s*<FoundersNote \/>\s*<footer\b/,
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
    /\.partner-logo--cursor\s*\{[^}]*width:\s*max\(66px,\s*65\.35%\);[^}]*height:\s*max\(90px,\s*89\.11%\);/s,
  );
  assert.match(css, /\.partner-logo--tiktok\s*\{[^}]*width:\s*max\(72px,\s*71\.29%\);/s);
  assert.match(css, /\.partner-logo--google\s*\{[^}]*width:\s*max\(54px,\s*53\.47%\);/s);
  assert.match(css, /\.partner-logo--apple\s*\{[^}]*width:\s*max\(54px,\s*53\.47%\);/s);
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
    /\.partner-grid\s*\{[^}]*width:\s*100%;[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*gap:\s*clamp\(20px,\s*2vw,\s*44px\)/s,
  );
  assert.doesNotMatch(css, /\.partner-grid\s*\{[^}]*max-width:/s);
  assert.match(
    css,
    /\.partner-tile\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto;[^}]*aspect-ratio:\s*1;/s,
  );
  // Shares the muted surface token with inputs and chips instead of a one-off
  // hex, so every resting gray surface tracks the same value.
  assert.match(app, /partner-tile rounded-\[10px\] bg-surface-muted/);
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.partner-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
  );
});

test("partner content aligns to the shared twelve-column grid", () => {
  assert.match(
    css,
    /\.partner-cta\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/s,
  );
  assert.match(css, /\.partner-copy\s*\{[^}]*grid-column:\s*1\s*\/\s*span 7;/s);
  assert.match(css, /\.partner-logos\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;/s);
});

test("partner copy sits vertically centered against the logo grid", () => {
  assert.match(css, /\.partner-copy\s*\{[^}]*justify-content:\s*center;/s);
});

test("partner CTA uses generous vertical padding without changing horizontal padding", () => {
  assert.match(app, /partner-cta[^"]*px-\[clamp\(20px,6vw,96px\)\]/);
  assert.match(app, /partner-cta[^"]*py-\[160px\]/);
  assert.match(app, /partner-cta[^"]*max-\[820px\]:py-\[80px\]/);
  assert.doesNotMatch(css, /\.partner-cta\s*\{[^}]*padding(?:-block)?:/s);
});

// The form's own sentence already explains the ask, so a description above it
// only repeated "interested in".
test("partner heading leads straight into the contact form", () => {
  assert.match(app, /Partner with us\s*<\/h2>\s*<PartnerContactForm \/>/);
  assert.doesNotMatch(app, /love to chat/);
});
