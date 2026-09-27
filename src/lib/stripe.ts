import Stripe from "stripe";
import { requestOrigin } from "@/lib/site";

let stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia",
      typescript: true,
    });
  }
  return stripe;
}

export function siteOriginFromRequest(request: Request) {
  return requestOrigin(request);
}
