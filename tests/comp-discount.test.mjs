import assert from "node:assert/strict";
import test from "node:test";
import {
  checkoutFailureCode,
  couponIdFromPromo,
  lookupCompCheckoutDiscount,
} from "../src/lib/comp-discount.ts";

function missing(message) {
  const error = new Error(message);
  error.code = "resource_missing";
  return error;
}

test("lookup uses a coupon id when retrieve succeeds", async () => {
  const discount = await lookupCompCheckoutDiscount("vXejHxwc", {
    coupons: { retrieve: async (id) => ({ id }) },
    promotionCodes: {
      retrieve: async () => {
        throw new Error("unused");
      },
      list: async () => ({ data: [] }),
    },
  });
  assert.deepEqual(discount, { coupon: "vXejHxwc" });
});

test("lookup falls back to a customer-facing promotion code", async () => {
  const discount = await lookupCompCheckoutDiscount("vXejHxwc", {
    coupons: {
      retrieve: async () => {
        throw missing("No such coupon: 'vXejHxwc'");
      },
    },
    promotionCodes: {
      retrieve: async () => {
        throw new Error("unused");
      },
      list: async () => ({ data: [{ id: "promo_123" }] }),
    },
  });
  assert.deepEqual(discount, { promotion_code: "promo_123" });
});

test("lookup uses the coupon attached to a promo_ id", async () => {
  const discount = await lookupCompCheckoutDiscount(
    "promo_1UKjNQRTgiLNfq1KP5vNNePP",
    {
      coupons: {
        retrieve: async () => {
          throw new Error("should not retrieve coupons");
        },
      },
      promotionCodes: {
        retrieve: async (id) => ({
          id,
          promotion: { coupon: "nVubzSJY", type: "coupon" },
        }),
        list: async () => ({ data: [] }),
      },
    },
  );
  assert.deepEqual(discount, { coupon: "nVubzSJY" });
});

test("lookup falls back to promotion_code if promo retrieve is not missing", async () => {
  const discount = await lookupCompCheckoutDiscount(
    "promo_1UKjNQRTgiLNfq1KP5vNNePP",
    {
      coupons: {
        retrieve: async () => {
          throw new Error("unused");
        },
      },
      promotionCodes: {
        retrieve: async () => {
          throw new Error("The provided key does not have the required permissions");
        },
        list: async () => ({ data: [] }),
      },
    },
  );
  assert.deepEqual(discount, {
    promotion_code: "promo_1UKjNQRTgiLNfq1KP5vNNePP",
  });
});

test("lookup throws when the id exists in neither live coupons nor promotion codes", async () => {
  await assert.rejects(
    () =>
      lookupCompCheckoutDiscount("vXejHxwc", {
        coupons: {
          retrieve: async () => {
            throw missing("No such coupon: 'vXejHxwc'");
          },
        },
        promotionCodes: {
          retrieve: async () => {
            throw missing("No such promotion code");
          },
          list: async () => ({ data: [] }),
        },
      }),
    /No such coupon or promotion code/,
  );
});

test("coupon id is read from promotion.coupon or a top-level coupon", () => {
  assert.equal(
    couponIdFromPromo({ promotion: { coupon: "nVubzSJY", type: "coupon" } }),
    "nVubzSJY",
  );
  assert.equal(couponIdFromPromo({ coupon: "legacy_id" }), "legacy_id");
  assert.equal(couponIdFromPromo({ coupon: { id: "obj_id" } }), "obj_id");
  assert.equal(couponIdFromPromo({}), "");
});

test("checkout maps missing coupons to coupon and bad keys to stripe", () => {
  assert.equal(
    checkoutFailureCode(missing("No such coupon: 'vXejHxwc'")),
    "coupon",
  );
  assert.equal(
    checkoutFailureCode({
      message: "Invalid API Key provided: sk_test_***",
    }),
    "stripe",
  );
  assert.equal(
    checkoutFailureCode({ message: "No such customer: 'cus_123'" }),
    "checkout",
  );
});
