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

test("a coupon applies only when the id and email both match", () => {
  const previousCoupon = process.env.STRIPE_COUPON_FREE_MEMBERSHIP;
  const previousEmails = process.env.STRIPE_COMP_EMAILS;
  process.env.STRIPE_COUPON_FREE_MEMBERSHIP = "coupon_testFree";
  process.env.STRIPE_COMP_EMAILS = "comp@designmeetup.info";
  try {
    assert.equal(compCouponId(), "coupon_testFree");
    assert.equal(isCompMembershipEmail("COMP@designmeetup.info"), true);
    assert.equal(shouldApplyCompCoupon("comp@designmeetup.info"), true);
    assert.equal(shouldApplyCompCoupon("other@designmeetup.info"), false);
  } finally {
    if (previousCoupon === undefined) delete process.env.STRIPE_COUPON_FREE_MEMBERSHIP;
    else process.env.STRIPE_COUPON_FREE_MEMBERSHIP = previousCoupon;
    if (previousEmails === undefined) delete process.env.STRIPE_COMP_EMAILS;
    else process.env.STRIPE_COMP_EMAILS = previousEmails;
  }
});

test("checkout applies the comp coupon and skips a card when the email is listed", async () => {
  const checkout = await read("app/api/stripe/checkout/route.ts");
  assert.match(checkout, /shouldApplyCompCoupon\(user\.email\)/);
  assert.match(checkout, /discounts: \[\{ coupon: compCouponId\(\) \}\]/);
  assert.match(checkout, /payment_method_collection: "if_required"/);
  assert.doesNotMatch(checkout, /allow_promotion_codes/);
});
