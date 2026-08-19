import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const {
  parsePartnerInquiryEmail,
  historicalInquiryId,
} = await import("../src/lib/partner-inquiry-parse.ts");
const { inquiryTextFromRfc822 } = await import(
  "../scripts/lib/inquiry-rfc822.mjs"
);
const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const script = await readFile(
  new URL("../scripts/import-partner-inquiries.mjs", import.meta.url),
  "utf8",
);
const contactEmail = await readFile(
  new URL("../src/lib/contact-email.ts", import.meta.url),
  "utf8",
);
const workflow = await readFile(
  new URL(
    "../.github/workflows/import-partner-inquiries.yml",
    import.meta.url,
  ),
  "utf8",
);

test("internal partner emails round-trip into a table row", () => {
  const parsed = parsePartnerInquiryEmail(`New partner inquiry

Name: Ada Lovelace
Email: ada@example.com
Interest: partnering on an event
City: San Francisco
Submitted: 2026-08-12T15:04:05.000Z
`);
  assert.equal(parsed?.firstName, "Ada");
  assert.equal(parsed?.lastName, "Lovelace");
  assert.equal(parsed?.email, "ada@example.com");
  assert.equal(parsed?.interest, "sponsor");
  assert.equal(parsed?.city, "sf");
  assert.equal(parsed?.submittedAt, "2026-08-12T15:04:05.000Z");
  assert.equal(
    parsed?.submissionId,
    historicalInquiryId({
      email: "ada@example.com",
      interest: "sponsor",
      city: "sf",
      firstName: "Ada",
      lastName: "Lovelace",
      submittedAt: parsed.submittedAt,
    }),
  );
  assert.equal(
    parsePartnerInquiryEmail("Hi Ada,\n\nThanks so much for reaching out"),
    null,
  );
});

test("historical aliases still map onto the current interest keys", () => {
  const parsed = parsePartnerInquiryEmail(`New partner inquiry

Name: Grace Hopper
Email: grace@example.com
Interest: sponsoring an event series
City: New York
Submitted: 2026-08-12T15:04:05.000Z
`);
  assert.equal(parsed?.interest, "sponsor");
  assert.equal(parsed?.city, "nyc");
  assert.equal(parsed?.firstName, "Grace");
  assert.equal(parsed?.lastName, "Hopper");
});

test("re-parsing the same Gmail body reuses the same submission id", () => {
  const body = `New partner inquiry

Name: Alan Turing
Email: alan@example.com
Interest: speaking at an event
City: any city
Submitted: 2026-08-13T00:00:00.000Z
`;
  assert.equal(
    parsePartnerInquiryEmail(body)?.submissionId,
    parsePartnerInquiryEmail(body)?.submissionId,
  );
});

test("base64 Gmail payloads still yield the inquiry body", () => {
  const text = `New partner inquiry

Name: Jean Bartik
Email: jean@example.com
Interest: judging a makeathon
City: Los Angeles
Submitted: 2026-08-14T12:00:00.000Z
`;
  const encoded = Buffer.from(text, "utf8").toString("base64");
  const rfc822 = [
    "From: Design Meetup <contactdesignmeetup@gmail.com>",
    "To: contactdesignmeetup@gmail.com",
    "Subject: Design Meetup — Judging a makeathon",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encoded,
  ].join("\r\n");
  const extracted = inquiryTextFromRfc822(rfc822);
  const parsed = parsePartnerInquiryEmail(extracted);
  assert.equal(parsed?.firstName, "Jean");
  assert.equal(parsed?.city, "la");
  assert.equal(parsed?.interest, "judge");
});

test("import script reads Gmail and upserts partner_inquiries", () => {
  assert.equal(
    pkg.scripts["import:partner-inquiries"],
    "node --experimental-strip-types scripts/import-partner-inquiries.mjs",
  );
  assert.match(script, /from "imapflow"/);
  assert.match(script, /parsePartnerInquiryEmail/);
  assert.match(script, /from\("partner_inquiries"\)\.insert/);
  assert.match(script, /error\.code === "23505"/);
  assert.match(script, /imap\.gmail\.com/);
  assert.match(script, /\.env\.production\.local/);
  assert.match(script, /process\.env\.GMAIL_USER \|\| siteEmail/);
  assert.match(script, /npx vercel env pull \.env\.production\.local/);
  assert.ok(pkg.devDependencies.imapflow);
  assert.match(contactEmail, /"New partner inquiry"/);
  assert.match(workflow, /vercel env pull \.env\.production\.local/);
  assert.match(workflow, /npm run import:partner-inquiries/);
  assert.match(workflow, /workflow_dispatch/);
});
