import { createAdminClient } from "./auth";
import { supabaseAuthConfigured } from "./auth-session";
import { hasGraduated, persistGraduation } from "./graduation";
import {
  displayNameFromEmail,
  firstNameFromDisplay,
  hasPortalAccess,
  normalizeMembershipStatus,
  priceIdForTier,
  tierFromPriceId,
  type MembershipRecord,
  type MembershipStatus,
  type ProfileRecord,
  type Tier,
} from "./membership";
import {
  ensureLocalProfile,
  getLocalMembership,
  getLocalProfile,
  listLocalStudentUserIds,
  readAvatarFile,
  saveAvatarFile,
  setLocalStripeCustomerId,
  updateLocalProfile,
  upsertLocalMembership,
} from "./membership-store";
import { sendGraduationUpgradeEmail } from "./welcome-email";

const DEMO_EMAIL = "demo@designmeetup.info";

let supabaseTablesReady: boolean | null = null;

async function supabaseMembershipTablesAvailable() {
  if (!supabaseAuthConfigured()) {
    supabaseTablesReady = false;
    return false;
  }
  if (supabaseTablesReady != null) return supabaseTablesReady;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1);
    supabaseTablesReady = !error;
  } catch {
    supabaseTablesReady = false;
  }
  return supabaseTablesReady;
}

