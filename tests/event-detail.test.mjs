import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const header = await readFile(
  new URL("../src/components/SiteHeader.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const primary = await readFile(
  new URL("../src/components/Primary.tsx", import.meta.url),
  "utf8",
);
const iconButton = await readFile(
  new URL("../src/components/IconButton.tsx", import.meta.url),
  "utf8",
);
const viewToggle = await readFile(
  new URL("../src/components/GalleryViewToggle.tsx", import.meta.url),
  "utf8",
);
const eventListRow = await readFile(
  new URL("../src/components/EventListRow.tsx", import.meta.url),
  "utf8",
);

const hasClass = (name) =>
  new RegExp(`className="[^"]*\\b${name}\\b[^"]*"`);

test("hosted by metadata is gone because the team hosts every event", () => {
  assert.doesNotMatch(app, /function parseHosts\(/);
  assert.doesNotMatch(app, /Hosted by/);
  assert.doesNotMatch(app, hasClass("host-list"));
  assert.doesNotMatch(css, /\.host-list/);
});

test("header uses the Design Meetup logo image inside the home link", async () => {
  assert.match(header, hasClass("wordmark"));
  assert.match(header, /aria-label="Design Meetup home"/);
  assert.match(header, hasClass("wordmark-logo"));
  assert.match(header, /src="\/design-meetup-logo\.png"/);
  assert.match(header, /width=\{60\}/);
  assert.match(header, /height=\{60\}/);
  assert.match(header, /alt=""/);
  assert.doesNotMatch(
    header,
    /className="[^"]*\bwordmark\b[^"]*"[^>]*>\s*Design Meetup\s*</,
  );
  assert.match(
    css,
    /\.wordmark\s*\{[^}]*display:\s*flex;[^}]*height:\s*60px;/s,
  );
  assert.match(
    css,
    /\.wordmark-logo\s*\{[^}]*width:\s*auto;[^}]*height:\s*100%;/s,
  );
  assert.match(header, /wordmark-logo border-0 outline-none/);
  assert.match(app, /import \{ SiteHeader \} from "\.\/SiteHeader"/);
  await access(new URL("../public/design-meetup-logo.png", import.meta.url));
});

test("the headline names the audience across eight of twelve columns", () => {
  assert.doesNotMatch(app, /Past gatherings · 2026/);
  assert.match(
    app,
    /<h1[^>]*id="page-title"[^>]*aria-label="A space for the world’s most ambitious creatives"[^>]*>[\s\S]*A space for the world’s[\s\S]*most ambitious creatives[\s\S]*<\/h1>/,
  );
  assert.doesNotMatch(app, /For designers who believe/);
  assert.match(
    css,
    /\.intro\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/s,
  );
  assert.match(css, /h1\s*\{[^}]*grid-column:\s*1\s*\/\s*span 8;/s);
});

test("section headings are set at the same size as the hero headline", () => {
  assert.match(
    app,
    /<h1[^>]*className="[^"]*text-\[clamp\(3\.5rem,6vw,5rem\)\][^"]*font-bold[^"]*leading-\[1\.05\][^"]*text-black[^"]*"/,
  );

  for (const id of [
    "upcoming-events-title",
    "about-title",
    "partner-cta-title",
  ]) {
    assert.match(
      app,
      new RegExp(
        `<h2\\s+className="[^"]*text-\\[clamp\\(3\\.5rem,6vw,5rem\\)\\][^"]*leading-\\[1\\.05\\][^"]*max-\\[520px\\]:text-\\[clamp\\(2\\.75rem,12vw,3\\.75rem\\)\\][^"]*"\\s+id="${id}"`,
      ),
      `${id} should match the hero headline size`,
    );
  }

  assert.doesNotMatch(app, /text-\[clamp\(3rem,4\.7vw,3\.75rem\)\]/);
});

test("the hero gives the headline room to breathe under the logo", () => {
  assert.match(app, /px-\[clamp\(20px,6vw,96px\)\]/);
  assert.match(
    app,
    /className="intro [^"]*pt-\[clamp\(18px,2\.5vw,40px\)\][^"]*pb-\[clamp\(14px,2vw,32px\)\]/,
  );
  assert.match(app, /max-\[820px\]:pt-5/);
  assert.match(app, /max-\[520px\]:pt-4/);
  assert.match(css, /\.intro\s*\{[^}]*row-gap:\s*clamp\(28px,\s*4vw,\s*56px\);/s);
});

