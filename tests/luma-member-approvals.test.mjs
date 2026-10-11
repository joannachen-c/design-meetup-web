import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  approvePendingMembers,
  createLumaClient,
  eventIdFromWebhook,
  isValidLumaWebhookToken,
  lumaWebhookToken,
  lumaWebhookUrl,
  memberEmailSet,
  membersToApprove,
} from "../src/lib/luma-member-approvals.ts";

const NOW = new Date("2026-10-11T12:00:00.000Z");

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** In-memory stand-in for the Luma API, recording every approval. */
function fakeLuma({ events, guests, failApprovalFor = new Set(), throttleFirst = 0 }) {
  const calls = [];
  const approvals = [];
  let throttled = 0;
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push(`${init.method ?? "GET"} ${url.pathname}${url.search}`);
    assert.equal(init.headers["x-luma-api-key"], "secret-test");
    if (throttled < throttleFirst) {
      throttled += 1;
      return json({ message: "slow down" }, 429);
    }
    if (url.pathname === "/v1/calendars/events/list") {
      return json({ entries: events.map((event) => ({ event })), has_more: false });
    }
    if (url.pathname === "/v1/events/guests/list") {
      assert.equal(url.searchParams.get("approval_status"), "pending_approval");
      const all = guests[url.searchParams.get("event_id")] ?? [];
      // Two per page so pagination is exercised.
      const start = Number(url.searchParams.get("pagination_cursor") ?? 0);
      const page = all.slice(start, start + 2);
      const next = start + 2 < all.length ? String(start + 2) : undefined;
      return json({ entries: page, has_more: Boolean(next), next_cursor: next });
    }
    if (url.pathname === "/v1/events/guests/update-status") {
      const body = JSON.parse(init.body);
      if (failApprovalFor.has(body.guest_id)) {
        return json({ message: "payment could not be captured" }, 400);
      }
      approvals.push(body);
      return json({});
    }
    return json({ message: "Not found." }, 404);
  };
  return { fetchImpl, calls, approvals };
}

const pending = (id, email, name = null) => ({
  api_id: id,
  email,
  name,
  approval_status: "pending_approval",
});

test("only pending guests whose email belongs to a member are picked", () => {
  const members = memberEmailSet([" Ada@Example.com ", "grace@example.com", null, ""]);
  assert.deepEqual([...members], ["ada@example.com", "grace@example.com"]);

  const picked = membersToApprove(
    [
      { id: "gst-1", email: "ADA@example.com", name: "Ada" },
      { id: "gst-2", email: "stranger@example.com", name: null },
      { id: "gst-3", email: "grace@example.com ", name: "Grace" },
    ],
    members,
  );
  assert.deepEqual(
    picked.map((guest) => guest.id),
    ["gst-1", "gst-3"],
  );
});

test("sweep approves members on every open approval event and leaves others pending", async () => {
  const luma = fakeLuma({
    events: [
      { api_id: "evt-past", name: "Ended", start_at: "2026-10-09T22:00:00.000Z", end_at: "2026-10-10T00:00:00.000Z", require_approval: true },
      { api_id: "evt-open", name: "Medal", start_at: "2026-10-21T22:00:00.000Z", end_at: "2026-10-22T00:00:00.000Z", require_approval: true },
      { api_id: "evt-rsvp", name: "Open RSVP", start_at: "2026-10-16T22:00:00.000Z", end_at: "2026-10-17T00:00:00.000Z", require_approval: false },
      { api_id: "evt-now", name: "Underway", start_at: "2026-10-11T11:00:00.000Z", end_at: "2026-10-11T14:00:00.000Z" },
    ],
    guests: {
      "evt-past": [pending("gst-old", "ada@example.com")],
      "evt-open": [
        pending("gst-a", "ada@example.com", "Ada"),
        pending("gst-b", "stranger@example.com"),
        pending("gst-c", "Grace@Example.com", "Grace"),
      ],
      "evt-now": [pending("gst-d", "grace@example.com")],
    },
  });

  const summary = await approvePendingMembers({
    client: createLumaClient({ apiKey: "secret-test", fetchImpl: luma.fetchImpl }),
    memberEmails: memberEmailSet(["ada@example.com", "grace@example.com"]),
    now: NOW,
  });

  assert.deepEqual(luma.approvals, [
    { event_id: "evt-open", guest_id: "gst-a", status: "approved" },
    { event_id: "evt-open", guest_id: "gst-c", status: "approved" },
    { event_id: "evt-now", guest_id: "gst-d", status: "approved" },
  ]);
  assert.equal(summary.pending, 4);
  assert.equal(summary.approved, 3);
  assert.equal(summary.failed, 0);
  assert.ok(
    !luma.calls.some((call) => call.includes("evt-past") || call.includes("evt-rsvp")),
    "ended events and events without approval are not queried",
  );
});

