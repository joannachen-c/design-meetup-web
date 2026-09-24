import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  normalizeMembershipStatus,
  type Tier,
} from "@/lib/membership";
import {
  resolveTierFromStripePrice,
  upsertMembership,
} from "@/lib/membership-service";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 501 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ||
          session.metadata?.supabase_user_id ||
          null;
        if (!userId || !session.subscription) break;
        const subscription = await stripe.subscriptions.retrieve(
          String(session.subscription),
        );
        await syncSubscription(userId, subscription);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id || null;
        if (!userId) break;
        await syncSubscription(userId, subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(userId: string, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const tierFromMeta = subscription.metadata?.tier;
  const tier: Tier | null =
    tierFromMeta === "student" || tierFromMeta === "professional"
      ? tierFromMeta
      : resolveTierFromStripePrice(priceId);
  if (!tier) return;

  const status =
    subscription.status === "canceled"
      ? "canceled"
      : normalizeMembershipStatus(subscription.status);

  const periodEndSec =
    // Stripe API shapes vary by version; prefer subscription-level period end.
    (subscription as { current_period_end?: number }).current_period_end ??
    subscription.items.data[0]?.current_period_end ??
    null;
  const periodEnd = periodEndSec
    ? new Date(periodEndSec * 1000).toISOString()
    : null;

  await upsertMembership({
    userId,
    tier,
    status,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });
}
