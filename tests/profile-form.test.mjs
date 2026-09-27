import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const form = await readFile(new URL("src/components/portal/ProfileForm.tsx", root), "utf8");
const page = await readFile(new URL("app/portal/profile/page.tsx", root), "utf8");

function at(name) {
  const index = form.indexOf(`name="${name}"`);
  assert.ok(index > 0, `expected ${name} field`);
  return index;
}

test("mobile profile stacks the form below the page title", () => {
  assert.match(page, /grid grid-cols-1 gap-8/);
  assert.match(page, /lg:grid-cols-\[auto_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(page, /flex-wrap/);
});

test("desktop profile keeps name, email, and location left of upload photo", () => {
  assert.match(form, /lg:grid-cols-\[minmax\(0,1fr\)_200px\]/);
  assert.match(form, /max-lg:order-first/);
  const first = at("firstName");
  const last = at("lastName");
  const email = at("email");
  const location = at("location");
  const avatar = form.indexOf('name="avatar"');
  const school = at("school");
  assert.ok(first < last && last < email && email < location);
  assert.ok(location < avatar, "upload photo sits beside the identity fields");
  assert.ok(avatar < school, "school/year 2x2 is under the identity + photo chunk");
});

test("school year and position company are a 2x2 on desktop and stacked on mobile", () => {
  const school = at("school");
  const year = at("year");
  const position = at("position");
  const company = at("company");
  assert.ok(school < year && year < position && position < company);
  assert.match(form, /grid grid-cols-1 gap-5 lg:grid-cols-2/);
});

