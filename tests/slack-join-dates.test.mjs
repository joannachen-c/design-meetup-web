import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  earliestByEmail,
  joinDatesFromChannelJoins,
  joinDatesFromSlackCsv,
  memberSinceLabel,
  parseCsv,
} from "../src/lib/slack-join-dates.ts";

test("member since prefers the Slack join date over the portal signup", () => {
  assert.equal(
    memberSinceLabel("2024-03-14T18:00:00.000Z", "2026-09-22T00:00:00.000Z"),
    "Mar 2024",
  );
  assert.equal(memberSinceLabel(null, "2026-09-22T00:00:00.000Z"), "Sept 2026");
  assert.equal(memberSinceLabel("not a date", "2026-06-01T00:00:00Z"), "June 2026");
  assert.equal(memberSinceLabel(null, null), null);
});

test("csv parser handles quotes, commas, and CRLF", () => {
  assert.deepEqual(parseCsv('\uFEFFa,b\r\n"x, y","say ""hi"""\r\n'), [
    ["a", "b"],
    ["x, y", 'say "hi"'],
  ]);
});

test("reads the Slack member analytics export", () => {
  const csv = [
    "Name,Email,Account type,Account created (UTC),Days active",
    'Ilyssa Yan,Ilyssa@Example.com,Member,"Mar 14, 2024",40',
    "Jo Chen,jo@example.com,Workspace Owner,2023-01-05,300",
    "No Email,,Member,2023-02-01,1",
    "Bad Date,bad@example.com,Member,,1",
  ].join("\n");
  const rows = joinDatesFromSlackCsv(csv);
  assert.deepEqual(
    rows.map((row) => [row.email, row.joinedAt.slice(0, 7)]),
    [
      ["ilyssa@example.com", "2024-03"],
      ["jo@example.com", "2023-01"],
    ],
  );
});

test("csv without a join-date column explains which headers it saw", () => {
  assert.throws(
    () => joinDatesFromSlackCsv("username,email\nilyssa,i@example.com"),
    /Headers: username, email/,
  );
});

test("the Manage members export is rejected with a pointer to the analytics export", () => {
  const csv = [
    "username,email,status,billing-active,has-2fa,has-sso,userid,fullname,displayname,expiration-timestamp",
    'iy53,iy53@cornell.edu,Admin,1,0,0,U0A6AJG820L,"Ilyssa Yan","Ilyssa Yan",',
  ].join("\n");
  assert.throws(() => joinDatesFromSlackCsv(csv), /Analytics → Members/);
});

test("first #general channel_join per person is their Slack join date", () => {
  const emails = new Map([
    ["U1", "Ilyssa@example.com"],
    ["U2", "jo@example.com"],
  ]);
  const rows = joinDatesFromChannelJoins(
    [
      { subtype: "channel_join", user: "U1", ts: "1726000000.000100" },
      { subtype: "channel_join", user: "U1", ts: "1710000000.000100" },
      { user: "U2", ts: "1600000000.000100", text: "hello" },
      { subtype: "channel_join", user: "U2", ts: "1700000000.000100" },
      { subtype: "channel_join", user: "U9", ts: "1500000000.000100" },
    ],
    emails,
  );
  assert.deepEqual(rows, [
    {
      email: "ilyssa@example.com",
      slackUserId: "U1",
      joinedAt: new Date(1710000000000.1).toISOString(),
    },
    {
      email: "jo@example.com",
      slackUserId: "U2",
      joinedAt: new Date(1700000000000.1).toISOString(),
    },
  ]);
});

test("re-imports never move a join date later", () => {
  const rows = earliestByEmail([
    { email: "a@example.com", slackUserId: "U1", joinedAt: "2023-01-01T00:00:00.000Z" },
    { email: "a@example.com", slackUserId: null, joinedAt: "2025-01-01T00:00:00.000Z" },
  ]);
  assert.deepEqual(rows, [
    { email: "a@example.com", slackUserId: "U1", joinedAt: "2023-01-01T00:00:00.000Z" },
  ]);
});

test("the portal card reads member since from the Slack join date", async () => {
  const page = await readFile(new URL("../app/portal/page.tsx", import.meta.url), "utf8");
  assert.match(page, /getSlackJoinedAt\(/);
  assert.match(page, /cohortJoinedAt\(cohort\) \?\?/);
  assert.match(page, /memberSinceLabel\(joinedAt, profile\?\.createdAt\)/);
});
