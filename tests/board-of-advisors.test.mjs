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

test("advisor lookups ignore case and surrounding space", () => {
  assert.equal(isBoardOfAdvisorsEmail(" Angela@AChuDesign.com "), true);
  assert.equal(isBoardOfAdvisorsEmail("someone@example.com"), false);
});
