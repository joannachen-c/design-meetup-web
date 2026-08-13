import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const footer = await readFile(
  new URL("../src/components/SiteFooter.tsx", import.meta.url),
  "utf8",
);
const home = await readFile(
  new URL("../src/components/HomePage.tsx", import.meta.url),
  "utf8",
);
const designSystem = await readFile(
  new URL("../src/DesignSystem.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const primary = await readFile(
  new URL("../src/components/Primary.tsx", import.meta.url),
  "utf8",
);
const input = await readFile(
  new URL("../src/components/Input.tsx", import.meta.url),
  "utf8",
);
const partnerForm = await readFile(
  new URL("../src/components/PartnerContactForm.tsx", import.meta.url),
  "utf8",
);
const scrollReveal = await readFile(
  new URL("../src/components/ScrollReveal.tsx", import.meta.url),
  "utf8",
);
const newsletterForm = await readFile(
  new URL("../src/components/NewsletterForm.tsx", import.meta.url),
  "utf8",
);
const socialIcons = await readFile(
  new URL("../src/components/icons/SocialIcons.tsx", import.meta.url),
  "utf8",
);

test("footer uses the existing logo on the shared twelve-column grid", () => {
  assert.match(footer, /className="[^"]*\bfooter-logo\b[^"]*"/);
  assert.match(footer, /src="\/design-meetup-logo\.svg"/);
  assert.match(footer, /<h2[^>]*>\s*Contact\s*<\/h2>/);
  assert.match(footer, /contactdesignmeetup@gmail\.com/);
  assert.match(footer, /Substack/);
  assert.match(footer, /label: "Instagram"/);
  assert.match(footer, /label: "LinkedIn"/);
  assert.match(footer, /label: "X"/);
  assert.match(footer, /aria-label=\{label\}/);
  assert.match(footer, /Join the newsletter/);
  assert.match(
    css,
    /footer\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);[^}]*column-gap:\s*clamp\(16px,\s*2vw,\s*28px\);/s,
  );
  assert.match(css, /\.footer-brand\s*\{[^}]*grid-column:\s*1\s*\/\s*span 4;/s);
  assert.match(css, /\.footer-contact\s*\{[^}]*grid-column:\s*6\s*\/\s*span 3;/s);
  assert.match(css, /\.footer-newsletter\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;/s);
});

test("a hairline opens the footer on the shared page gutters", () => {
  assert.match(
    footer,
    /<footer[\s\S]*?className="[^"]*\brelative\b[^"]*\bpx-\[clamp\(20px,6vw,96px\)\]/,
  );
  assert.match(
    footer,
    /<div\s+aria-hidden="true"\s+className="[^"]*\babsolute\b[^"]*\binset-x-\[clamp\(20px,6vw,96px\)\][^"]*\btop-0\b[^"]*\bh-px\b[^"]*\bbg-skeleton\b[^"]*"\s*\/>/,
  );

  // A border on the footer itself would run edge to edge past the gutters.
  assert.doesNotMatch(footer, /<footer[^>]*className="[^"]*\bborder-t\b/);
});

test("footer logo destination depends on the page that renders it", () => {
  assert.match(
    footer,
    /logoHref = "\/design-system"/,
  );
  assert.match(
    footer,
    /logoAriaLabel = "Design Meetup design system"/,
  );
  assert.match(
    footer,
    /aria-label=\{logoAriaLabel\}[\s\S]*?className="[^"]*\bfooter-logo\b[^"]*"[\s\S]*?href=\{logoHref\}/,
  );
  const logoAnchor =
    footer.match(
      /<a\s+aria-label=\{logoAriaLabel\}[\s\S]*?className="[^"]*\bfooter-logo\b[^"]*"[\s\S]*?<\/a>/,
    )?.[0] ?? "";
  assert.match(logoAnchor, /href=\{logoHref\}/);
  assert.doesNotMatch(logoAnchor, /instagram\.com/);
  assert.match(home, /import \{ SiteFooter \} from "\.\/SiteFooter"/);
  assert.match(home, /<SiteFooter \/>/);
  assert.match(
    designSystem,
    /import \{ SiteFooter \} from "\.\/components\/SiteFooter"/,
  );
  assert.match(
    designSystem,
    /<SiteFooter\s+logoHref="\/"\s+logoAriaLabel="Design Meetup home"\s+hideDesignSystemPromo\s+\/>/,
  );
});

