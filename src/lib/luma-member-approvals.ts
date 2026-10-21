import { createHmac, timingSafeEqual } from "node:crypto";
import { cohortForEmail, type Cohort } from "./cohort.ts";

/**
 * Members skip the Luma approval queue. Luma has no notion of our Stripe
 * membership, so we watch pending RSVPs on the Design Meetup calendar and
 * approve the ones whose email belongs to an active member.
 *
 * Everything here talks to Luma through an injected fetch and takes the member
 * list as an argument, so the rules are testable without Luma or Supabase.
 */

export const LUMA_API_BASE = "https://public-api.luma.com";
export const LUMA_WEBHOOK_PATH = "/api/luma/webhook";

// Approval-queue events: a fresh RSVP and a guest moved back to pending.
export const LUMA_WEBHOOK_EVENT_TYPES = ["guest.registered", "guest.updated"];

type FetchImpl = typeof fetch;

export type LumaPendingGuest = {
  id: string;
  email: string;
  name: string | null;
};

export type LumaApprovalResult = {
  eventId: string;
  eventName: string | null;
  pending: number;
  approved: LumaPendingGuest[];
  failed: Array<LumaPendingGuest & { error: string }>;
};

export type LumaApprovalSummary = {
  dryRun: boolean;
  events: LumaApprovalResult[];
  pending: number;
  approved: number;
  failed: number;
};

type LumaClientOptions = {
  apiKey: string;
  fetchImpl?: FetchImpl;
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
};

export function lumaApiKey(env: Record<string, string | undefined> = process.env) {
  return (env.LUMA_API_KEY ?? "").trim() || null;
}

export function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function memberEmailSet(emails: Iterable<string | null | undefined>) {
  const set = new Set<string>();
  for (const email of emails) {
    const normalized = normalizeEmail(email);
    if (normalized) set.add(normalized);
  }
  return set;
}

export function membersToApprove(
  guests: LumaPendingGuest[],
  memberEmails: Set<string>,
) {
  return guests.filter((guest) => memberEmails.has(normalizeEmail(guest.email)));
}

/**
 * Luma does not document how to verify webhook signatures, so the webhook URL
 * carries a token derived from the API key instead. Holding the token only
 * lets a caller trigger a re-check: approvals are always decided from what
 * Luma reports, never from the request body.
 */
export function lumaWebhookToken(apiKey: string) {
  return createHmac("sha256", apiKey).update("luma-member-approvals-webhook").digest("hex");
}

export function isValidLumaWebhookToken(apiKey: string, token: string | null) {
  if (!token) return false;
  const expected = Buffer.from(lumaWebhookToken(apiKey));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function lumaWebhookUrl(origin: string, apiKey: string) {
  const url = new URL(LUMA_WEBHOOK_PATH, origin);
  url.searchParams.set("token", lumaWebhookToken(apiKey));
  return url.toString();
}

/** The event a guest webhook is about, or null for payloads we ignore. */
export function eventIdFromWebhook(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const { type, data } = payload as {
    type?: unknown;
    data?: { approval_status?: unknown; event?: { id?: unknown; api_id?: unknown } };
  };
  if (typeof type !== "string" || !LUMA_WEBHOOK_EVENT_TYPES.includes(type)) return null;
  if (data?.approval_status !== "pending_approval") return null;
  const id = data.event?.id ?? data.event?.api_id;
  return typeof id === "string" && id.startsWith("evt-") ? id : null;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class LumaApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LumaApiError";
    this.status = status;
  }
}

