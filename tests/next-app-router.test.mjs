import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("package scripts use Next.js", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.match(pkg.scripts.dev, /\bnext dev\b/);
  assert.match(pkg.scripts.build, /\bnext build\b/);
  assert.match(pkg.scripts.start, /\bnext start\b/);
  assert.equal(pkg.scripts.preview, undefined);
  assert.ok(pkg.dependencies.next || pkg.devDependencies.next);
  assert.equal(pkg.dependencies?.vite, undefined);
  assert.equal(pkg.devDependencies?.vite, undefined);
});

test("App Router pages exist for home and design-system", async () => {
  await access(new URL("app/layout.tsx", root));
  await access(new URL("app/page.tsx", root));
  await access(new URL("app/design-system/page.tsx", root));
});

test("home server page fetches events and passes hybrid props", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /fetchPastEvents/);
  assert.match(page, /initialEvents/);
  assert.match(page, /initialError/);
  assert.match(page, /HomePage/);
  assert.doesNotMatch(page, /["']use client["']/);
});

test("HomePage is a client component driven by initial props", async () => {
  const home = await read("src/components/HomePage.tsx");
  assert.match(home, /["']use client["']/);
  assert.match(home, /initialEvents/);
  assert.match(home, /initialError/);
  assert.doesNotMatch(home, /fetchPastEvents\(\)/);
});

test("Supabase env uses NEXT_PUBLIC_ prefix", async () => {
  const supabase = await read("src/lib/supabase.ts");
  const envExample = await read(".env.example");
  assert.match(supabase, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(supabase, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(supabase, /import\.meta\.env/);
  assert.doesNotMatch(supabase, /VITE_SUPABASE_/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
});

test("Vite entrypoints are removed", async () => {
  for (const path of [
    "vite.config.ts",
    "index.html",
    "src/main.tsx",
    "src/App.tsx",
    "src/vite-env.d.ts",
  ]) {
    await assert.rejects(() => access(new URL(path, root)));
  }
});
