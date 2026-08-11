import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const newsletterForm = await readFile(
  new URL("../src/components/NewsletterForm.tsx", import.meta.url),
  "utf8",
);
const input = await readFile(
  new URL("../src/components/Input.tsx", import.meta.url),
  "utf8",
).catch(() => "");

test("newsletter uses the shared Input component", () => {
  assert.match(app, /import \{ NewsletterForm \} from "\.\/NewsletterForm"/);
  assert.match(newsletterForm, /import \{ Input \} from "\.\/Input"/);
  assert.match(newsletterForm, /<Input[\s\S]*id="newsletter-email"/);
});

test("Input matches the button radius and uses an accent-primary focus ring", () => {
  assert.match(input, /export function Input/);
  assert.match(input, /rounded-\[10px\]/);
  assert.match(input, /focus-visible:ring-2/);
  assert.match(input, /focus-visible:ring-accent-primary/);
});

test("Input pins its own weight so a bold label cannot cascade in", () => {
  assert.match(input, /\bfont-normal\b/);
  assert.doesNotMatch(input, /\bfont-(?:medium|semibold|bold)\b/);
});
