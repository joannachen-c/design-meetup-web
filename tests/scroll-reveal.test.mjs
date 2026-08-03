import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("major site content uses the shared scroll reveal", () => {
  assert.match(app, /import \{ ScrollReveal \} from "\.\/ScrollReveal";/);
  assert.ok(
    (app.match(/<ScrollReveal\b/g) ?? []).length >= 10,
    "expected scroll reveals across the page",
  );
});

test("scroll reveal animates compositor properties and respects reduced motion", () => {
  assert.match(css, /\.scroll-reveal\s*\{[^}]*opacity:\s*0;[^}]*transform:/s);
  assert.match(css, /\.scroll-reveal\.is-visible\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*translateY\(0\)/s);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.scroll-reveal\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none/s,
  );
});
