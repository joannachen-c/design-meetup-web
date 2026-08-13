import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(
  new URL("../src/components/HomePage.tsx", import.meta.url),
  "utf8",
);
const marquee = await readFile(
  new URL("../src/components/PhotoMarquee.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

const marqueeCss =
  css.match(
    /\/\* Full-bleed autoscroll strip[\s\S]*?@keyframes photo-marquee\s*\{[\s\S]*?\}/,
  )?.[0] ?? "";

test("photo marquee sits after the apply section and before the footer", () => {
  assert.match(app, /import \{ PhotoMarquee \} from "\.\/PhotoMarquee"/);
  assert.match(
    app,
    /id="apply"[\s\S]*<\/section>\s*<PhotoMarquee events=\{events\} \/>\s*<SiteFooter \/>/,
  );
});

test("photo marquee is a decorative autoscroll strip with no manual scroll", () => {
  assert.match(marquee, /aria-hidden="true"/);
  assert.match(marquee, /pointer-events-none/);
  assert.match(marquee, /IntersectionObserver/);
  assert.doesNotMatch(marquee, /overflow-x:\s*auto|overflow-x-auto|overflow-x:\s*scroll/);
  assert.doesNotMatch(marquee, /aria-controls|Previous|Next|scrollBy|scrollTo/);
  assert.doesNotMatch(marqueeCss, /overflow-x:\s*auto|overflow-x:\s*scroll/);
  assert.match(css, /\.photo-marquee\s*\{[^}]*pointer-events:\s*none;/s);
  assert.match(
    css,
    /\.photo-marquee-viewport\s*\{[^}]*overflow:\s*hidden;/s,
  );
});

test("photo marquee animation is a linear transform loop", () => {
  assert.match(
    css,
    /\.photo-marquee-track\s*\{[^}]*animation:\s*photo-marquee[^;]*linear infinite;/s,
  );
  assert.match(
    css,
    /@keyframes photo-marquee\s*\{[^}]*transform:\s*translateX\(-50%\)/s,
  );
  assert.doesNotMatch(marqueeCss, /animation:[^;]*(width|left|margin)/);
  assert.match(
    css,
    /\.photo-marquee-track\[data-paused\]\s*\{[^}]*animation-play-state:\s*paused;/s,
  );
});

test("photo marquee stops for reduced motion", () => {
  assert.match(marquee, /useReducedMotion/);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.photo-marquee-track\s*\{[^}]*animation:\s*none;/s,
  );
});

test("photo marquee tiles are three-quarters the original square size", () => {
  assert.match(
    css,
    /\.photo-marquee-item\s*\{[^}]*width:\s*min\(282\.75px,\s*54vw\);[^}]*height:\s*min\(282\.75px,\s*54vw\);/s,
  );
  assert.match(marquee, /MARQUEE_PHOTO_RENDER = \{ width: 283,/);
});

test("photo marquee has no edge fades or drop shadows", () => {
  assert.doesNotMatch(marqueeCss, /::before|::after|mask-image|backdrop-filter/);
  assert.doesNotMatch(marqueeCss, /box-shadow|drop-shadow|filter:/);
  assert.doesNotMatch(marquee, /shadow-|drop-shadow/);
});

test("photo marquee uses meetup photos with gallery rounding on the surface", () => {
  assert.match(marquee, /gallery_images/);
  assert.match(marquee, /photo-marquee-photo[^"]*rounded-md/);
  // Bottom padding matches the footer's top padding so the hairline sits
  // centered between the strip and the contact block.
  assert.match(
    marquee,
    /className="photo-marquee bg-surface pt-12 pb-\[clamp\(48px,6\.5vw,96px\)\]"/,
  );
  assert.match(marquee, /sizedImage\(url, MARQUEE_PHOTO_RENDER\)/);
  assert.match(marquee, /photo-marquee-set m-0 flex gap-5 pr-5/);
});

test("photo marquee prepends the extra restaurant photo ahead of event galleries", () => {
  assert.match(marquee, /const EXTRA_MARQUEE_PHOTOS = \["\/marquee\/IMG_9707\.jpg"\]/);
  assert.match(marquee, /for \(const url of EXTRA_MARQUEE_PHOTOS\) take\(url\)/);
});

test("photo marquee includes shared gallery placeholders the recap rail still hides", () => {
  assert.match(marquee, /function isPlaceholderPhoto/);
  assert.match(
    marquee,
    /if \(isPlaceholderPhoto\(image\.image_url\)\) take\(image\.image_url\)/,
  );
  assert.doesNotMatch(
    marquee,
    /!url\.includes\("\/placeholders\/"\)/,
  );
  assert.match(app, /filter\(\(url\) => !url\.includes\("\/placeholders\/"\)\)/);
});