export function createLumaClient({
  apiKey,
  fetchImpl = fetch,
  sleep = defaultSleep,
  maxAttempts = 4,
}: LumaClientOptions) {
  async function request<T>(
    path: string,
    init: { method?: "GET" | "POST"; query?: Record<string, string>; body?: unknown } = {},
  ): Promise<T> {
    const url = new URL(path, LUMA_API_BASE);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      url.searchParams.set(key, value);
    }

    for (let attempt = 1; ; attempt += 1) {
      const response = await fetchImpl(url, {
        method: init.method ?? "GET",
        headers: {
          accept: "application/json",
          "x-luma-api-key": apiKey,
          ...(init.body === undefined ? {} : { "content-type": "application/json" }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        cache: "no-store",
      });

      if (response.ok) return (await response.json()) as T;

      // Calendar keys share 200 requests/minute; back off instead of failing the sweep.
      if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) {
        await sleep(2 ** attempt * 1_000);
        continue;
      }

      let message = `Luma ${init.method ?? "GET"} ${url.pathname} returned ${response.status}`;
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload?.message) message += `: ${payload.message}`;
      } catch {
        // Body was not JSON; the status is enough.
      }
      throw new LumaApiError(message, response.status);
    }
  }

  async function paginate<T>(path: string, query: Record<string, string>) {
    const entries: T[] = [];
    let cursor: string | undefined;
    do {
      const page = await request<{ entries?: T[]; has_more?: boolean; next_cursor?: string }>(
        path,
        { query: { ...query, pagination_limit: "100", ...(cursor ? { pagination_cursor: cursor } : {}) } },
      );
      entries.push(...(page.entries ?? []));
      cursor = page.has_more && page.next_cursor ? page.next_cursor : undefined;
    } while (cursor);
    return entries;
  }

  return {
    /** Events that have not ended yet, including ones already underway. */
    async listOpenEvents(now = new Date()) {
      type Entry = {
        event?: LumaEventSummary;
      } & LumaEventSummary;
      const after = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const entries = await paginate<Entry>("/v1/calendars/events/list", { after });
      return entries
        .map((entry) => entry.event ?? entry)
        .filter((event) => {
          const end = new Date(event.end_at ?? event.start_at ?? "").getTime();
          return Number.isFinite(end) && end > now.getTime();
        })
        .flatMap((event) => {
          const id = event.api_id ?? event.id;
          return id ? [{ id, name: event.name ?? null, requireApproval: event.require_approval }] : [];
        });
    },

    async listPendingGuests(eventId: string): Promise<LumaPendingGuest[]> {
      type Entry = {
        api_id?: string;
        id?: string;
        email?: string | null;
        user_email?: string | null;
        name?: string | null;
        user_name?: string | null;
        approval_status?: string;
      };
      const entries = await paginate<Entry>("/v1/events/guests/list", {
        event_id: eventId,
        approval_status: "pending_approval",
      });
      return entries.flatMap((guest) => {
        const id = guest.api_id ?? guest.id;
        const email = guest.email ?? guest.user_email;
        if (!id || !email || guest.approval_status !== "pending_approval") return [];
        return [{ id, email, name: guest.name ?? guest.user_name ?? null }];
      });
    },

    async approveGuest(eventId: string, guestId: string) {
      await request("/v1/events/guests/update-status", {
        method: "POST",
        body: { event_id: eventId, guest_id: guestId, status: "approved" },
      });
    },

    async findMembershipTierId(name: string) {
      const tiers = await paginate<{ id?: string; api_id?: string; name?: string }>(
        "/v1/memberships/tiers/list",
        {},
      );
      const tier = tiers.find((entry) => entry.name === name);
      return tier?.id ?? tier?.api_id ?? null;
    },

    /** Emails of everyone who already holds a membership on the calendar, in any tier. */
    async listCalendarMemberEmails() {
      const people = await paginate<{
        email?: string | null;
        user?: { email?: string | null } | null;
        membership?: { status?: string } | null;
      }>("/v1/calendar/list-people", {});
      return memberEmailSet(
        people
          .filter((person) => person.membership)
          .map((person) => person.email ?? person.user?.email),
      );
    },

    async ensureContactTag(name: string, color = "blue") {
      const tags = await paginate<{ id?: string; api_id?: string; name?: string }>(
        "/v1/calendars/contact-tags/list",
        {},
      );
      const existing = tags.find((tag) => tag.name === name);
      const existingId = existing?.id ?? existing?.api_id;
      if (existingId) return existingId;
      const created = await request<{ id?: string; api_id?: string }>(
        "/v1/calendars/contact-tags/create",
        { method: "POST", body: { name, color } },
      );
      const id = created.id ?? created.api_id;
      if (!id) throw new Error(`Luma did not return an id for tag "${name}"`);
      return id;
    },

    /** Creates the contact when Luma has never seen the email, and applies tags. */
    async importContacts(
      contacts: Array<{ email: string; name?: string | null }>,
      tags: string[],
    ) {
      await request("/v1/calendars/contacts/import", {
        method: "POST",
        body: { contacts, tags },
      });
    },

    /** Returns false when the person already has a membership on this calendar. */
    async addMemberToTier(email: string, tierId: string) {
      try {
        const result = await request<{ status?: string }>("/v1/memberships/members/add", {
          method: "POST",
          body: { email, membership_tier_id: tierId },
        });
        if (result.status === "pending") {
          await request("/v1/memberships/members/update-status", {
            method: "POST",
            body: { user_id: email, status: "approved" },
          });
        }
        return true;
      } catch (error) {
        if (error instanceof LumaApiError && /already has an active membership/i.test(error.message)) {
          return false;
        }
        throw error;
      }
    },

    async declineMember(email: string) {
      await request("/v1/memberships/members/update-status", {
        method: "POST",
        body: { user_id: email, status: "declined" },
      });
    },
  };
}

