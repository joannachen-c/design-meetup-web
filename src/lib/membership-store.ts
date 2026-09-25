import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
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
export const AVATAR_DIR = path.join(process.cwd(), ".data", "avatars");

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      profiles: Array.isArray(parsed.profiles)
        ? parsed.profiles.map((profile) => ({
            ...profile,
            avatarUrl: profile.avatarUrl ?? null,
          }))
        : [],
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
    // Upgrade the seeded demo label if it still looks auto-generated.
    if (
      input.email.toLowerCase() === "demo@designmeetup.info" &&
      (!existing.displayName ||
        /^demo$/i.test(existing.displayName.trim()) ||
        existing.displayName.trim().toLowerCase() === "demo")
    ) {
      existing.displayName = "Michelle Liu";
    } else if (input.displayName != null && !existing.displayName) {
      existing.displayName = input.displayName;
    }
    existing.updatedAt = now;
    await writeStore(store);
    return existing;
  }
  const created: ProfileRecord = {
    id: input.id,
    email: input.email,
    displayName: input.displayName ?? displayNameFromEmail(input.email),
    avatarUrl: null,
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

export async function updateLocalProfile(input: {
  userId: string;
  email?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}) {
  const store = await readStore();
  const profile = store.profiles.find((p) => p.id === input.userId);
  if (!profile) return null;
  if (input.email != null) profile.email = input.email;
  if (input.displayName !== undefined) profile.displayName = input.displayName;
  if (input.avatarUrl !== undefined) profile.avatarUrl = input.avatarUrl;
  profile.updatedAt = new Date().toISOString();
  await writeStore(store);
  return profile;
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

export function avatarFilePath(userId: string, ext = "jpg") {
  return path.join(AVATAR_DIR, `${userId}.${ext}`);
}

export async function saveAvatarFile(
  userId: string,
  bytes: Buffer,
  contentType: string,
) {
  await mkdir(AVATAR_DIR, { recursive: true });
  const ext =
    contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
  // Clear prior extensions so only one avatar file remains.
  for (const oldExt of ["jpg", "png", "webp"]) {
    try {
      await unlink(path.join(AVATAR_DIR, `${userId}.${oldExt}`));
    } catch {
      // ignore missing
    }
  }
  const filePath = avatarFilePath(userId, ext);
  await writeFile(filePath, bytes);
  return { filePath, ext, contentType };
}

export async function readAvatarFile(userId: string) {
  for (const ext of ["jpg", "png", "webp"] as const) {
    const filePath = avatarFilePath(userId, ext);
    try {
      const bytes = await readFile(filePath);
      const contentType =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
      return { bytes, contentType, ext };
    } catch {
      // try next
    }
  }
  return null;
}
