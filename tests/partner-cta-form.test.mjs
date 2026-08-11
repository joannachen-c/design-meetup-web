import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(
  new URL("../src/components/HomePage.tsx", import.meta.url),
  "utf8",
);
const select = await readFile(
  new URL("../src/components/Select.tsx", import.meta.url),
  "utf8",
);
const input = await readFile(
  new URL("../src/components/Input.tsx", import.meta.url),
  "utf8",
);
const form = await readFile(
  new URL("../src/components/PartnerContactForm.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const packageJson = await readFile(
  new URL("../package.json", import.meta.url),
  "utf8",
);
const chevron = await readFile(
  new URL("../src/components/icons/ChevronDownIcon.tsx", import.meta.url),
  "utf8",
);

test("partner CTA replaces the plain button with the sentence form", () => {
  assert.match(app, /import \{ PartnerContactForm \} from "\.\/PartnerContactForm"/);
  assert.match(app, /<PartnerContactForm \/>/);
  assert.doesNotMatch(app, /Reach out/);
  assert.match(form, /^"use client";/);
});

test("dropdown builds its custom menu on the shared Radix primitive", () => {
  assert.match(select, /^"use client";/);
  assert.match(
    select,
    /import \* as SelectPrimitive from "@radix-ui\/react-select"/,
  );
  assert.match(select, /<SelectPrimitive\.Root/);
  assert.match(select, /<SelectPrimitive\.Trigger/);
  assert.match(select, /<SelectPrimitive\.Portal>/);
  assert.match(select, /<SelectPrimitive\.Content/);
  assert.match(select, /<SelectPrimitive\.Item/);
  assert.match(select, /<SelectPrimitive\.ItemText>/);
  assert.match(select, /<SelectPrimitive\.ItemIndicator asChild>/);
  assert.match(select, /options\.map\(\(option\) => \(/);
  assert.match(packageJson, /"@radix-ui\/react-select":/);
});

test("keyboard and focus behaviour is not hand rolled", () => {
  assert.doesNotMatch(select, /onKeyDown|useEffect|addEventListener/);
  assert.doesNotMatch(select, /role="listbox"|role="option"|aria-expanded/);
  assert.doesNotMatch(select, /<select\b|<option\b/);
});

test("the menu is anchored, collision aware, and scroll capped", () => {
  assert.match(select, /position="popper"/);
  assert.match(select, /sideOffset=\{6\}/);
  assert.match(select, /align="start"/);
  assert.match(select, /min-w-\[var\(--radix-select-trigger-width\)\]/);
  assert.match(
    select,
    /max-h-\[var\(--radix-select-content-available-height\)\]/,
  );
});

test("the portalled menu keeps the site typeface and surface language", () => {
  assert.match(select, /font-\['Alte_Haas_Grotesk',sans-serif\]/);
  assert.match(select, /\bbg-white\b/);
  assert.match(select, /\bshadow-lg ring-1 ring-black\/5\b/);
  assert.match(select, /\bz-50\b/);
  assert.match(select, /data-\[highlighted\]:bg-surface-muted/);
  assert.match(select, /data-\[disabled\]:cursor-not-allowed/);
});

test("the menu entrance is short, compositor only, and reduced motion aware", () => {
  assert.match(
    css,
    /\.select-menu\s*\{[^}]*transform-origin:\s*var\(--radix-select-content-transform-origin\);/s,
  );
  assert.match(
    css,
    /\.select-menu\[data-state="open"\]\s*\{[^}]*animation:\s*select-menu-in 140ms ease-out;/s,
  );
  assert.match(
    css,
    /@keyframes select-menu-in\s*\{[^@]*opacity:\s*0;[^@]*transform:\s*scale\(0\.96\) translateY\(-4px\);/s,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.select-menu\[data-state="open"\]\s*\{\s*animation:\s*none;/,
  );
});

test("dropdown reuses the input surface, radius, and height", () => {
  for (const token of [
    /\bmin-h-11\b/,
    /\brounded-\[10px\]/,
    /\bbg-surface-muted\b/,
    /\btext-base\b/,
    /\btext-ink\b/,
    /\bfont-normal\b/,
  ]) {
    assert.match(select, token);
    assert.match(input, token);
  }
  assert.match(select, /\bpy-2\.5\b/);
  assert.match(select, /\bpl-4\b/);
  assert.match(input, /\bpy-2\.5\b/);
  assert.match(input, /\bpx-4\b/);
});

test("dropdown sizes itself to the selected option and shows one chevron", () => {
  assert.match(select, /<SelectPrimitive\.Value placeholder=\{placeholder\} \/>/);
  assert.match(select, /hasWidthOverride \? "" : "w-fit"/);
  assert.match(select, /<span className="min-w-0 truncate leading-\[1\.2\]">/);
  // The chevron sits on the trigger's inner right edge, even when the trigger
  // is stretched wider than its label.
  assert.match(select, /\bjustify-between\b/);
  assert.match(select, /import \{ ChevronDownIcon \} from "\.\/icons\/ChevronDownIcon"/);
  assert.equal(select.match(/<ChevronDownIcon\b/g)?.length, 1);
  assert.match(select, /group-data-\[state=open\]:-rotate-180/);
  assert.match(select, /\bmotion-reduce:transition-none\b/);
});

test("dropdown keeps visible focus and disabled affordances", () => {
  assert.match(select, /focus-visible:outline-2/);
  assert.match(select, /focus-visible:outline-ink/);
  assert.match(select, /disabled:cursor-not-allowed disabled:opacity-50/);
  assert.match(select, /data-\[state=open\]:bg-gray-200/);
  assert.match(select, /transition-colors duration-150 ease-out/);
});

test("sentence form offers the requested interests and cities", () => {
  for (const [value, label] of [
    ["panelist", "being a panelist"],
    ["judge", "judging a makeathon"],
    ["sponsor-one", "sponsoring one event"],
    ["sponsor-series", "sponsoring an event series"],
  ]) {
    assert.match(
      form,
      new RegExp(
        `value: "${value}",\\s*label: "${label}"`,
      ),
    );
  }
  assert.doesNotMatch(form, /attending events/);
  assert.doesNotMatch(form, /value: "sponsor", label: "sponsoring"/);
  for (const [value, label] of [
    ["sf", "San Francisco"],
    ["nyc", "New York"],
    ["la", "Los Angeles"],
    ["any", "any city"],
  ]) {
    assert.match(form, new RegExp(`\\{ value: "${value}", label: "${label}" \\}`));
  }
  assert.match(form, /<span>My name is<\/span>/);
  assert.match(form, /<span>I’m interested in<\/span>/);
  assert.match(form, /<span>in<\/span>/);
  assert.match(form, /<span>Reach me at<\/span>/);
});

test("the name row collects a first and last name for the greeting", () => {
  assert.match(form, /name="first-name"/);
  assert.match(form, /name="last-name"/);
  assert.match(form, /autoComplete="given-name"/);
  assert.match(form, /autoComplete="family-name"/);
  assert.match(form, /My name is \$\{fullName\}\./);
});

test("every sentence field is labelled and the email field is validated", () => {
  for (const field of ["first-name", "last-name", "interest", "city", "email"]) {
    assert.match(
      form,
      new RegExp(`<label className="sr-only" htmlFor=\\{\`\\$\\{fieldId\\}-${field}\`\\}>`),
    );
    assert.match(form, new RegExp(`name="${field}"`));
  }
  assert.match(form, /type="email"/);
  assert.match(form, /autoComplete="email"/);
  assert.match(form, /\brequired\b/);
  assert.match(form, /<Primary type="submit">Send<\/Primary>/);
});

test("submitting hands off to email without reloading the page", () => {
  assert.match(form, /event\.preventDefault\(\);/);
  assert.match(form, /mailto:\$\{CONTACT_EMAIL\}\?subject=\$\{encodeURIComponent\(/);
  assert.match(form, /const CONTACT_EMAIL = "contactdesignmeetup@gmail\.com";/);
  assert.match(form, /setSent\(true\);/);
  assert.match(form, /aria-live="polite"/);
  assert.match(form, /role="status"/);
  assert.match(form, /\bempty:hidden\b/);
});

test("sentence breaks into rows and wraps instead of overflowing", () => {
  assert.match(
    form,
    /className="partner-form flex w-fit max-w-full flex-col gap-2/,
  );
  assert.equal(
    form.match(/flex w-full flex-wrap items-center gap-x-2 gap-y-2/g)?.length,
    3,
  );
  // Vertical form gap matches the horizontal gap between email + Send.
  assert.match(form, /\bgap-2\b/);
  assert.match(form, /\bgap-x-2\b/);
});

test("the selected checkmark matches the chevron stroke weight", () => {
  assert.match(select, /strokeWidth="1\.5"/);
  assert.doesNotMatch(select, /strokeWidth="1\.6"/);
  assert.match(chevron, /strokeWidth="1\.5"/);
});

test("every row shares one right edge so the city select lines up with Send", () => {
  // Form stays fit-content; each row is full-width inside it. The city select
  // and email field grow to absorb slack so the right edge is shared.
  assert.doesNotMatch(form, /className="partner-form[^"]*(?<!max-)w-full/);
  assert.doesNotMatch(form, /className="partner-form[^"]*items-start/);
  assert.match(
    form,
    /<Select\s+className="min-w-\[8rem\] grow basis-\[8rem\]"\s+id=\{\`\$\{fieldId\}-city\`\}/,
  );
  assert.match(form, /className="min-w-\[12rem\] grow basis-\[12rem\]"/);
  assert.doesNotMatch(form, /\bmax-w-\[20rem\]\b/);
  assert.match(form, /role="status"/);
  assert.match(form, /\bw-0 min-w-full\b/);
  assert.match(select, /hasWidthOverride/);
});
