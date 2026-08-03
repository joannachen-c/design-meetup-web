import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const primary = await readFile(
  new URL("../src/components/Primary.tsx", import.meta.url),
  "utf8",
);
const iconButton = await readFile(
  new URL("../src/components/IconButton.tsx", import.meta.url),
  "utf8",
);

const hasClass = (name) =>
  new RegExp(`className="[^"]*\\b${name}\\b[^"]*"`);

test("host names are split on supported separators and rendered as a list", () => {
  assert.match(app, /function parseHosts\(/);
  assert.match(app, /,\|&\|\\band\\b/);
  assert.match(app, hasClass("host-list"));
  assert.match(app, /hosts\.map\(\(host\)/);
});

test("header uses the Design Meetup logo image inside the home link", async () => {
  assert.match(app, hasClass("wordmark"));
  assert.match(app, /aria-label="Design Meetup home"/);
  assert.match(app, hasClass("wordmark-logo"));
  assert.match(app, /src="\/design-meetup-logo\.png"/);
  assert.match(app, /width=\{60\}/);
  assert.match(app, /height=\{60\}/);
  assert.match(app, /alt=""/);
  assert.doesNotMatch(
    app,
    /className="[^"]*\bwordmark\b[^"]*"[^>]*>\s*Design Meetup\s*</,
  );
  assert.match(
    css,
    /\.wordmark-logo\s*\{[^}]*width:\s*60px;[^}]*height:\s*auto;/s,
  );
  assert.match(app, /wordmark-logo border-0 outline-none/);
  await access(new URL("../public/design-meetup-logo.png", import.meta.url));
});

test("intro uses the partner heading style across eight of twelve columns", () => {
  assert.doesNotMatch(app, /Past gatherings · 2026/);
  assert.match(
    app,
    /<h1[^>]*id="page-title"[^>]*aria-label="For designers who believe growth happens together"[^>]*>[\s\S]*For designers who believe[\s\S]*growth happens together[\s\S]*<\/h1>/,
  );
  assert.match(
    css,
    /\.intro\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/s,
  );
  assert.match(css, /h1\s*\{[^}]*grid-column:\s*1\s*\/\s*span 8;/s);
  assert.match(
    app,
    /<h1[^>]*className="[^"]*text-\[clamp\(3rem,4\.7vw,3\.75rem\)\][^"]*font-bold[^"]*leading-\[1\.08\][^"]*text-black[^"]*"/,
  );
});

test("intro uses matched reduced block padding responsively", () => {
  assert.match(app, /px-\[clamp\(20px,6vw,96px\)\]/);
  assert.match(app, /py-\[clamp\(26px,4\.5vw,69px\)\]/);
  assert.match(app, /max-\[820px\]:py-8/);
  assert.match(app, /max-\[520px\]:py-\[23px\]/);
});

test("intro copy uses Tailwind text-base with its default line height", () => {
  assert.match(
    app,
    /className="[^"]*\bintro-copy\b[^"]*\btext-base\b[^"]*"/,
  );
  assert.doesNotMatch(
    app,
    /className="[^"]*\bintro-copy\b[^"]*\bleading-(?:normal|\[[^\]]+\])\b[^"]*"/,
  );
  assert.doesNotMatch(app, /className="[^"]*\bintro-copy\b[^"]*\btext-\[clamp\(/);
});

test("intro copy fills the remaining desktop grid columns", () => {
  assert.match(
    app,
    /className="[^"]*\bintro-copy\b[^"]*\bcol-start-9\b[^"]*\bcol-span-4\b[^"]*"/,
  );
  assert.doesNotMatch(css, /\.intro-copy\s*\{[^}]*max-width:/s);
});

test("gallery toolbar keeps only a normal-weight counter and borderless controls", () => {
  assert.doesNotMatch(app, /Scroll or use arrow keys/);
  assert.match(app, hasClass("counter-current"));
  assert.match(app, /counter-current font-normal/);
  assert.match(iconButton, /bg-surface-muted/);
  assert.match(iconButton, /hover:not-disabled:bg-gray-300/);
  assert.match(iconButton, /rounded-full border-0/);
  assert.match(app, /aria-label="Previous event"/);
  assert.match(app, /aria-label="Next event"/);
  assert.match(app, /stroke="currentColor"/);
});

