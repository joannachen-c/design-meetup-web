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
const contactRoute = await readFile(
  new URL("../app/api/contact/route.ts", import.meta.url),
  "utf8",
);
const contactEmail = await readFile(
  new URL("../src/lib/contact-email.ts", import.meta.url),
  "utf8",
);
const envExample = await readFile(
  new URL("../.env.example", import.meta.url),
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
  assert.match(
    select,
    /min-w-\[calc\(var\(--radix-select-trigger-width\)\+8px\)\]/,
  );
  assert.match(
    select,
    /max-h-\[var\(--radix-select-content-available-height\)\]/,
  );
});

test("menu rows land on the trigger's footprint so labels left align", () => {
  // The menu's own padding is cancelled out by an equal negative alignOffset,
  // so a row's box matches the trigger's box and its pl-4 / pr-3 put the label
  // and indicator on the same axes as the trigger's label and chevron.
  assert.match(select, /const MENU_PADDING = 4;/);
  assert.match(select, /\bp-1\b/);
  assert.match(select, /alignOffset=\{-MENU_PADDING\}/);
  const trigger = select.match(
    /const triggerClassName = \[([\s\S]*?)\]\s*\n\s*\.filter/,
  )[1];
  const item = select.match(
    /<SelectPrimitive\.Item\s+className="([^"]*)"/,
  )[1];
  for (const padding of [/\bpl-4\b/, /\bpr-3\b/]) {
    assert.match(trigger, padding);
    assert.match(item, padding);
  }
  assert.doesNotMatch(item, /\bpl-3\b|\bpr-2\.5\b/);
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
    ["sponsor", "partnering on an event"],
    ["panelist", "speaking at an event"],
    ["judge", "judging a makeathon"],
    ["venue", "providing a venue"],
  ]) {
    assert.match(
      form,
      new RegExp(
        `value: "${value}",\\s*label: "${label}"`,
      ),
    );
  }
  assert.doesNotMatch(form, /attending events/);
  assert.doesNotMatch(form, /sponsor-one|sponsor-series|sponsoring one event|sponsoring an event series|being a panelist|sponsoring an event/);
  assert.match(
    form,
    /useState\(interestOptions\[0\]\.value\)/,
  );
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
  assert.match(contactEmail, /const fullName = `\$\{submission\.firstName\} \$\{submission\.lastName\}`;/);
  assert.match(contactEmail, /`Name: \$\{fullName\}`/);
  assert.match(contactEmail, /`Hi \$\{submission\.firstName\},`/);
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
  assert.match(form, /<Primary[\s\S]*type="submit"[\s\S]*>\s*\{status === "sending" \? "Sending\.\.\." : "Send"\}\s*<\/Primary>/);
});

test("submitting posts the form without leaving the page", () => {
  assert.match(form, /event\.preventDefault\(\);/);
  assert.match(form, /await fetch\("\/api\/contact"/);
  assert.match(form, /method: "POST"/);
  assert.match(form, /"Content-Type": "application\/json"/);
  assert.match(form, /firstName,\s*lastName,\s*interest,\s*city,\s*email,\s*company,\s*submissionId,/);
  assert.doesNotMatch(form, /mailto:|window\.location/);
  assert.match(form, /aria-live="polite"/);
  assert.match(form, /role="status"/);
  assert.match(form, /\bempty:hidden\b/);
});

test("the form shows sending, success, and failure states in place", () => {
  assert.match(form, /status === "sending"/);
  assert.match(form, /disabled=\{status === "sending"\}/);
  assert.match(form, /loading=\{status === "sending"\}/);
  assert.match(form, /Sending\.\.\./);
  assert.match(form, /Thanks — we received your note and emailed you a copy\./);
  assert.match(form, /We couldn’t send that\. Please try again\./);
  assert.match(form, /setStatus\(response\.ok \? "sent" : "error"\)/);
  assert.match(form, /setStatus\("error"\)/);
  assert.match(form, /const resetStatus = \(\) => \{/);
  assert.match(form, /setSubmissionId\(createSubmissionId\(\)\)/);
});

test("contact route validates, ignores honeypots, and sends server mail", () => {
  assert.match(contactRoute, /export async function POST\(request: Request\)/);
  assert.match(contactRoute, /const MAX_BODY_BYTES = 4096;/);
  assert.match(contactRoute, /await request\.text\(\)/);
  assert.match(contactRoute, /JSON\.parse\(body\)/);
  assert.match(contactRoute, /company[\s\S]*!== ""[\s\S]*NextResponse\.json\(\{ ok: true \}\)/);
  assert.match(contactRoute, /validateContactSubmission\(payload\)/);
  assert.match(contactRoute, /sendContactEmails\(submission\)/);
  assert.match(contactRoute, /status: 400/);
  assert.match(contactRoute, /status: result\.status/);
});

test("server email sends from Gmail to Design Meetup and the user", () => {
  assert.match(contactEmail, /import \{ siteEmail, siteName \} from "@\/lib\/site"/);
  assert.match(contactEmail, /const SMTP_HOST = "smtp\.gmail\.com";/);
  assert.match(contactEmail, /const SMTP_PORT = 465;/);
  assert.match(contactEmail, /process\.env\.GMAIL_USER/);
  assert.match(contactEmail, /process\.env\.GMAIL_APP_PASSWORD/);
  assert.match(contactEmail, /user\.toLowerCase\(\) !== siteEmail/);
  assert.match(contactEmail, /`From: \$\{siteName\} <\$\{siteEmail\}>`/);
  assert.match(contactEmail, /to: siteEmail/);
  assert.match(contactEmail, /replyTo: submission\.email/);
  assert.match(contactEmail, /to: submission\.email/);
  assert.match(contactEmail, /replyTo: siteEmail/);
  assert.match(contactEmail, /AUTH PLAIN/);
  assert.doesNotMatch(contactEmail, /resend|RESEND_API_KEY|CONTACT_FROM_EMAIL/i);
  assert.match(envExample, /GMAIL_USER=contactdesignmeetup@gmail\.com/);
  assert.match(envExample, /GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx/);
});

test("sentence breaks into rows and wraps instead of overflowing", () => {
  assert.match(
    form,
    /className="partner-form flex w-fit max-w-full flex-col gap-3[^"]*max-\[820px\]:gap-6/,
  );
  assert.equal(
    form.match(/flex w-full flex-wrap items-center gap-x-3 gap-y-3/g)?.length,
    3,
  );
  // Desktop keeps the tight row gap; mobile opens it up for touch.
  assert.match(form, /\bgap-3\b/);
  assert.match(form, /max-\[820px\]:gap-6/);
  assert.match(form, /\bgap-x-3\b/);
  assert.match(form, /max-\[640px\]:basis-full/);
  assert.match(
    form,
    /<Primary\s+className="max-\[640px\]:w-full max-\[640px\]:justify-center"\s+type="submit"/,
  );
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
  assert.match(
    form,
    /className="min-w-\[12rem\] grow basis-\[12rem\] max-\[640px\]:min-w-0 max-\[640px\]:basis-full"/,
  );
  assert.doesNotMatch(form, /\bmax-w-\[20rem\]\b/);
  assert.match(form, /role="status"/);
  assert.match(form, /\bw-0 min-w-full\b/);
  assert.match(select, /hasWidthOverride/);
});
