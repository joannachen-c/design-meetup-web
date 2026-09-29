import assert from "node:assert/strict";
import test from "node:test";
import { cohortForEmail } from "../src/lib/cohort.ts";

test("the member directory sheet is cohort 0", () => {
  assert.equal(cohortForEmail("studio@liumichelle.com"), 0);
  assert.equal(cohortForEmail("  Studio@LiuMichelle.com "), 0);
  assert.equal(cohortForEmail("yunakeem3@gmail.com"), 0);
});

test("the rest of the signup allowlist is cohort 1", () => {
  assert.equal(cohortForEmail("angelinawwu@ucla.edu"), 1);
  assert.equal(cohortForEmail("sebastianmm.design@gmail.com"), 1);
  assert.equal(cohortForEmail("demo@designmeetup.info"), 1);
});

test("emails on neither sheet have no cohort", () => {
  assert.equal(cohortForEmail("someone@example.com"), null);
  assert.equal(cohortForEmail(""), null);
  assert.equal(cohortForEmail(null), null);
});