export const LUMA_MEMBER_TIER = "Member";

const DEMO_EMAIL = "demo@designmeetup.info";

/** Cohort is the Luma contact category. Comp emails are cohort 0; the allowlist is cohort 1. */
export const LUMA_COHORT_TAGS: Record<Cohort, { name: string; color: string }> = {
  0: { name: "Cohort 0", color: "blue" },
  1: { name: "Cohort 1", color: "purple" },
};

export function lumaCategoryForEmail(email: string | null | undefined) {
  const cohort = cohortForEmail(email);
  return cohort == null ? null : LUMA_COHORT_TAGS[cohort];
}

/**
 * After a portal signup, tag the person's cohort on Luma. Membership in the
 * Member tier waits until they have paid. The demo account is skipped.
 * Unknown emails are skipped. Safe to repeat.
 */
export async function registerSignedUpMemberOnLuma({
  client,
  email,
  name,
}: {
  client: LumaClient;
  email: string;
  name?: string | null;
}) {
  const normalized = normalizeEmail(email);
  const category = lumaCategoryForEmail(normalized);
  if (!normalized || normalized === DEMO_EMAIL || !category) return null;

  const tagId = await client.ensureContactTag(category.name, category.color);
  await client.importContacts(
    [{ email: normalized, name: name?.trim() || null }],
    [tagId],
  );
  return { email: normalized, tagId, tag: category.name };
}

/**
 * Put someone on the Member tier after they have paid on the portal, or when
 * they are on the Board of Advisors. The demo account is skipped.
 */
export async function grantLumaMembership({
  client,
  email,
}: {
  client: LumaClient;
  email: string;
}) {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized === DEMO_EMAIL) return null;
  const tierId = await client.findMembershipTierId(LUMA_MEMBER_TIER);
  if (!tierId) throw new Error(`Luma has no "${LUMA_MEMBER_TIER}" membership tier`);
  const added = await client.addMemberToTier(normalized, tierId);
  return { email: normalized, tierId, added };
}

/** Payment must succeed even when Luma is down. */
export async function syncPaidMemberToLuma(input: {
  email: string;
  client?: LumaClient;
}) {
  let client = input.client ?? null;
  if (!client) {
    const apiKey = lumaApiKey();
    if (!apiKey) return null;
    client = createLumaClient({ apiKey, maxAttempts: 2 });
  }
  try {
    return await grantLumaMembership({ client, email: input.email });
  } catch (error) {
    console.error("[luma] paid member sync failed", error);
    return null;
  }
}

/**
 * Emails on the Design Meetup roster who should not hold the Luma Member tier.
 * Keep everyone who has paid on the portal and the Board of Advisors.
 */
