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
const lightbox = await readFile(
  new URL("../src/components/GalleryLightbox.tsx", import.meta.url),
  "utf8",
);
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

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
    "apply-cta-title",
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
    /className="intro [^"]*pt-\[clamp\(18px,2\.5vw,40px\)\][^"]*pb-\[clamp\(12px,1\.6vw,24px\)\]/,
  );
  assert.match(app, /max-\[820px\]:pt-5/);
  assert.match(app, /max-\[820px\]:pb-3/);
  assert.match(app, /max-\[520px\]:pt-4/);
  assert.match(app, /max-\[520px\]:pb-2\.5/);
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
  const toolbar = app.match(
    /className="gallery-toolbar[^"]*"[\s\S]*?<\/ScrollReveal>/,
  )?.[0] ?? "";
  assert.notEqual(toolbar, "");
  assert.doesNotMatch(toolbar, /aria-label="Previous event"/);
  assert.doesNotMatch(toolbar, /aria-label="Next event"/);
  assert.match(toolbar, /<GalleryViewToggle view=\{view\} onChange=\{changeView\} \/>/);
  assert.match(iconButton, /bg-surface-muted/);
  assert.match(iconButton, /hover:not-disabled:bg-gray-300/);
  assert.match(iconButton, /rounded-full border-0 p-0/);
  assert.match(iconButton, /appearance-none/);
  assert.match(iconButton, /place-items-center/);
  assert.match(app, /stroke="currentColor"/);
  // Mobile has no grid view: hide the toggle and snap back to the carousel.
  assert.match(
    css,
    /@media \(max-width:\s*820px\)\s*\{[\s\S]*?\.gallery-toolbar\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(app, /matchMedia\("\(max-width: 820px\)"\)/);
  assert.match(app, /if \(media\.matches\) changeView\("carousel"\)/);
});

test("the layout toggle swaps the carousel for a grid of covers", () => {
  assert.match(viewToggle, hasClass("view-toggle"));
  assert.match(viewToggle, /role="group"\s*\n?\s*aria-label="Event layout"/);
  assert.match(viewToggle, /aria-pressed=\{view === option\.value\}/);
  // Options hug their own labels, so the thumb tracks the measured width and
  // offset of the active button instead of a shared half-width track.
  assert.match(css, /\.view-toggle\s*\{[^}]*display:\s*inline-flex;[^}]*gap:\s*2px;/s);
  assert.doesNotMatch(css, /\.view-toggle\s*\{[^}]*grid-auto-columns:\s*1fr/s);
  assert.match(
    viewToggle,
    /transform: `translateX\(\$\{thumb\.x\}px\)`, width: thumb\.width/,
  );
  // Icon-only pills: no visible text label, so each button carries its own
  // aria-label and a hover tooltip. Selected state stays on the thumb.
  assert.doesNotMatch(viewToggle, /view-toggle-label/);
  assert.match(viewToggle, /aria-label=\{option\.label\}/);
  assert.match(viewToggle, /<Tooltip key=\{option\.value\} content=\{option\.label\}>/);
  assert.match(
    viewToggle,
    /option\.value === "carousel" \? \(\s*<CarouselViewIcon filled=\{view === option\.value\} \/>\s*\) : \(\s*<GridViewIcon filled=\{view === option\.value\} \/>\s*\)/,
  );
  assert.doesNotMatch(css, /\.view-toggle-label\b/);
  assert.match(app, /view === "carousel" \? \(/);
  assert.match(app, hasClass("event-grid"));
  assert.match(viewToggle, /\{ value: "grid", label: "Grid" \}/);
});

test("the selected layout icon fills while the other stays an outline", () => {
  assert.match(viewToggle, /function CarouselViewIcon\(\{ filled \}: \{ filled: boolean \}\)/);
  assert.match(viewToggle, /function GridViewIcon\(\{ filled \}: \{ filled: boolean \}\)/);
  // Solid state swaps fill in and halves the stroke so both states keep the
  // same footprint on a 24x24 viewBox. Stroke 2 matches the photo-rail chevrons.
  assert.match(
    viewToggle,
    /filled \? \{ fill: "currentColor", strokeWidth: 1 \} : undefined/,
  );
  assert.equal(viewToggle.match(/strokeWidth="2"/g)?.length, 2);
  assert.match(viewToggle, /viewBox="0 0 24 24"/);
  // Outer marks stay filled in both states (prod 16×16 hairlines, scaled 1.5×);
  // only the center bar outlines when idle.
  assert.match(viewToggle, /const side = \{ fill: "currentColor", stroke: "none" \}/);
  assert.match(
    viewToggle,
    /<rect x="4\.2" y="6\.825" width="2\.1" height="10\.35" rx="1\.05" \{\.\.\.side\} \/>/,
  );
  assert.match(viewToggle, /<rect[^>]*x="9"[\s\S]*?\{\.\.\.center\}/);
  assert.match(
    viewToggle,
    /<rect x="17\.7" y="6\.825" width="2\.1" height="10\.35" rx="1\.05" \{\.\.\.side\} \/>/,
  );
  // 6x6 cells at 4 and 14 leave a 4-unit gutter, so a stroke of 2 does not touch.
  assert.match(viewToggle, /<rect x="4" y="4" width="6" height="6" rx="1\.5" \{\.\.\.square\} \/>/);
  assert.match(
    viewToggle,
    /<rect x="14" y="14" width="6" height="6" rx="1\.5" \{\.\.\.square\} \/>/,
  );
  assert.match(viewToggle, /aria-pressed:text-ink/);
  assert.match(viewToggle, /text-subtle hover:text-ink/);
  assert.equal(viewToggle.match(/className="size-5"/g)?.length, 2);
});

