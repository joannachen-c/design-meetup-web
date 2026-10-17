import {
  isStripePriceId,
  isStripeProductId,
  priceIdForTier,
  TIER_CATALOG,
  type Tier,
} from "./membership.ts";

export type StripePriceLike = {
  id: string;
  active?: boolean;
  unit_amount?: number | null;
  nickname?: string | null;
  recurring?: {
    interval?: string | null;
    interval_count?: number | null;
  } | null;
};

export type PriceLookupStripe = {
  prices: {
    list: (params: {
      product: string;
      active?: boolean;
      type?: "recurring" | "one_time";
      limit?: number;
    }) => Promise<{ data: StripePriceLike[] }>;
  };
};

function missingMonthlyPrice(tier: Tier, productId: string) {
  const catalog = TIER_CATALOG[tier];
  const error = new Error(
    `No such price on product '${productId}' for ${catalog.name} (${catalog.priceLabel}). Set STRIPE_PRICE_${tier.toUpperCase()}_MONTHLY to a live price_ id.`,
  );
  (error as { code?: string }).code = "resource_missing";
  return error;
}

function isMonthlyRecurring(price: StripePriceLike) {
  return (
    price.recurring?.interval === "month" &&
    (price.recurring.interval_count ?? 1) === 1
  );
}

function pickMatchingPrice(tier: Tier, prices: StripePriceLike[]) {
  const amount = TIER_CATALOG[tier].amountCents;
  const monthly = prices.filter(isMonthlyRecurring);
  const matchingAmount = monthly.filter((price) => price.unit_amount === amount);
  if (matchingAmount.length === 1) return matchingAmount[0].id;
  if (matchingAmount.length > 1) {
    const named = matchingAmount.find((price) =>
      (price.nickname || "").toLowerCase().includes(tier),
    );
    return (named ?? matchingAmount[0]).id;
  }
  if (monthly.length === 1) return monthly[0].id;
  return null;
}

export async function priceIdFromProduct(
  productId: string,
  tier: Tier,
  stripe: PriceLookupStripe,
) {
  const listed = await stripe.prices.list({
    product: productId,
    active: true,
    type: "recurring",
    limit: 100,
  });
  const priceId = pickMatchingPrice(tier, listed.data);
  if (!priceId) throw missingMonthlyPrice(tier, productId);
  return priceId;
}

/** Checkout needs a Price id. Env sometimes holds a Product id (prod_...). */
export async function resolveCheckoutPriceId(
  tier: Tier,
  stripe: PriceLookupStripe,
) {
  const configured = priceIdForTier(tier);
  if (configured.startsWith("price_local_")) {
    throw new Error(
      `Missing live Stripe Price id for ${TIER_CATALOG[tier].name}. Set STRIPE_PRICE_${tier.toUpperCase()}_MONTHLY to a live price id, then redeploy.`,
    );
  }
  if (isStripeProductId(configured)) {
    return priceIdFromProduct(configured, tier, stripe);
  }
  if (!isStripePriceId(configured)) {
    throw new Error(
      `No such price: '${configured}'. Set STRIPE_PRICE_${tier.toUpperCase()}_MONTHLY to a live price_ id, not a product id.`,
    );
  }
  return configured;
}