test("dry run reports who would be approved without changing Luma", async () => {
  const luma = fakeLuma({
    events: [{ api_id: "evt-open", name: "Medal", start_at: "2026-10-21T22:00:00.000Z", require_approval: true }],
    guests: { "evt-open": [pending("gst-a", "ada@example.com")] },
  });
  const summary = await approvePendingMembers({
    client: createLumaClient({ apiKey: "secret-test", fetchImpl: luma.fetchImpl }),
    memberEmails: memberEmailSet(["ada@example.com"]),
    dryRun: true,
    now: NOW,
  });
  assert.equal(summary.approved, 1);
  assert.deepEqual(luma.approvals, []);
  assert.ok(!luma.calls.some((call) => call.startsWith("POST")));
});

test("one failed approval is reported without stopping the rest", async () => {
  const luma = fakeLuma({
    events: [],
    guests: {
      "evt-open": [pending("gst-a", "ada@example.com"), pending("gst-c", "grace@example.com")],
    },
    failApprovalFor: new Set(["gst-a"]),
  });
  const summary = await approvePendingMembers({
    client: createLumaClient({ apiKey: "secret-test", fetchImpl: luma.fetchImpl }),
    memberEmails: memberEmailSet(["ada@example.com", "grace@example.com"]),
    eventIds: ["evt-open"],
  });
  assert.equal(summary.approved, 1);
  assert.equal(summary.failed, 1);
  assert.match(summary.events[0].failed[0].error, /400: payment could not be captured/);
  assert.deepEqual(luma.approvals, [
    { event_id: "evt-open", guest_id: "gst-c", status: "approved" },
  ]);
});

test("rate-limited requests are retried with backoff", async () => {
  const luma = fakeLuma({
    events: [],
    guests: { "evt-open": [pending("gst-a", "ada@example.com")] },
    throttleFirst: 2,
  });
  const waits = [];
  const client = createLumaClient({
    apiKey: "secret-test",
    fetchImpl: luma.fetchImpl,
    sleep: async (ms) => {
      waits.push(ms);
    },
  });
  const guests = await client.listPendingGuests("evt-open");
  assert.deepEqual(guests, [{ id: "gst-a", email: "ada@example.com", name: null }]);
  assert.deepEqual(waits, [2_000, 4_000]);
});

test("rate limiting that never clears surfaces as an error", async () => {
  const luma = fakeLuma({ events: [], guests: {}, throttleFirst: 99 });
  const client = createLumaClient({
    apiKey: "secret-test",
    fetchImpl: luma.fetchImpl,
    sleep: async () => {},
  });
  await assert.rejects(client.listPendingGuests("evt-open"), /429: slow down/);
});

test("webhook token is derived from the API key and checked in constant time", () => {
  const token = lumaWebhookToken("secret-test");
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.notEqual(token, lumaWebhookToken("secret-other"));
  assert.equal(isValidLumaWebhookToken("secret-test", token), true);
  assert.equal(isValidLumaWebhookToken("secret-test", token.slice(1)), false);
  assert.equal(isValidLumaWebhookToken("secret-test", null), false);
  assert.equal(
    lumaWebhookUrl("https://design-meetup-web.vercel.app", "secret-test"),
    `https://design-meetup-web.vercel.app/api/luma/webhook?token=${token}`,
  );
  assert.ok(!token.includes("secret-test"));
});

test("only pending guest webhooks name an event to re-check", () => {
  const guestWebhook = (type, approval_status, event = { id: "evt-open" }) => ({
    type,
    data: { id: "gst-a", user_email: "ada@example.com", approval_status, event },
  });
  assert.equal(eventIdFromWebhook(guestWebhook("guest.registered", "pending_approval")), "evt-open");
  assert.equal(eventIdFromWebhook(guestWebhook("guest.updated", "pending_approval")), "evt-open");
  assert.equal(
    eventIdFromWebhook(guestWebhook("guest.registered", "pending_approval", { api_id: "evt-legacy" })),
    "evt-legacy",
  );
  assert.equal(eventIdFromWebhook(guestWebhook("guest.registered", "approved")), null);
  assert.equal(eventIdFromWebhook(guestWebhook("event.updated", "pending_approval")), null);
  assert.equal(
    eventIdFromWebhook(guestWebhook("guest.registered", "pending_approval", { id: "../x" })),
    null,
  );
  assert.equal(eventIdFromWebhook(null), null);
  assert.equal(eventIdFromWebhook("nope"), null);
});

test("luma:webhook script is wired up and the API key stays out of the repo", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(pkg.scripts["luma:webhook"], /scripts\/register-luma-webhook\.mjs/);
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(envExample, /^LUMA_API_KEY=$/m);
});
