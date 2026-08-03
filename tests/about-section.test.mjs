import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("about section appears immediately before the partner section", () => {
  assert.match(
    app,
    /<section[\s\S]*className="[^"]*\babout-section\b[^"]*"[\s\S]*id="about"[\s\S]*>\s*[\s\S]*ABOUT[\s\S]*<\/section>\s*<section[\s\S]*className="[^"]*\bpartner-cta\b/,
  );
});

test("about section introduces the community and lists every team member", () => {
  for (const copy of [
    "We are a community of the world’s most ambitious creatives.",
    "We bring together those who aspire to take their craft seriously while forming meaningful connections.",
    "Founders",
    "Ilyssa Yan",
    "Brandon Lee",
    "Directors, Event & Partnerships",
    "Joanna Chen",
    "Michelle Liu",
    "Graphics Leads",
    "Matthew Hope",
    "Yufei Wang",
    "Internal Community Lead",
    "Emily Shen",
  ]) {
    assert.ok(app.includes(copy), `expected about section to include “${copy}”`);
  }
});

test("about section follows the shared responsive layout conventions", () => {
  assert.match(
    app,
    /about-section[^"]*px-\[clamp\(20px,6vw,96px\)\][^"]*py-\[120px\][^"]*max-\[820px\]:py-36/,
  );
  assert.match(app, /className="about-grid"/);
  assert.match(
    css,
    /\.about-grid\s*\{[^}]*grid-template-columns:\s*minmax\(280px,\s*0\.64fr\)\s+minmax\(0,\s*1\.36fr\)/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.about-grid\s*\{[^}]*grid-template-columns:\s*1fr/s,
  );
});

test("verified team members link to LinkedIn from polaroid portrait cards", () => {
  for (const [name, linkedin] of [
    ["Ilyssa Yan", "https://www.linkedin.com/in/ilyssayan"],
    ["Brandon Lee", "https://www.linkedin.com/in/brandonjoshlee"],
    ["Joanna Chen", "https://www.linkedin.com/in/joannachen1014/"],
    ["Michelle Liu", "https://www.linkedin.com/in/michelletliu"],
    ["Emily Shen", "https://www.linkedin.com/in/emilyshenucla"],
    ["Matthew Hope", "https://www.linkedin.com/in/matthewhope1"],
    ["Yufei Wang", "https://www.linkedin.com/in/yufei-wang-5b1138253/"],
  ]) {
    assert.ok(app.includes(`name: "${name}"`));
    assert.ok(app.includes(`linkedin: "${linkedin}"`));
  }

  assert.match(app, /className="team-polaroid/);
  assert.match(app, /target="_blank"/);
  assert.match(app, /rel="noreferrer"/);
  assert.match(app, /alt=\{`\$\{member\.name\} portrait`\}/);
});

test("team cards use local portraits for every team member", () => {
  for (const slug of [
    "ilyssa-yan",
    "brandon-lee",
    "joanna-chen",
    "michelle-liu",
    "emily-shen",
    "matthew-hope",
    "yufei-wang",
  ]) {
    assert.ok(app.includes(`/team/${slug}.`), `expected local portrait for ${slug}`);
  }

  assert.match(
    app,
    /name: "Joanna Chen",[\s\S]*linkedin: "https:\/\/www\.linkedin\.com\/in\/joannachen1014\/",[\s\S]*image: "\/team\/joanna-chen\.jpg"/,
  );
  assert.match(
    app,
    /name: "Yufei Wang",[\s\S]*linkedin: "https:\/\/www\.linkedin\.com\/in\/yufei-wang-5b1138253\/",[\s\S]*image: "\/team\/yufei-wang\.jpg"/,
  );
  assert.doesNotMatch(
    app,
    /name: "Joanna Chen",[\s\S]*?initials: "JC"/,
  );
  assert.doesNotMatch(
    app,
    /name: "Yufei Wang",[\s\S]*?initials: "YW"/,
  );
});

test("community photo and four position labels sit outside the smaller polaroids", () => {
  assert.match(
    app,
    /src="\/about\/design-meetup-community\.jpg"[\s\S]*alt="Design Meetup community gathering around tables to make and connect"/,
  );
  assert.match(
    app,
    /className="[^"]*w-full[^"]*rounded-\[11px\][^"]*"/,
  );
  assert.equal((app.match(/className="team-row"/g) ?? []).length, 1);
  assert.match(app, /teamGroups\.map\(\(group\) =>/);
  assert.match(
    app,
    /<dt[\s\S]*className=\{`mb-4 text-base uppercase text-gray-400/,
  );
  assert.doesNotMatch(
    app.match(/function TeamCard[\s\S]*?\n\}/)?.[0] ?? "",
    /member\.role/,
  );
  assert.match(app, /team-polaroid[^"]*w-\[clamp\(108px,9vw,132px\)\]/);
});

test("polaroids use neutral frames and visibly clip rounded inner portraits", () => {
  assert.doesNotMatch(css, /--radius-surface:/);
  assert.match(
    app,
    /team-polaroid[^"]*rounded-md[^"]*bg-white[^"]*shadow-lg/,
  );
  assert.equal(
    (app.match(/team-polaroid[^"]*\bborder\b[^"]*\bborder-gray-100\b/g) ?? [])
      .length,
    2,
  );
  assert.equal((app.match(/team-polaroid[^"]*\bshadow-lg\b/g) ?? []).length, 2);
  assert.equal(
    (app.match(/team-polaroid[^"]*\bhover:shadow-xl\b/g) ?? []).length,
    2,
  );
  assert.doesNotMatch(app, /shadow-\[0_5px_14px_rgba\(20,25,35,0\.18\)\]/);
  assert.match(
    app,
    /aspect-square[^"]*overflow-hidden[^"]*rounded-sm/,
  );
  assert.match(
    app,
    /<img[\s\S]*className="[^"]*size-full[^"]*rounded-sm[^"]*object-cover[^"]*"/,
  );
  assert.match(
    css,
    /\.team-polaroid\s*\{[^}]*transition:\s*transform 160ms ease-out,\s*box-shadow 160ms ease-out/s,
  );
  assert.match(
    css,
    /@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*\.team-polaroid:hover\s*\{[^}]*transform:\s*rotate\(-1deg\)/s,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*\.team-polaroid\s*\{[^}]*transition:\s*none[\s\S]*\.team-polaroid:hover\s*\{[^}]*transform:\s*none/s,
  );
});

test("polaroid names and frames use compact Tailwind spacing helpers", () => {
  assert.match(app, /className="mt-1\.5 block text-sm font-bold/);
  assert.equal((app.match(/team-polaroid[^"]*\bp-2\b[^"]*\bpb-3\.5\b/g) ?? []).length, 2);
  assert.doesNotMatch(app, /className="mt-2 block text-sm font-bold/);
  assert.doesNotMatch(app, /className="mt-3 block text-sm/);
  assert.doesNotMatch(app, /team-polaroid[^"]*\bpb-4\b/);
});

test("team groups fill the row on desktop and reflow without overflow", () => {
  assert.match(app, /className="team-groups/);
  assert.match(
    css,
    /\.team-groups\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(4,\s*max-content\);[^}]*justify-content:\s*space-between/s,
  );
  assert.match(
    css,
    /@media \(max-width: 1023px\)[\s\S]*\.team-groups\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*max-content\);[^}]*justify-content:\s*space-between/s,
  );
  assert.match(
    css,
    /@media \(max-width: 600px\)[\s\S]*\.team-groups\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*justify-content:\s*stretch/s,
  );
  assert.doesNotMatch(css, /\.team-groups\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(
    app,
    /role: "Founders"[\s\S]*role: "Directors, Event \& Partnerships"[\s\S]*role: "Graphics Leads"[\s\S]*role: "Internal Community Lead"/
  );
});

test("website team view is conditional, centered, and dims non-members", () => {
  assert.match(
    app,
    /const websiteTeam = new Set\(\["Ilyssa Yan", "Brandon Lee", "Joanna Chen", "Michelle Liu"\]\)/,
  );
  assert.match(
    app,
    /useState\(false\)[\s\S]*team-filter-control[\s\S]*isWebsiteTeamVisible\s*\?\s*\(/,
  );
  assert.match(
    app,
    /<Primary[\s\S]*variant="ghost"[\s\S]*WEBSITE TEAM![\s\S]*<\/Primary>[\s\S]*<dl className="team-groups/,
  );
  assert.match(
    app,
    /className="[^"]*team-filter-control[^"]*\bjustify-start\b[^"]*"/,
  );
  assert.match(
    css,
    /\.team-filter-control\s*\{[^}]*min-height:\s*clamp\(48px,\s*7vw,\s*96px\);[^}]*align-items:\s*center;/s,
  );
  assert.match(app, /<Primary[^>]*className="-ml-4 mt-2"/);
  assert.match(app, /onClick=\{\(\) => setIsWebsiteTeamVisible\(false\)\}/);
  assert.match(
    app,
    /isWebsiteTeamVisible\s*&&\s*!websiteTeam\.has\(member\.name\)/,
  );
  assert.match(
    app,
    /group\.members\.some\(\(member\) =>\s*websiteTeam\.has\(member\.name\),?\s*\)/,
  );
  assert.match(app, /opacity-50/);
  assert.doesNotMatch(
    app.match(
      /<section\s+className="[^"]*about-section[\s\S]*?<\/section>/,
    )?.[0] ?? "",
    /pointer-events-none|opacity-0/,
  );
});

test("about section places the three Figma offering columns above the team", async () => {
  for (const [title, description, icon] of [
    [
      "In-person events",
      "Think speaker panels, workshops, talks, and meetups at cafes and co-working venues to meet new design friends.",
      "in-person-events.svg",
    ],
    [
      "Monthly newsletter",
      "Get curated events, opportunities, and designers to watch and candid takes about craft and taste.",
      "monthly-newsletter.svg",
    ],
    [
      "Online community",
      "Meet new design friends, get feedback on your portfolio or side projects, and learn about exclusive opportunities.",
      "online-community.svg",
    ],
  ]) {
    assert.ok(app.includes(title));
    assert.ok(app.includes(description));
    assert.ok(app.includes(`/about/${icon}`));
    await access(new URL(`../public/about/${icon}`, import.meta.url));
  }

  assert.match(
    app,
    /<ul\s+className="about-offerings[\s\S]*<\/ul>[\s\S]*team-filter-control[\s\S]*<dl className="team-groups/,
  );
  assert.match(app, /className="size-\[18px\][^"]*"[\s\S]*width=\{18\}[\s\S]*height=\{18\}/);
  assert.match(app, /<li className="min-w-0 flex flex-col gap-3"/);
  assert.match(
    app,
    /<h3 className="[^"]*\btext-lg\b[^"]*\bfont-bold\b[^"]*">/,
  );
  assert.match(
    app,
    /<p className="[^"]*\btext-base\b[^"]*text-\[#727272\][^"]*">/,
  );
  assert.match(
    css,
    /\.about-offerings\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*321px\)\);[^}]*justify-content:\s*space-between;/s,
  );
});
