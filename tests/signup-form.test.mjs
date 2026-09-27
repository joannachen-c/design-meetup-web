import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("signup form asks for a name before email", async () => {
  const form = await read("src/components/portal/LoginForm.tsx");
  assert.match(form, /mode === "signup"/);
  assert.match(form, /name="displayName"/);
  const nameAt = form.indexOf('name="displayName"');
  const emailAt = form.indexOf('name="email"');
  assert.ok(nameAt > 0 && emailAt > nameAt);
});

test("signup API stores the submitted display name", async () => {
  const route = await read("app/api/auth/route.ts");
  assert.match(route, /Enter your name/);
  assert.match(route, /ensureProfile\(\{ id: result\.userId, email, displayName \}\)/);
});
