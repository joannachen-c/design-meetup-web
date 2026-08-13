import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(
  new URL("../src/components/HomePage.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const form = await readFile(
  new URL("../src/components/ApplyNotifyForm.tsx", import.meta.url),
  "utf8",
);
const applyRoute = await readFile(
  new URL("../app/api/apply/route.ts", import.meta.url),
  "utf8",
);
const migration = await readFile(
  new URL(
    "../supabase/migrations/20260812170000_create_application_emails.sql",
    import.meta.url,
  ),
  "utf8",
);

test("apply section sits between the founders note and the footer", () => {
  assert.match(
    app,
    /<FoundersNote \/>\s*<section[\s\S]*className="[^"]*\bapply-cta\b[^"]*"[\s\S]*id="apply"[\s\S]*>\s*[\s\S]*>\s*Applications opening soon\s*<\/h2>[\s\S]*<\/section>\s*<PhotoMarquee events=\{events\} \/>\s*<SiteFooter \/>/,
  );
});

test("apply section points to Instagram and Substack for updates", () => {
  assert.match(
    app,
    /We'll be opening up applications for the next Design Meetup member cohort soon\. If you're a student or early-career designer, we'd love to have you\./,
  );
  assert.match(
    app,
    /<p className="m-0 mt-5 text-pretty">\s*Follow us on Instagram and Substack to stay updated!\s*<\/p>/,
  );
  assert.match(
    app,
    /Drop your email and we'll let you know when applications open\./,
  );
  assert.match(app, /import \{ ApplyNotifyForm \} from "\.\/ApplyNotifyForm"/);
  assert.match(app, /<ApplyNotifyForm \/>/);
  assert.match(
    app,
    /<Primary[\s\S]*variant="secondary"[\s\S]*href="https:\/\/www\.instagram\.com\/designmeetup\/"[\s\S]*Instagram[\s\S]*<\/Primary>/,
  );
  assert.match(
    app,
    /<Primary[\s\S]*variant="secondary"[\s\S]*href="https:\/\/designmeetup\.substack\.com\/"[\s\S]*Substack[\s\S]*<\/Primary>/,
  );
  assert.match(app, /<InstagramIcon className="size-5/);
  assert.match(app, /<InstagramIcon\s+branded/);
  assert.match(app, /<SubstackIcon className="size-5/);
  assert.match(app, /group-hover:text-\[#FF6719\]/);
  assert.match(
    app,
    /className="group gap-2"[\s\S]*Instagram[\s\S]*className="group gap-2"[\s\S]*Substack/,
  );
});

test("apply section uses the shared responsive twelve-column layout", () => {
  assert.match(
    css,
    /\.apply-cta\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);/s,
  );
  assert.match(css, /\.apply-copy\s*\{[^}]*grid-column:\s*1\s*\/\s*span 8;/s);
  assert.match(css, /\.apply-follow\s*\{[^}]*grid-column:\s*9\s*\/\s*span 4;/s);
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.apply-cta\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*\.apply-copy,\s*\.apply-follow\s*\{[^}]*grid-column:\s*1;/s,
  );
});

test("apply waitlist form keeps email and CTA on one row", () => {
  assert.match(
    form,
    /<form\s+className="[^"]*\bgrid-cols-\[minmax\(0,1fr\)_auto\][^"]*\bgap-3\b[^"]*"/,
  );
  assert.doesNotMatch(form, /max-\[640px\]:grid-cols-1/);
  assert.match(form, /<Primary\s+className="shrink-0"/);
});

test("apply waitlist form posts emails to a private supabase table", () => {
  assert.match(form, /^"use client";/);
  assert.match(form, /import \{ Input \} from "\.\/Input"/);
  assert.match(form, /fetch\("\/api\/apply"/);
  assert.match(form, /placeholder="you@email.com"/);
  assert.match(form, /Notify me/);
  assert.match(form, /We’ll email you when applications open\./);
  assert.match(form, /name="company"/);
  assert.match(form, /className="hidden"/);
  assert.match(applyRoute, /from\("application_emails"\)\.insert/);
  assert.match(applyRoute, /error\.code === "23505"/);
  assert.match(applyRoute, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(applyRoute, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(migration, /Anyone can add an application email/);
  assert.match(applyRoute, /company[\s\S]*!== ""[\s\S]*NextResponse\.json\(\{ ok: true \}\)/);
  assert.match(migration, /create table if not exists public\.application_emails/);
  assert.match(migration, /constraint application_emails_email_key unique \(email\)/);
  assert.match(migration, /enable row level security/);
});