test("footer logo is a vector that fills its four-column track", async () => {
  await access(new URL("../public/design-meetup-logo.svg", import.meta.url));
  const svg = await readFile(
    new URL("../public/design-meetup-logo.svg", import.meta.url),
    "utf8",
  );

  // A fixed pixel size would stop the mark from tracking the grid, and a
  // raster source would soften it at this scale.
  assert.match(svg, /viewBox="0 0 (\d+) \1"/);
  assert.doesNotMatch(svg, /<image\b/);
  assert.match(css, /\.footer-logo\s*\{[^}]*width:\s*100%;[^}]*aspect-ratio:\s*1;/s);
  assert.doesNotMatch(css, /\.footer-logo\s*\{[^}]*width:\s*128px;/s);
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.footer-logo\s*\{[^}]*max-width:\s*min\(32vw,\s*130px\);/s,
  );
});

test("footer logo bleeds off the bottom edge", () => {
  // The brand cell reserves less height than the mark, and the footer clips the
  // remainder, so the circle runs off the bottom edge.
  assert.match(css, /footer\s*\{[^}]*overflow:\s*clip;/s);
  assert.match(css, /\.footer-brand\s*\{[^}]*position:\s*relative;[^}]*aspect-ratio:\s*100 \/ 45;/s);
  assert.match(css, /\.footer-logo\s*\{[^}]*position:\s*absolute;/s);

  // The credit keeps out of the brand columns so the mark cannot cover it.
  assert.match(css, /\.footer-credit\s*\{[^}]*grid-column:\s*6\s*\/\s*span 7;/s);

  // Stacked mobile footer keeps the mark whole instead.
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.footer-brand\s*\{[^}]*position:\s*static;[^}]*aspect-ratio:\s*auto;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.footer-logo\s*\{[^}]*position:\s*static;/s,
  );
});

test("footer logo pops up from below on every scroll into view", () => {
  assert.match(footer, /<ScrollReveal className="footer-brand" repeat>/);
  // The reveal rewinds once the mark is fully past the viewport, so the pop
  // replays instead of firing once per page load.
  assert.match(scrollReveal, /repeat = false/);
  assert.match(scrollReveal, /if \(!repeat\) observation\.stop\(\)/);
  assert.match(
    scrollReveal,
    /if \(repeat\) element\.classList\.remove\("is-visible"\)/,
  );
  // The pop starts 40px before the mark reaches the viewport, which is also the
  // gap that keeps the rewind off the boundary the reveal fires at.
  assert.match(scrollReveal, /\{ margin: 40 \}/);

  // Only the mark animates; the wrapper would otherwise add a second offset.
  assert.match(
    css,
    /\.footer-brand\.scroll-reveal\s*\{[^}]*transform:\s*none;[^}]*transition:\s*none;/s,
  );
  assert.match(
    css,
    /\.footer-logo\s*\{[^}]*opacity:\s*0;[^}]*transform:\s*translateY\(clamp\([^)]*\)\)\s*scale\(0\.96\);/s,
  );
  assert.match(
    css,
    /\.footer-brand\.is-visible \.footer-logo\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*translateY\(0\)\s*scale\(1\);/s,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.footer-logo\s*\{[^}]*transition:\s*none;/s,
  );
});

