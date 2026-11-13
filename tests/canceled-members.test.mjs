import assert from "node:assert/strict";
import test from "node:test";
import { pickCanceledMembers } from "../src/lib/canceled-members.ts";

const row = (overrides) => ({
  email: "a@x.co",
  name: null,
  tier: "student",
  status: "active",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-12-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z",
  ...overrides,
});

test("only canceled or ending memberships are listed, newest first", () => {
  const result = pickCanceledMembers([
    row({ email: "active@x.co" }),
    row({ email: "Ended@X.co ", status: "canceled", updatedAt: "2026-11-02T00:00:00Z" }),
    row({ email: "ending@x.co", cancelAtPeriodEnd: true, updatedAt: "2026-11-05T00:00:00Z", name: " Ana " }),
    row({ email: null, status: "canceled" }),
  ]);
  assert.deepEqual(
    result.map((m) => [m.email, m.state, m.name]),
    [
      ["ending@x.co", "scheduled", "Ana"],
      ["ended@x.co", "canceled", null],
    ],
  );
});

test("nothing is listed when everyone is still active", () => {
  assert.deepEqual(pickCanceledMembers([row({}), row({ email: "b@x.co" })]), []);
});
