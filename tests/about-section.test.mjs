import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

const aboutSection =
  app.match(/<section\s+className="[^"]*about-section[\s\S]*?<\/section>/)?.[0] ?? "";

test("about section appears immediately before the partner section", () => {
  assert.match(
    app,
    /<section[\s\S]*className="[^"]*\babout-section\b[^"]*"[\s\S]*id="about"[\s\S]*>\s*[\s\S]*>\s*About\s*<\/h2>[\s\S]*<\/section>\s*<section[\s\S]*className="[^"]*\bpartner-cta\b/,
  );
});

test("about section introduces the community and how it grew", () => {
  for (const copy of [
    "We are a community of the world’s most ambitious creatives.",
    "In December 2025, Design Meetup was just an idea. A month later, we hosted our first event with 50 designers. And now, we’ve brought together 10,000+ people across 30 events in NY, LA, and the Bay Area.",
  ]) {
    assert.ok(app.includes(copy), `expected about section to include “${copy}”`);
  }
});

test("about section follows the shared responsive layout conventions", () => {
  assert.match(
    app,
    /about-section[^"]*px-\[clamp\(20px,6vw,96px\)\][^"]*pt-\[160px\][^"]*pb-\[80px\][^"]*max-\[820px\]:pt-\[80px\][^"]*max-\[820px\]:pb-\[40px\]/,
  );
  assert.match(app, /className="about-grid"/);
  assert.match(
    css,
    /\.about-grid\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/s,
  );
  // The copy row spans the full width and splits internally, so the lede lands
  // in the same four columns the partner logo grid occupies.
  assert.match(css, /\.about-copy\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s);
  assert.match(
    css,
    /\.about-copy\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/s,
  );
  assert.match(css, /\.about-copy > h2\s*\{[^}]*grid-column:\s*1\s*\/\s*span 8;/s);
  assert.match(css, /\.about-lede\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;/s);
  assert.match(css, /\.partner-logos\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;/s);
  assert.match(css, /\.about-image\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s);
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.about-grid\s*\{[^}]*grid-template-columns:\s*1fr/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.about-copy > h2,\s*\.about-lede\s*\{[^}]*grid-column:\s*1;/s,
  );
});

test("about media runs full width below the copy", () => {
  const media =
    app.match(/<div className="about-image min-w-0"[\s\S]*?<\/ScrollReveal>/)?.[0] ?? "";
  // Matches the Mux asset's native 1920x1080 so nothing gets cropped.
  assert.match(media, /aspect-\[16\/9\][\s\S]*w-full[\s\S]*rounded-\[20px\]/);
  assert.match(
    css,
    /\.about-image\s*\{[^}]*margin-top:\s*clamp\(56px,\s*6vw,\s*104px\);/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.about-image\s*\{[^}]*margin-top:\s*72px;/s,
  );
});

test("about section carries only its heading, copy, and photo", () => {
  for (const removed of [
    "about-offerings",
    "team-groups",
    "team-filter-control",
    "team-polaroid",
    "team-row",
    "Ways to join Design Meetup",
    "Website team!",
  ]) {
    assert.ok(
      !aboutSection.includes(removed),
      `expected the about section to have dropped “${removed}”`,
    );
    assert.ok(
      !css.includes(`.${removed}`),
      `expected the stylesheet to have dropped “.${removed}”`,
    );
  }
});

test("the team roster and offerings data are gone with their markup", () => {
  for (const symbol of [
    "aboutOfferings",
    "teamGroups",
    "websiteTeam",
    "TeamCard",
    "TeamMember",
    "isWebsiteTeamVisible",
  ]) {
    assert.doesNotMatch(
      app,
      new RegExp(`\\b${symbol}\\b`),
      `expected ${symbol} to be removed`,
    );
  }
});
