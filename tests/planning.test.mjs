import assert from "node:assert/strict";
import test from "node:test";
import {
  parsePlanningPatch,
  planningItemFromRow,
  planningPatchToRow,
} from "../src/lib/planning.ts";
import { isPlanningApiToken } from "../src/lib/planning-token.ts";

test("a valid patch is trimmed and mapped to columns", () => {
  const result = parsePlanningPatch({
    company: "  Figma  ",
    nextStep: "Send the deck",
    urgency: "urgent",
    status: "attention",
    roles: ["outreach", " outreach ", "media"],
    owners: ["Michelle Liu", "Dan He"],
    links: [{ label: "Proposal", url: "https://docs.google.com/document/d/abc" }],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.patch.roles, ["outreach", "media"]);
  assert.deepEqual(result.patch.owners, ["Michelle Liu", "Dan He"]);
  assert.equal(result.patch.company, "Figma");
  const row = planningPatchToRow(result.patch);
  assert.equal(row.next_step, "Send the deck");
  assert.equal(row.company, "Figma");
  assert.equal("nextStep" in row, false);
});

test("bad values are rejected with a reason", () => {
  for (const input of [
    null,
    [],
    { company: "" },
    { company: 4 },
    { urgency: "panic" },
    { status: "open" },
    { roles: "outreach" },
    { roles: [4] },
    { roles: ["x".repeat(41)] },
    { owners: Array.from({ length: 13 }, (_, index) => `Person ${index}`) },
    { links: [{ url: "javascript:alert(1)" }] },
    { links: [{ url: "not a url" }] },
    { id: "abc" },
    { updated_by: "me" },
    { notes: "x".repeat(5001) },
  ]) {
    const result = parsePlanningPatch(input);
    assert.equal(result.ok, false, JSON.stringify(input)?.slice(0, 60));
    assert.ok(result.error);
  }
});

test("new items need a company", () => {
  assert.equal(parsePlanningPatch({ poc: "Dan" }, { requireCompany: true }).ok, false);
  assert.equal(parsePlanningPatch({ company: "Notion" }, { requireCompany: true }).ok, true);
});

test("rows from the database are cleaned before reaching the page", () => {
  const item = planningItemFromRow({
    id: "1",
    company: "Uber",
    next_step: null,
    urgency: "whatever",
    status: "done",
    roles: ["events", 7, "", "events"],
    owners: ["Brandon Lee", null],
    links: [{ label: "Doc", url: "https://example.com" }, { url: "javascript:alert(1)" }],
    updated_at: "2026-10-20T00:00:00Z",
  });
  assert.equal(item.nextStep, "");
  assert.equal(item.urgency, "normal");
  assert.equal(item.status, "done");
  assert.deepEqual(item.roles, ["events"]);
  assert.deepEqual(item.owners, ["Brandon Lee"]);
  assert.deepEqual(item.links, [{ label: "Doc", url: "https://example.com/" }]);
});

test("the Muse API token fails closed", () => {
  const token = "a".repeat(40);
  assert.equal(isPlanningApiToken(`Bearer ${token}`, token), true);
  assert.equal(isPlanningApiToken(`Bearer ${token}x`, token), false);
  assert.equal(isPlanningApiToken(token, token), false);
  assert.equal(isPlanningApiToken(null, token), false);
  assert.equal(isPlanningApiToken("Bearer short", "short"), false);
  assert.equal(isPlanningApiToken("Bearer ", undefined), false);
  assert.equal(isPlanningApiToken("Bearer ", ""), false);
});
