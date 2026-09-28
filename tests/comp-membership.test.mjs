import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  compCouponId,
  isCompMembershipEmail,
  parseCompEmails,
  shouldApplyCompCoupon,
} from "../src/lib/comp-membership.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("comp email list is case-insensitive and comma-separated", () => {
  const emails = parseCompEmails(
    " studio@liumichelle.com, Friend@DesignMeetup.info \n other@x.com ",
  );
  assert.equal(emails.has("studio@liumichelle.com"), true);
  assert.equal(emails.has("friend@designmeetup.info"), true);
  assert.equal(emails.has("other@x.com"), true);
  assert.equal(emails.has("missing@x.com"), false);
});

test("directory sheet emails get the coupon; other approved signups still pay", () => {
  assert.equal(isCompMembershipEmail("studio@liumichelle.com"), true);
  assert.equal(isCompMembershipEmail("BL628@cornell.edu"), true);
  assert.equal(isCompMembershipEmail("yunakeem3@gmail.com"), true);
  assert.equal(isCompMembershipEmail("demo@designmeetup.info"), false);
  assert.equal(isCompMembershipEmail("angelinawwu@ucla.edu"), false);
});

test("a coupon applies only when the stripe coupon id is set", () => {
  const previousCoupon = process.env.STRIPE_COUPON_FREE_MEMBERSHIP;
  try {
    process.env.STRIPE_COUPON_FREE_MEMBERSHIP = "vXejHxwc";
    assert.equal(compCouponId(), "vXejHxwc");
    assert.equal(shouldApplyCompCoupon("studio@liumichelle.com"), true);
    assert.equal(shouldApplyCompCoupon("angelinawwu@ucla.edu"), false);
    process.env.STRIPE_COUPON_FREE_MEMBERSHIP = "coupon_testFree";
    assert.equal(compCouponId(), "coupon_testFree");
    process.env.STRIPE_COUPON_FREE_MEMBERSHIP = "";
    assert.equal(shouldApplyCompCoupon("studio@liumichelle.com"), false);
  } finally {
    if (previousCoupon === undefined) delete process.env.STRIPE_COUPON_FREE_MEMBERSHIP;
    else process.env.STRIPE_COUPON_FREE_MEMBERSHIP = previousCoupon;
  }
});

test("checkout looks up the coupon in the current Stripe mode and still collects a card", async () => {
  const checkout = await read("app/api/stripe/checkout/route.ts");
  const subscribe = await read("app/portal/subscribe/page.tsx");
  const comp = await read("src/lib/comp-membership.ts");
  assert.match(checkout, /shouldApplyCompCoupon\(user\.email\)/);
  assert.match(checkout, /lookupCompCheckoutDiscount\(compCouponId\(\), stripe\)/);
  assert.match(checkout, /payment_method_collection: "always"/);
  assert.match(checkout, /error=coupon|"coupon"/);
  assert.match(subscribe, /case "coupon"/);
  assert.doesNotMatch(checkout, /if_required/);
  assert.doesNotMatch(checkout, /allow_promotion_codes/);
  assert.match(
    comp,
    /docs.google.com\/spreadsheets\/d\/1fT3s72MVCAxb8gXrE6YXfBrMEHxTbL6jG8LQI8l5hlM/,
  );
});
