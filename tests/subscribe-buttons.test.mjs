import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("get started posts to stripe checkout as a form so the page always navigates", async () => {
  const buttons = await read("src/components/portal/SubscribeButtons.tsx");
  assert.match(buttons, /action="\/api\/stripe\/checkout"/);
  assert.match(buttons, /form\.submit\(\)/);
  assert.match(buttons, /next\.origin !== window\.location\.origin/);
  assert.match(buttons, /window\.location\.assign\(next\.href\)/);
  assert.doesNotMatch(buttons, /setError/);
});

test("invalid stripe keys still start membership instead of a silent checkout error", async () => {
  const route = await read("app/api/stripe/checkout/route.ts");
  assert.match(route, /invalid api key/i);
  assert.match(route, /activateMockMembership\(user\.id, tier\)/);
  assert.match(route, /\/portal\?subscribed=1&tier=/);
});

test("preview membership is persisted in a cookie when the filesystem is ephemeral", async () => {
  const store = await read("src/lib/membership-store.ts");
  const session = await read("src/lib/auth-session.ts");
  assert.match(session, /LOCAL_DATA_COOKIE/);
  assert.match(store, /writeCookieStore/);
  assert.match(store, /readCookieStore/);
});
