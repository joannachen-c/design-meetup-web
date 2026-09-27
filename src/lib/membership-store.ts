import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
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

const DEFAULT_STORE_DIR = path.join(process.cwd(), ".data");
const FALLBACK_STORE_DIR = path.join("/tmp", "design-meetup-web");

let resolvedStoreDir: string | null = null;

async function dataDir() {
  if (resolvedStoreDir) return resolvedStoreDir;
  for (const dir of [DEFAULT_STORE_DIR, FALLBACK_STORE_DIR]) {
    try {
      await mkdir(dir, { recursive: true });
      const probe = path.join(dir, ".write-probe");
      await writeFile(probe, "ok");
      await unlink(probe).catch(() => {});
      resolvedStoreDir = dir;
      return dir;
    } catch {
      // Preview/serverless filesystems may be read-only outside /tmp.
    }
  }
  resolvedStoreDir = FALLBACK_STORE_DIR;
  return resolvedStoreDir;
}

async function storePath() {
  return path.join(await dataDir(), "membership-store.json");
}

async function lockPath() {
  return `${await storePath()}.lock`;
}

export async function avatarDir() {
  const dir = path.join(await dataDir(), "avatars");
  await mkdir(dir, { recursive: true });
  return dir;
}

const STALE_LOCK_MS = 5_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function errorCode(error: unknown) {
  return (error as NodeJS.ErrnoException | undefined)?.code;
}

function normalize(parsed: Partial<StoreShape>): StoreShape {
  return {
    profiles: Array.isArray(parsed.profiles)
      ? parsed.profiles.map((profile) => ({
          ...profile,
          avatarUrl: profile.avatarUrl ?? null,
          school: profile.school ?? null,
          year: profile.year ?? null,
          company: profile.company ?? null,
          position: profile.position ?? null,
          location: profile.location ?? null,
          website: profile.website ?? null,
          instagram: profile.instagram ?? null,
          x: profile.x ?? null,
          linkedin: profile.linkedin ?? null,
          youtube: profile.youtube ?? null,
          github: profile.github ?? null,
        }))
      : [],
    memberships: Array.isArray(parsed.memberships) ? parsed.memberships : [],
  };
}

/**
 * A missing file is an empty store; an unreadable one is not. Treating a
 * half-written file as empty used to write that emptiness back and wipe
 * every profile and membership.
 */
async function readStore(): Promise<StoreShape> {
  const filePath = await storePath();
  for (let attempt = 0; ; attempt += 1) {
    let raw: string;
    try {
      raw = await readFile(filePath, "utf8");
    } catch (error) {
      if (errorCode(error) === "ENOENT") return normalize({});
      throw error;
    }
    try {
      return normalize(JSON.parse(raw) as Partial<StoreShape>);
    } catch (error) {
      if (attempt >= 20) throw error;
      await sleep(25);
    }
  }
}

/** Readers only ever see a complete file: write a temp copy, then rename. */
async function writeStore(store: StoreShape) {
  const filePath = await storePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

/**
 * Serializes read-modify-write cycles with a lock file so concurrent requests
 * cannot overwrite each other's changes. A file lock (not an in-memory queue)
 * because route handlers and page renders may load separate module copies.
 */
async function withStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  const filePath = await lockPath();
  await mkdir(path.dirname(filePath), { recursive: true });
  const startedAt = Date.now();
  for (;;) {
    try {
      await writeFile(filePath, String(process.pid), { flag: "wx" });
      break;
    } catch (error) {
      if (errorCode(error) !== "EEXIST") throw error;
      const lockAge = await stat(filePath)
        .then((info) => Date.now() - info.mtimeMs)
        .catch(() => 0);
      if (lockAge > STALE_LOCK_MS) {
        await unlink(filePath).catch(() => {});
        continue;
      }
      if (Date.now() - startedAt > 10_000) {
        throw new Error("membership store is busy; try again.");
      }
      await sleep(15);
    }
  }
  try {
    return await fn();
  } finally {
    await unlink(filePath).catch(() => {});
  }
}

/** Runs `fn` on a fresh copy of the store and saves only if it changed. */
function mutateStore<T>(fn: (store: StoreShape) => T): Promise<T> {
  return withStoreLock(async () => {
    const store = await readStore();
    const before = JSON.stringify(store);
    const result = fn(store);
    if (JSON.stringify(store) !== before) await writeStore(store);
    return result;
  });
}

