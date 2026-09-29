import assert from "node:assert/strict";
import test from "node:test";
import {
  isStripePriceId,
  isStripeProductId,
  priceIdForTier,
} from "../src/lib/membership.ts";
import { resolveCheckoutPriceId } from "../src/lib/stripe-price.ts";
import { checkoutFailureCode } from "../src/lib/comp-discount.ts";

const PRODUCT_ID = "prod_vLShasv4kagv9t";

function withPriceEnv(values, run) {
  const previous = {
    student: process.env.STRIPE_PRICE_STUDENT_MONTHLY,
    professional: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    secret: process.env.STRIPE_SECRET_KEY,
  };
  process.env.STRIPE_SECRET_KEY = "sk_live_example";
  process.env.STRIPE_PRICE_STUDENT_MONTHLY = values.student;
  process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY = values.professional;
  return Promise.resolve()
    .then(run)
    .finally(() => {
      if (previous.student === undefined) delete process.env.STRIPE_PRICE_STUDENT_MONTHLY;
      else process.env.STRIPE_PRICE_STUDENT_MONTHLY = previous.student;
      if (previous.professional === undefined) {
        delete process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
      } else {
        process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY = previous.professional;
      }
      if (previous.secret === undefined) delete process.env.STRIPE_SECRET_KEY;
      else process.env.STRIPE_SECRET_KEY = previous.secret;
    });
}

function pricesOnProduct(prices) {
  return {
    prices: {
      list: async ({ product }) => {
        assert.equal(product, PRODUCT_ID);
        return { data: prices };
      },
    },
  };
}

test("product vs price id helpers", () => {
  assert.equal(isStripeProductId(PRODUCT_ID), true);
  assert.equal(isStripeProductId("price_live_student"), false);
  assert.equal(isStripePriceId("price_live_student"), true);
  assert.equal(isStripePriceId("price_local_student"), false);
  assert.equal(isStripePriceId(PRODUCT_ID), false);
});

test("checkout resolves a product id to the matching monthly price", async () => {
  await withPriceEnv(
    { student: PRODUCT_ID, professional: PRODUCT_ID },
    async () => {
      assert.equal(priceIdForTier("student"), PRODUCT_ID);
      const stripe = pricesOnProduct([
        {
          id: "price_live_student",
          unit_amount: 1000,
          recurring: { interval: "month", interval_count: 1 },
        },
        {
          id: "price_live_pro",
          unit_amount: 3500,
          recurring: { interval: "month", interval_count: 1 },
        },
      ]);
      assert.equal(
        await resolveCheckoutPriceId("student", stripe),
        "price_live_student",
      );
      assert.equal(
        await resolveCheckoutPriceId("professional", stripe),
        "price_live_pro",
      );
    },
  );
});

test("checkout keeps a real price id without listing products", async () => {
  await withPriceEnv(
    { student: "price_live_student", professional: "price_live_pro" },
    async () => {
      const stripe = {
        prices: {
          list: async () => {
            throw new Error("should not list prices for a price_ id");
          },
        },
      };
      assert.equal(
        await resolveCheckoutPriceId("student", stripe),
        "price_live_student",
      );
    },
  );
});

test("checkout refuses a product with no matching monthly price", async () => {
  await withPriceEnv(
    { student: PRODUCT_ID, professional: PRODUCT_ID },
    async () => {
      const stripe = pricesOnProduct([
        {
          id: "price_yearly",
          unit_amount: 1000,
          recurring: { interval: "year", interval_count: 1 },
        },
      ]);
      await assert.rejects(
        () => resolveCheckoutPriceId("student", stripe),
        /No such price on product/,
      );
    },
  );
});

test("missing live prices and product ids map to the price checkout error", () => {
  assert.equal(
    checkoutFailureCode({
      message: `No such price: '${PRODUCT_ID}'`,
    }),
    "price",
  );
  assert.equal(
    checkoutFailureCode({
      message: `No such product: '${PRODUCT_ID}'`,
    }),
    "price",
  );
  assert.equal(
    checkoutFailureCode({
      message:
        "Missing live Stripe Price id for student. Set STRIPE_PRICE_STUDENT_MONTHLY to a live price id, then redeploy.",
    }),
    "price",
  );
});
