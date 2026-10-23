import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const route = await read("../app/talent/page.tsx");
const robots = await read("../app/robots.ts");
const page = await read("../src/components/talent/TalentPage.tsx");
const form = await read("../src/components/talent/TalentContactForm.tsx");
const content = await read("../src/components/talent/talent-content.ts");
const contactEmail = await read("../src/lib/contact-email.ts");
const migration = await read(
  "../supabase/migrations/20261023120000_add_partner_inquiry_talent_interest.sql",
);

test("talent page is shared by link only, never indexed", () => {
  assert.match(route, /robots:\s*\{\s*index: false,\s*follow: false,?\s*\}/);
  assert.match(route, /canonical: "\/talent"/);
  assert.match(robots, /disallow: \[[^\]]*"\/talent"/);
});

test("talent page keeps advisors anonymous", () => {
  for (const source of [page, form, content]) {
    assert.doesNotMatch(source, /board-of-advisors/);
    assert.doesNotMatch(source, /[a-z0-9._-]+@(?!company\.com)[a-z0-9-]+\.[a-z]/i);
  }
  assert.doesNotMatch(content, /firstName|fullName|linkedin/i);
});

test("every logo on the wall ships as a local asset", async () => {
  const sources = [...content.matchAll(/src: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(sources.length >= 16);
  for (const src of sources) {
    await access(new URL(`../public${src}`, import.meta.url));
  }
});

test("talent form posts the talent interest through the contact route", () => {
  assert.match(form, /^"use client";/);
  assert.match(form, /fetch\("\/api\/contact"/);
  assert.match(form, /interest: "talent"/);
  assert.match(form, /name="company"[\s\S]*tabIndex=\{-1\}/);
  assert.match(contactEmail, /talent:\s*\{\s*label:\s*"hiring through the Talent Network"/);
});

test("packed note stays under the contact route's 1000 character cap", () => {
  const organization = Number(form.match(/MAX_ORGANIZATION_LENGTH = (\d+)/)[1]);
  const note = Number(form.match(/MAX_NOTE_LENGTH = (\d+)/)[1]);
  const longestRole = "a Staff or Principal Designer".length;
  const longestFormat = "both formats".length;
  const labels = "Company: · Hiring: · Format: · Message: ".length;
  assert.ok(organization + note + longestRole + longestFormat + labels < 1000);
});

test("partner_inquiries interest check admits talent inquiries", () => {
  assert.match(
    migration,
    /check \(interest in \('sponsor', 'panelist', 'judge', 'venue', 'advisor', 'talent'\)\)/,
  );
});