test("event details render the selected event gallery images from Supabase", () => {
  assert.match(app, /aria-labelledby="event-photos-title"/);
  assert.match(
    app,
    /<h3[^>]*id="event-photos-title"[^>]*>\s*Gallery\s*<\/h3>/,
  );
  assert.match(
    app,
    /className="mb-4 flex items-center justify-between"[\s\S]*id="event-photos-title"/,
  );
  assert.match(app, hasClass("detail-photo-list"));
  assert.match(app, /selectedEvent\?\.gallery_images/);
  assert.match(app, /selectedPhotos\.map\(\(photoUrl, photoIndex\)/);
  assert.doesNotMatch(app, /Array\.from\(\{ length: 3 \}/);
  assert.doesNotMatch(app, /selectedPhotos\.slice\(/);
});

test("event photos use an accessible horizontally scrollable rail", () => {
  assert.match(
    app,
    /className="[^"]*\bdetail-photo-list\b[^"]*\bw-screen\b[^"]*\btouch-pan-x\b[^"]*"[\s\S]*tabIndex=\{0\}[\s\S]*aria-label=\{`\$\{selectedEvent\.title\} gallery, horizontally scrollable`\}/,
  );
  assert.match(
    app,
    /`\$\{selectedEvent\.title\} event photo \$\{photoIndex \+ 1\} of \$\{selectedPhotos\.length\}`/,
  );
  assert.match(
    css,
    /\.detail-photo-list\s*\{[^}]*display:\s*flex;[^}]*overflow-x:\s*auto;[^}]*scroll-snap-type:\s*x mandatory;/s,
  );
  assert.match(
    css,
    /\.detail-photo-list li\s*\{[^}]*flex:\s*0 0 auto;/s,
  );
  assert.match(
    app,
    /detail-photo[^"]*h-\[clamp\(180px,52vw,260px\)\][^"]*w-auto[^"]*max-w-\[min\(82vw,640px\)\][^"]*object-contain[^"]*min-\[821px\]:h-\[clamp\(190px,15vw,200px\)\][^"]*min-\[821px\]:max-w-none/,
  );
});

test("selected event title uses the next heavier text weight", () => {
  assert.match(
    app,
    /<p[^>]*className="[^"]*\bfont-bold\b[^"]*"[^>]*id="selected-event-title"/,
  );
});

test("event photo controls scroll by a responsive increment and disable at boundaries", () => {
  assert.match(app, /const detailPhotoRailRef = useRef<HTMLUListElement \| null>\(null\)/);
  assert.match(app, /const \[canScrollPhotosLeft, setCanScrollPhotosLeft\] = useState\(false\)/);
  assert.match(app, /const \[canScrollPhotosRight, setCanScrollPhotosRight\] = useState\(false\)/);
  assert.match(app, /rail\.scrollBy\(\{[\s\S]*left:[\s\S]*behavior: reduceMotion \? "auto" : "smooth"/);
  assert.match(app, /rail\.scrollLeft > 1/);
  assert.match(app, /rail\.scrollLeft < rail\.scrollWidth - rail\.clientWidth - 1/);
  assert.match(app, /aria-label="Previous event photo"[\s\S]*aria-controls="event-photo-rail"[\s\S]*disabled=\{!canScrollPhotosLeft\}/);
  assert.match(app, /aria-label="Next event photo"[\s\S]*aria-controls="event-photo-rail"[\s\S]*disabled=\{!canScrollPhotosRight\}/);
  assert.match(app, /onLoad=\{\(\) => updatePhotoRailBoundsFromRef\(\)\}/);
});

test("event photo rail bleeds to viewport edges with aligned terminal spacing", () => {
  assert.match(
    app,
    /detail-photo-list[^"]*relative[^"]*left-1\/2[^"]*w-screen[^"]*-translate-x-1\/2[^"]*p-0/,
  );
  assert.match(
    css,
    /\.detail-photo-list\s*\{[^}]*--page-gutter:\s*clamp\(20px,\s*6vw,\s*96px\);[^}]*scroll-padding-inline:\s*var\(--page-gutter\);/s,
  );
  assert.match(
    css,
    /\.detail-photo-list::before,\s*\.detail-photo-list::after\s*\{[^}]*flex:\s*0 0 var\(--page-gutter\);[^}]*content:\s*"";/s,
  );
});

test("event photo gallery starts without extra top padding", () => {
  assert.match(
    app,
    /className="detail-extras pt-0"/,
  );
  assert.doesNotMatch(
    app,
    /className="detail-extras[^"]*(?:pt-\[clamp|max-\[820px\]:pt-)/,
  );
});

test("event details include sponsors as metadata in the definition list", () => {
  assert.match(
    app,
    /<dl[^>]*>[\s\S]*<dt[^>]*>\s*Sponsors\s*<\/dt>[\s\S]*className="[^"]*\bsponsor-placeholder\b[^"]*"[\s\S]*<\/dl>/,
  );
  assert.match(app, /Sponsor slot open/);
  assert.doesNotMatch(app, /className="detail-sponsors"/);
  assert.doesNotMatch(app, /event-sponsors-title/);
  assert.match(app, /sponsor-placeholder bg-transparent/);
});

test("sponsor logos use restrained Tailwind spacing", () => {
  assert.match(app, /className="sponsor-list m-0 gap-5 p-0"/);
  assert.doesNotMatch(css, /\.sponsor-list\s*\{[^}]*\bgap:/s);
});

test("event details begin closer to the selected event caption", () => {
  assert.match(app, /event-detail[^"]*pt-\[clamp\(20px,3vw,40px\)\]/);
});

test("event description shares the intro copy's four-column alignment", () => {
  assert.doesNotMatch(app, /className="detail-index"/);
  assert.doesNotMatch(app, /Event \{String\(selectedIndex/);
  assert.match(
    css,
    /\.detail-grid\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);[^}]*column-gap:\s*clamp\(16px,\s*2vw,\s*28px\);/s,
  );
  assert.match(
    css,
    /\.detail-grid > dl\s*\{[^}]*display:\s*grid;[^}]*grid-column:\s*1\s*\/\s*span 7;[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*grid-row:\s*1;/s,
  );
  assert.match(
    css,
    /\.detail-title\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;[^}]*grid-row:\s*1;/s,
  );
  assert.match(
    css,
    /\.detail-extras\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s,
  );
});

test("event summaries preserve rich TipTap formatting with plain fallback", () => {
  assert.match(app, /selectedEvent\?\.summary_html\?\.trim\(\)/);
  assert.match(app, /dangerouslySetInnerHTML=\{\{ __html: summaryHtml \}\}/);
  assert.match(app, /selectedEvent\?\.summary\?\.split\(\/\\n\{2,\}\/\)/);
  assert.match(app, /const detailSummaryClassName = \[[\s\S]*"detail-summary/);
  assert.match(app, /\[&_strong\]:font-bold/);
  assert.match(app, /\[&_a\]:underline/);
});

test("long event summaries collapse at 360px with an accessible expansion control", () => {
  assert.match(app, /max-h-\[360px\]/);
  assert.match(app, /bg-gradient-to-b from-transparent to-white/);
  assert.match(
    app,
    /<Link[\s\S]*aria-expanded=\{isExpanded\}[\s\S]*aria-controls=\{contentId\}[\s\S]*onClick=\{\(\) => setIsExpanded\(!isExpanded\)\}[\s\S]*>\s*\{isExpanded \? "See less" : "See more"\}\s*<\/Link>/,
  );
  assert.match(app, /contentHeight > 360/);
});

test("event detail content uses base text and gray uppercase labels", () => {
  assert.match(
    app,
    /"detail-summary max-w-\[54ch\] text-base leading-\[1\.7\]"/,
  );
  assert.match(
    app,
    /<dt className="mb-\[7px\] text-base uppercase text-gray-400">\s*Where\s*<\/dt>[\s\S]*<dt className="mb-\[7px\] text-base uppercase text-gray-400">\s*Hosted by\s*<\/dt>/,
  );
  assert.match(
    app,
    /<dt className="mb-4 text-base uppercase text-gray-400">\s*Sponsors\s*<\/dt>/,
  );
  assert.equal(
    (app.match(/<dd className="m-0 text-base leading-6">/g) ?? []).length,
    2,
  );
  assert.match(
    app,
    /<dt[^>]*>\s*Where\s*<\/dt>\s*<dd className="m-0 text-base leading-6">\s*\{selectedEvent\.location\}\s*<\/dd>/,
  );
  assert.match(
    app,
    /<dt[^>]*>\s*Sponsors\s*<\/dt>[\s\S]*?<dd className="m-0 mb-2 text-base leading-6">/,
  );
  assert.match(
    app,
    /<h3[\s\S]*className="[^"]*text-base[^"]*uppercase text-gray-400"/,
  );
});

test("View on Luma uses the shared Link component as a safe external link", () => {
  assert.match(
    app,
    /<Link[\s\S]*href=\{selectedEvent\.luma_url\}[\s\S]*target="_blank"[\s\S]*rel="noreferrer"[\s\S]*>[\s\S]*View on Luma/,
  );
  assert.doesNotMatch(
    app,
    /<Primary[\s\S]*href=\{selectedEvent\.luma_url\}[\s\S]*>[\s\S]*View on Luma/,
  );
  assert.match(
    app,
    /import \{ ArrowUpRightIcon \} from "\.\/icons\/ArrowUpRightIcon"/,
  );
  assert.match(
    app,
    /className="[^"]*\bgap-2\b[^"]*"[\s\S]*View on Luma[\s\S]*<ArrowUpRightIcon \/>/,
  );
  assert.doesNotMatch(app, /<span aria-hidden="true">↗<\/span>/);
  assert.match(primary, /variant\?: "primary" \| "secondary" \| "ghost"/);
  assert.match(primary, /variant === "ghost"/);
});

test("View on Luma sits once under sponsor content with an aligned left edge", () => {
  assert.match(
    app,
    /<div className="detail-sponsor">[\s\S]*<dt[^>]*>\s*Sponsors\s*<\/dt>[\s\S]*<dd className="[^"]*\bmb-2\b[^"]*">[\s\S]*\{sponsors\.length > 0 \? \([\s\S]*Sponsor slot open[\s\S]*<\/dd>[\s\S]*<Link[\s\S]*className="[^"]*\bgap-2\b[^"]*"[\s\S]*href=\{selectedEvent\.luma_url\}[\s\S]*<\/Link>[\s\S]*<\/div>/,
  );
  assert.doesNotMatch(app, /<Link[^>]*className="[^"]*-ml-/);
  assert.doesNotMatch(
    app,
    /Where[\s\S]*\{selectedEvent\.location\}[\s\S]*<Link[\s\S]*Hosted by/,
  );
  assert.equal((app.match(/View on Luma/g) ?? []).length, 1);
});

test("mobile event details appear before the event description", () => {
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*?\.detail-grid > dl\s*\{[^}]*order:\s*1[^}]*\}[\s\S]*?\.detail-title\s*\{[^}]*order:\s*2[^}]*\}/,
  );
});

test("all image surfaces are borderless", () => {
  assert.match(app, /event-card[^"]*border-0/);
  assert.match(app, /detail-photo[^`]*rounded-md border-0/);
  assert.match(app, /sponsor-logo border-0 outline-none/);
});

test("nonselected covers blend against a white underlay so they look lighter", () => {
  assert.match(app, /event-card[^"]*bg-white/);
  assert.doesNotMatch(
    css,
    /\.event-card\s*\{[^}]*background:\s*oklch\(35%/s,
  );
  assert.doesNotMatch(
    css,
    /\.event-card(?:\[aria-pressed="true"\])?::(?:before|after)\s*\{/s,
  );
});

test("event images keep normal color while nonselected images use 70% opacity", () => {
  assert.match(
    css,
    /\.event-card:not\(\[aria-pressed="true"\]\) img\s*\{[^}]*opacity:\s*0\.7;[^}]*filter:\s*none;/s,
  );
  assert.match(
    css,
    /\.event-card\[aria-pressed="true"\] img\s*\{[^}]*opacity:\s*1;[^}]*filter:\s*none;/s,
  );
  assert.doesNotMatch(
    css,
    /\.event-card(?::not\(\[aria-pressed="true"\]\)|\[aria-pressed="true"\]) img\s*\{[^}]*(?:brightness|saturate|contrast)\(/s,
  );
});
