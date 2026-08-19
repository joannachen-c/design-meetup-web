import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const {
  parsePartnerInquiryEmail,
  historicalInquiryId,
} = await import("../src/lib/partner-inquiry-parse.ts");
const { inquiryTextFromRfc822 } = await import("../src/lib/inquiry-rfc822.ts");
const {
  partnerInquiryRow,
  classifyInsertError,
} = await import("../src/lib/partner-inquiry-import.ts");
const {
  bearerTokenFromHeader,
  isAuthorizedImportCaller,
  IMPORT_PROJECT_SLUG,
} = await import("../src/lib/vercel-project-auth.ts");
const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const script = await readFile(
  new URL("../scripts/import-partner-inquiries.mjs", import.meta.url),
  "utf8",
);
const importLib = await readFile(
  new URL("../src/lib/partner-inquiry-import.ts", import.meta.url),
  "utf8",
);
const importRoute = await readFile(
  new URL("../app/api/contact/import/route.ts", import.meta.url),
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
const productionWorkflow = await readFile(
  new URL("../.github/workflows/vercel-production.yml", import.meta.url),
  "utf8",
);
const trigger = await readFile(
  new URL("../scripts/trigger-partner-inquiry-import.sh", import.meta.url),
  "utf8",
);
const vercelJson = JSON.parse(
  await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
);
const nextConfig = await readFile(
  new URL("../next.config.ts", import.meta.url),
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
  const row = partnerInquiryRow(parsed);
  assert.equal(row.submission_id, parsed.submissionId);
  assert.equal(row.first_name, "Ada");
  assert.equal(row.email, "ada@example.com");
  assert.equal(classifyInsertError(null), "ok");
  assert.equal(classifyInsertError({ code: "23505" }), "duplicate");
  assert.equal(classifyInsertError({ code: "42501" }), "failed");
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

test("import runs on Vercel where Gmail Sensitive env already exists", () => {
  assert.equal(
    pkg.scripts["import:partner-inquiries"],
    "node --experimental-strip-types scripts/import-partner-inquiries.mjs",
  );
  assert.ok(pkg.dependencies.imapflow);
  assert.equal(pkg.devDependencies?.imapflow, undefined);
  assert.match(importLib, /from "imapflow"/);
  assert.match(importLib, /parsePartnerInquiryEmail/);
  assert.match(importLib, /from\("partner_inquiries"\)[\s\S]*insert/);
  assert.match(importLib, /error\.code === "23505"/);
  assert.match(importLib, /imap\.gmail\.com/);
  assert.match(importLib, /process\.env\.GMAIL_USER \|\| siteEmail/);
  assert.doesNotMatch(importLib, /console\.(log|info|debug|error)\([^)]*email/i);
  assert.match(script, /importPartnerInquiriesFromGmail/);
  assert.match(script, /api\/contact\/import/);
  assert.match(script, /process\.env\.VERCEL_TOKEN/);
  assert.doesNotMatch(script, /vercel env pull/);
  assert.match(contactEmail, /"New partner inquiry"/);
  assert.match(nextConfig, /serverExternalPackages:\s*\[["']imapflow["']\]/);
});

test("production import route accepts a Vercel token or cron secret", async () => {
  await access(new URL("../app/api/contact/import/route.ts", import.meta.url));
  assert.match(importRoute, /export const runtime = "nodejs"/);
  assert.match(importRoute, /export const maxDuration = 60/);
  assert.match(importRoute, /isAuthorizedImportCaller/);
  assert.match(importRoute, /importPartnerInquiriesFromGmail/);
  assert.match(importRoute, /status: 401/);
  assert.match(importRoute, /export async function GET/);
  assert.match(importRoute, /export async function POST/);
  assert.equal(bearerTokenFromHeader("Bearer secret-token"), "secret-token");
  assert.equal(bearerTokenFromHeader("Basic nope"), null);

  const hits = [];
  const okFetch = async (url) => {
    hits.push(String(url));
    return new Response("{}", { status: 200 });
  };
  assert.equal(
    await isAuthorizedImportCaller("tok", {
      VERCEL_PROJECT_ID: "prj_1",
      VERCEL_ORG_ID: "team_1",
    }, okFetch),
    true,
  );
  assert.match(hits[0], /\/v9\/projects\/prj_1/);
  assert.match(hits[0], /teamId=team_1/);
  assert.equal(await isAuthorizedImportCaller(null), false);
  assert.equal(
    await isAuthorizedImportCaller("cron", { CRON_SECRET: "cron" }, okFetch),
    true,
  );
  assert.equal(
    await isAuthorizedImportCaller(
      "nope",
      { CRON_SECRET: "cron", VERCEL_ORG_ID: "team_1" },
      async () => new Response("", { status: 403 }),
    ),
    false,
  );
  assert.equal(IMPORT_PROJECT_SLUG, "design-meetup-web");
});

test("GitHub Actions call production instead of pulling Sensitive env", () => {
  assert.doesNotMatch(workflow, /vercel env pull/);
  assert.doesNotMatch(workflow, /npm run import:partner-inquiries/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /cron: "0 6 \* \* \*"/);
  assert.match(workflow, /scripts\/trigger-partner-inquiry-import\.sh/);
  assert.match(trigger, /api\/contact\/import/);
  assert.match(trigger, /Authorization: Bearer \$\{VERCEL_TOKEN\}/);
  assert.doesNotMatch(trigger, /GMAIL_APP_PASSWORD/);
  assert.match(productionWorkflow, /import-partner-inquiries:/);
  assert.match(productionWorkflow, /needs: deploy-production/);
  assert.match(
    productionWorkflow,
    /scripts\/trigger-partner-inquiry-import\.sh/,
  );
  assert.equal(vercelJson.crons?.[0]?.path, "/api/contact/import");
  assert.equal(vercelJson.crons?.[0]?.schedule, "0 6 * * *");
});
