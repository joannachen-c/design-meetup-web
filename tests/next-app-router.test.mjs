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

test("root layout sets a shared Open Graph and Twitter preview image", async () => {
  const layout = await read("app/layout.tsx");
  const site = await read("src/lib/site.ts");
  await access(new URL("public/og-preview.jpg", root));
  assert.match(layout, /metadataBase/);
  assert.match(layout, /from ["']@\/lib\/site["']/);
  assert.match(site, /design-meetup-web\.vercel\.app/);
  assert.match(layout, /openGraph/);
  assert.match(site, /og-preview\.jpg/);
  assert.match(layout, /summary_large_image/);
  assert.match(layout, /alternates:\s*\{[\s\S]*canonical:\s*["']\/["']/);
  assert.match(layout, /robots:\s*\{[\s\S]*index:\s*true/);
});

test("design-system page sets its own Open Graph preview image and is noindex", async () => {
  const page = await read("app/design-system/page.tsx");
  await access(new URL("public/og-design-system.jpg", root));
  assert.match(page, /openGraph/);
  assert.match(page, /og-design-system\.jpg/);
  assert.match(page, /summary_large_image/);
  assert.match(page, /\/design-system/);
  assert.match(page, /index:\s*false/);
  assert.match(page, /follow:\s*false/);
});

test("robots and sitemap routes exist for search engines", async () => {
  const robots = await read("app/robots.ts");
  const sitemap = await read("app/sitemap.ts");
  assert.match(robots, /disallow:\s*\[["']\/design-system["']\]/);
  assert.match(robots, /sitemap\.xml/);
  assert.match(sitemap, /siteUrl/);
  assert.match(sitemap, /priority:\s*1/);
});

test("home page emits Organization and WebSite JSON-LD", async () => {
  const page = await read("app/page.tsx");
  const jsonLd = await read("src/components/SiteJsonLd.tsx");
  assert.match(page, /SiteJsonLd/);
  assert.match(jsonLd, /application\/ld\+json/);
  assert.match(jsonLd, /"Organization"/);
  assert.match(jsonLd, /"WebSite"/);
  assert.match(jsonLd, /sameAs/);
});

test("Agentation loads only in development", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.ok(pkg.devDependencies?.agentation);
  assert.equal(pkg.dependencies?.agentation, undefined);

  const agentationDev = await read("src/components/AgentationDev.tsx");
  assert.match(agentationDev, /["']use client["']/);
  assert.match(agentationDev, /import\(["']agentation["']\)/);
  assert.match(agentationDev, /ssr:\s*false/);
  assert.match(agentationDev, /http:\/\/localhost:4747/);

  const layout = await read("app/layout.tsx");
  assert.match(layout, /AgentationDev/);
  assert.match(layout, /NODE_ENV\s*===\s*["']development["']/);
});

test("root layout sends page views to Vercel Web Analytics", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.ok(pkg.dependencies["@vercel/analytics"]);

  const layout = await read("app/layout.tsx");
  assert.match(layout, /from ["']@vercel\/analytics\/next["']/);
  assert.match(layout, /<Analytics \/>/);
});
