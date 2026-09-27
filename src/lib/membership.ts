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
  avatarUrl: string | null;
  school: string | null;
  year: string | null;
  company: string | null;
  position: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  x: string | null;
  linkedin: string | null;
  youtube: string | null;
  github: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileSocialLinks = {
  website: string | null;
  instagram: string | null;
  x: string | null;
  linkedin: string | null;
  youtube: string | null;
  github: string | null;
};

export function socialHref(
  kind: keyof ProfileSocialLinks,
  value: string | null | undefined,
) {
  const raw = (value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  switch (kind) {
    case "website":
      return `https://${raw.replace(/^\/+/, "")}`;
    case "instagram":
      return `https://instagram.com/${raw.replace(/^@/, "")}`;
    case "x":
      return `https://x.com/${raw.replace(/^@/, "")}`;
    case "linkedin":
      return `https://linkedin.com/in/${raw.replace(/^\/?in\//, "")}`;
    case "youtube":
      return `https://youtube.com/@${raw.replace(/^@/, "")}`;
    case "github":
      return `https://github.com/${raw.replace(/^@/, "")}`;
    default:
      return null;
  }
}

export const TIER_CATALOG: Record<
  Tier,
  {
    name: string;
    priceLabel: string;
    amountCents: number;
    benefits: string[];
  }
> = {
  student: {
    name: "student",
    priceLabel: "$10 / month",
    amountCents: 1000,
    benefits: [
      "for undergraduate designers",
      "guaranteed rsvp to every event (no waitlists)",
      "member directory",
      "bi-weekly coworking",
      "member-only events",
      "job opportunities and recruiting support from advisors and members",
    ],
  },
  professional: {
    name: "professional",
    priceLabel: "$35 / month",
    amountCents: 3500,
    benefits: [
      "for designers working in industry",
      "everything in student",
      "personal warm intros to design leads at partner companies",
    ],
  },
};

export const DEFAULT_STRIPE_PRICE_STUDENT =
  "price_1UIVFiRTgiLNfq1Kv7KyAwmF";
export const DEFAULT_STRIPE_PRICE_PROFESSIONAL =
  "price_1UIVG2RTgiLNfq1KTLqH7jof";

function configuredPriceId(tier: Tier) {
  const fromEnv =
    tier === "student"
      ? process.env.STRIPE_PRICE_STUDENT_MONTHLY
      : process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
  const trimmed = fromEnv?.trim();
  if (trimmed) return trimmed;
  return tier === "student"
    ? DEFAULT_STRIPE_PRICE_STUDENT
    : DEFAULT_STRIPE_PRICE_PROFESSIONAL;
}

export function tierFromPriceId(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null;
  if (
    priceId === configuredPriceId("student") ||
    priceId === "price_local_student"
  ) {
    return "student";
  }
  if (
    priceId === configuredPriceId("professional") ||
    priceId === "price_local_professional"
  ) {
    return "professional";
  }
  return null;
}

export function priceIdForTier(tier: Tier): string {
  return configuredPriceId(tier);
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
  const normalized = email.trim().toLowerCase();
  if (normalized === "demo@designmeetup.info") return "Michelle Liu";
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
