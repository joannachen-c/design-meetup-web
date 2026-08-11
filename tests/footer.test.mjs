import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
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
const socialIcons = await readFile(
  new URL("../src/components/icons/SocialIcons.tsx", import.meta.url),
  "utf8",
);

test("footer uses the existing logo on the shared twelve-column grid", () => {
  assert.match(app, /className="[^"]*\bfooter-logo\b[^"]*"/);
  assert.match(app, /src="\/design-meetup-logo\.png"/);
  assert.match(app, /<h2[^>]*>Contact<\/h2>/);
  assert.match(app, /contactdesignmeetup@gmail\.com/);
  assert.match(app, /Substack/);
  assert.match(app, /aria-label="Instagram"/);
  assert.match(app, /aria-label="LinkedIn"/);
  assert.match(app, /aria-label="X"/);
  assert.match(app, /Join the newsletter/);
  assert.match(
    css,
    /footer\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);[^}]*column-gap:\s*clamp\(16px,\s*2vw,\s*28px\);/s,
  );
  assert.match(css, /\.footer-brand\s*\{[^}]*grid-column:\s*1\s*\/\s*span 4;/s);
  assert.match(css, /\.footer-contact\s*\{[^}]*grid-column:\s*6\s*\/\s*span 3;/s);
  assert.match(css, /\.footer-newsletter\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;/s);
});

test("footer contact links use the official destinations", () => {
  assert.match(
    app,
    /href="mailto:contactdesignmeetup@gmail\.com"[\s\S]*?>[\s\S]*?contactdesignmeetup@gmail\.com[\s\S]*?<ArrowUpRightIcon[\s\S]*?<\/a>/,
  );
  for (const [label, href, icon] of [
    ["Substack", "https://designmeetup.substack.com/", "SubstackIcon"],
    ["Instagram", "https://www.instagram.com/designmeetup/", "InstagramIcon"],
    ["LinkedIn", "https://www.linkedin.com/company/design-meetup/", "LinkedInIcon"],
    ["X", "https://x.com/designmeetuphq", "XIcon"],
  ]) {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      app,
      new RegExp(
        `aria-label="${label}"[\\s\\S]*?href="${escapedHref}"[\\s\\S]*?target="_blank"[\\s\\S]*?rel="noreferrer"[\\s\\S]*?>\\s*<${icon} \\/>\\s*<\\/a>`,
      ),
    );
  }
  assert.match(
    app,
    /<div className="footer-contact-row[^"]*">\s*<a\s+aria-label="Substack"/,
  );
  assert.match(
    app,
    /import \{ InstagramIcon, LinkedInIcon, SubstackIcon, XIcon \} from "\.\/icons\/SocialIcons"/,
  );
});

test("social icons are optically balanced", () => {
  assert.match(app, /<SubstackIcon \/>/);
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
    app,
    /<nav\s+aria-label="Contact links"\s+className="[^"]*\bgap-5\b[^"]*"\s*>/,
  );
  assert.match(
    app,
    /<div className="footer-contact-row [^"]*\bgap-6\b[^"]*">/,
  );
  assert.doesNotMatch(css, /\.footer-contact nav\s*\{/);
  assert.doesNotMatch(css, /\.footer-contact-row\s*\{/);
});

test("email arrow fades without shifting horizontally", () => {
  const arrow = app.match(/<ArrowUpRightIcon className="([^"]+)"/)?.[1] ?? "";

  assert.match(arrow, /\btransition-opacity\b/);
  assert.doesNotMatch(arrow, /\btranslate-x-/);
  assert.doesNotMatch(arrow, /\btransition-\[opacity,transform\]\b/);
});

