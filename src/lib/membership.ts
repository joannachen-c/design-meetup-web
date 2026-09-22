export type Tier = "student" | "professional";

export type MembershipStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export type MembershipRecord = {
  userId: string;
  tier: Tier;
  status: MembershipStatus;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
};

export type ProfileRecord = {
  id: string;
  email: string;
  displayName: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const TIER_CATALOG: Record<
  Tier,
  {
    name: string;
    priceLabel: string;
    amountCents: number;
    body: string;
  }
> = {
  student: {
    name: "Student",
    priceLabel: "$10 / month",
    amountCents: 1000,
    body: "For undergraduate and early-career designers. Guaranteed RSVP to every event (no waitlists), member directory, bi-weekly coworking, member-only events, and job leads from advisors and members.",
  },
  professional: {
    name: "Professional",
    priceLabel: "$35 / month",
    amountCents: 3500,
    body: "Everything in Student, plus personal warm intros to design leads at partner companies.",
  },
};

export function tierFromPriceId(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null;
  const student = process.env.STRIPE_PRICE_STUDENT_MONTHLY;
  const professional = process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
  if (student && priceId === student) return "student";
  if (professional && priceId === professional) return "professional";
  if (priceId === "price_local_student") return "student";
  if (priceId === "price_local_professional") return "professional";
  return null;
}

export function priceIdForTier(tier: Tier): string {
  if (tier === "student") {
    return process.env.STRIPE_PRICE_STUDENT_MONTHLY || "price_local_student";
  }
  return (
    process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || "price_local_professional"
  );
}

export function hasPortalAccess(status: MembershipStatus | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}

export function canUpgrade(tier: Tier | null | undefined) {
  return tier === "student";
}

export function isTier(value: unknown): value is Tier {
  return value === "student" || value === "professional";
}

export function normalizeMembershipStatus(
  value: string | null | undefined,
): MembershipStatus {
  switch (value) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "incomplete":
      return value;
    case "unpaid":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "incomplete";
  }
}

export function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] || "member";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function firstNameFromDisplay(displayName: string | null | undefined, email: string) {
  const source = (displayName || displayNameFromEmail(email)).trim();
  return source.split(/\s+/)[0] || "there";
}
