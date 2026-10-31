import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { parseApprovalEmails } from "../src/lib/approved-signups.ts";
import { isApprovedSignupEmail } from "../src/lib/signup-allowlist.ts";
import { isCompMembershipEmail } from "../src/lib/comp-membership.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Ilyssa's Oct 29 applicants can sign up as paying members", () => {
  for (const email of [
    "jesselin.elza@gmail.com",
    "Taylort1421@gmail.com",
    " lauracaiwu@berkeley.edu ",
  ]) {
    assert.equal(isApprovedSignupEmail(email), true, email);
    assert.equal(isCompMembershipEmail(email), false, email);
  }
});

test("pasted emails are split, normalized and de-duplicated", () => {
  const { valid, invalid } = parseApprovalEmails(
    "Jesselin.Elza@gmail.com, taylort1421@gmail.com\n<lauracaiwu@berkeley.edu>; mailto:x@y.co jesselin.elza@gmail.com not-an-email",
  );
  assert.deepEqual(valid, [
    "jesselin.elza@gmail.com",
    "taylort1421@gmail.com",
    "lauracaiwu@berkeley.edu",
    "x@y.co",
  ]);
  assert.deepEqual(invalid, ["not-an-email"]);
  assert.deepEqual(parseApprovalEmails(["a@b.co", 4, "c@d.co"]).valid, ["a@b.co", "c@d.co"]);
  assert.deepEqual(parseApprovalEmails(null), { valid: [], invalid: [] });
});

test("approved signups live in a service-role-only table", async () => {
  const migration = await read("supabase/migrations/20261029120000_create_approved_signups.sql");
  assert.match(migration, /create table if not exists public\.approved_signups/);
  assert.match(migration, /alter table public\.approved_signups enable row level security;/);
  assert.doesNotMatch(migration, /create policy/i);
});

test("signup, cohorts and Luma approvals all honor portal-approved emails", async () => {
  const auth = await read("src/lib/auth.ts");
  const service = await read("src/lib/membership-service.ts");
  const route = await read("app/api/auth/route.ts");
  const actions = await read("src/lib/auth-actions.ts");
  assert.match(auth, /!isApprovedSignupEmail\(email\) && !\(await isAddedApprovedSignup\(email\)\)/);
  assert.match(service, /\.\.\.\(await listApprovedSignupEmails\(\)\)/);
  for (const source of [route, actions]) {
    assert.match(source, /cohort: await cohortForMember\(email\)/);
  }
});

test("only organizers or the Sheets token can approve, and the form sits on Planning", async () => {
  const api = await read("app/api/portal/approved-signups/route.ts");
  const access = await read("src/lib/portal-access.ts");
  const page = await read("app/portal/planning/page.tsx");
  assert.equal((api.match(/if \(!(actor|\(await approvalsActor\(request\)\))\) return notFound\(\);/g) || []).length, 2);
  assert.match(access, /process\.env\.MEMBER_APPROVALS_TOKEN/);
  assert.match(access, /isOrganizerSession\(user\)/);
  assert.match(page, /requireOrganizer\("\/portal\/planning"\)/);
  assert.match(page, /<ApproveMembersForm initialApproved=\{approved\} \/>/);
});

test("the Sheets script treats green fills as approved and posts with the token", async () => {
  const source = await read("scripts/google-sheets/approve-green-rows.gs");
  const sandbox = {};
  vm.runInNewContext(`${source}\nthis.isGreen = isGreen; this.findEmailColumn = findEmailColumn;`, sandbox);
  for (const hex of ["#d9ead3", "#b6d7a8", "#93c47d", "#34a853", "#00ff00"]) {
    assert.equal(sandbox.isGreen(hex), true, hex);
  }
  for (const hex of ["#ffffff", "#fff2cc", "#d0e0e3", "#f4cccc", "#cfe2f3", "", null]) {
    assert.equal(sandbox.isGreen(hex), false, String(hex));
  }
  assert.equal(sandbox.findEmailColumn(["Name", "School Email", "Email"]), 2);
  assert.equal(sandbox.findEmailColumn(["Name", "Email Address"]), 1);
  assert.equal(sandbox.findEmailColumn(["Name"]), -1);
  assert.match(source, /Authorization: "Bearer " \+ token/);
  assert.match(source, /\/api\/portal\/approved-signups/);
  assert.match(source, /onChange\(\)/);
});