export async function ensureProfile(user: {
  id: string;
  email?: string | null;
  displayName?: string | null;
}) {
  const email = (user.email || "").trim().toLowerCase();
  const displayName =
    user.displayName?.trim() || displayNameFromEmail(email);
  if (await supabaseMembershipTablesAvailable()) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select(
        "id,email,display_name,avatar_url,school,year,company,position,location,website,instagram,x,linkedin,youtube,github,stripe_customer_id,created_at,updated_at",
      )
      .eq("id", user.id)
      .maybeSingle();
    if (existing) {
      const mapped = mapProfile(existing);
      if (
        email === "demo@designmeetup.info" &&
        (!mapped.displayName || /^demo$/i.test(mapped.displayName.trim()))
      ) {
        await admin
          .from("profiles")
          .update({
            display_name: "Michelle Liu",
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        mapped.displayName = "Michelle Liu";
      } else if (user.displayName?.trim() && !mapped.displayName) {
        await admin
          .from("profiles")
          .update({
            display_name: user.displayName.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        mapped.displayName = user.displayName.trim();
      }
      return mapped;
    }
    const now = new Date().toISOString();
    const row = {
      id: user.id,
      email,
      display_name: displayName,
      avatar_url: null,
      stripe_customer_id: null,
      created_at: now,
      updated_at: now,
    };
    await admin.from("profiles").upsert(row);
    return mapProfile(row);
  }
  return ensureLocalProfile({
    id: user.id,
    email,
    displayName,
  });
}

function mapProfile(row: {
  id: string;
  email: string;
  display_name?: string | null;
  displayName?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  school?: string | null;
  year?: string | null;
  company?: string | null;
  position?: string | null;
  location?: string | null;
  website?: string | null;
  instagram?: string | null;
  x?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  github?: string | null;
  stripe_customer_id?: string | null;
  stripeCustomerId?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}): ProfileRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? row.displayName ?? null,
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? null,
    school: row.school ?? null,
    year: row.year ?? null,
    company: row.company ?? null,
    position: row.position ?? null,
    location: row.location ?? null,
    website: row.website ?? null,
    instagram: row.instagram ?? null,
    x: row.x ?? null,
    linkedin: row.linkedin ?? null,
    youtube: row.youtube ?? null,
    github: row.github ?? null,
    stripeCustomerId: row.stripe_customer_id ?? row.stripeCustomerId ?? null,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}

export async function getProfile(userId: string) {
  if (await supabaseMembershipTablesAvailable()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select(
        "id,email,display_name,avatar_url,school,year,company,position,location,website,instagram,x,linkedin,youtube,github,stripe_customer_id,created_at,updated_at",
      )
      .eq("id", userId)
      .maybeSingle();
    return data ? mapProfile(data) : null;
  }
  return getLocalProfile(userId);
}

export async function updateProfile(input: {
  userId: string;
  email?: string;
  displayName?: string;
  school?: string | null;
  year?: string | null;
  company?: string | null;
  position?: string | null;
  location?: string | null;
  website?: string | null;
  instagram?: string | null;
  x?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  github?: string | null;
  avatarBytes?: Buffer | null;
  avatarContentType?: string | null;
}) {
  const email = input.email?.trim().toLowerCase();
  const displayName =
    input.displayName === undefined ? undefined : input.displayName.trim() || null;
  const school = input.school?.trim() || null;
  const year =
    input.year === undefined ? undefined : persistGraduation(input.year);
  const company = input.company?.trim() || null;
  const position = input.position?.trim() || null;
  const location = input.location?.trim() || null;
  const website = input.website?.trim() || null;
  const instagram = input.instagram?.trim().replace(/^@/, "") || null;
  const x = input.x?.trim().replace(/^@/, "") || null;
  const linkedin = input.linkedin?.trim().replace(/^\/?in\//, "") || null;
  const youtube = input.youtube?.trim().replace(/^@/, "") || null;
  const github = input.github?.trim().replace(/^@/, "") || null;
  let avatarUrl: string | null | undefined;

  if (input.avatarBytes && input.avatarContentType) {
    await saveAvatarFile(
      input.userId,
      input.avatarBytes,
      input.avatarContentType,
    );
    avatarUrl = `/api/portal/avatar/${input.userId}?v=${Date.now()}`;
  }

  if (await supabaseMembershipTablesAvailable()) {
    const admin = createAdminClient();
    const existing = await getProfile(input.userId);
    // Keep the login identity confirmed. Changing email without
    // email_confirm can lock the member out until they click a link.
    if (email && email !== existing?.email) {
      await admin.auth.admin.updateUserById(input.userId, {
        email,
        email_confirm: true,
      });
    }
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (email) patch.email = email;
    if (displayName !== undefined) patch.display_name = displayName;
    if (avatarUrl !== undefined) patch.avatar_url = avatarUrl;
    if (input.school !== undefined) patch.school = school;
    if (input.year !== undefined) patch.year = year;
    if (input.company !== undefined) patch.company = company;
    if (input.position !== undefined) patch.position = position;
    if (input.location !== undefined) patch.location = location;
    if (input.website !== undefined) patch.website = website;
    if (input.instagram !== undefined) patch.instagram = instagram;
    if (input.x !== undefined) patch.x = x;
    if (input.linkedin !== undefined) patch.linkedin = linkedin;
    if (input.youtube !== undefined) patch.youtube = youtube;
    if (input.github !== undefined) patch.github = github;
    await admin.from("profiles").update(patch).eq("id", input.userId);
    return getProfile(input.userId);
  }

  return updateLocalProfile({
    userId: input.userId,
    email,
    displayName,
    avatarUrl,
    school: input.school !== undefined ? school : undefined,
    year: input.year !== undefined ? year : undefined,
    company: input.company !== undefined ? company : undefined,
    position: input.position !== undefined ? position : undefined,
    location: input.location !== undefined ? location : undefined,
    website: input.website !== undefined ? website : undefined,
    instagram: input.instagram !== undefined ? instagram : undefined,
    x: input.x !== undefined ? x : undefined,
    linkedin: input.linkedin !== undefined ? linkedin : undefined,
    youtube: input.youtube !== undefined ? youtube : undefined,
    github: input.github !== undefined ? github : undefined,
  });
}

export async function getAvatarForUser(userId: string) {
  return readAvatarFile(userId);
}

export async function getMembership(userId: string): Promise<MembershipRecord | null> {
  if (await supabaseMembershipTablesAvailable()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("memberships")
      .select(
        "user_id,tier,status,stripe_subscription_id,stripe_price_id,current_period_end,cancel_at_period_end,updated_at",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    return {
      userId: data.user_id,
      tier: data.tier as Tier,
      status: normalizeMembershipStatus(data.status),
      stripeSubscriptionId: data.stripe_subscription_id,
      stripePriceId: data.stripe_price_id,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
      updatedAt: data.updated_at,
    };
  }
  return getLocalMembership(userId);
}

const RECOVERY_MISS_TTL_MS = 15_000;
const recoveryMisses = new Map<string, number>();

/**
 * Rebuild a missing membership from the member's live Stripe subscription.
 * Covers a missed webhook and hosts without a durable membership store
 * (no service-role key means memberships only live in a per-instance /tmp).
 */
async function recoverMembershipFromStripe(userId: string) {
  const missedAt = recoveryMisses.get(userId);
  if (missedAt && Date.now() - missedAt < RECOVERY_MISS_TTL_MS) return null;
  if (!stripeConfigured()) return null;

  const { getStripe } = await import("./stripe");
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const profile = await getProfile(userId);
    const customerIds = new Set<string>();
    if (profile?.stripeCustomerId) customerIds.add(profile.stripeCustomerId);
    const email = (profile?.email || "").trim().toLowerCase();
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 10 });
      for (const customer of customers.data) customerIds.add(customer.id);
    }

    for (const customer of customerIds) {
      const subscriptions = await stripe.subscriptions.list({
        customer,
        status: "all",
        limit: 10,
      });
      const live = subscriptions.data.find((subscription) => {
        const owner = subscription.metadata?.supabase_user_id;
        return (
          (!owner || owner === userId) &&
          hasPortalAccess(normalizeMembershipStatus(subscription.status))
        );
      });
      if (live) {
        recoveryMisses.delete(userId);
        return syncMembershipFromStripeSubscription(userId, live);
      }
    }
  } catch (error) {
    console.error("stripe membership recovery failed", error);
  }
  recoveryMisses.set(userId, Date.now());
  return null;
}

