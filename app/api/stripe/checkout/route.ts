import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isTier, priceIdForTier, TIER_CATALOG } from "@/lib/membership";
import {
  changeMembershipTier,
  ensureProfile,
  getProfile,
  saveStripeCustomerId,
  stripeConfigured,
  userHasPortalAccess,
} from "@/lib/membership-service";
import {
  checkoutFailureCode,
  lookupCompCheckoutDiscount,
  stripeErrorFields,
} from "@/lib/comp-discount";
import { shouldApplyCompCoupon, compCouponId } from "@/lib/comp-membership";
import {
  ensureStripeCustomer,
  getStripe,
  siteOriginFromRequest,
} from "@/lib/stripe";

export const runtime = "nodejs";

async function readTier(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { tier?: unknown };
      return { kind: "json" as const, tier: body.tier };
    } catch {
      return { kind: "json" as const, tier: null };
    }
  }

  try {
    const form = await request.formData();
    return { kind: "form" as const, tier: form.get("tier") };
  } catch {
    return { kind: "form" as const, tier: null };
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const origin = siteOriginFromRequest(request);
  const parsed = await readTier(request);

  if (!user?.email) {
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL("/login?next=%2Fportal%2Fsubscribe", origin),
        303,
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isTier(parsed.tier)) {
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL("/portal/subscribe?error=pick-tier", origin),
        303,
      );
    }
    return NextResponse.json({ error: "Pick a valid tier." }, { status: 400 });
  }
  const tier = parsed.tier;

  const userId = user.id;

  async function checkoutError(message: string, code = "checkout", status = 502) {
    if (parsed.kind === "form") {
      const paid = await userHasPortalAccess(userId);
      if (paid) {
        return NextResponse.redirect(
          new URL("/portal?checkout_error=1", origin),
          303,
        );
      }
      const dest = new URL("/portal/subscribe", origin);
      dest.searchParams.set("error", code);
      if (message) dest.searchParams.set("reason", message.slice(0, 240));
      return NextResponse.redirect(dest, 303);
    }
    return NextResponse.json({ error: message, code }, { status });
  }

  await ensureProfile({ id: user.id, email: user.email });

  if (!stripeConfigured()) {
    return checkoutError(
      "billing isn't set up correctly yet. please try again later.",
      "stripe",
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    if (parsed.kind === "form") {
      return NextResponse.redirect(
        new URL("/portal/subscribe?error=stripe", origin),
        303,
      );
    }
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  try {
    const switched = await changeMembershipTier(user.id, tier);
    if (switched) {
      const url = `${origin}/portal?subscribed=1&tier=${tier}`;
      if (parsed.kind === "form") {
        return NextResponse.redirect(url, 303);
      }
      return NextResponse.json({ url, mock: false });
    }

    const profile = await getProfile(user.id);
    const customerId = await ensureStripeCustomer(stripe, {
      customerId: profile?.stripeCustomerId ?? null,
      email: user.email,
      userId: user.id,
    });
    if (customerId !== profile?.stripeCustomerId) {
      await saveStripeCustomerId(user.id, customerId);
    }

    const priceId = priceIdForTier(tier);
    if (priceId.startsWith("price_local_")) {
      if (parsed.kind === "form") {
        return NextResponse.redirect(
          new URL("/portal/subscribe?error=price", origin),
          303,
        );
      }
      return NextResponse.json(
        {
          error: `Missing Stripe Price id for ${TIER_CATALOG[tier].name}. Set STRIPE_PRICE_${tier.toUpperCase()}_MONTHLY.`,
        },
        { status: 500 },
      );
    }

    const applyComp = shouldApplyCompCoupon(user.email);
    const discounts = applyComp
      ? [await lookupCompCheckoutDiscount(compCouponId(), stripe)]
      : undefined;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/portal?subscribed=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/portal/subscribe?canceled=1`,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id, tier },
      subscription_data: {
        metadata: { supabase_user_id: user.id, tier },
      },
      ...(discounts ? { discounts } : {}),
      // Collect a card even when the coupon brings the total to $0.
      payment_method_collection: "always",
    });

    if (!session.url) {
      if (parsed.kind === "form") {
        return NextResponse.redirect(
          new URL("/portal/subscribe?error=checkout", origin),
          303,
        );
      }
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }

    if (parsed.kind === "form") {
      return NextResponse.redirect(session.url, 303);
    }
    return NextResponse.json({ url: session.url, mock: false });
  } catch (error) {
    const fields = stripeErrorFields(error);
    console.error("stripe checkout failed", fields);
    const code = checkoutFailureCode(error);
    const stripeMessage = fields.message;
    if (code === "stripe") {
      return checkoutError(
        stripeMessage ||
          "billing isn't set up correctly yet. please try again later.",
        "stripe",
      );
    }
    if (code === "coupon") {
      return checkoutError(
        stripeMessage ||
          "couldn't apply the free membership coupon. please try again later.",
        "coupon",
      );
    }
    return checkoutError(
      stripeMessage || "could not start checkout. please try again.",
    );
  }
}
