import assert from "node:assert/strict";
import test from "node:test";
import {
  boardOfAdvisorsEmails,
  isBoardOfAdvisorsEmail,
} from "../src/lib/board-of-advisors.ts";

test("the Board of Advisors list is normalized and unique", () => {
  const emails = boardOfAdvisorsEmails();
  assert.equal(emails.length, 49);
  assert.equal(new Set(emails).size, emails.length);
  for (const email of emails) {
    assert.equal(email, email.trim().toLowerCase());
    assert.match(email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  }
});

test("every advisor is a comped member who can sign up, outside the founding cohorts", async () => {
  const { isCompMembershipEmail, compMembershipEmails } = await import("../src/lib/comp-membership.ts");
  const { isApprovedSignupEmail } = await import("../src/lib/signup-allowlist.ts");
  const { cohortForEmail } = await import("../src/lib/cohort.ts");
  const comped = new Set(compMembershipEmails(""));
  for (const email of boardOfAdvisorsEmails()) {
    assert.equal(isCompMembershipEmail(email, ""), true, email);
    assert.equal(isApprovedSignupEmail(email), true, email);
    assert.ok(comped.has(email), email);
  }
  assert.equal(cohortForEmail("hi@jessyin.world"), null);
  assert.equal(cohortForEmail("Sophia@Framer.com"), null);
  // Advisors already on the directory sheet keep their cohort.
  assert.equal(cohortForEmail("tisebuilds@gmail.com"), 0);
});

test("advisor lookups ignore case and surrounding space", () => {
  assert.equal(isBoardOfAdvisorsEmail(" Angela@AChuDesign.com "), true);
  assert.equal(isBoardOfAdvisorsEmail("someone@example.com"), false);
});
