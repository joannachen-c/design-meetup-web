import assert from "node:assert/strict";
import test from "node:test";
import {
  canUpgrade,
  DEFAULT_STRIPE_PRICE_PROFESSIONAL,
  DEFAULT_STRIPE_PRICE_STUDENT,
  hasPortalAccess,
  normalizeMembershipStatus,
  priceIdForTier,
  profileDetailsComplete,
  TIER_CATALOG,
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

test("live stripe keys refuse the test-mode catalog price ids", () => {
  const previousStudent = process.env.STRIPE_PRICE_STUDENT_MONTHLY;
  const previousProfessional = process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
  const previousSecret = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PRICE_STUDENT_MONTHLY;
  delete process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
  process.env.STRIPE_SECRET_KEY = "sk_live_example";
  try {
    assert.equal(priceIdForTier("student"), "price_local_student");
    assert.equal(priceIdForTier("professional"), "price_local_professional");
    process.env.STRIPE_PRICE_STUDENT_MONTHLY = "price_live_student";
    process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY = "price_live_pro";
    assert.equal(priceIdForTier("student"), "price_live_student");
    assert.equal(priceIdForTier("professional"), "price_live_pro");
  } finally {
    if (previousStudent === undefined) delete process.env.STRIPE_PRICE_STUDENT_MONTHLY;
    else process.env.STRIPE_PRICE_STUDENT_MONTHLY = previousStudent;
    if (previousProfessional === undefined) {
      delete process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
    } else {
      process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY = previousProfessional;
    }
    if (previousSecret === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousSecret;
  }
});

test("stripe status normalization", () => {
  assert.equal(normalizeMembershipStatus("active"), "active");
  assert.equal(normalizeMembershipStatus("unpaid"), "incomplete");
  assert.equal(normalizeMembershipStatus("nope"), "incomplete");
});

test("professional lists everything in student first", () => {
  assert.equal(TIER_CATALOG.professional.benefits[0], "everything in student");
});

test("profile is complete with a role or school + year, plus website and location", () => {
  const base = { website: "ilyssa.design", location: "San Francisco" };
  assert.equal(profileDetailsComplete({ ...base, position: "Designer" }), true);
  assert.equal(profileDetailsComplete({ ...base, company: "Figma" }), true);
  assert.equal(
    profileDetailsComplete({ ...base, school: "Stanford", year: "2027" }),
    true,
  );

  assert.equal(profileDetailsComplete({ ...base, school: "Stanford" }), false);
  assert.equal(profileDetailsComplete({ ...base, year: "2027" }), false);
  assert.equal(profileDetailsComplete({ ...base }), false);
  assert.equal(
    profileDetailsComplete({ position: "Designer", location: "SF" }),
    false,
  );
  assert.equal(
    profileDetailsComplete({ position: "Designer", website: "ilyssa.design" }),
    false,
  );
  assert.equal(
    profileDetailsComplete({ ...base, position: "   ", company: "" }),
    false,
  );
  assert.equal(profileDetailsComplete({}), false);
});