export async function userHasPortalAccess(userId: string) {
  const membership =
    (await getMembership(userId)) ?? (await recoverMembershipFromStripe(userId));
  if (!hasPortalAccess(membership?.status ?? null)) return false;
  if (isLiveStripeSubscriptionId(membership?.stripeSubscriptionId)) return true;
  const profile = await getProfile(userId);
  return (profile?.email || "").trim().toLowerCase() === DEMO_EMAIL;
}

export async function saveStripeCustomerId(userId: string, customerId: string) {
  if (await supabaseMembershipTablesAvailable()) {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    return;
  }
  await setLocalStripeCustomerId(userId, customerId);
}

export async function upsertMembership(input: {
  userId: string;
  tier: Tier;
  status: MembershipStatus;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  if (await supabaseMembershipTablesAvailable()) {
    const admin = createAdminClient();
    await admin.from("memberships").upsert(
      {
        user_id: input.userId,
        tier: input.tier,
        status: input.status,
        stripe_subscription_id: input.stripeSubscriptionId ?? null,
        stripe_price_id: input.stripePriceId ?? priceIdForTier(input.tier),
        current_period_end: input.currentPeriodEnd ?? null,
        cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    return getMembership(input.userId);
  }
  return upsertLocalMembership(input);
}

export async function activateMockMembership(userId: string, tier: Tier) {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  return upsertMembership({
    userId,
    tier,
    status: "active",
    stripeSubscriptionId: `sub_local_${userId.slice(0, 8)}`,
    stripePriceId: priceIdForTier(tier),
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
  });
}

/** Preview/demo login can open the dashboard. New accounts must pay first. */
export async function ensureDemoMembership(
  email: string | null | undefined,
  userId: string,
) {
  if ((email || "").trim().toLowerCase() !== DEMO_EMAIL) return;
  const membership = await getMembership(userId);
  if (!hasPortalAccess(membership?.status ?? null)) {
    await activateMockMembership(userId, "student");
  }
}

/** Move graduated students onto Professional and persist that membership. */
export async function maybeUpgradeGraduatedStudent(input: {
  userId: string;
  origin?: string;
}) {
  const membership = await getMembership(input.userId);
  if (!membership || membership.tier !== "student") return null;
  if (!hasPortalAccess(membership.status)) return null;

  const profile = await getProfile(input.userId);
  if (!hasGraduated(profile?.year)) return null;

  try {
    let upgraded = null;
    if (isLiveStripeSubscriptionId(membership.stripeSubscriptionId)) {
      upgraded = await changeMembershipTier(input.userId, "professional");
      if (!upgraded) return null;
    } else {
      upgraded = await upsertMembership({
        userId: input.userId,
        tier: "professional",
        status: membership.status,
        stripeSubscriptionId: membership.stripeSubscriptionId,
        stripePriceId: priceIdForTier("professional"),
        currentPeriodEnd: membership.currentPeriodEnd,
        cancelAtPeriodEnd: false,
      });
    }
    if (profile?.email) {
      await sendGraduationUpgradeEmail({
        email: profile.email,
        firstName: firstNameFromDisplay(profile.displayName, profile.email),
        origin: input.origin,
      });
    }
    return upgraded;
  } catch (error) {
    console.error("graduation upgrade failed", {
      error: error instanceof Error ? error.message : "unknown error",
      userId: input.userId,
    });
    return null;
  }
}

export async function listStudentMemberIds() {
  if (await supabaseMembershipTablesAvailable()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("memberships")
      .select("user_id")
      .eq("tier", "student");
    return (data ?? []).map((row) => row.user_id as string);
  }
  return listLocalStudentUserIds();
}

/** Activate membership from a completed Checkout Session (works without webhooks). */
export async function syncMembershipFromCheckoutSession(input: {
  userId: string;
  sessionId: string;
}) {
  const { getStripe } = await import("./stripe");
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
    expand: ["subscription"],
  });
  if (session.payment_status !== "paid" && session.status !== "complete") {
    return null;
  }
  const owner =
    session.client_reference_id ||
    session.metadata?.supabase_user_id ||
    null;
  if (owner && owner !== input.userId) return null;

  const tierMeta = session.metadata?.tier;
  let tier: Tier | null =
    tierMeta === "student" || tierMeta === "professional" ? tierMeta : null;

  const subscription =
    typeof session.subscription === "object" && session.subscription
      ? session.subscription
      : null;
  const priceId = subscription?.items?.data?.[0]?.price?.id ?? null;
  if (!tier) {
    tier = resolveTierFromStripePrice(priceId);
  }
  if (!tier) {
    const subTier = subscription?.metadata?.tier;
    if (subTier === "student" || subTier === "professional") tier = subTier;
  }
  if (!tier) return null;

  const periodEndSec =
    (subscription as { current_period_end?: number } | null)?.current_period_end ??
    subscription?.items?.data?.[0]?.current_period_end ??
    null;

  if (session.customer && typeof session.customer === "string") {
    await saveStripeCustomerId(input.userId, session.customer);
  }

  return upsertMembership({
    userId: input.userId,
    tier,
    status: "active",
    stripeSubscriptionId:
      typeof session.subscription === "string"
        ? session.subscription
        : subscription?.id ?? null,
    stripePriceId: priceId ?? priceIdForTier(tier),
    currentPeriodEnd: periodEndSec
      ? new Date(periodEndSec * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
  });
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim().startsWith("sk_"));
}

/** Preview/local can use cookie membership. Production must charge through Stripe. */
export function mockBillingAllowed() {
  return process.env.VERCEL_ENV !== "production";
}

export function isLiveStripeSubscriptionId(
  id: string | null | undefined,
): id is string {
  return Boolean(id && id.startsWith("sub_") && !id.startsWith("sub_local_"));
}

function isStripeAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /invalid api key|no such api key|authentication/i.test(message);
}