export function emailsToRemoveFromLumaTier(
  rosterEmails: Iterable<string | null | undefined>,
  keepEmails: Iterable<string | null | undefined>,
) {
  const remove = memberEmailSet(rosterEmails);
  for (const email of memberEmailSet(keepEmails)) remove.delete(email);
  return remove;
}

/** Signup must succeed even when Luma is down. Returns null when there is nothing to do. */
export async function syncSignedUpMemberToLuma(input: {
  email: string;
  name?: string | null;
  client?: LumaClient;
}) {
  let client = input.client ?? null;
  if (!client) {
    const apiKey = lumaApiKey();
    if (!apiKey) return null;
    client = createLumaClient({ apiKey, maxAttempts: 2 });
  }
  try {
    return await registerSignedUpMemberOnLuma({
      client,
      email: input.email,
      name: input.name,
    });
  } catch (error) {
    console.error("[luma] signup cohort tag failed", error);
    return null;
  }
}

/**
 * Put paid portal members and the Board of Advisors on the Member tier, and
 * take the tier back from roster emails that have not paid. People already
 * on the tier are not added again.
 */
export async function syncMembershipTier({
  client,
  memberEmails,
  revokeEmails,
  tierName = LUMA_MEMBER_TIER,
}: {
  client: LumaClient;
  memberEmails: Set<string>;
  revokeEmails?: Set<string>;
  tierName?: string;
}) {
  const tierId = await client.findMembershipTierId(tierName);
  if (!tierId) throw new Error(`Luma has no "${tierName}" membership tier`);
  const existing = await client.listCalendarMemberEmails();
  let added = 0;
  let removed = 0;
  const failed: Array<{ email: string; error: string }> = [];
  for (const email of memberEmails) {
    if (existing.has(email)) continue;
    try {
      if (await client.addMemberToTier(email, tierId)) added += 1;
    } catch (error) {
      failed.push({ email, error: error instanceof Error ? error.message : String(error) });
    }
  }
  for (const email of revokeEmails ?? []) {
    if (!existing.has(email) || memberEmails.has(email)) continue;
    try {
      await client.declineMember(email);
      removed += 1;
    } catch (error) {
      failed.push({ email, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { tierId, added, removed, alreadyMembers: existing.size, failed };
}

type LumaEventSummary = {
  api_id?: string;
  id?: string;
  name?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  require_approval?: boolean;
};

export type LumaClient = ReturnType<typeof createLumaClient>;

/**
 * Approve every pending guest who is a member, on the given events or on
 * every event that has not ended. Safe to run repeatedly: approved guests
 * leave the pending list, so a second run finds nothing to do.
 */
export async function approvePendingMembers({
  client,
  memberEmails,
  eventIds,
  dryRun = false,
  now = new Date(),
}: {
  client: LumaClient;
  memberEmails: Set<string>;
  eventIds?: string[];
  dryRun?: boolean;
  now?: Date;
}): Promise<LumaApprovalSummary> {
  const events = eventIds
    ? eventIds.map((id) => ({ id, name: null as string | null, requireApproval: undefined }))
    : (await client.listOpenEvents(now)).filter((event) => event.requireApproval !== false);

  const results: LumaApprovalResult[] = [];
  for (const event of events) {
    const pending = await client.listPendingGuests(event.id);
    const result: LumaApprovalResult = {
      eventId: event.id,
      eventName: event.name,
      pending: pending.length,
      approved: [],
      failed: [],
    };
    for (const guest of membersToApprove(pending, memberEmails)) {
      if (dryRun) {
        result.approved.push(guest);
        continue;
      }
      try {
        await client.approveGuest(event.id, guest.id);
        result.approved.push(guest);
      } catch (error) {
        result.failed.push({
          ...guest,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    results.push(result);
  }

  return {
    dryRun,
    events: results,
    pending: results.reduce((sum, event) => sum + event.pending, 0),
    approved: results.reduce((sum, event) => sum + event.approved.length, 0),
    failed: results.reduce((sum, event) => sum + event.failed.length, 0),
  };
}
