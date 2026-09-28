import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("signup form asks for first and last name like the profile form", async () => {
  const form = await read("src/components/portal/LoginForm.tsx");
  const profile = await read("src/components/portal/ProfileForm.tsx");
  assert.match(form, /mode === "signup"/);
  assert.match(form, /name="firstName"/);
  assert.match(form, /name="lastName"/);
  assert.match(form, /grid grid-cols-2 gap-3/);
  assert.doesNotMatch(form, /name="displayName"/);
  assert.match(profile, /name="firstName"/);
  assert.match(profile, /name="lastName"/);
  const firstAt = form.indexOf('name="firstName"');
  const lastAt = form.indexOf('name="lastName"');
  const emailAt = form.indexOf('name="email"');
  assert.ok(firstAt > 0 && lastAt > firstAt && emailAt > lastAt);
});

test("signup API joins first and last name onto the profile", async () => {
  const route = await read("app/api/auth/route.ts");
  assert.match(route, /Enter your first name/);
  assert.match(route, /body\.firstName/);
  assert.match(route, /body\.lastName/);
  assert.match(route, /\$\{firstName\} \$\{lastName\}/);
  assert.match(route, /ensureProfile\(\{ id: result\.userId, email, displayName \}\)/);
});