function isMissingStripeSubscription(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /no such subscription/i.test(message);
}

type StripeSubscriptionLike = {
  id: string;
  status: string;
  customer?: string | { id?: string } | null;
  cancel_at_period_end?: boolean | null;
  current_period_end?: number;
  metadata?: { supabase_user_id?: string; tier?: string } | null;
  items?: {
    data?: Array<{
      current_period_end?: number;
      price?: { id?: string } | null;
    }>;
  };
};

function customerIdFromSubscription(subscription: StripeSubscriptionLike) {
  if (typeof subscription.customer === "string") return subscription.customer;
  return subscription.customer?.id ?? null;
}

export async function syncMembershipFromStripeSubscription(
  userId: string,
  subscription: StripeSubscriptionLike,
) {
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const tierFromMeta = subscription.metadata?.tier;
  const tier: Tier | null =
    tierFromMeta === "student" || tierFromMeta === "professional"
      ? tierFromMeta
      : resolveTierFromStripePrice(priceId);
  if (!tier) return null;

  const status =
    subscription.status === "canceled"
      ? "canceled"
      : normalizeMembershipStatus(subscription.status);

  const periodEndSec =
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end ??
    null;

  const customerId = customerIdFromSubscription(subscription);
  if (customerId) await saveStripeCustomerId(userId, customerId);

  return upsertMembership({
    userId,
    tier,
    status,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    currentPeriodEnd: periodEndSec
      ? new Date(periodEndSec * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });
}

export async function changeMembershipTier(userId: string, tier: Tier) {
  const membership = await getMembership(userId);
  const subscriptionId = membership?.stripeSubscriptionId;
  if (!isLiveStripeSubscriptionId(subscriptionId)) {
    return null;
  }
  const { getStripe } = await import("./stripe");
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const current = await stripe.subscriptions.retrieve(subscriptionId);
    if (current.status === "canceled" || current.status === "incomplete_expired") {
      return null;
    }
    const itemId = current.items.data[0]?.id;
    if (!itemId) return null;
    const { resolveCheckoutPriceId } = await import("./stripe-price");
    const nextPriceId = await resolveCheckoutPriceId(tier, stripe);
    const updated = await stripe.subscriptions.update(current.id, {
      items: [{ id: itemId, price: nextPriceId }],
      metadata: { supabase_user_id: userId, tier },
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
    });
    return syncMembershipFromStripeSubscription(userId, updated);
  } catch (error) {
    if (isMissingStripeSubscription(error)) return null;
    if (mockBillingAllowed() && isStripeAuthError(error)) return null;
    throw error;
  }
}

