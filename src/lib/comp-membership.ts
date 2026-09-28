/** Server-only. 100% Stripe coupon applied at checkout for listed emails. */

export function parseCompEmails(raw: string | undefined | null) {
  return new Set(
    (raw || "")
      .split(/[,;\n]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isCompMembershipEmail(
  email: string,
  rawList = process.env.STRIPE_COMP_EMAILS,
) {
  return parseCompEmails(rawList).has(email.trim().toLowerCase());
}

export function compCouponId(
  raw = process.env.STRIPE_COUPON_FREE_MEMBERSHIP,
) {
  const id = (raw || "").trim();
  return id.startsWith("coupon_") ? id : "";
}

export function shouldApplyCompCoupon(email: string) {
  return Boolean(compCouponId() && isCompMembershipEmail(email));
}