test("footer logo lifts slightly on desktop hover only", () => {
  // translate stays off the entrance transform so the pop-in curve is untouched.
  assert.match(css, /\.footer-logo\s*\{[^}]*translate:\s*0 0;[^}]*translate 150ms ease-out;/s);
  assert.match(
    css,
    /@media \(hover: hover\) and \(pointer: fine\)\s*\{[^}]*\.footer-brand\.is-visible \.footer-logo:hover\s*\{[^}]*translate:\s*0 -3px;/s,
  );
});

test("footer contact links use the official destinations", () => {
  assert.match(
    footer,
    /href="mailto:contactdesignmeetup@gmail\.com"[\s\S]*?>[\s\S]*?contactdesignmeetup@gmail\.com[\s\S]*?<ArrowUpRightIcon[\s\S]*?<\/a>/,
  );
  for (const [label, href] of [
    ["Substack", "https://designmeetup.substack.com/"],
    ["Instagram", "https://www.instagram.com/designmeetup/"],
    ["LinkedIn", "https://www.linkedin.com/company/design-meetup/"],
    ["X", "https://x.com/designmeetuphq"],
  ]) {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      footer,
      new RegExp(`label: "${label}",\\s*href: "${escapedHref}",`),
    );
  }
  assert.match(
    footer,
    /<div className="footer-contact-row[^"]*">[\s\S]*?<Tooltip key=\{label\} content=\{label\}>[\s\S]*?aria-label=\{label\}/,
  );
  assert.match(
    footer,
    /import \{\s*InstagramIcon,\s*LinkedInIcon,\s*SubstackIcon,\s*XIcon,\s*\} from "\.\/icons\/SocialIcons"/,
  );
  assert.match(
    footer,
    /import \{ Tooltip, TooltipProvider \} from "\.\/Tooltip"/,
  );
});

