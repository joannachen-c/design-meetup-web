import assert from "node:assert/strict";
import test from "node:test";
import {
  canUpgrade,
  hasPortalAccess,
  normalizeMembershipStatus,
  tierFromPriceId,
} from "../src/lib/membership.ts";

test("portal access allows active, trialing, and past_due", () => {
  assert.equal(hasPortalAccess("active"), true);
  assert.equal(hasPortalAccess("trialing"), true);
  assert.equal(hasPortalAccess("past_due"), true);
  assert.equal(hasPortalAccess("canceled"), false);
  assert.equal(hasPortalAccess("incomplete"), false);
  assert.equal(hasPortalAccess(null), false);
});

test("student can upgrade", () => {
  assert.equal(canUpgrade("student"), true);
  assert.equal(canUpgrade("professional"), false);
  assert.equal(canUpgrade(null), false);
});

test("local price ids map to tiers", () => {
  assert.equal(tierFromPriceId("price_local_student"), "student");
  assert.equal(tierFromPriceId("price_local_professional"), "professional");
  assert.equal(tierFromPriceId("price_unknown"), null);
});

test("stripe status normalization", () => {
  assert.equal(normalizeMembershipStatus("active"), "active");
  assert.equal(normalizeMembershipStatus("unpaid"), "incomplete");
  assert.equal(normalizeMembershipStatus("nope"), "incomplete");
});