test("newsletter form is accessible, non-reloading, and left aligned", () => {
  assert.match(app, /onSubmit=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.match(app, /<label htmlFor="newsletter-email"/);
  assert.match(app, /type="email"/);
  assert.match(app, /placeholder="Enter your email here"/);
  assert.match(app, /type="submit"/);
  assert.match(app, /<Primary type="submit">\s*Subscribe\s*<\/Primary>/);
  assert.doesNotMatch(app, /<Primary type="submit" fullWidth>/);
  assert.match(app, /<Input[\s\S]*id="newsletter-email"/);
  assert.match(input, /\btext-left\b/);
  assert.match(input, /\btext-base\b/);
  assert.match(
    app,
    /<form\s+className="[^"]*\bgrid-cols-\[minmax\(0,1fr\)_auto\][^"]*\bgap-2\b[^"]*"/,
  );
  assert.doesNotMatch(css, /\.newsletter-form\s*\{/);
});

test("partner and newsletter CTAs share the Primary component", () => {
  assert.match(partnerForm, /<Primary type="submit">Send<\/Primary>/);
  assert.match(app, /<Primary type="submit">\s*Subscribe\s*<\/Primary>/);
  assert.match(primary, /export function Primary/);
  assert.match(primary, /href \?/);
  assert.match(primary, /variant === "primary"/);
  assert.match(primary, /w-fit/);
  assert.match(primary, /rounded-\[10px\]/);
  assert.match(primary, /bg-accent-primary/);
  assert.match(primary, /fullWidth \? "w-full"/);
});

test("all footer text uses the text-base equivalent and stacks on mobile", () => {
  assert.match(app, /<footer[\s\S]*\btext-base\b/);
  assert.match(
    app,
    /<h2 className="[^"]*\bfont-semibold\b[^"]*">\s*Contact\s*<\/h2>/,
  );
  assert.match(
    app,
    /<h2 className="[^"]*\bfont-semibold\b[^"]*">\s*Join the newsletter\s*<\/h2>/,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*footer\s*\{[^}]*grid-template-columns:\s*1fr;[\s\S]*\.footer-brand,[\s\S]*\.footer-contact,[\s\S]*\.footer-newsletter\s*\{[^}]*grid-column:\s*1;/s,
  );
  assert.match(app, /className="sr-only"/);
});

test("mobile footer places the newsletter above contact", () => {
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.footer-brand\s*\{[^}]*order:\s*1;[^}]*\}[\s\S]*\.footer-newsletter\s*\{[^}]*order:\s*2;[^}]*\}[\s\S]*\.footer-contact\s*\{[^}]*order:\s*3;[^}]*\}[\s\S]*\.footer-credit\s*\{[^}]*order:\s*4;/s,
  );
  assert.match(app, /<ScrollReveal className="footer-credit col-span-full"/);
});

test("footer uses a white surface with dark, readable text", () => {
  assert.match(
    app,
    /<footer[\s\S]*className="[^"]*\bbg-white\b[^"]*\btext-\[oklch\(22%_0\.025_250\)\](?:\s|")/,
  );
  assert.match(
    app,
    /const footerLinkClassName =\s*"[^"]*\btext-\[oklch\(53%_0\.025_250\)\][^"]*\bhover:text-\[oklch\(22%_0\.025_250\)\]/,
  );
  assert.match(
    input,
    /\bbg-surface-muted\b/,
  );
});

test("footer ends with a centered gray technology credit", () => {
  assert.match(
    css,
    /\.text-medium\s*\{[^}]*text-shadow:\s*-0\.25px 0 currentColor,\s*0\.25px 0 currentColor;/s,
  );
  assert.match(
    app,
    /const footerCreditLinkClassName = `\$\{footerLinkClassName\} text-medium`;/,
  );
  assert.match(
    app,
    /<p className="[^"]*\bcol-span-full\b[^"]*\btext-center\b[^"]*\btext-sm\b[^"]*\btext-gray-400\b[^"]*">/,
  );
  for (const [label, href] of [
    ["Next.js", "https://nextjs.org/"],
    ["Cursor", "https://cursor.com/"],
    ["Supabase", "https://supabase.com/"],
  ]) {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      app,
      new RegExp(
        `<a[\\s\\S]*?className=\\{footerCreditLinkClassName\\}[\\s\\S]*?href="${escapedHref}"[\\s\\S]*?target="_blank"[\\s\\S]*?rel="noreferrer"[\\s\\S]*?>\\s*${label.replace(".", "\\.")}\\s*<\\/a>`,
      ),
    );
  }
  assert.match(
    app,
    /Website built in[\s\S]*Next\.js[\s\S]*Cursor[\s\S]*Supabase[\s\S]*by the[\s\S]*Design Meetup Team[\s\S]*\./,
  );
  assert.match(
    app,
    /<footer[\s\S]*className="[^"]*pt-\[clamp\(64px,8vw,112px\)\][^"]*pb-\[clamp\(32px,4vw,56px\)\]/,
  );
});

test("footer links have no underlines and the team credit opens the website team", () => {
  assert.doesNotMatch(
    app.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "",
    /(?<!no-)underline(?:\s|")/,
  );
  assert.match(
    app,
    /<a[\s\S]*className=\{footerCreditLinkClassName\}[\s\S]*href="#website-team"[\s\S]*onClick=\{showWebsiteTeam\}[\s\S]*>\s*Design Meetup Team\s*<\/a>/,
  );
});
