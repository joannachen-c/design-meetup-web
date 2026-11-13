import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";
import { toMemberCard } from "../src/lib/directory-people.ts";
import {
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  previewDue,
  previewUrl,
  toPreviewImage,
} from "../src/lib/portfolio-previews.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-10-31T12:00:00Z");
const ago = (days) => new Date(now - days * DAY).toISOString();

test("a site is captured when new, re-captured weekly, and retried sooner after a failure", () => {
  assert.equal(previewDue("me.com", null, now), true);
  assert.equal(previewDue("me.com", { website: "me.com", status: "ok", capturedAt: ago(2) }, now), false);
  assert.equal(previewDue("me.com", { website: "me.com", status: "ok", capturedAt: ago(8) }, now), true);
  assert.equal(previewDue("me.com", { website: "me.com", status: "failed", capturedAt: ago(1) }, now), false);
  assert.equal(previewDue("me.com", { website: "me.com", status: "failed", capturedAt: ago(4) }, now), true);
  assert.equal(previewDue("new.me", { website: "me.com", status: "ok", capturedAt: ago(0) }, now), true);
});

test("cards only show a capture of the member's current website", () => {
  const preview = { website: "me.com", status: "ok", capturedAt: "2026-10-30T00:00:00.000Z" };
  assert.equal(previewUrl("u1", "me.com", preview), `/api/portal/preview/u1?v=${Date.parse(preview.capturedAt)}`);
  assert.equal(previewUrl("u1", "new.me", preview), null);
  assert.equal(previewUrl("u1", "me.com", { ...preview, status: "failed" }), null);
  assert.equal(previewUrl("u1", "me.com", null), null);

  const card = toMemberCard({
    profile: {
      id: "u1", email: "m@example.com", displayName: "M", avatarUrl: null, school: null, year: null,
      company: null, position: null, location: null, website: "me.com", instagram: null, x: null,
      linkedin: null, youtube: null, github: null, disciplines: [], stripeCustomerId: null,
      createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z",
    },
    membership: { tier: "student", status: "active" },
    preview,
  });
  assert.match(card.previewUrl, /^\/api\/portal\/preview\/u1\?v=\d+$/);
});

test("screenshots are cropped to the card frame and blank loaders are rejected", async () => {
  const blank = await sharp({ create: { width: 1440, height: 900, channels: 3, background: "#fbf18f" } }).png().toBuffer();
  // A gradient with bands: busy enough to be a real page at any scale.
  const pixels = Buffer.alloc(1440 * 900 * 3);
  for (let y = 0; y < 900; y += 1) {
    for (let x = 0; x < 1440; x += 1) {
      const i = (y * 1440 + x) * 3;
      pixels[i] = Math.round((x / 1440) * 255);
      pixels[i + 1] = Math.floor(y / 60) % 2 ? 40 : 220;
      pixels[i + 2] = Math.round((y / 900) * 255);
    }
  }
  const busy = await sharp(pixels, { raw: { width: 1440, height: 900, channels: 3 } }).png().toBuffer();

  assert.equal((await toPreviewImage(blank)).blank, true);
  const image = await toPreviewImage(busy);
  assert.equal(image.blank, false);
  const meta = await sharp(image.webp).metadata();
  assert.deepEqual([meta.format, meta.width, meta.height], ["webp", PREVIEW_WIDTH, PREVIEW_HEIGHT]);
});

test("previews are served to members only, and only the project's cron caller can store them", async () => {
  const preview = await read("app/api/portal/preview/[userId]/route.ts");
  assert.ok(preview.indexOf("canViewMemberMedia(userId)") < preview.indexOf(".download("));
  const cron = await read("app/api/cron/portfolio-previews/route.ts");
  assert.match(cron, /export async function GET\(request: Request\) \{\s*if \(!\(await authorized\(request\)\)\)/);
  assert.match(cron, /export async function PUT\(request: Request\) \{\s*if \(!\(await authorized\(request\)\)\)/);
  assert.match(cron, /isAuthorizedImportCaller\(bearerTokenFromHeader/);
});

test("the daily capture goes through the app, so GitHub never holds the Supabase key", async () => {
  const workflow = await read(".github/workflows/portfolio-previews.yml");
  assert.match(workflow, /npm run capture:previews -- --origin https:\/\/design-meetup-web\.vercel\.app/);
  assert.match(workflow, /VERCEL_TOKEN: \$\{\{ secrets\.VERCEL_TOKEN \}\}/);
  assert.doesNotMatch(workflow, /SUPABASE/);
  const migration = await read("supabase/migrations/20261031130000_create_portfolio_previews.sql");
  assert.match(migration, /alter table public\.portfolio_previews enable row level security;/);
  assert.match(migration, /values \('portfolio-previews', 'portfolio-previews', false\)/);
});

test("error responses and near-empty error pages are not shown as portfolios", async () => {
  const { looksLikeErrorPage } = await import("../src/lib/portfolio-previews.ts");
  assert.equal(looksLikeErrorPage(404, "anything"), true);
  assert.equal(looksLikeErrorPage(200, "This page doesn't exist. It may have been moved."), true);
  assert.equal(looksLikeErrorPage(200, "Application error: a client-side exception has occurred"), true);
  assert.equal(looksLikeErrorPage(200, "Welcome to Megan's World. Explore. Discoveries are out there."), false);
  assert.equal(looksLikeErrorPage(200, `${"Case study ".repeat(60)} 404 Not Found project`), false);
  assert.equal(looksLikeErrorPage(null, "Hi, I'm Aaron, a product designer"), false);
});

test("a loader on a flat background counts as blank, a minimal site does not", async () => {
  const loader = await sharp({ create: { width: 1440, height: 900, channels: 3, background: "#fbf18f" } })
    .composite([{ input: { create: { width: 40, height: 60, channels: 3, background: "#7a4b1f" } }, top: 400, left: 700 }])
    .png()
    .toBuffer();
  assert.equal((await toPreviewImage(loader)).blank, true);
  const minimal = await sharp({ create: { width: 1440, height: 900, channels: 3, background: "#ffffff" } })
    .composite([{ input: { create: { width: 900, height: 120, channels: 3, background: "#111111" } }, top: 300, left: 270 }])
    .png()
    .toBuffer();
  assert.equal((await toPreviewImage(minimal)).blank, false);
});
