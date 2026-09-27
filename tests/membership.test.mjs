import assert from "node:assert/strict";
import test from "node:test";
import {
  canUpgrade,
  DEFAULT_STRIPE_PRICE_PROFESSIONAL,
  DEFAULT_STRIPE_PRICE_STUDENT,
  hasPortalAccess,
  normalizeMembershipStatus,
  priceIdForTier,
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

test("preview stripe price ids are the default catalog when env is unset", () => {
  const previousStudent = process.env.STRIPE_PRICE_STUDENT_MONTHLY;
  const previousProfessional = process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
  delete process.env.STRIPE_PRICE_STUDENT_MONTHLY;
  delete process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
  try {
    assert.equal(priceIdForTier("student"), DEFAULT_STRIPE_PRICE_STUDENT);
    assert.equal(priceIdForTier("professional"), DEFAULT_STRIPE_PRICE_PROFESSIONAL);
    assert.equal(tierFromPriceId(DEFAULT_STRIPE_PRICE_STUDENT), "student");
    assert.equal(tierFromPriceId(DEFAULT_STRIPE_PRICE_PROFESSIONAL), "professional");
  } finally {
    if (previousStudent === undefined) delete process.env.STRIPE_PRICE_STUDENT_MONTHLY;
    else process.env.STRIPE_PRICE_STUDENT_MONTHLY = previousStudent;
    if (previousProfessional === undefined) {
      delete process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
    } else {
      process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY = previousProfessional;
    }
  }
});

test("stripe status normalization", () => {
  assert.equal(normalizeMembershipStatus("active"), "active");
  assert.equal(normalizeMembershipStatus("unpaid"), "incomplete");
  assert.equal(normalizeMembershipStatus("nope"), "incomplete");
});
