import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  displayNameFromEmail,
  type MembershipRecord,
  type MembershipStatus,
  type ProfileRecord,
  type Tier,
} from "./membership";

type StoreShape = {
  profiles: ProfileRecord[];
  memberships: MembershipRecord[];
};

const STORE_PATH = path.join(process.cwd(), ".data", "membership-store.json");

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      memberships: Array.isArray(parsed.memberships) ? parsed.memberships : [],
    };
  } catch {
    return { profiles: [], memberships: [] };
  }
}

async function writeStore(store: StoreShape) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function ensureLocalProfile(input: {
  id: string;
  email: string;
  displayName?: string | null;
}) {
  const store = await readStore();
  const existing = store.profiles.find((p) => p.id === input.id);
  const now = new Date().toISOString();
  if (existing) {
    existing.email = input.email;
    if (input.displayName != null) existing.displayName = input.displayName;
    existing.updatedAt = now;
    await writeStore(store);
    return existing;
  }
  const created: ProfileRecord = {
    id: input.id,
    email: input.email,
    displayName: input.displayName ?? displayNameFromEmail(input.email),
    stripeCustomerId: null,
    createdAt: now,
    updatedAt: now,
  };
  store.profiles.push(created);
  await writeStore(store);
  return created;
}

export async function getLocalProfile(userId: string) {
  const store = await readStore();
  return store.profiles.find((p) => p.id === userId) ?? null;
}

export async function setLocalStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
) {
  const store = await readStore();
  const profile = store.profiles.find((p) => p.id === userId);
  if (!profile) return null;
  profile.stripeCustomerId = stripeCustomerId;
  profile.updatedAt = new Date().toISOString();
  await writeStore(store);
  return profile;
}

export async function getLocalMembership(userId: string) {
  const store = await readStore();
  return store.memberships.find((m) => m.userId === userId) ?? null;
}

export async function upsertLocalMembership(input: {
  userId: string;
  tier: Tier;
  status: MembershipStatus;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const existing = store.memberships.find((m) => m.userId === input.userId);
  if (existing) {
    existing.tier = input.tier;
    existing.status = input.status;
    if (input.stripeSubscriptionId !== undefined) {
      existing.stripeSubscriptionId = input.stripeSubscriptionId;
    }
    if (input.stripePriceId !== undefined) {
      existing.stripePriceId = input.stripePriceId;
    }
    if (input.currentPeriodEnd !== undefined) {
      existing.currentPeriodEnd = input.currentPeriodEnd;
    }
    if (input.cancelAtPeriodEnd !== undefined) {
      existing.cancelAtPeriodEnd = input.cancelAtPeriodEnd;
    }
    existing.updatedAt = now;
    await writeStore(store);
    return existing;
  }
  const created: MembershipRecord = {
    userId: input.userId,
    tier: input.tier,
    status: input.status,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    stripePriceId: input.stripePriceId ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
    updatedAt: now,
  };
  store.memberships.push(created);
  await writeStore(store);
  return created;
}