export function ensureLocalProfile(input: {
  id: string;
  email: string;
  displayName?: string | null;
}) {
  return mutateStore((store) => {
    const existing = store.profiles.find((p) => p.id === input.id);
    const now = new Date().toISOString();
    if (existing) {
      let changed = false;
      if (existing.email !== input.email) {
        existing.email = input.email;
        changed = true;
      }
      // Upgrade the seeded demo label if it still looks auto-generated.
      if (
        input.email.toLowerCase() === "demo@designmeetup.info" &&
        (!existing.displayName || /^demo$/i.test(existing.displayName.trim()))
      ) {
        existing.displayName = "Michelle Liu";
        changed = true;
      } else if (input.displayName != null && !existing.displayName) {
        existing.displayName = input.displayName;
        changed = true;
      }
      if (changed) existing.updatedAt = now;
      return existing;
    }
    const created: ProfileRecord = {
      id: input.id,
      email: input.email,
      displayName: input.displayName ?? displayNameFromEmail(input.email),
      avatarUrl: null,
      school: null,
      year: null,
      company: null,
      position: null,
      location: null,
      website: null,
      instagram: null,
      x: null,
      linkedin: null,
      youtube: null,
      github: null,
      stripeCustomerId: null,
      createdAt: now,
      updatedAt: now,
    };
    store.profiles.push(created);
    return created;
  });
}

export async function getLocalProfile(userId: string) {
  const store = await readStore();
  return store.profiles.find((p) => p.id === userId) ?? null;
}

export function updateLocalProfile(input: {
  userId: string;
  email?: string;
  displayName?: string | null;
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
}) {
  return mutateStore((store) => {
    const profile = store.profiles.find((p) => p.id === input.userId);
    if (!profile) return null;
    if (input.email != null) profile.email = input.email;
    if (input.displayName !== undefined) profile.displayName = input.displayName;
    if (input.avatarUrl !== undefined) profile.avatarUrl = input.avatarUrl;
    if (input.school !== undefined) profile.school = input.school;
    if (input.year !== undefined) profile.year = input.year;
    if (input.company !== undefined) profile.company = input.company;
    if (input.position !== undefined) profile.position = input.position;
    if (input.location !== undefined) profile.location = input.location;
    if (input.website !== undefined) profile.website = input.website;
    if (input.instagram !== undefined) profile.instagram = input.instagram;
    if (input.x !== undefined) profile.x = input.x;
    if (input.linkedin !== undefined) profile.linkedin = input.linkedin;
    if (input.youtube !== undefined) profile.youtube = input.youtube;
    if (input.github !== undefined) profile.github = input.github;
    profile.updatedAt = new Date().toISOString();
    return profile;
  });
}

export function setLocalStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
) {
  return mutateStore((store) => {
    const profile = store.profiles.find((p) => p.id === userId);
    if (!profile) return null;
    profile.stripeCustomerId = stripeCustomerId;
    profile.updatedAt = new Date().toISOString();
    return profile;
  });
}

export async function getLocalMembership(userId: string) {
  const store = await readStore();
  return store.memberships.find((m) => m.userId === userId) ?? null;
}

export function upsertLocalMembership(input: {
  userId: string;
  tier: Tier;
  status: MembershipStatus;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  return mutateStore((store) => {
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
    return created;
  });
}

export async function avatarFilePath(userId: string, ext = "jpg") {
  return path.join(await avatarDir(), `${userId}.${ext}`);
}

export async function saveAvatarFile(
  userId: string,
  bytes: Buffer,
  contentType: string,
) {
  const dir = await avatarDir();
  const ext =
    contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
  // Clear prior extensions so only one avatar file remains.
  for (const oldExt of ["jpg", "png", "webp"]) {
    try {
      await unlink(path.join(dir, `${userId}.${oldExt}`));
    } catch {
      // ignore missing
    }
  }
  const filePath = path.join(dir, `${userId}.${ext}`);
  await writeFile(filePath, bytes);
  return { filePath, ext, contentType };
}

export async function readAvatarFile(userId: string) {
  for (const ext of ["jpg", "png", "webp"] as const) {
    const filePath = await avatarFilePath(userId, ext);
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
