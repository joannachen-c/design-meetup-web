import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const input = await readFile(
  new URL("../src/components/Input.tsx", import.meta.url),
  "utf8",
).catch(() => "");

test("newsletter uses the shared Input component", () => {
  assert.match(app, /import \{ Input \} from "\.\/components\/Input"/);
  assert.match(app, /<Input[\s\S]*id="newsletter-email"/);
});

test("Input matches the button radius and uses a gray focus ring", () => {
  assert.match(input, /export function Input/);
  assert.match(input, /rounded-\[10px\]/);
  assert.match(input, /focus-visible:ring-2/);
  assert.match(input, /focus-visible:ring-gray-400/);
});
