import assert from "node:assert/strict";
import test from "node:test";
import {
  COHORT_1_JOINED_AT,
  cohortEmails,
  cohortForEmail,
  cohortJoinedAt,
} from "../src/lib/cohort.ts";
import { memberSinceLabel } from "../src/lib/slack-join-dates.ts";

test("the member directory sheet is cohort 0", () => {
  assert.equal(cohortForEmail("studio@liumichelle.com"), 0);
  assert.equal(cohortForEmail("  Studio@LiuMichelle.com "), 0);
  assert.equal(cohortForEmail("yunakeem3@gmail.com"), 0);
  assert.equal(cohortForEmail("mikaelalabadan@gmail.com"), 0);
});

test("the rest of the signup allowlist is cohort 1", () => {
  assert.equal(cohortForEmail("angelinawwu@ucla.edu"), 1);
  assert.equal(cohortForEmail("sebastianmm.design@gmail.com"), 1);
  assert.equal(cohortForEmail("demo@designmeetup.info"), 1);
});

test("the October 2026 paid intake is cohort 2, members since Oct 2026", () => {
  for (const email of [
    "katherine9wang@gmail.com",
    " Hanswfu.Design@gmail.com ",
    "giangt.edu@gmail.com",
    "design.ginny@gmail.com",
    "justingainsley@gmail.com",
  ]) {
    assert.equal(cohortForEmail(email), 2, email);
  }
  assert.equal(memberSinceLabel(cohortJoinedAt(2), "2027-02-01T00:00:00Z"), "Oct 2026");
  assert.equal(cohortForEmail("alizahunbaev@gmail.com"), 0);
  assert.equal(cohortForEmail("jazkurnz06@gmail.com"), 1);
});

test("emails on neither sheet have no cohort", () => {
  assert.equal(cohortForEmail("someone@example.com"), null);
  assert.equal(cohortForEmail(""), null);
  assert.equal(cohortForEmail(null), null);
});

test("cohort 1 members are members since Sept 2026", () => {
  assert.equal(memberSinceLabel(COHORT_1_JOINED_AT, "2027-02-01T00:00:00Z"), "Sept 2026");
  assert.equal(memberSinceLabel(cohortJoinedAt(1), "2027-02-01T00:00:00Z"), "Sept 2026");
});

test("cohort 0 members are members since Mar 2026", () => {
  assert.equal(memberSinceLabel(cohortJoinedAt(0), "2027-02-01T00:00:00Z"), "Mar 2026");
  assert.equal(memberSinceLabel(cohortJoinedAt(cohortForEmail("studio@liumichelle.com")), null), "Mar 2026");
});

test("members outside both cohorts have no hardcoded join date", () => {
  assert.equal(cohortJoinedAt(null), null);
});

test("cohortEmails lists both cohorts once, each with a cohort", () => {
  const emails = cohortEmails();
  assert.equal(new Set(emails).size, emails.length);
  assert.ok(emails.includes("studio@liumichelle.com"));
  assert.ok(emails.includes("angelinawwu@ucla.edu"));
  for (const email of emails) assert.notEqual(cohortForEmail(email), null, email);
});