test("the hero carries the headline alone, with no supporting paragraph", () => {
  assert.doesNotMatch(app, /\bintro-copy\b/);
  assert.doesNotMatch(css, /\bintro-copy\b/);
  assert.ok(
    !app.includes("Design Meetup brings together early-career designers"),
    "expected the hero supporting paragraph to be removed",
  );
});

test("gallery toolbar carries the layout toggle instead of a counter and arrows", () => {
  assert.doesNotMatch(app, /Scroll or use arrow keys/);
  assert.doesNotMatch(app, /counter-current/);
  assert.doesNotMatch(app, /padStart\(2, "0"\)/);
  assert.doesNotMatch(app, /aria-label="Previous event"\s/);
  assert.doesNotMatch(app, /aria-label="Next event"/);
  assert.match(app, /<GalleryViewToggle view=\{view\} onChange=\{changeView\} \/>/);
  assert.match(iconButton, /bg-surface-muted/);
  assert.match(iconButton, /hover:not-disabled:bg-gray-300/);
  assert.match(iconButton, /rounded-full border-0/);
  assert.match(app, /stroke="currentColor"/);
});

test("the layout toggle swaps the carousel for a scannable list", () => {
  assert.match(viewToggle, hasClass("view-toggle"));
  assert.match(viewToggle, /role="group"\s*\n?\s*aria-label="Event layout"/);
  assert.match(viewToggle, /aria-pressed=\{view === option\.value\}/);
  // Options hug their own labels, so the thumb tracks the measured width and
  // offset of the active button instead of a shared half-width track.
  assert.match(css, /\.view-toggle\s*\{[^}]*display:\s*inline-flex;/s);
  assert.doesNotMatch(css, /\.view-toggle\s*\{[^}]*grid-auto-columns:\s*1fr/s);
  assert.match(
    viewToggle,
    /transform: `translateX\(\$\{thumb\.x\}px\)`, width: thumb\.width/,
  );
  // Icon-only pills: no visible text label, so each button carries its own
  // aria-label and renders only an icon. Selected state stays on the thumb.
  assert.doesNotMatch(viewToggle, /view-toggle-label/);
  assert.match(viewToggle, /aria-label=\{option\.label\}/);
  assert.match(
    viewToggle,
    /option\.value === "carousel" \? <CarouselViewIcon \/> : <ListViewIcon \/>/,
  );
  assert.doesNotMatch(css, /\.view-toggle-label\b/);
  assert.match(app, /view === "carousel" \? \(/);
  assert.match(app, hasClass("event-list"));
  assert.match(app, /<EventListRow/);
  assert.match(eventListRow, hasClass("event-row"));
});

test("the detail heading owns the selected title id", () => {
  assert.match(app, /const SELECTED_TITLE_ID = "selected-event-title";/);
  assert.match(
    app,
    /<h2[\s\S]*id=\{SELECTED_TITLE_ID\}[\s\S]*>\s*\{selectedEvent\.title\}\s*<\/h2>/,
  );
  assert.doesNotMatch(app, /titleId=/);
  assert.doesNotMatch(eventListRow, /\btitleId\b/);
});

test("selected event title uses the next heavier text weight", () => {
  assert.match(
    app,
    /<h2[^>]*className="[^"]*\bfont-bold\b[^"]*"[^>]*id=\{SELECTED_TITLE_ID\}/s,
  );
  assert.match(
    eventListRow,
    /className="event-row-title block font-bold/,
  );
});

test("event details render the selected event gallery images from Supabase", () => {
  assert.match(app, /aria-labelledby="event-photos-title"/);
  assert.match(
    app,
    /<h3[^>]*id="event-photos-title"[^>]*>\s*Gallery\s*<\/h3>/,
  );
  assert.match(
    app,
    /className="mb-\[clamp\(24px,3vw,40px\)\] flex items-center justify-between"[\s\S]*id="event-photos-title"/,
  );
  assert.match(app, hasClass("detail-photo-list"));
  assert.match(app, /selectedEvent\?\.gallery_images/);
  assert.match(app, /selectedPhotos\.map\(\(photoUrl, photoIndex\)/);
  assert.doesNotMatch(app, /Array\.from\(\{ length: 3 \}/);
  assert.doesNotMatch(app, /selectedPhotos\.slice\(/);
});

test("the gallery stays hidden while an event still uses the shared placeholders", () => {
  assert.match(app, /url\.includes\("\/placeholders\/"\)/);
  assert.match(app, /const showEventGallery = selectedPhotos\.length > 0/);
  assert.match(app, /\{showEventGallery \? \(/);
  assert.doesNotMatch(
    app,
    /gallery_images\?\.length > 0[\s\S]*\? selectedEvent\.image_url/,
  );
});

test("event photos use an accessible horizontally scrollable rail", () => {
  assert.match(
    app,
    /className="[^"]*\bdetail-photo-list\b[^"]*\btouch-pan-x\b[^"]*"[\s\S]*tabIndex=\{0\}[\s\S]*aria-label=\{`\$\{selectedEvent\.title\} gallery, horizontally scrollable`\}/,
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

test("event photo controls scroll by a responsive increment and disable at boundaries", () => {
  assert.match(app, /const detailPhotoRailRef = useRef<HTMLUListElement \| null>\(null\)/);
  assert.match(app, /const \[canScrollPhotosLeft, setCanScrollPhotosLeft\] = useState\(false\)/);
  assert.match(app, /const \[canScrollPhotosRight, setCanScrollPhotosRight\] = useState\(false\)/);
  assert.match(app, /rail\.scrollBy\(\{[\s\S]*left:[\s\S]*behavior: reduceMotion \? "auto" : "smooth"/);
  assert.match(app, /rail\.scrollLeft > 1/);
  assert.match(app, /rail\.scrollLeft < rail\.scrollWidth - rail\.clientWidth - 1/);
  assert.match(app, /aria-label="Previous event photo"[\s\S]*aria-controls="event-photo-rail"[\s\S]*disabled=\{!canScrollPhotosLeft\}/);
  assert.match(app, /aria-label="Next event photo"[\s\S]*aria-controls="event-photo-rail"[\s\S]*disabled=\{!canScrollPhotosRight\}/);
  assert.match(app, /onLoad=\{\(\) => \{[\s\S]*?updatePhotoRailBoundsFromRef\(\);/);
});

test("event photos shimmer gray until each one decodes", () => {
  assert.match(
    app,
    /detail-photo-frame[^"]*relative[^"]*overflow-hidden[^"]*rounded-md"\s*\n\s*data-loaded=\{loadedPhotos\[photoUrl\] \? "true" : "false"\}/,
  );
  assert.match(app, /className="detail-photo-shimmer bg-skeleton"/);
  assert.match(app, /aria-hidden="true"/);
  // A cached photo can be complete before onLoad is attached.
  assert.match(app, /node\?\.complete && node\.naturalWidth > 0/);
  assert.match(app, /onError=\{\(\) => markPhotoLoaded\(photoUrl\)\}/);
  assert.match(css, /--color-skeleton:/);
  assert.match(
    css,
    /\.detail-photo-frame\[data-loaded="false"\] \.detail-photo\s*\{[^}]*aspect-ratio:\s*3 \/ 4;[^}]*opacity:\s*0;/s,
  );
  assert.match(
    css,
    /\.detail-photo-shimmer::after\s*\{[^}]*animation:\s*photo-shimmer/s,
  );
  assert.match(
    css,
    /\.detail-photo-frame\[data-loaded="true"\] \.detail-photo-shimmer\s*\{[^}]*opacity:\s*0;/s,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.detail-photo-shimmer[\s\S]*?animation:\s*none;/,
  );
});

test("event photo rail bleeds to viewport edges with aligned terminal spacing", () => {
  assert.match(
    app,
    /detail-photo-list[^"]*m-0[^"]*touch-pan-x[^"]*p-0/,
  );
  assert.doesNotMatch(
    app,
    /detail-photo-list[^"]*(?:left-1\/2|w-screen|-translate-x-1\/2)/,
  );
  assert.match(
    css,
    /\.detail-photo-list\s*\{[^}]*--page-gutter:\s*clamp\(20px,\s*6vw,\s*96px\);[^}]*width:\s*calc\(100%\s*\+\s*var\(--page-gutter\)\s*\+\s*var\(--page-gutter\)\);[^}]*margin-inline:\s*calc\(0px\s*-\s*var\(--page-gutter\)\);[^}]*scroll-padding-inline:\s*var\(--page-gutter\);/s,
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

test("sponsors render as chips beside the other event metadata", () => {
  assert.match(
    app,
    /<ul[^>]*className="[^"]*\bdetail-chips\b[^"]*"[\s\S]*sponsors\.map\(\(sponsor\)[\s\S]*sponsor\.name[\s\S]*<Chip>\{chipContent\}<\/Chip>[\s\S]*<\/ul>/,
  );
  assert.match(app, /Sponsor slot open/);
  assert.doesNotMatch(app, /className="detail-sponsors"/);
  assert.doesNotMatch(app, /event-sponsors-title/);
  assert.match(
    app,
    /<Chip className="sponsor-placeholder" variant="outline">/,
  );
  assert.doesNotMatch(app, hasClass("sponsor-list"));
  assert.doesNotMatch(css, /\.sponsor-list\b/);
});

test("sponsor logos shrink to sit inside a chip next to the sponsor name", () => {
  assert.match(app, /sponsor-logo border-0 outline-none/);
  assert.match(
    css,
    /\.sponsor-logo\s*\{[^}]*max-width:\s*72px;[^}]*max-height:\s*18px;[^}]*object-fit:\s*contain;/s,
  );
});

test("the event card separates the name from its metadata column", () => {
  assert.match(app, /event-detail[^"]*pt-\[clamp\(32px,4vw,64px\)\]/);
  assert.doesNotMatch(app, /className="detail-index"/);
  assert.doesNotMatch(app, /Event \{String\(selectedIndex/);
  assert.match(
    css,
    /\.detail-grid\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);[^}]*column-gap:\s*clamp\(16px,\s*2vw,\s*28px\);/s,
  );
  assert.match(
    css,
    /\.detail-title\s*\{[^}]*grid-column:\s*1\s*\/\s*span 8;[^}]*grid-row:\s*1;/s,
  );
  assert.match(
    css,
    /\.detail-meta\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;[^}]*grid-row:\s*1;/s,
  );
  // The summary, the About lede, and the partner logos all share these columns.
  assert.match(css, /\.partner-logos\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;/s);
  assert.match(
    css,
    /\.detail-extras\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s,
  );
  assert.doesNotMatch(css, /\.detail-grid > dl\b/);
});

test("the event name is the large black heading in the left column", () => {
  assert.match(
    app,
    /<div className="detail-title">\s*<h2[\s\S]*?className="[^"]*text-\[clamp\(1\.75rem,2\.6vw,2\.5rem\)\][^"]*\bfont-bold\b[^"]*\btext-black\b[^"]*"[\s\S]*?id=\{SELECTED_TITLE_ID\}[\s\S]*?>\s*\{selectedEvent\.title\}\s*<\/h2>/,
  );
});

test("event metadata sits under the title in the left column", () => {
  // The facts belong to the title block, so they read as a caption for it
  // rather than as a header for the summary in the right column.
  assert.match(
    app,
    /<div className="detail-title">[\s\S]*?<\/h2>\s*<div className="detail-facts[^"]*"/,
  );
  assert.match(
    css,
    /\.detail-facts\s*\{[^}]*gap:\s*clamp\(12px,\s*1\.4vw,\s*18px\);/s,
  );
  // Padding rather than margin, so the gap cannot collapse into the heading,
  // and as a utility because spacing belongs in Tailwind here.
  assert.match(app, /detail-facts pt-\[clamp\(12px,1\.4vw,18px\)\]/);
  assert.doesNotMatch(app, /detail-facts[^"]*\bmt-\[/);
  assert.match(
    app,
    /<div className="detail-meta">\s*<ExpandableSummary/,
  );
});

test("list view pairs the roster and the detail into a master/detail split", () => {
  assert.match(app, /<div className="events-layout" data-view=\{view\}>/);
  assert.match(
    css,
    /\.events-layout\[data-view="list"\]\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*7fr\)\s+minmax\(0,\s*5fr\)/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="list"\]\s*\{[^}]*align-items:\s*stretch;/s,
  );
  // Same top inset as the detail column so the first row lines up with the title.
  assert.match(
    app,
    /gallery-list[^"]*pt-\[clamp\(32px,4vw,64px\)\]/,
  );
  assert.match(
    app,
    /event-detail[^"]*pt-\[clamp\(32px,4vw,64px\)\]/,
  );
  // The scrollport grows with the detail column instead of capping at a short viewport.
  assert.match(
    css,
    /\.events-layout\[data-view="list"\] \.event-list-scroll\s*\{[^}]*max-height:\s*none;/s,
  );
  // Detail stacks into one column instead of its own 12-column split.
  assert.match(
    css,
    /\.events-layout\[data-view="list"\] \.detail-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="list"\] \.detail-title,\s*\.events-layout\[data-view="list"\] \.detail-meta\s*\{[^}]*grid-column:\s*auto/s,
  );
  // Without this the full-bleed rail would run back under the list.
  assert.match(
    css,
    /\.events-layout\[data-view="list"\] \.detail-photo-list\s*\{[^}]*--page-gutter:\s*0px/s,
  );
  // One page gutter between the columns rather than two stacked ones.
  assert.match(
    css,
    /\.events-layout\[data-view="list"\] > \.event-detail\s*\{[^}]*margin-left:\s*calc\(0px - clamp\(20px,\s*6vw,\s*96px\)\)/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.events-layout\[data-view="list"\]\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.events-layout\[data-view="list"\] > \.event-detail\s*\{[^}]*margin-left:\s*0/s,
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

test("long event summaries collapse at 220px with an accessible expansion control", () => {
  assert.match(app, /max-h-\[220px\]/);
  assert.match(
    app,
    /<Link[\s\S]*aria-expanded=\{isExpanded\}[\s\S]*aria-controls=\{contentId\}[\s\S]*onClick=\{toggleExpanded\}[\s\S]*>\s*\{isExpanded \? "See less" : "See more"\}\s*<\/Link>/,
  );
  // The measured threshold has to track the clamp, or the fade and the control
  // appear on summaries that are not actually clipped.
  assert.match(app, /contentHeight > 220/);
  assert.match(
    app,
    /bg-gradient-to-b from-white\/0 via-white\/80 to-white/,
  );
  assert.doesNotMatch(app, /backdrop-blur/);
});

test("collapsing a long summary scrolls back to its top, honouring reduced motion", () => {
  assert.match(app, /const containerRef = useRef<HTMLDivElement \| null>\(null\)/);
  assert.match(app, /<div className="relative" ref=\{containerRef\}>/);
  assert.match(
    app,
    /const toggleExpanded = useCallback\(\(\) => \{[\s\S]*if \(isExpanded && container\)[\s\S]*window\.scrollTo\(\{[\s\S]*behavior: reduceMotion \? "auto" : "smooth"/,
  );
  // Readers who are already above the summary should stay put.
  assert.match(app, /if \(top < SUMMARY_COLLAPSE_SCROLL_MARGIN\)/);
});

test("event detail body copy is dark gray with no uppercase gray labels", () => {
  assert.match(
    app,
    /"detail-summary max-w-\[62ch\] text-base leading-\[1\.7\] text-body"/,
  );
  assert.doesNotMatch(app, /\buppercase\b/);
  assert.doesNotMatch(app, /\btext-gray-400\b/);
  assert.match(css, /--color-body:\s*#202020;/);
  assert.match(
    app,
    /<h3[\s\S]*className="[^"]*\btext-xl\b[^"]*\btext-black\b"[\s\S]*id="event-photos-title"/,
  );
});

test("event metadata reads as three rows: facts, sponsor pills, then the link", () => {
  const facts = app.match(
    /<div className="detail-facts[\s\S]*?\n {16}<\/div>/,
  )?.[0];
  assert.ok(facts, "expected a detail-facts block");

  // Row one is plain text, not pills. Location leads, then date — same
  // colours as the list rows, separated by a gap rather than a dot.
  assert.match(
    facts,
    /<p className="m-0 flex flex-wrap items-baseline gap-x-4 text-base leading-6">\s*\{selectedEvent\.location \? \(\s*<span className="text-muted">\s*<span className="sr-only">Location: /,
  );
  assert.match(
    facts,
    /<span className="text-subtle">\s*<span className="sr-only">Date: <\/span>\s*\{selectedEvent\.date_label\}/,
  );
  assert.doesNotMatch(facts, /·/);
  assert.match(
    facts,
    /<span className="sr-only">Location: <\/span>\s*\{selectedEvent\.location\}/,
  );
  assert.match(facts, /selectedEvent\.location \? \(/);
  assert.doesNotMatch(
    facts,
    /<Chip>\s*<span className="sr-only">Date: /,
  );

  // Row two keeps the pills for sponsors only.
  assert.match(
    facts,
    /<ul\s+className="detail-chips[^"]*"\s*aria-label="Sponsors"\s*>[\s\S]*<span className="sr-only">Sponsor: <\/span>/,
  );

  assert.match(
    css,
    /\.detail-facts\s*\{[^}]*display:\s*grid;[^}]*justify-items:\s*start;/s,
  );
});

test("View on Luma is a link rather than a pill", () => {
  assert.match(
    app,
    /<Link\s+className="inline-flex items-center gap-1\.5"\s+href=\{selectedEvent\.luma_url\}\s+target="_blank"\s+rel="noreferrer"\s*>\s*View on Luma\s*<ArrowUpRightIcon \/>\s*<\/Link>/,
  );
  assert.doesNotMatch(app, /<Chip[^>]*href=\{selectedEvent\.luma_url\}/);
  assert.doesNotMatch(
    app,
    /<Primary[\s\S]*href=\{selectedEvent\.luma_url\}[\s\S]*>[\s\S]*View on Luma/,
  );
  assert.match(
    app,
    /import \{ ArrowUpRightIcon \} from "\.\/icons\/ArrowUpRightIcon"/,
  );
  assert.match(app, /import \{ Chip \} from "\.\/Chip"/);
  assert.doesNotMatch(app, /<span aria-hidden="true">↗<\/span>/);
  assert.equal((app.match(/View on Luma/g) ?? []).length, 1);
});

test("the event name stacks above its metadata on mobile", () => {
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*?\.detail-title\s*\{[^}]*order:\s*1[^}]*\}[\s\S]*?\.detail-meta\s*\{[^}]*order:\s*2[^}]*\}/,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*?\.detail-meta\s*\{[^}]*grid-column:\s*auto;/s,
  );
  assert.doesNotMatch(css, /\.detail-sponsor\b/);
});

test("the sponsor tooltip is retired now that chips spell out the name", () => {
  assert.doesNotMatch(app, /<TooltipProvider>/);
  assert.doesNotMatch(app, /<Tooltip content=\{sponsor\.name\}>/);
  assert.doesNotMatch(app, /from "\.\/Tooltip"/);
});

test("mobile detail tracks floor at zero so the bleeding photo rail cannot widen them", () => {
  // `1fr` is `minmax(auto, 1fr)`, and that auto floor adopts the photo rail's
  // full max-content width, stretching every sibling past the viewport.
  const mobile = css.match(/@media \(max-width: 820px\)\s*\{[\s\S]*?\n\}/)?.[0];
  assert.ok(mobile, "expected a max-width: 820px block");

  for (const selector of [".detail-grid", ".detail-extras"]) {
    const rule = mobile.match(
      new RegExp(`\\${selector}\\s*\\{[^}]*\\}`, "s"),
    )?.[0];
    assert.ok(rule, `expected a mobile ${selector} rule`);
    assert.match(rule, /grid-template-columns:\s*minmax\(0,\s*1fr\);/);
    assert.doesNotMatch(rule, /grid-template-columns:\s*1fr;/);
  }
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
