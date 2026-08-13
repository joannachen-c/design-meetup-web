import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("Figma partner section appears immediately before the founders note, apply CTA, and footer", () => {
  assert.match(
    app,
    /<section[\s\S]*className="[^"]*\bpartner-cta\b[^"]*"[\s\S]*Partner with us[\s\S]*<PartnerContactForm \/>[\s\S]*<\/section>\s*<FoundersNote \/>\s*<section[\s\S]*className="[^"]*\bapply-cta\b[^"]*"[\s\S]*<\/section>\s*<PhotoMarquee events=\{events\} \/>\s*<SiteFooter \/>/,
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
    /\.partner-logo\s*\{[^}]*width:\s*max\(var\(--partner-logo-min-width\),\s*var\(--partner-logo-width\)\);[^}]*height:\s*max\(var\(--partner-logo-min-height\),\s*var\(--partner-logo-height\)\);[^}]*object-fit:\s*contain;/s,
  );
  assert.match(css, /\.partner-logo--figma\s*\{[^}]*--partner-logo-min-width:\s*31px;[^}]*--partner-logo-min-height:\s*46px;/s);
  assert.match(css, /\.partner-logo--notion\s*\{[^}]*--partner-logo-min-width:\s*45px;[^}]*--partner-logo-min-height:\s*45px;/s);
  assert.match(css, /\.partner-logo--tiktok\s*\{[^}]*--partner-logo-min-width:\s*87px;[^}]*--partner-logo-min-height:\s*49px;/s);
  assert.match(css, /\.partner-logo--framer\s*\{[^}]*--partner-logo-min-width:\s*48px;[^}]*--partner-logo-min-height:\s*48px;/s);
  assert.match(css, /\.partner-logo--google\s*\{[^}]*--partner-logo-min-width:\s*43px;[^}]*--partner-logo-min-height:\s*43px;/s);
  assert.match(css, /\.partner-logo--rainbow\s*\{[^}]*--partner-logo-min-width:\s*51px;[^}]*--partner-logo-min-height:\s*45px;/s);
  assert.match(
    css,
    /\.partner-logo--ramp\s*\{[^}]*transform:\s*translateX\(-2px\);/s,
  );
  assert.match(
    css,
    /\.partner-logo--framer\s*\{[^}]*transform:\s*translateY\(2px\);/s,
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
  // On mobile the capped grid sits centred in the column instead of flush left.
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.partner-grid\s*\{[^}]*margin-inline:\s*auto;/s,
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

test("mobile stacks the form over the logos with a doubled row gap", () => {
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.partner-cta\s*\{[^}]*row-gap:\s*96px;/s,
  );
});

test("partner copy sits vertically centered against the logo grid", () => {
  assert.match(css, /\.partner-copy\s*\{[^}]*justify-content:\s*center;/s);
});

test("partner CTA uses generous vertical padding without changing horizontal padding", () => {
  assert.match(app, /partner-cta[^"]*px-\[clamp\(20px,6vw,96px\)\]/);
  assert.match(app, /partner-cta[^"]*py-\[200px\]/);
  assert.match(app, /partner-cta[^"]*max-\[820px\]:py-\[96px\]/);
  assert.doesNotMatch(css, /\.partner-cta\s*\{[^}]*padding(?:-block)?:/s);
});

// The form's own sentence already explains the ask, so a description above it
// only repeated "interested in".
test("partner heading leads straight into the contact form", () => {
  assert.match(app, /Partner with us\s*<\/h2>\s*<PartnerContactForm \/>/);
  assert.doesNotMatch(app, /love to chat/);
});