test("footer social icons show tooltips on hover", () => {
  assert.match(footer, /<TooltipProvider>/);
  assert.match(footer, /<\/TooltipProvider>/);
  for (const label of ["Substack", "Instagram", "LinkedIn", "X"]) {
    assert.match(
      footer,
      new RegExp(
        `label: "${label}"[\\s\\S]*?href: "[^"]+"[\\s\\S]*?icon:`,
      ),
    );
  }
  assert.match(
    footer,
    /footerSocialLinks\.map\(\(\{ label, href, icon \}\) => \(\s*<Tooltip key=\{label\} content=\{label\}>/,
  );
});

test("footer social icons take on their brand color on hover", () => {
  assert.match(footer, /const footerSocialLinkClassName = `\$\{footerLinkClassName\} group/);
  assert.match(
    footer,
    /<SubstackIcon[\s\S]*?group-hover:text-\[#FF6719\][\s\S]*?group-focus-visible:text-\[#FF6719\]/,
  );
  assert.match(footer, /<InstagramIcon\s+branded/);
  assert.match(
    footer,
    /group-hover:opacity-0[\s\S]*?<InstagramIcon\s+branded[\s\S]*?group-hover:opacity-100/,
  );
  assert.match(
    footer,
    /<LinkedInIcon[\s\S]*?group-hover:text-\[#0A66C2\][\s\S]*?group-focus-visible:text-\[#0A66C2\]/,
  );
  assert.match(
    footer,
    /<XIcon[\s\S]*?group-hover:text-ink[\s\S]*?group-focus-visible:text-ink/,
  );
});

test("social icons are optically balanced", () => {
  assert.match(footer, /<SubstackIcon/);
  assert.match(
    socialIcons,
    /export function SubstackIcon[\s\S]*?className = "size-\[18px\]"/,
  );
  assert.match(
    socialIcons,
    /export function XIcon[\s\S]*?className = "size-\[18px\]"/,
  );
});

test("footer contact links use the requested spacing", () => {
  assert.match(
    footer,
    /<nav\s+aria-label="Contact links"\s+className="[^"]*\bgap-5\b[^"]*"\s*>/,
  );
  assert.match(
    footer,
    /<div className="footer-contact-row [^"]*\bgap-6\b[^"]*">/,
  );
  assert.doesNotMatch(css, /\.footer-contact nav\s*\{/);
  assert.doesNotMatch(css, /\.footer-contact-row\s*\{/);
});

test("email arrow fades without shifting horizontally", () => {
  const arrow = footer.match(/<ArrowUpRightIcon className="([^"]+)"/)?.[1] ?? "";

  assert.match(arrow, /\btransition-opacity\b/);
  assert.doesNotMatch(arrow, /\btranslate-x-/);
  assert.doesNotMatch(arrow, /\btransition-\[opacity,transform\]\b/);
});

test("newsletter form is accessible, non-reloading, and left aligned", () => {
  assert.match(footer, /import \{ NewsletterForm \} from "\.\/NewsletterForm"/);
  assert.match(footer, /<NewsletterForm \/>/);
  assert.match(newsletterForm, /action=\{SUBSTACK_SUBSCRIBE_URL\}/);
  assert.match(newsletterForm, /<label htmlFor="newsletter-email"/);
  assert.match(newsletterForm, /type="email"/);
  assert.match(newsletterForm, /placeholder="Enter your email here"/);
  assert.match(newsletterForm, /type="submit"/);
  assert.match(
    newsletterForm,
    /<Primary[\s\S]*type="submit"[\s\S]*>\s*Subscribe\s*<\/Primary>/,
  );
  assert.doesNotMatch(newsletterForm, /<Primary type="submit" fullWidth>/);
  assert.match(newsletterForm, /<Input[\s\S]*id="newsletter-email"/);
  assert.match(input, /\btext-left\b/);
  assert.match(input, /\btext-base\b/);
  assert.match(
    newsletterForm,
    /<form\s+className="[^"]*\bgrid-cols-\[minmax\(0,1fr\)_auto\][^"]*\bgap-3\b[^"]*"/,
  );
  assert.doesNotMatch(newsletterForm, /max-\[640px\]:grid-cols-1/);
  assert.match(
    newsletterForm,
    /<Primary\s+className="shrink-0"\s+type="submit"\s*>/,
  );
  assert.doesNotMatch(css, /\.newsletter-form\s*\{/);
});

test("partner and newsletter CTAs share the Primary component", () => {
  assert.match(partnerForm, /<Primary[\s\S]*type="submit"[\s\S]*>\s*\{status === "sending" \? "Sending\.\.\." : "Send"\}\s*<\/Primary>/);
  assert.match(
    newsletterForm,
    /<Primary[\s\S]*type="submit"[\s\S]*>\s*Subscribe\s*<\/Primary>/,
  );
  assert.match(primary, /export function Primary/);
  assert.match(primary, /href \?/);
  assert.match(primary, /variant = "primary"/);
  assert.match(primary, /variantClassName\[variant\]/);
  assert.match(primary, /w-fit/);
  assert.match(primary, /rounded-\[10px\]/);
  assert.match(primary, /bg-accent-primary/);
  assert.match(primary, /fullWidth \? "w-full"/);
});

test("all footer text uses the text-base equivalent and stacks on mobile", () => {
  assert.match(footer, /<footer[\s\S]*\btext-base\b/);
  assert.match(
    footer,
    /<h2 className="[^"]*\btext-xl\b[^"]*\bfont-bold\b[^"]*\btext-black\b[^"]*">\s*Contact\s*<\/h2>/,
  );
  assert.match(
    footer,
    /<h2 className="[^"]*\btext-xl\b[^"]*\bfont-bold\b[^"]*\btext-black\b[^"]*">\s*Join the newsletter\s*<\/h2>/,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*footer\s*\{[^}]*grid-template-columns:\s*1fr;[\s\S]*\.footer-brand,[\s\S]*\.footer-contact,[\s\S]*\.footer-newsletter\s*\{[^}]*grid-column:\s*1;/s,
  );
});

test("mobile footer places the newsletter above contact", () => {
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.footer-brand\s*\{[^}]*order:\s*1;[^}]*\}[\s\S]*\.footer-newsletter\s*\{[^}]*order:\s*2;[^}]*\}[\s\S]*\.footer-contact\s*\{[^}]*order:\s*3;[^}]*\}[\s\S]*\.footer-credit\s*\{[^}]*order:\s*4;/s,
  );
  assert.match(footer, /<ScrollReveal className="footer-credit"/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.footer-credit\s*\{[^}]*grid-column:\s*1;/s);
});

test("footer uses the cream surface with dark, readable text", () => {
  assert.match(
    footer,
    /<footer[\s\S]*className="[^"]*\bbg-surface\b[^"]*\btext-body(?:\s|")/,
  );
  assert.match(
    footer,
    /const footerLinkClassName =\s*"[^"]*\btext-muted\b[^"]*\bhover:text-ink\b/,
  );
  assert.match(
    input,
    /\bbg-surface-muted\b/,
  );
});

test("footer ends with a right-aligned gray technology credit", () => {
  assert.match(
    css,
    /\.text-medium\s*\{[^}]*text-shadow:\s*-0\.25px 0 currentColor,\s*0\.25px 0 currentColor;/s,
  );
  assert.match(
    footer,
    /const footerCreditLinkClassName = `\$\{footerLinkClassName\} text-medium`;/,
  );
  assert.match(
    footer,
    /<div className="[^"]*\bflex\b[^"]*\bflex-col\b[^"]*\bgap-0\b[^"]*\btext-right\b[^"]*\btext-base\b[^"]*\btext-muted\b[^"]*\bmax-\[820px\]:text-left\b[^"]*">/,
  );
  for (const [label, href] of [
    ["Next.js", "https://nextjs.org/"],
    ["Cursor", "https://cursor.com/"],
    ["Supabase", "https://supabase.com/"],
    ["Design System", "/design-system"],
  ]) {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      footer,
      new RegExp(
        `<a[\\s\\S]*?className=\\{footerCreditLinkClassName\\}[\\s\\S]*?href="${escapedHref}"[\\s\\S]*?target="_blank"[\\s\\S]*?rel="noreferrer"[\\s\\S]*?>\\s*${label.replace(".", "\\.")}\\s*<\\/a>`,
      ),
    );
  }
  assert.match(
    footer,
    /Website built in[\s\S]*Next\.js[\s\S]*with[\s\S]*Cursor[\s\S]*and[\s\S]*Supabase[\s\S]*\./,
  );
  assert.match(
    footer,
    /!hideDesignSystemPromo && \([\s\S]*Check out our[\s\S]*Design System[\s\S]*!/,
  );
  assert.match(
    footer,
    /<footer[\s\S]*className="[^"]*pt-\[clamp\(48px,6\.5vw,96px\)\][^"]*pb-\[clamp\(40px,5vw,72px\)\]/,
  );
});

test("design system page footer omits the design system promo", () => {
  assert.match(footer, /hideDesignSystemPromo = false/);
  assert.match(
    footer,
    /!hideDesignSystemPromo && \([\s\S]*Check out our[\s\S]*Design System[\s\S]*!/,
  );
  assert.match(
    designSystem,
    /<SiteFooter\s+logoHref="\/"\s+logoAriaLabel="Design Meetup home"\s+hideDesignSystemPromo\s+\/>/,
  );
  assert.doesNotMatch(
    designSystem,
    /Check out our[\s\S]*Design System[\s\S]*!/,
  );
  assert.match(home, /<SiteFooter \/>/);
  assert.doesNotMatch(home, /hideDesignSystemPromo/);
});

test("footer links have no underlines and the credit has no team attribution", () => {
  assert.doesNotMatch(
    footer.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "",
    /(?<!no-)underline(?:\s|")/,
  );
  assert.doesNotMatch(footer, /by the Design Meetup Team/);
  assert.doesNotMatch(footer, /href="#website-team"/);
  assert.doesNotMatch(footer, /showWebsiteTeam/);
});
