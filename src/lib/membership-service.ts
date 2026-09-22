import { createAdminClient } from "./auth";
import {
  displayNameFromEmail,
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
  setLocalStripeCustomerId,
  upsertLocalMembership,
} from "./membership-store";

let supabaseTablesReady: boolean | null = null;

async function supabaseMembershipTablesAvailable() {
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
}) {
  const email = (user.email || "").trim().toLowerCase();
  if (await supabaseMembershipTablesAvailable()) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id,email,display_name,stripe_customer_id,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle();
    if (existing) {
      return mapProfile(existing);
    }
    const now = new Date().toISOString();
    const row = {
      id: user.id,
      email,
      display_name: displayNameFromEmail(email),
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
    displayName: displayNameFromEmail(email),
  });
}

function mapProfile(row: {
  id: string;
  email: string;
  display_name?: string | null;
  displayName?: string | null;
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
      .select("id,email,display_name,stripe_customer_id,created_at,updated_at")
      .eq("id", userId)
      .maybeSingle();
    return data ? mapProfile(data) : null;
  }
  return getLocalProfile(userId);
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

export async function userHasPortalAccess(userId: string) {
  const membership = await getMembership(userId);
  return hasPortalAccess(membership?.status ?? null);
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

export function resolveTierFromStripePrice(priceId: string | null | undefined) {
  return tierFromPriceId(priceId);
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