test("grid view shows covers alone, with the title and date left to the label", () => {
  const cover = app.match(/className="event-grid-cover[^"]*"/)?.[0] ?? "";
  assert.notEqual(cover, "");
  assert.match(app, /aria-label=\{`\$\{item\.title\}, \$\{item\.date_label\}`\}/);
  assert.match(app, /aria-pressed=\{index === selectedIndex\}/);
  // No visible name, date or location: the artwork carries the event.
  assert.doesNotMatch(app, /event-grid[\s\S]{0,1200}\{item\.date_label\}</);
  assert.doesNotMatch(app, /event-grid[\s\S]{0,1200}\{item\.location\}</);
  // Covers pack four to a row and fill the column, matching production.
  assert.match(
    css,
    /\.event-grid\s*\{[^}]*grid-template-columns:\s*repeat\(\s*4,\s*minmax\(0,\s*1fr\)\s*\);/s,
  );
  assert.match(css, /\.event-grid-cover\s*\{[^}]*aspect-ratio:\s*1;/s);
  // The unselected covers step back, so the chosen one reads without a ring.
  assert.match(
    css,
    /\.event-grid-cover:not\(\[aria-pressed="true"\]\)\s*\{[^}]*opacity:\s*0\.6;/s,
  );
  assert.match(
    css,
    /\.event-grid-cover\[aria-pressed="true"\]\s*\{[^}]*opacity:\s*1;/s,
  );
  assert.match(
    css,
    /\.event-grid-cover\[aria-pressed="true"\]\s*\{[^}]*transform:\s*scale\(1\.04\);/s,
  );
  // Hovering an unselected cover wakes it up without reaching the selection.
  assert.match(
    css,
    /\.event-grid-cover:not\(\[aria-pressed="true"\]\):hover\s*\{[^}]*opacity:\s*0\.85;/s,
  );
  assert.doesNotMatch(css, /\.event-grid-cover:hover\s*\{[^}]*opacity:/s);
  // Selection changes fade rather than snap, and hold still under reduced motion.
  assert.match(
    css,
    /\.event-grid-cover\s*\{[^}]*transition:[^;]*opacity 150ms ease-out;/s,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.event-grid-cover,[\s\S]*?\{\s*transition:\s*none;/s,
  );
  // The row component the old list view used is gone along with its styles.
  assert.doesNotMatch(css, /\.event-row\b/);
  assert.doesNotMatch(app, /EventListRow/);
});

test("the detail heading owns the selected title id", () => {
  assert.match(app, /const SELECTED_TITLE_ID = "selected-event-title";/);
  assert.match(
    app,
    /<h2[\s\S]*id=\{SELECTED_TITLE_ID\}[\s\S]*>\s*\{selectedEvent\.title\}\s*<\/h2>/,
  );
  assert.doesNotMatch(app, /titleId=/);
});

test("selected event title uses the next heavier text weight", () => {
  assert.match(
    app,
    /<h2[^>]*className="[^"]*\bfont-bold\b[^"]*"[^>]*id=\{SELECTED_TITLE_ID\}/s,
  );
});

test("event details render the selected event gallery images from Supabase", () => {
  assert.match(app, /aria-label="Event gallery"/);
  assert.doesNotMatch(app, /id="event-photos-title"/);
  assert.doesNotMatch(app, />\s*Gallery\s*<\/h3>/);
  assert.match(app, hasClass("detail-photo-list"));
  assert.match(app, /selectedEvent\?\.gallery_images/);
  assert.match(app, /selectedPhotoRenders\.map\(\(photo, photoIndex\)/);
  assert.doesNotMatch(app, /Array\.from\(\{ length: 3 \}/);
  assert.doesNotMatch(app, /selectedPhotoRenders\.slice\(/);
});

test("the gallery stays hidden while an event still uses the shared placeholders", () => {
  assert.match(app, /url\.includes\("\/placeholders\/"\)/);
  assert.match(app, /const showEventGallery = selectedPhotos\.length > 0/);
  // The extras wrapper goes with it, so a gallery-less event doesn't leave an
  // empty grid row and its gap under the detail — unless the event is past and
  // we reserve the slot for a "Photos coming soon!" note.
  assert.match(
    app,
    /\{showEventGallery \|\| showPhotosComingSoon \? \(\s*<div className="detail-extras pt-\[var\(--detail-extra-gap\)\]">/,
  );
  assert.doesNotMatch(
    app,
    /gallery_images\?\.length > 0[\s\S]*\? selectedEvent\.image_url/,
  );
});

test("past events without photos promise a recap in the gallery slot", () => {
  assert.match(
    app,
    /const showPhotosComingSoon = !showEventGallery && selectedEventHasEnded/,
  );
  assert.match(
    app,
    /new Date\(selectedEvent\.ends_at \?\? selectedEvent\.starts_at\)\.getTime\(\) <\s*Date\.now\(\)/,
  );
  assert.match(
    app,
    /className="detail-photos-empty[^"]*text-subtle"[^>]*>\s*Photos coming soon!/,
  );
  // Same gray as the date eyebrow, and it stays inside the section gutters
  // (no bleed like the photo rail).
  assert.match(app, /<span className="detail-date text-subtle">/);
  assert.doesNotMatch(
    app,
    /detail-photos-empty[^"]*detail-photo-list|page-gutter-start/,
  );
});

test("event photos use an accessible horizontally scrollable rail", () => {
  assert.match(
    app,
    /className="[^"]*\bdetail-photo-list\b[^"]*\btouch-pan-x\b[^"]*"[\s\S]*tabIndex=\{0\}[\s\S]*aria-label=\{`\$\{selectedEvent\.title\} gallery, horizontally scrollable`\}/,
  );
  assert.match(
    app,
    /`\$\{selectedEvent\.title\} event photo \$\{photoIndex \+ 1\} of \$\{selectedPhotoRenders\.length\}`/,
  );
  assert.match(
    css,
    /\.detail-photo-list\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*nowrap;[^}]*overflow-x:\s*auto;[^}]*scroll-snap-type:\s*x mandatory;/s,
  );
  assert.match(
    css,
    /\.detail-photo-list li\s*\{[^}]*flex:\s*0 0 auto;/s,
  );
  // One height for both layouts: the utility is on the shared photo element, so
  // carousel and grid view cannot drift apart. Mobile stays short enough that a
  // landscape fits with the next frame peeking; desktop keeps the taller rail.
  assert.match(
    app,
    /detail-photo[^"]*h-\[clamp\(150px,46vw,200px\)\][^"]*w-auto[^"]*max-w-none[^"]*object-contain[^"]*min-\[821px\]:h-\[clamp\(240px,20vw,310px\)\]/,
  );
  assert.doesNotMatch(app, /detail-photo[^"]*max-w-\[min\(82vw/);
});

test("the photo arrows only appear once the rail can actually scroll", () => {
  assert.match(
    app,
    /const \[isPhotoRailScrollable, setIsPhotoRailScrollable\] = useState\(false\)/,
  );
  assert.match(
    app,
    /setIsPhotoRailScrollable\(shouldLoop\)/,
  );
  assert.match(
    app,
    /\{isPhotoRailScrollable \? \(\s*<div className="detail-photo-arrows mt-\[clamp\(12px,1\.5vw,22px\)\] flex translate-y-1 items-center justify-end">\s*<div\s*\n?\s*className="flex gap-2"/,
  );
  // Chevrons sit under the rail so they don't steal height from the photos.
  assert.match(
    app,
    /<\/BlossomCarousel>\s*<\/div>\s*\{isPhotoRailScrollable \? \(/,
  );
  assert.match(app, /function ArrowIcon[\s\S]*?strokeWidth="2"/);
  // Negative margin, not padding: the 32px ghost circle insets a 20px
  // chevron, so the glyph (not the hit target) meets the gallery edge.
  assert.match(
    app,
    /aria-label="Previous event photo"[\s\S]*?className="size-8 -ml-3"/,
  );
  assert.match(
    app,
    /aria-label="Next event photo"[\s\S]*?className="size-8 -mr-3"/,
  );
  // Same idle gray as the location line (`text-muted`), not the unselected view-toggle icons.
  assert.match(
    app,
    /aria-label="Previous event photo"[\s\S]*?tone="muted"/,
  );
  assert.match(
    app,
    /aria-label="Next event photo"[\s\S]*?tone="muted"/,
  );
  assert.match(
    iconButton,
    /muted: "text-muted hover:not-disabled:text-ink"/,
  );
  // Ghost fill is hover-only; mouse clicks blur so :focus cannot keep it.
  assert.match(iconButton, /ghost: "bg-transparent hover:not-disabled:bg-surface-muted"/);
  assert.match(iconButton, /if \(event\.detail > 0\) \{\s*event\.currentTarget\.blur\(\);/);
  assert.doesNotMatch(iconButton, /border-0 p-2/);
  // A rail that never mounts has no arrows to speak of.
  assert.match(
    app,
    /if \(!photoRailElement\) \{\s*photoRailLoopsRef\.current = false;\s*setPhotoRailLoops\(false\);\s*setIsPhotoRailScrollable\(false\)/,
  );
});

test("photo-rail chevrons are optically centered in the ghost hit target", () => {
  // A chevron's mass sits on the open side, so equal padding still reads
  // off-axis in a round button. Nudge each glyph 1px toward its tip.
  assert.match(
    app,
    /function ArrowIcon[\s\S]*?direction === "left" \? "size-5 -translate-x-px" : "size-5 translate-x-px"/,
  );
  // Same 20px glyph / 32px hit target as the photo-rail controls — without
  // size-5 the SVG filled the default 36px button and dwarfed the page chevrons.
  assert.match(lightbox, /lightbox-arrow-prev size-8/);
  assert.match(lightbox, /lightbox-arrow-next size-8/);
  assert.match(
    lightbox,
    /className="absolute top-\[clamp\(16px,3vw,32px\)\] right-\[clamp\(16px,3vw,32px\)\] size-8"\s*\n\s*aria-label="Close gallery"/,
  );
  assert.match(lightbox, /function CloseIcon[\s\S]*?className="size-5"/);
});

test("lightbox chevrons are optically centered in the solid circle", () => {
  // 0.25px toward the circle centre; vertical stays geometric.
  // Close stays geometrically centered; it has no fill to optically correct.
  assert.match(
    lightbox,
    /direction === "left"\s*\? "block size-5 shrink-0 translate-x-\[0\.25px\]"\s*: "block size-5 shrink-0 -translate-x-\[0\.25px\]"/,
  );
  assert.match(
    lightbox,
    /function ChevronIcon[\s\S]*?preserveAspectRatio="xMidYMid meet"/,
  );
  assert.doesNotMatch(
    lightbox,
    /function ChevronIcon[\s\S]*?translate-y-/,
  );
  assert.doesNotMatch(
    lightbox,
    /function CloseIcon[\s\S]*?translate-/,
  );
});

test("mobile lightbox arrows keep a square hit target", () => {
  // height:auto under the caption flexed the size-8 width against a shorter
  // content box and squashed the chevron in an oval.
  assert.match(
    css,
    /@media \(max-width:\s*520px\)\s*\{[\s\S]*?button\.lightbox-arrow-prev,\s*button\.lightbox-arrow-next\s*\{[^}]*width:\s*2rem;[^}]*height:\s*2rem;/s,
  );
  assert.doesNotMatch(
    css,
    /@media \(max-width:\s*520px\)\s*\{[\s\S]*?button\.lightbox-arrow-prev,\s*button\.lightbox-arrow-next\s*\{[^}]*height:\s*auto;/s,
  );
});

test("event photo controls scroll right forever and loop in the middle copy", () => {
  assert.match(app, /const detailPhotoRailRef = useRef<HTMLUListElement \| null>\(null\)/);
  assert.match(app, /const \[canScrollPhotosLeft, setCanScrollPhotosLeft\] = useState\(false\)/);
  assert.match(app, /const \[canScrollPhotosRight, setCanScrollPhotosRight\] = useState\(false\)/);
  assert.match(app, /const PHOTO_RAIL_LOOP_COPIES = 3/);
  assert.match(app, /function photoRailCycleWidth\(/);
  assert.match(app, /function photoRailLoopScrollLeft\(/);
  assert.doesNotMatch(app, /function photoRailPinnedScrollLeft\(/);
  assert.match(app, /function restorePhotoRailChrome\(/);
  assert.match(app, /function jumpPhotoRailScroll\(/);
  assert.match(app, /Array\.from\(\{ length: photoRailCopies \}/);
  assert.match(app, /const isClone = photoRailCopies > 1 && copy !== 1/);
  assert.match(app, /left < cycleWidth \* 0\.5/);
  assert.match(app, /left > cycleWidth \* 1\.5/);
  assert.match(app, /setProperty\("scroll-snap-type", "none", "important"\)/);
  assert.match(app, /setProperty\("scroll-behavior", "auto", "important"\)/);
  assert.doesNotMatch(app, /setProperty\("scroll-behavior", "smooth"/);
  assert.match(app, /void rail\.offsetWidth/);
  assert.match(app, /setAttribute\("has-snap", "false"\)/);
  assert.match(app, /setAttribute\("has-snap", "true"\)/);
  assert.match(app, /requestAnimationFrame\(step\)/);
  assert.doesNotMatch(app, /rail\.scrollTo\(\{ left, behavior: "smooth" \}\)/);
  assert.match(app, /restorePhotoRailChrome\(rail\)/);
  assert.match(app, /addEventListener\("scrollend", onScrollEnd\)/);
  assert.doesNotMatch(app, /settleRail/);
  assert.doesNotMatch(app, /holdSnapOff/);
  assert.doesNotMatch(app, /function animatePhotoRailScroll\(/);
  assert.doesNotMatch(app, /HTMLElement\.prototype\.scrollTo/);
  assert.match(app, /function glidePhotoRailScroll\(/);
  assert.match(app, /function cancelPhotoRailGlide\(/);
  assert.match(app, /jumpPhotoRailScroll\(rail, looped\.left\)/);
  assert.match(app, /function photoRailEndAlignLeft\(/);
  assert.match(app, /function photoRailAlignLeft\(/);
  assert.match(app, /function photoRailSnapAlign\(/);
  assert.match(
    app,
    /window\.matchMedia\("\(max-width: 820px\)"\)\.matches \? "start" : "end"/,
  );
  assert.match(app, /const align = photoRailSnapAlign\(\)/);
  assert.doesNotMatch(app, /view === "grid" \? "start" : "end"/);
  assert.match(app, /itemBox\.right - port\.right/);
  assert.match(app, /itemBox\.left - port\.left/);
  assert.match(app, /function photoRailSnappedItem\(/);
  assert.match(app, /function photoRailSeedScrollLeft\(/);
  assert.match(app, /PHOTO_RAIL_LANDING_PAIR_EVENT_IDS/);
  assert.match(app, /fillFromStart/);
  assert.match(
    app,
    /photoRailSeedScrollLeft\(\s*rail,\s*count,\s*align,\s*PHOTO_RAIL_LANDING_PAIR_EVENT_IDS\.has\(selectedEvent\?\.id \?\? ""\),\s*\)/,
  );
  assert.match(app, /function photoRailStepItem\(/);
  assert.doesNotMatch(app, /function photoRailCopyLength\(/);
  assert.match(app, /while \(left > cycleWidth \* 1\.5\) left -= cycleWidth/);
  assert.match(app, /while \(left < cycleWidth \* 0\.5\) left \+= cycleWidth/);
  assert.match(app, /const shouldLoop = count > 1/);
  assert.match(
    app,
    /if \(!photoRailPlacedRef\.current\) \{\s*jumpPhotoRailScroll\(\s*rail,\s*photoRailSeedScrollLeft\(\s*rail,\s*count,\s*align,\s*PHOTO_RAIL_LANDING_PAIR_EVENT_IDS\.has\(selectedEvent\?\.id \?\? ""\),\s*\),\s*\);/,
  );
  assert.match(app, /if \(wrap && !photoRailAnimatingRef\.current\)/);
  assert.match(app, /setCanScrollPhotosLeft\(true\)/);
  assert.match(app, /setCanScrollPhotosRight\(true\)/);
  // Chevrons step one photo. They always glide; wrapping mid-step was the
  // instant teleport. Duration scales with distance so landscapes don't lurch.
  // Live-retarget each frame so a clone expanding behind the rail cannot
  // leave the ease 194px short, then snap-jump the rest.
  assert.match(app, /const current = photoRailSnappedItem\(rail, align\)/);
  assert.match(app, /const next = photoRailStepItem\(items, current, direction\)/);
  assert.match(
    app,
    /glidePhotoRailScroll\(\s*rail,\s*\(\) => photoRailAlignLeft\(rail, next, align\),\s*Boolean\(reduceMotion\),/,
  );
  assert.match(app, /const PHOTO_RAIL_GLIDE_MAX_PX = 36/);
  assert.match(app, /items\[count \* 2\]/);
  assert.match(app, /rail\.scrollLeft \+= shift/);
  assert.match(app, /"--photo-aspect"/);
  assert.doesNotMatch(app, /if \(wrapped\) \{\s*jumpPhotoRailScroll\(rail, target\);/);
  assert.doesNotMatch(app, /function animatePhotoRailScroll\(/);
  assert.doesNotMatch(app, /const nativeScrollTo = HTMLElement\.prototype\.scrollTo/);
  assert.doesNotMatch(app, /PHOTO_RAIL_STEP_MS/);
  assert.match(app, /const PHOTO_RAIL_GLIDE_MS = 420/);
  assert.match(app, /const PHOTO_RAIL_GLIDE_REF_PX = 240/);
  assert.match(app, /const PHOTO_RAIL_GLIDE_MAX_MS = 720/);
  assert.doesNotMatch(app, /holdSnapOff/);
  assert.doesNotMatch(app, /clientWidth \* 0\.8/);
  assert.doesNotMatch(app, /rail\.scrollBy\(/);
  assert.doesNotMatch(app, /function photoRailSnapLeft\(/);
  assert.doesNotMatch(app, /left >= maxScroll - 1/);
  assert.match(
    app,
    /aria-label="Previous event photo"[\s\S]*aria-controls="event-photo-rail"[\s\S]*disabled=\{photoRailLoops \? false : !canScrollPhotosLeft\}/,
  );
  assert.match(
    app,
    /aria-label="Next event photo"[\s\S]*aria-controls="event-photo-rail"[\s\S]*disabled=\{photoRailLoops \? false : !canScrollPhotosRight\}/,
  );
  assert.match(app, /onLoad=\{\(event\) => \{[\s\S]*?updatePhotoRailBoundsFromRef\(\);/);
});

test("the event photo rail uses Blossom Carousel for drag snapping", () => {
  assert.match(layout, /import ["']@blossom-carousel\/react\/style\.css["']/);
  assert.match(app, /import \{ BlossomCarousel \} from ["']@blossom-carousel\/react["']/);
  assert.match(app, /<BlossomCarousel\s*\n\s*as="ul"/);
  assert.match(app, /data-blossom-slide=""/);
  assert.match(
    css,
    /\.detail-photo-list\s*\{[^}]*--snap-type:\s*x mandatory;[^}]*scroll-snap-type:\s*x mandatory;/s,
  );
  // Blossom's [blossom-carousel] rule sets scroll-behavior: smooth; without
  // this override the silent middle-copy seed animates as auto-scroll.
  assert.match(
    css,
    /\.detail-photo-list\s*\{[^}]*overflow-x:\s*auto;[^}]*scroll-behavior:\s*auto;/s,
  );
  assert.match(
    css,
    /\.detail-photo-list li\s*\{[^}]*scroll-snap-align:\s*end;/s,
  );
  assert.doesNotMatch(
    css,
    /\.detail-photo-list li\s*\{[^}]*scroll-snap-stop:\s*always;/s,
  );
  // Mobile: free-scroll. Snap on wide landscapes reads as hitching; desktop
  // keeps end snap so the rightmost photo sits flush. --snap-type none
  // so Blossom's !important rule stays off.
  assert.match(
    css,
    /@media \(max-width:\s*820px\)[\s\S]*\.detail-photo-list\s*\{[^}]*--snap-type:\s*none;[^}]*scroll-snap-type:\s*none;[^}]*overflow-x:\s*scroll;/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*820px\)[\s\S]*\.detail-photo-list li\s*\{[^}]*scroll-snap-align:\s*none;/s,
  );
});

test("event photos shimmer gray until each one decodes", () => {
  assert.match(
    app,
    /detail-photo-frame[^"]*relative[^"]*overflow-hidden[^"]*rounded-lg[^"]*"\s*\n\s*data-loaded=\{loadedPhotos\[photo\.src\] \? "true" : "false"\}/,
  );
  assert.match(app, /className="detail-photo-shimmer bg-skeleton"/);
  assert.match(app, /aria-hidden="true"/);
  // A cached photo can be complete before onLoad is attached.
  assert.match(app, /node\?\.complete && node\.naturalWidth > 0/);
  // A photo only gives up once the untransformed original has failed too.
  assert.match(
    app,
    /onError=\{\(event\) => \{\s*if \(!recoverImage\(event\.currentTarget\)\) \{\s*markPhotoLoaded\(photo\.src\);/,
  );
  assert.match(css, /--color-skeleton:/);
  assert.match(
    css,
    /\.detail-photo-frame\[data-loaded="false"\] \.detail-photo\s*\{[^}]*aspect-ratio:\s*var\(--photo-aspect,\s*3 \/ 4\);[^}]*opacity:\s*0;/s,
  );
  assert.match(
    css,
    /\.detail-photo-frame \.detail-photo\s*\{[^}]*aspect-ratio:\s*var\(--photo-aspect, auto\);/s,
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

test("clicking a gallery photo opens it in the lightbox at its own index", () => {
  assert.match(app, /import \{ GalleryLightbox \} from "\.\/GalleryLightbox"/);
  assert.match(
    app,
    /<button\s*\n\s*type="button"\s*\n\s*className="detail-photo-frame[^"]*"[\s\S]*?openLightbox\(\s*photoIndex % selectedPhotoRenders\.length/,
  );
  assert.match(
    app,
    /<GalleryLightbox\s*\n\s*photos=\{lightboxPhotos\}\s*\n\s*previews=\{selectedPhotoRenders\}\s*\n\s*index=\{lightboxIndex\}[\s\S]*?onIndexChange=\{setLightboxIndex\}\s*\n\s*onClose=\{closeLightbox\}/,
  );
  // The rail's thumbnail render would go soft blown up across the viewport.
  assert.match(
    app,
    /const lightboxPhotos = useMemo\([\s\S]*?sizedImageUrl\(url, \{ width: 1200/,
  );
  // Switching events swaps the whole gallery out from under the overlay.
  assert.match(
    app,
    /useEffect\(\(\) => \{\s*setLightboxIndex\(null\);\s*\}, \[selectedEvent\?\.id\]\)/,
  );
  // The frame is a button now, so it has to shed the default button chrome.
  assert.match(app, /detail-photo-frame[^"]*border-0 bg-transparent p-0/);
  assert.match(css, /\.detail-photo-frame\s*\{[^}]*cursor:\s*pointer;/s);
});

test("the lightbox is a light modal overlay driven by ghost icon buttons", () => {
  assert.match(lightbox, /createPortal\(/);
  assert.match(lightbox, /role="dialog"\s*\n\s*aria-modal="true"/);
  assert.match(lightbox, /bg-white\/88[\s\S]*backdrop-blur-md/);
  // Portaled onto body, which has no typeface — without this the caption
  // falls through to the system UI stack instead of Alte Haas Grotesk.
  assert.match(
    lightbox,
    /font-\['Alte_Haas_Grotesk',sans-serif\]/,
  );
  assert.match(app, /font-\['Alte_Haas_Grotesk',sans-serif\]/);
  assert.match(lightbox, /max-h-\[78vh\] max-w-\[88vw\]/);
  // Shadow sits on a wrapper outside the clipped photo so overflow + radius
  // cannot paint the event-cover inset edge.
  assert.match(
    lightbox,
    /inline-flex rounded-xl shadow-\[0_24px_64px_rgba\(0,0,0,0\.22\)\][\s\S]*?lightbox-frame[^"]*rounded-xl/,
  );
  assert.doesNotMatch(lightbox, /lightbox-frame[^"]*media-inset/);
  assert.doesNotMatch(
    lightbox,
    /lightbox-frame[^"]*overflow-hidden/,
  );
  assert.match(css, /\.lightbox-frame\s*\{[^}]*clip-path:\s*inset\(0 round 12px\);/s);

  // Close stays a ghost in the corner so it does not compete with the photo.
  // Arrow fills are owned in CSS (not IconButton solid) so both sides match.
  assert.match(
    lightbox,
    /aria-label="Close gallery"\s*\n\s*variant="ghost"/,
  );
  for (const label of ["Previous photo", "Next photo"]) {
    assert.match(
      lightbox,
      new RegExp(`aria-label="${label}"\\s*\\n\\s*variant="ghost"`),
      `${label} should be a ghost icon button with CSS-owned fill`,
    );
  }
  assert.match(
    css,
    /button\.lightbox-arrow-prev,\s*button\.lightbox-arrow-next\s*\{[^}]*background-color:\s*var\(--lightbox-arrow-bg\)\s*!important;/s,
  );
  assert.match(
    css,
    /--lightbox-arrow-bg:\s*color-mix\(\s*in oklab,\s*var\(--color-muted\) 18%,\s*var\(--color-surface\)\s*\);/s,
  );
  assert.doesNotMatch(
    css,
    /button\.lightbox-arrow-prev\s*\{[^}]*background(?:-color)?:\s*transparent/s,
  );
  // Hover darkening is fine-pointer only so a stuck :hover on touch cannot
  // leave one arrow darker than the other.
  assert.match(
    css,
    /@media \(hover:\s*hover\) and \(pointer:\s*fine\)\s*\{[\s\S]*?button\.lightbox-arrow-prev:hover:not\(:disabled\),\s*button\.lightbox-arrow-next:hover:not\(:disabled\)\s*\{[^}]*background-color:\s*var\(--lightbox-arrow-bg-press\)\s*!important;/s,
  );
  // Close sits in the corner; desktop arrows straddle the photo, and a phone
  // keeps them under the caption so a wide image cannot cover them.
  assert.match(
    lightbox,
    /className="absolute top-\[clamp\(16px,3vw,32px\)\] right-\[clamp\(16px,3vw,32px\)\] size-8"\s*\n\s*aria-label="Close gallery"/,
  );
  assert.match(lightbox, /className="lightbox-arrow lightbox-arrow-prev size-8"/);
  assert.match(lightbox, /className="lightbox-arrow lightbox-arrow-next size-8"/);
  assert.match(
    css,
    /button\.lightbox-arrow-prev\s*\{[^}]*left:\s*clamp\(12px,\s*3vw,\s*32px\);/s,
  );
  assert.match(
    css,
    /button\.lightbox-arrow-next\s*\{[^}]*right:\s*clamp\(12px,\s*3vw,\s*32px\);/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*520px\)\s*\{[\s\S]*?\.lightbox-arrows\s*\{[^}]*position:\s*static;[^}]*display:\s*flex;[^}]*justify-content:\s*center;/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*520px\)\s*\{[\s\S]*?\.lightbox-arrow-prev,\s*\.lightbox-arrow-next,\s*button\.lightbox-arrow-prev,\s*button\.lightbox-arrow-next\s*\{[^}]*position:\s*static;/s,
  );
  assert.match(lightbox, /disabled=\{!hasPrevious\}/);
  assert.match(lightbox, /disabled=\{!hasNext\}/);
  assert.match(lightbox, /const hasPrevious = isOpen && photos\.length > 1/);
  assert.match(lightbox, /const hasNext = isOpen && photos\.length > 1/);
  assert.doesNotMatch(lightbox, /hasPrevious = isOpen && index > 0/);
  assert.doesNotMatch(lightbox, /hasNext = isOpen && index < photos\.length - 1/);
  assert.match(
    lightbox,
    /onIndexChange\(\(index \+ direction \+ photos\.length\) % photos\.length\)/,
  );
  // A single photo has nowhere to step, so it keeps only the close control.
  assert.match(lightbox, /\{photos\.length > 1 \? \(/);
});

test("the lightbox never shows empty space while a photo loads", () => {
  // The rail's render is already decoded, so it paints on the first frame and
  // gives the frame the photo's real shape before the big render lands. The
  // same srcSet the rail used is what lets a retina cache hit paint instantly.
  assert.match(app, /previews=\{selectedPhotoRenders\}/);
  assert.match(
    lightbox,
    /const basePhoto = basePreview\?\.src \?\? photo/,
  );
  assert.match(lightbox, /srcSet=\{baseSrcSet\}/);
  assert.match(lightbox, /className="lightbox-photo[^"]*"\s*\n\s*key=\{basePhoto\}/);
  assert.match(lightbox, /\{basePhoto === photo \? null : \(/);
  // Same shimmer as the rail, for photos the reader never scrolled past. It
  // waits a beat so it never washes over a photo that is already on screen.
  assert.match(lightbox, /className="detail-photo-shimmer bg-skeleton"/);
  assert.match(lightbox, /const PLACEHOLDER_DELAY_MS = 120/);
  assert.match(
    lightbox,
    /data-placeholder=\{\s*isPlaceholderDue && !isBaseLoaded && !holding\s*\? "true"\s*: "false"\s*\}/,
  );
  assert.match(
    css,
    /\.lightbox-frame \.detail-photo-shimmer\s*\{[^}]*opacity:\s*0;[^}]*transition:\s*none;/s,
  );
  assert.match(
    css,
    /\.lightbox-frame\[data-placeholder="true"\] \.detail-photo-shimmer\s*\{[^}]*opacity:\s*1;/s,
  );
  // Stepping keeps the last painted photo up until the next one has pixels,
  // so a gray wash cannot replace a photo the reader is already looking at.
  assert.match(lightbox, /const holding = Boolean\(painted && !isBaseLoaded\)/);
  assert.match(lightbox, /lightbox-photo lightbox-photo-held/);
  assert.match(
    css,
    /\.lightbox-photo-held\.lightbox-photo-full\s*\{[^}]*opacity:\s*1;[^}]*transition:\s*none;/s,
  );
  assert.match(
    css,
    /\.lightbox-frame\[data-holding="true"\]\s*>\s*\.lightbox-photo:not\(\.lightbox-photo-held\)\s*\{[^}]*opacity:\s*0;/s,
  );
  assert.match(lightbox, /!url \|\| !node\?\.complete \|\| node\.naturalWidth <= 0/);
  assert.match(lightbox, /const baseImgRef = useRef<HTMLImageElement \| null>\(null\)/);
  assert.match(lightbox, /const fullImgRef = useRef<HTMLImageElement \| null>\(null\)/);
  assert.match(lightbox, /ref=\{baseImgRef\}/);
  assert.match(lightbox, /ref=\{fullImgRef\}/);
  assert.doesNotMatch(
    lightbox,
    /ref=\{\(node\) =>\s*basePhoto \? markLoadedIfComplete/,
  );
  assert.match(lightbox, /function readPhotoSize\(/);
  assert.match(lightbox, /image\.naturalWidth > 0 && image\.naturalHeight > 0/);
  assert.match(lightbox, /image\.getAttribute\("width"\)/);
  assert.match(lightbox, /"--lightbox-aspect": `\$\{frameSize\.width\} \/ \$\{frameSize\.height\}`/);
  assert.match(lightbox, /data-has-aspect=\{frameSize \? "true" : "false"\}/);
  // 3/4 is only the unknown-dimension fallback; a known landscape must not
  // sit in a forced portrait column while it decodes.
  assert.match(
    css,
    /\.lightbox-frame\[data-base-loaded="false"\] \.lightbox-photo,\s*\.lightbox-frame\[data-has-aspect="true"\] \.lightbox-photo\s*\{[^}]*aspect-ratio:\s*var\(--lightbox-aspect,\s*3 \/ 4\);[^}]*width:\s*min\(88vw,\s*calc\(78vh \* var\(--lightbox-aspect,\s*3 \/ 4\)\)\);/s,
  );
  assert.match(
    css,
    /\.lightbox-frame\[data-placeholder="true"\] \.lightbox-photo\s*\{[^}]*opacity:\s*0;/s,
  );
  assert.doesNotMatch(
    css,
    /\.lightbox-frame\[data-base-loaded="false"\] \.lightbox-photo\s*\{[^}]*opacity:\s*0;/s,
  );
  assert.doesNotMatch(
    css,
    /\.lightbox-frame\[data-base-loaded="false"\] \.lightbox-photo\s*\{[^}]*height:\s*78vh;/s,
  );
  assert.match(
    css,
    /\.lightbox-frame\[data-loaded="true"\] \.lightbox-photo-full\s*\{[^}]*opacity:\s*1;/s,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.lightbox-photo-full[\s\S]*?transition:\s*none;/,
  );
});

test("the lightbox answers the keyboard and hands focus back on close", () => {
  assert.match(lightbox, /event\.key === "Escape"[\s\S]*?onClose\(\)/);
  assert.match(lightbox, /event\.key === "ArrowLeft"[\s\S]*?step\(-1\)/);
  assert.match(lightbox, /event\.key === "ArrowRight"[\s\S]*?step\(1\)/);
  // Portaled past the page, so Tab has to be wrapped by hand.
  assert.match(lightbox, /event\.key !== "Tab"/);
  assert.match(lightbox, /returnFocusRef\.current = document\.activeElement/);
  assert.match(lightbox, /document\.body\.style\.overflow = "hidden"/);
  assert.match(
    lightbox,
    /returnFocusRef\.current\?\.focus\(\{ preventScroll: true \}\)/,
  );
  // Clicking anywhere off the photo closes; the photo, caption and controls
  // keep the overlay open.
  assert.match(
    lightbox,
    /if \(target\.closest\("img, figcaption, button, \.lightbox-arrows"\)\) return;\s*onClose\(\);/,
  );
});

// Stepping used to wait out the outgoing photo's exit before mounting the next
// one, so an arrow cost two animations before anything appeared.
test("stepping swaps a warmed photo instantly instead of cross-fading", () => {
  assert.doesNotMatch(lightbox, /mode="wait"/);
  assert.match(
    lightbox,
    /warmImages\(\[\s*photos\[index\],\s*wrap\(1\),\s*wrap\(-1\),/,
  );
  assert.match(lightbox, /const isPhotoWarm = isImageWarm\(photo\)/);
  assert.match(lightbox, /decoding=\{isPhotoWarm \? "sync" : "async"\}/);
  assert.doesNotMatch(lightbox, /<motion\.img/);
  // The reveal belongs to the overlay's arrival, not to every arrow press.
  assert.match(
    lightbox,
    /<motion\.figure[\s\S]*?: \{ opacity: 0, y: PHOTO_ENTRANCE_Y_PX \}[\s\S]*?animate=\{\{ opacity: 1, y: 0 \}\}/,
  );
  assert.match(
    lightbox,
    /const PHOTO_ENTRANCE_DURATION_S = 0\.42;\s*const PHOTO_ENTRANCE_Y_PX = 20;/,
  );
});

test("the lightbox keeps the event name stable under the photo", () => {
  assert.match(
    css,
    /\.lightbox-figure\s*\{[^}]*grid-template-rows:\s*78vh 20px;[^}]*gap:\s*1\.5rem;/s,
  );
  assert.match(
    lightbox,
    /<figcaption className="m-0 self-start text-center text-sm leading-5 text-muted">\s*\{title\}\s*<\/figcaption>/,
  );
  assert.match(app, /title=\{selectedEvent\.title\}/);
  assert.match(
    css,
    /@media \(max-width:\s*520px\)\s*\{[\s\S]*?\.lightbox-figure\s*\{[^}]*gap:\s*48px;/s,
  );
  assert.doesNotMatch(
    css,
    /@media \(max-width:\s*520px\)\s*\{[\s\S]*?\.lightbox-arrows\s*\{[^}]*margin-top:/s,
  );
});

// Chevrons sit on the frosted wash and need ink weight so both sides match;
// close stays muted in the corner so it does not compete with the photo.
test("lightbox controls use ink chevrons and a muted close", () => {
  assert.equal(lightbox.match(/tone="muted"/g)?.length, 1);
  assert.equal(lightbox.match(/tone="ink"/g)?.length, 2);
  assert.match(
    lightbox,
    /aria-label="Previous photo"\s*\n\s*variant="ghost"\s*\n\s*tone="ink"/,
  );
  assert.match(
    lightbox,
    /aria-label="Next photo"\s*\n\s*variant="ghost"\s*\n\s*tone="ink"/,
  );
  assert.match(
    lightbox,
    /aria-label="Close gallery"\s*\n\s*variant="ghost"\s*\n\s*tone="muted"/,
  );
  assert.match(
    iconButton,
    /muted: "text-muted hover:not-disabled:text-ink"/,
  );
  assert.match(iconButton, /transition-\[background-color,color,transform,opacity\]/);
});

test("lightbox arrows stay put when the photo frame sizes on open", () => {
  // Nested inside the Motion figure, absolute/fixed arrows used the growing
  // transformed figure as their containing block and slid outward on open.
  // They are siblings of the figure, pinned to the full-screen shell.
  const arrowsAt = lightbox.indexOf('className="lightbox-arrows"');
  const figureCloseAt = lightbox.indexOf("</motion.figure>");
  assert.ok(figureCloseAt >= 0, "expected the motion figure to close");
  assert.ok(
    arrowsAt > figureCloseAt,
    "arrows must mount after the figure so Motion's transform cannot contain them",
  );
  assert.match(lightbox, /className="lightbox-shell/);
  assert.match(
    css,
    /\.lightbox-arrows\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s,
  );
  assert.match(
    css,
    /button\.lightbox-arrow-prev,\s*button\.lightbox-arrow-next\s*\{[^}]*position:\s*absolute;[^}]*top:\s*0;[^}]*bottom:\s*0;[^}]*margin-block:\s*auto;/s,
  );
  assert.doesNotMatch(
    css,
    /button\.lightbox-arrow-prev,\s*button\.lightbox-arrow-next\s*\{[^}]*position:\s*fixed;/s,
  );
  assert.doesNotMatch(
    css,
    /button\.lightbox-arrow-prev,\s*button\.lightbox-arrow-next\s*\{[^}]*transform:\s*translateY\(-50%\)/s,
  );
  assert.match(
    css,
    /button\.lightbox-arrow-prev,\s*button\.lightbox-arrow-next\s*\{[^}]*transition-property:\s*background-color,\s*color,\s*opacity\s*!important;/s,
  );
});

test("event photo rail bleeds to the page edge under the title stack", () => {
  assert.match(
    app,
    /detail-photo-list[^"]*m-0[^"]*touch-pan-x[^"]*p-0/,
  );
  assert.doesNotMatch(
    app,
    /detail-photo-list[^"]*(?:left-1\/2|w-screen|-translate-x-1\/2)/,
  );
  // Start-side bleed to the viewport; photos sit on that edge with no spacer.
  // End side stops at the summary column.
  assert.match(
    css,
    /\.detail-photo-list\s*\{[^}]*--page-gutter:\s*clamp\(20px,\s*6vw,\s*96px\);[^}]*--page-gutter-start:\s*var\(--page-gutter\);[^}]*--page-gutter-end:\s*0px;[^}]*width:\s*calc\(100%\s*\+\s*var\(--page-gutter-start\)\s*\+\s*var\(--page-gutter-end\)\);/s,
  );
  assert.match(
    css,
    /\.detail-photo-list\s*\{[^}]*scroll-padding-inline:\s*0;/s,
  );
  assert.doesNotMatch(css, /\.detail-photo-list::before\s*\{/);
  assert.match(
    css,
    /\.detail-photo-list::after\s*\{[^}]*flex:\s*0 0 var\(--page-gutter-end\);[^}]*content:\s*"";/s,
  );
  // Mobile has no summary column beside the rail, so both gutters bleed and
  // the end spacer collapses so a photo can sit on the viewport edge.
  assert.match(
    css,
    /@media \(max-width:\s*820px\)[\s\S]*\.detail-photo-list\s*\{[^}]*--page-gutter-start:\s*var\(--page-gutter\);[^}]*--page-gutter-end:\s*var\(--page-gutter\);/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*820px\)[\s\S]*\.detail-photo-list::after\s*\{[^}]*flex-basis:\s*0;/s,
  );
});

test("event photo rail sits still until the reader moves it", () => {
  // One silent jump into the middle copy so wrap has room; images decoding
  // must not keep shoving the rail toward the last photo.
  assert.match(app, /const photoRailPlacedRef = useRef\(false\)/);
  assert.doesNotMatch(app, /pinPhotoRailToEndRef/);
  assert.doesNotMatch(app, /scrollPhotoRailToEnd/);
  assert.doesNotMatch(app, /photoRailPinnedScrollLeft/);
  assert.match(
    app,
    /if \(!photoRailPlacedRef\.current\) \{\s*jumpPhotoRailScroll\(\s*rail,\s*photoRailSeedScrollLeft\(\s*rail,\s*count,\s*align,\s*PHOTO_RAIL_LANDING_PAIR_EVENT_IDS\.has\(selectedEvent\?\.id \?\? ""\),\s*\),\s*\);\s*photoRailPlacedRef\.current = true;/,
  );
  assert.match(
    app,
    /useLayoutEffect\(\(\) => \{\s*photoRailPlacedRef\.current = false;/,
  );
  assert.match(
    app,
    /\[photoRailElement, selectedEvent\?\.id, view, updatePhotoRailBounds\]/,
  );
  // Wrap after a finished chevron ease, or after drag/trackpad idle.
  assert.match(app, /if \(photoRailAnimatingRef\.current\) return/);
  assert.match(app, /updatePhotoRailBounds\(photoRailElement, true\)/);
  assert.doesNotMatch(app, /const chevronGlide = photoRailAnimatingRef\.current/);
  assert.doesNotMatch(app, /const onScroll = \(\) => \{/);
  assert.match(app, /const updateBounds = \(\) => updatePhotoRailBounds\(photoRailElement\);/);
  assert.match(app, /if \(wrap && !photoRailAnimatingRef\.current\)/);
  // Blossom would animate scrollLeft assignments; wraps have to be instant.
  assert.match(app, /setProperty\("scroll-behavior", "auto", "important"\)/);
  assert.match(
    css,
    /\.detail-photo-list\s*\{[^}]*scroll-behavior:\s*auto;/s,
  );
  assert.doesNotMatch(app, /setInterval\(/);
});

test("event photo gallery gets a subtle responsive content gap", () => {
  assert.match(
    app,
    /className="detail-extras pt-\[var\(--detail-extra-gap\)\]"/,
  );
  assert.match(
    css,
    /\.events-layout\s*\{[^}]*--detail-extra-gap:\s*clamp\(8px,\s*0\.75vw,\s*13px\);/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\]\s*\{[^}]*--detail-extra-gap:\s*clamp\(4px,\s*0\.375vw,\s*6px\);/s,
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
  assert.match(
    app,
    /sponsor-logo overflow-hidden border-0 outline-none \$\{[\s\S]*?entrepreneurs-first[\s\S]*?rounded-full[\s\S]*?rounded-sm/,
  );
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
    /\.detail-grid\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);[^}]*column-gap:\s*clamp\(16px,\s*2vw,\s*28px\);[^}]*row-gap:\s*clamp\(20px,\s*3vw,\s*52px\);/s,
  );
  assert.match(
    css,
    /\.detail-primary\s*\{[^}]*grid-column:\s*1\s*\/\s*span 7;[^}]*grid-row:\s*1;/s,
  );
  assert.match(
    css,
    /\.detail-title\s*\{[^}]*grid-column:\s*1\s*\/\s*span 7;[^}]*grid-row:\s*1;/s,
  );
  assert.match(
    css,
    /\.detail-meta\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;[^}]*grid-row:\s*1;/s,
  );
  // The summary, the About lede, and the partner logos all share these columns.
  assert.match(css, /\.partner-logos\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;/s);
  // Gallery stacks under the title in the left column; the summary sits beside.
  assert.match(app, /<div className="detail-primary">/);
  assert.match(
    css,
    /\.detail-grid:has\(\.detail-extras\) \.detail-meta\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s,
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
  // The facts belong to the title block; CSS reorders date above the heading.
  assert.match(
    app,
    /<div className="detail-title">[\s\S]*?<\/h2>\s*<div className="detail-facts[^"]*"/,
  );
  assert.match(
    css,
    /\.detail-title\s*\{[^}]*flex-direction:\s*column;[^}]*gap:\s*clamp\(12px,\s*1\.2vw,\s*16px\);/s,
  );
  // Gap on the title owns the stack spacing; facts are display:contents.
  assert.match(app, /<div className="detail-facts">/);
  assert.doesNotMatch(app, /detail-facts[^"]*\bpt-\[/);
  assert.doesNotMatch(app, /detail-facts[^"]*\bmt-\[/);
  assert.match(
    app,
    /<div className="detail-meta">\s*<ExpandableSummary/,
  );
});

test("grid view pairs the covers and the detail into a master/detail split", () => {
  assert.match(app, /<div className="events-layout" data-view=\{view\}>/);
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\]\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*5fr\)\s+minmax\(0,\s*7fr\)/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\]\s*\{[^}]*grid-template-rows:\s*auto auto;/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\]\s*\{[^}]*align-items:\s*start;/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] > \.gallery-toolbar\s*\{[^}]*grid-column:\s*1 \/ span 2;[^}]*grid-row:\s*1;/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] > \.gallery-section\s*\{[^}]*grid-column:\s*2;[^}]*grid-row:\s*2;/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] > \.event-detail\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*2;/s,
  );
  // Same top inset as the detail column so the first covers line up with the cover.
  assert.match(
    app,
    /gallery-grid[^"]*pt-\[clamp\(32px,4vw,64px\)\]/,
  );
  assert.match(
    app,
    /event-detail[^"]*pt-\[clamp\(32px,4vw,64px\)\]/,
  );
  // Matching bottom inset, so the covers stop where the detail's copy stops.
  assert.match(
    app,
    /event-detail[^"]*pb-\[clamp\(56px,9vw,128px\)\]/,
  );
  assert.match(
    app,
    /gallery-grid[^"]*pb-\[clamp\(56px,9vw,128px\)\]/,
  );
  // Detail stacks into one column instead of its own 12-column split.
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*row-gap:\s*clamp\(28px,\s*2\.8vw,\s*44px\);/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-primary\s*\{[^}]*display:\s*contents;/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-title,\s*\.events-layout\[data-view="grid"\] \.detail-meta,\s*\.events-layout\[data-view="grid"\] \.detail-extras,\s*\.events-layout\[data-view="grid"\] \.detail-grid:has\(\.detail-extras\) \.detail-meta\s*\{[^}]*grid-column:\s*auto/s,
  );
  // Same rail as carousel: bleed off the left page edge, flush on the right.
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-photo-list\s*\{[^}]*--page-gutter-start:\s*var\(--page-gutter\);[^}]*--page-gutter-end:\s*0px/s,
  );
  assert.doesNotMatch(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-photo-list\s*\{[^}]*--page-gutter:\s*0px/s,
  );
  assert.doesNotMatch(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-photo-list\s*\{[^}]*display:\s*grid;[^}]*grid-template-rows:\s*auto auto/s,
  );
  // Same end-snap as carousel: a photo sits flush on the right, leftover
  // hangs off the left, chevrons stay at the end of the rail.
  assert.doesNotMatch(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-photo-list li\s*\{[^}]*scroll-snap-align:\s*start/s,
  );
  assert.doesNotMatch(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-photo-arrows\s*\{[^}]*justify-content:\s*flex-start/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-photo\s*\{[^}]*height:\s*clamp\(150px,\s*46vw,\s*200px\)/s,
  );
  assert.match(
    css,
    /@media \(min-width: 821px\)\s*\{\s*\.events-layout\[data-view="grid"\] \.detail-photo\s*\{[^}]*height:\s*clamp\(220px,\s*18vw,\s*288px\)/s,
  );
  assert.doesNotMatch(app, /selectedPhotoRenders\.length % 2 === 1/);
  assert.doesNotMatch(app, /-\$\{copy\}-pad/);
  // One page gutter between the columns rather than two stacked ones.
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] > \.gallery-section\s*\{[^}]*margin-left:\s*calc\(0px - clamp\(20px,\s*6vw,\s*96px\)\)/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.events-layout\[data-view="grid"\]\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.events-layout\[data-view="grid"\] > \.gallery-section\s*\{[^}]*margin-left:\s*0/s,
  );
});

test("the cover grid stands at its full height rather than scrolling in a box", () => {
  // Nothing wraps the covers in a scrollport or takes the column out of flow,
  // so every cover stays whole and the page is what scrolls.
  assert.doesNotMatch(css, /\.event-grid-scroll\b/);
  assert.doesNotMatch(css, /\.event-grid-viewport\b/);
  assert.doesNotMatch(app, /event-grid-scroll|event-grid-viewport/);
  assert.doesNotMatch(
    css,
    /\.events-layout\[data-view="grid"\] > \.gallery-section > \.scroll-reveal\s*\{[^}]*position:\s*absolute/s,
  );
  // Four columns fill the pack's own column; nothing caps them short of it.
  assert.match(css, /\.event-grid\s*\{[^}]*width:\s*100%;/s);
  assert.doesNotMatch(css, /\.event-grid\s*\{[^}]*max-width:/s);
});

test("desktop photo rail and cover grid fade off the left edge", () => {
  assert.doesNotMatch(app, /gridEdges|data-fade-top|data-fade-bottom/);
  assert.doesNotMatch(app, /data-fade-left=/);
  assert.doesNotMatch(app, /data-fade-right=/);
  assert.doesNotMatch(css, /\.detail-photo-viewport\[data-fade-right\]/);
  // Viewport, not the scrolling list, so the wash stays pinned to the page.
  // Resting carousel fade (45% → 18%), not the hover wash (opaque + blur).
  assert.match(
    css,
    /@media \(min-width:\s*821px\)\s*\{[\s\S]*?\.detail-photo-viewport::before,\s*\.gallery-grid::before\s*\{[^}]*width:\s*clamp\(64px,\s*13vw,\s*220px\);/s,
  );
  assert.match(
    css,
    /\.detail-photo-viewport::before,\s*\.gallery-grid::before\s*\{[^}]*background-image:\s*linear-gradient\(\s*to right,\s*color-mix\(in oklab,\s*var\(--color-surface\) 45%,\s*transparent\) 20%,\s*color-mix\(in oklab,\s*var\(--color-surface\) 18%,\s*transparent\) 55%/s,
  );
  assert.doesNotMatch(
    css,
    /\.detail-photo-viewport::before,\s*\.gallery-grid::before\s*\{[^}]*backdrop-filter/s,
  );
  assert.match(
    css,
    /\.detail-photo-viewport::before\s*\{[^}]*left:\s*calc\(0px - clamp\(20px,\s*6vw,\s*96px\)\);/s,
  );
  assert.match(
    css,
    /\.gallery-grid::before\s*\{[^}]*left:\s*0;/s,
  );
  // Flush on the right; no matching end wash.
  assert.doesNotMatch(css, /\.detail-photo-viewport::after/);
  assert.doesNotMatch(css, /\.gallery-grid::after/);
  assert.doesNotMatch(
    css,
    /\.detail-photo-list::before[^{]*\{[^}]*backdrop-filter/s,
  );
});

test("grid view opens the detail with the event cover at carousel size", () => {
  // The slot holds the cover (and the Luma label under it); the frame itself
  // still paints at the focused card's size.
  assert.match(
    app,
    /\{view === "grid" \? \(\s*<div className="detail-cover-slot">/,
  );
  assert.match(app, /const DETAIL_COVER_FRAME =\s*"detail-cover aspect-square/);
  assert.match(
    app,
    /\{\.\.\.sizedImage\(selectedEvent\.image_url, \{ width: 280, quality: 76 \}\)/,
  );
  // Sits above the title and centred, at the size the focused card paints.
  assert.match(
    app,
    /<\/div>\s*\) : null\}\s*<div className="detail-primary">/,
  );
  assert.match(
    css,
    /\.detail-cover-slot\s*\{[^}]*width:\s*min\(100%, calc\(var\(--event-cover-size\) \* 1\.03\)\);[^}]*margin-inline:\s*auto;/s,
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

test("long event summaries collapse with an accessible expansion control", () => {
  assert.match(css, /\.detail-summary-clamp\s*\{[^}]*max-height:\s*560px;/s);
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-summary-clamp:not\(\[data-expanded\]\)\s*\{[^}]*max-height:\s*220px;/s,
  );
  // Phone stacks the summary above the photos; keep it short so the gallery
  // isn't pushed below the fold.
  assert.match(
    css,
    /@media \(max-width:\s*820px\)[\s\S]*\.detail-summary-clamp:not\(\[data-expanded\]\)\s*\{[^}]*max-height:\s*160px;/s,
  );
  assert.match(
    app,
    /<Link[\s\S]*aria-expanded=\{isExpanded\}[\s\S]*aria-controls=\{contentId\}[\s\S]*onClick=\{toggleExpanded\}[\s\S]*>\s*\{isExpanded \? "See less" : "See more"\}\s*<\/Link>/,
  );
  // The rail's box ends on the size-8 chevron hit targets; the label's line
  // box has to end on the glyphs, or stretch hangs "See more" on the chrome
  // instead of the SVG path bottoms. Keep the nudge light so the label
  // doesn't float above the arrow row.
  assert.doesNotMatch(
    app,
    /detail-photo-list[^"]*\bpb-2\.5\b/,
  );
  assert.match(app, /className="mt-6 shrink-0 leading-none -translate-y-1\.5"/);
  // Inline frames leave a descender gap under the photos; that extra height
  // is what the summary column stretches to, so See more hangs a tad low.
  assert.match(
    app,
    /<li[\s\S]*?className="leading-none"[\s\S]*?data-blossom-slide=""/,
  );
  assert.doesNotMatch(
    css,
    /\.detail-photo-list li\s*\{[^}]*line-height:\s*0;/s,
  );
  // Compare the copy to the collapsed box, not the expanded one — expanding
  // grows the clamp to the content and would hide "See less".
  assert.match(app, /if \(isExpanded\) return;/);
  assert.match(app, /content\.scrollHeight > clamp\.clientHeight \+ 1/);
  assert.match(
    app,
    /bg-gradient-to-b from-surface\/0 via-surface\/80 to-surface/,
  );
  // A taller fade washes out several readable lines, so the softening stays
  // shallow enough to only touch the last line of the clamped copy.
  assert.match(app, /bottom-0 h-16 bg-gradient-to-b/);
  assert.doesNotMatch(app, /backdrop-blur/);
});

test("the collapsed summary does not inflate the title and gallery rows", () => {
  // height: 0 / min-height: 100% lets the summary column take the left stack's
  // height without feeding its copy back into that row.
  assert.match(
    css,
    /\.events-layout:not\(\[data-view="grid"\]\)[\s\S]*\.detail-meta\s*\{[^}]*height:\s*0;[^}]*min-height:\s*100%;/s,
  );
  assert.match(
    css,
    /\.events-layout:not\(\[data-view="grid"\]\)[\s\S]*\.detail-summary-clamp:not\(\[data-expanded\]\)\s*\{[^}]*max-height:\s*none;/s,
  );
  // Desktop carousel only: a tad of air above the summary copy.
  assert.match(
    css,
    /@media \(min-width:\s*821px\)[\s\S]*\.events-layout:not\(\[data-view="grid"\]\) \.detail-summary\s*\{[^}]*margin-top:\s*0\.375rem;/s,
  );
});

test("expanding the summary grows downward without moving the gallery", () => {
  assert.match(
    css,
    /\.events-layout:not\(\[data-view="grid"\]\)[\s\S]*\.detail-grid:has\(\.detail-summary-clamp\[data-expanded\]\)\s*\{[^}]*align-items:\s*start;/s,
  );
});

test("collapsing a long summary scrolls back to its top, honouring reduced motion", () => {
  assert.match(app, /const containerRef = useRef<HTMLDivElement \| null>\(null\)/);
  assert.match(app, /<div className="detail-summary-shell relative" ref=\{containerRef\}>/);
  assert.match(
    app,
    /const toggleExpanded = useCallback\(\(\) => \{[\s\S]*if \(isExpanded && container\)[\s\S]*window\.scrollTo\(\{[\s\S]*behavior: reduceMotion \? "auto" : "smooth"/,
  );
  // Readers who are already above the summary should stay put.
  assert.match(app, /if \(top < SUMMARY_COLLAPSE_SCROLL_MARGIN\)/);
});

test("event detail body copy uses ink with no uppercase gray labels", () => {
  assert.match(
    app,
    /"detail-summary max-w-\[62ch\] text-base leading-\[1\.7\] text-ink"/,
  );
  assert.doesNotMatch(app, /\buppercase\b/);
  assert.doesNotMatch(app, /\btext-gray-400\b/);
  assert.doesNotMatch(css, /--color-body/);
});

test("event metadata reads as two rows: facts, then sponsor pills", () => {
  const facts = app.match(
    /<div className="detail-facts[\s\S]*?\n {16}<\/div>/,
  )?.[0];
  assert.ok(facts, "expected a detail-facts block");

  // Row one is plain text, not pills. Classes let CSS reorder them into
  // date / title / city across carousel, grid, and phone.
  assert.match(
    facts,
    /<p className="detail-fact-line m-0 flex flex-wrap items-baseline gap-x-4 text-base leading-6">\s*\{selectedEvent\.location \? \(\s*<span className="detail-place text-muted">\s*<span className="sr-only">Location: /,
  );
  assert.match(
    facts,
    /<span className="detail-date text-subtle">\s*<span className="sr-only">Date: <\/span>\s*\{selectedEvent\.date_label\}/,
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
    /\.detail-facts,\s*\.detail-fact-line\s*\{\s*display:\s*contents;/s,
  );
  assert.match(css, /\.detail-chips\s*\{\s*display:\s*flex;/s);
});

test("View on Luma sits under the cover rather than in the facts", () => {
  // The cover itself opens Luma; the hint is a caption under it, not a link.
  assert.match(
    app,
    /aria-label=\{`Open \$\{selectedEvent\.title\} on Luma`\}/,
  );
  assert.match(app, /onClick=\{\(\) => openLuma\(detailLumaUrl\)\}/);
  assert.match(
    app,
    /className="cover-luma-hint text-medium text-base text-muted"\s*aria-hidden\s*>\s*View on Luma\s*<ArrowUpRightIcon \/>/,
  );
  assert.doesNotMatch(
    app,
    /<Link[^>]*href=\{selectedEvent\.luma_url\}[^>]*>[\s\S]*View on Luma/,
  );
  assert.doesNotMatch(app, /<Chip[^>]*href=\{selectedEvent\.luma_url\}/);
  assert.doesNotMatch(
    app,
    /<Primary[\s\S]*href=\{selectedEvent\.luma_url\}[\s\S]*>[\s\S]*View on Luma/,
  );
  assert.doesNotMatch(app, /detail-facts[\s\S]*View on Luma/);
});

test("grid view stacks detail as date, title, then city", () => {
  // Shared with carousel and phone: the title flex owns the date / title / place
  // stack so every layout reads the date as an eyebrow.
  assert.match(
    css,
    /\.detail-title\s*\{[^}]*flex-direction:\s*column;/s,
  );
  assert.match(
    css,
    /\.detail-facts,\s*\.detail-fact-line\s*\{\s*display:\s*contents;/s,
  );
  assert.match(
    css,
    /\.detail-date\s*\{\s*order:\s*1;/s,
  );
  assert.match(
    css,
    /\.detail-title > h2\s*\{\s*order:\s*2;/s,
  );
  assert.match(
    css,
    /\.detail-place\s*\{\s*order:\s*3;/s,
  );
  assert.match(
    css,
    /\.detail-facts > \*\s*\{\s*order:\s*4;/s,
  );
  assert.match(
    css,
    /\.events-layout\[data-view="grid"\] \.detail-chips\s*\{\s*display:\s*none;/s,
  );
});

test("carousel view also stacks date above the event name", () => {
  assert.match(
    css,
    /\.detail-date\s*\{\s*order:\s*1;[^}]*margin-bottom:\s*-4px;/s,
  );
  assert.match(
    css,
    /\.detail-title > h2\s*\{\s*order:\s*2;/s,
  );
  assert.match(
    css,
    /\.detail-place\s*\{\s*order:\s*3;/s,
  );
});

test("View on Luma is a link rather than a pill", () => {
  assert.match(
    app,
    /aria-label=\{`Open \$\{selectedEvent\.title\} on Luma`\}/,
  );
  assert.match(app, /onClick=\{\(\) => openLuma\(detailLumaUrl\)\}/);
  assert.match(
    app,
    /className="cover-luma-hint text-medium text-base text-muted"\s*aria-hidden\s*>\s*View on Luma\s*<ArrowUpRightIcon \/>/,
  );
  assert.doesNotMatch(
    app,
    /<Link[^>]*href=\{selectedEvent\.luma_url\}[^>]*>[\s\S]*View on Luma/,
  );
  assert.doesNotMatch(app, /<Chip[^>]*href=\{selectedEvent\.luma_url\}/);
  assert.doesNotMatch(
    app,
    /<Primary[\s\S]*href=\{selectedEvent\.luma_url\}[\s\S]*>[\s\S]*View on Luma/,
  );
  assert.doesNotMatch(
    app,
    /detail-facts[\s\S]*View on Luma/,
  );
  assert.match(
    app,
    /import \{ ArrowUpRightIcon \} from "\.\/icons\/ArrowUpRightIcon"/,
  );
  assert.match(app, /import \{ Chip \} from "\.\/Chip"/);
  assert.doesNotMatch(app, /<span aria-hidden="true">↗<\/span>/);
  // Once in the rail, once under the ticker, once under the grid detail cover.
  assert.equal((app.match(/View on Luma/g) ?? []).length, 3);
});

test("the phone View on Luma caption opens the event", () => {
  // Desktop: the cover is the control and the under-cover words are a caption.
  // Phone: those words sit under the ticks, so they have to be a control too —
  // shared Link owns the pointer affordance (HomePage must not hand-roll it).
  assert.match(
    app,
    /<Link\s+className="gallery-luma-hint"\s+href=\{detailLumaUrl\}\s+target="_blank"\s+rel="noopener noreferrer"/,
  );
  assert.doesNotMatch(
    app,
    /className="gallery-luma-hint[^"]*"\s*aria-hidden/,
  );
  assert.doesNotMatch(app, /gallery-luma-hint[^"]*\bcursor-pointer\b/);
  assert.match(
    css,
    /\.gallery-luma-hint\s*\{[^}]*display:\s*none;/,
  );
  assert.doesNotMatch(
    css,
    /\.gallery-luma-hint\s*\{[^}]*pointer-events:\s*none;/,
  );
  assert.match(
    css,
    /@media \(max-width:\s*820px\)[\s\S]*\.gallery-luma-hint\s*\{[^}]*display:\s*inline-flex;/,
  );
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

// On a phone the date reads as the title's eyebrow rather than a caption under
// it, using the same shared stack as carousel and grid.
test("the date sits above the event name on mobile", () => {
  const phone = css.match(/@media \(max-width: 820px\)\s*\{[\s\S]*$/)[0];
  assert.match(phone, /\.detail-title\s*\{[^}]*order:\s*1;/s);
  assert.match(phone, /\.detail-title\s*\{[^}]*gap:\s*10px;/s);
  assert.match(phone, /\.detail-date\s*\{[^}]*margin-bottom:\s*-3px;/s);
  // Shared stack rules live outside the phone query.
  assert.match(
    css,
    /\.detail-facts,\s*\.detail-fact-line\s*\{\s*display:\s*contents;/s,
  );
  assert.match(css, /\.detail-date\s*\{\s*order:\s*1;/s);
  assert.match(css, /\.detail-title > h2\s*\{\s*order:\s*2;/s);
  assert.match(css, /\.detail-place\s*\{\s*order:\s*3;/s);
  assert.match(css, /\.detail-facts > \*\s*\{\s*order:\s*4;/s);
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
  assert.match(app, /detail-photo[^`]*rounded-lg border-0/);
  assert.match(app, /sponsor-logo overflow-hidden border-0 outline-none/);
});

test("nonselected covers blend against a white underlay so they look lighter", () => {
  assert.match(app, /event-card[^"]*bg-white/);
  assert.doesNotMatch(
    css,
    /\.event-card\s*\{[^}]*background:\s*oklch\(35%/s,
  );
  // The cover pseudo-elements carry the inset hairline and the hover hit pad,
  // so they may exist; what they must never do again is wash a tint over the
  // artwork, which is what made nonselected covers read as muddy.
  const coverPseudoRules =
    css.match(
      /[^{}]*\.event-card[^{}]*::(?:before|after)[^{}]*\{[^}]*\}/gs,
    ) ?? [];

  assert.ok(coverPseudoRules.length > 0);
  for (const rule of coverPseudoRules) {
    assert.doesNotMatch(rule, /background|backdrop-filter|mix-blend-mode/);
  }
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