export async function setMembershipCancelAtPeriodEnd(
  userId: string,
  cancelAtPeriodEnd: boolean,
) {
  const membership = await getMembership(userId);
  if (!membership) return null;

  if (isLiveStripeSubscriptionId(membership.stripeSubscriptionId)) {
    const { getStripe } = await import("./stripe");
    const stripe = getStripe();
    if (stripe) {
      try {
        const updated = await stripe.subscriptions.update(
          membership.stripeSubscriptionId,
          { cancel_at_period_end: cancelAtPeriodEnd },
        );
        return syncMembershipFromStripeSubscription(userId, updated);
      } catch (error) {
        if (!(mockBillingAllowed() && isStripeAuthError(error))) {
          throw error;
        }
      }
    } else if (!mockBillingAllowed()) {
      throw new Error("Stripe is not configured.");
    }
  }

  return upsertMembership({
    userId,
    tier: membership.tier,
    status: membership.status,
    stripeSubscriptionId: membership.stripeSubscriptionId,
    stripePriceId: membership.stripePriceId,
    currentPeriodEnd: membership.currentPeriodEnd,
    cancelAtPeriodEnd,
  });
}

export function resolveTierFromStripePrice(priceId: string | null | undefined) {
  return tierFromPriceId(priceId);
}

export async function getMemberBillingOverview(userId: string) {
  const empty = { cards: [], invoices: [] };
  const { getCustomerBillingOverview, getStripe } = await import("./stripe");
  const stripe = getStripe();
  if (!stripe) return empty;
  const profile = await getProfile(userId);
  const customerId = profile?.stripeCustomerId;
  if (!customerId) return empty;
  try {
    return await getCustomerBillingOverview(stripe, customerId);
  } catch (error) {
    console.error("stripe billing overview failed", error);
    return empty;
  }
}
