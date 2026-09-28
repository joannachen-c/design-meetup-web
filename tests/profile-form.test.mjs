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
  assert.match(page, /className="upcoming-events"/);
  assert.match(page, /upcoming-events-copy/);
  assert.match(page, /upcoming-events-embed min-w-0/);
});

test("desktop profile form matches the Luma calendar embed columns", () => {
  assert.match(page, /upcoming-events-embed/);
  assert.doesNotMatch(page, /max-w-5xl/);
  assert.doesNotMatch(form, /max-w-5xl/);
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

test("school sits beside grad month and year dropdowns", () => {
  const school = at("school");
  const month = at("gradMonth");
  const year = at("gradYear");
  const composed = at("year");
  const position = at("position");
  const company = at("company");
  assert.ok(school < composed && composed < month && month < year);
  assert.ok(year < position && position < company);
  assert.match(form, /grid grid-cols-1 gap-5 lg:grid-cols-2/);
  assert.match(form, /grid grid-cols-2 gap-5/);
  assert.match(form, /parseGraduation\(initialYear\)/);
  assert.match(form, /formatGraduation\(gradMonth, gradYear\)/);
});

