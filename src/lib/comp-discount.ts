/** Resolve the comp coupon against the same Stripe mode as checkout (live vs test). */

export type CheckoutDiscount =
  | { coupon: string }
  | { promotion_code: string };

export type CompDiscountStripe = {
  coupons: { retrieve: (id: string) => Promise<unknown> };
  promotionCodes: {
    retrieve: (id: string) => Promise<unknown>;
    list: (params: {
      code: string;
      active?: boolean;
      limit?: number;
    }) => Promise<{ data: Array<{ id: string }> }>;
  };
};

export function stripeErrorFields(error: unknown) {
  if (!error || typeof error !== "object") {
    return {
      message: error instanceof Error ? error.message : String(error || ""),
      code: "",
      param: "",
      type: "",
    };
  }
  const e = error as {
    message?: string;
    code?: string;
    param?: string;
    type?: string;
  };
  return {
    message: e.message || "",
    code: e.code || "",
    param: e.param || "",
    type: e.type || "",
  };
}

export function isMissingStripeResource(error: unknown) {
  const { code, message } = stripeErrorFields(error);
  return (
    code === "resource_missing" ||
    /no such (coupon|promotion code)/i.test(message)
  );
}

export function checkoutFailureCode(error: unknown) {
  const { message, param } = stripeErrorFields(error);
  if (/invalid api key|no such api key|authentication/i.test(message)) {
    return "stripe" as const;
  }
  if (/api key/i.test(message)) return "stripe" as const;
  if (
    /no such coupon|no such promotion code/i.test(message) ||
    (/coupon|promotion code|discount/i.test(message) &&
      !/customer|price|api key/i.test(message)) ||
    /discount|coupon|promotion/i.test(param)
  ) {
    return "coupon" as const;
  }
  return "checkout" as const;
}

export async function lookupCompCheckoutDiscount(
  id: string,
  stripe: CompDiscountStripe,
): Promise<CheckoutDiscount> {
  const trimmed = id.trim();
  if (!trimmed) {
    const missing = new Error("No such coupon or promotion code: ''");
    (missing as { code?: string }).code = "resource_missing";
    throw missing;
  }

  if (trimmed.startsWith("promo_")) {
    await stripe.promotionCodes.retrieve(trimmed);
    return { promotion_code: trimmed };
  }

  try {
    await stripe.coupons.retrieve(trimmed);
    return { coupon: trimmed };
  } catch (error) {
    if (!isMissingStripeResource(error)) throw error;
  }

  const listed = await stripe.promotionCodes.list({
    code: trimmed,
    active: true,
    limit: 1,
  });
  const promo = listed.data[0];
  if (promo) return { promotion_code: promo.id };

  const missing = new Error(`No such coupon or promotion code: '${trimmed}'`);
  (missing as { code?: string }).code = "resource_missing";
  throw missing;
}
