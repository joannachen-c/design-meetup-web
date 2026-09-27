import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const form = await readFile(new URL("src/components/portal/ProfileForm.tsx", root), "utf8");

function at(name) {
  const index = form.indexOf(`name="${name}"`);
  assert.ok(index > 0, `expected ${name} field`);
  return index;
}

test("desktop profile keeps name, email, and location left of upload photo", () => {
  assert.match(form, /lg:grid-cols-\[minmax\(0,1fr\)_200px\]/);
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

test("school year and position company stay a 2x2 under the identity chunk", () => {
  const school = at("school");
  const year = at("year");
  const position = at("position");
  const company = at("company");
  assert.ok(school < year && year < position && position < company);
  const twoByTwo = form.indexOf('className="grid grid-cols-2 gap-5"');
  assert.ok(twoByTwo > 0);
  assert.ok(twoByTwo < school);
});
