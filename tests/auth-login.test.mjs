import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  accessTokenExpired,
  isLocalSessionToken,
} from "../src/lib/auth-session.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("preview auth does not crash when supabase is unconfigured", async () => {
  const session = await read("src/lib/auth-session.ts");
  const auth = await read("src/lib/auth.ts");
  const route = await read("app/api/auth/route.ts");
  assert.match(session, /export function supabaseAuthConfigured/);
  assert.match(auth, /localPasswordSignIn/);
  assert.match(auth, /demo@designmeetup.info/);
  assert.match(auth, /if \(!supabaseAuthConfigured\(\)\)/);
  assert.match(route, /couldn't sign in\. try again in a moment\./);
});

test("login form parses empty auth responses instead of a connection error", async () => {
  const form = await read("src/components/portal/LoginForm.tsx");
  assert.match(form, /response\.text\(\)/);
  assert.match(form, /JSON\.parse\(raw\)/);
  assert.doesNotMatch(
    form,
    /const payload = \(await response\.json\(\)\)/,
  );
});

test("local demo sessions are not treated as expired JWTs", () => {
  const token = `local.${Buffer.from(
    JSON.stringify({ id: "demo", email: "demo@designmeetup.info" }),
    "utf8",
  ).toString("base64url")}`;
  assert.equal(isLocalSessionToken(token), true);
  assert.equal(accessTokenExpired(token), false);
  assert.equal(accessTokenExpired(undefined), true);
});

test("portal proxy keeps local demo cookies instead of refreshing them", async () => {
  const proxy = await read("proxy.ts");
  assert.match(proxy, /isLocalSessionToken\(access\) \|\| isLocalSessionToken\(refresh\)/);
});
