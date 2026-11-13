// Screenshots members' portfolio sites for the directory cards.
//
//   npm run capture:previews                 due members, straight to Supabase (.env.local service role)
//   npm run capture:previews -- --all        every member with a website
//   npm run capture:previews -- --id <uuid>  one member
//   npm run capture:previews -- --origin https://design-meetup-web.vercel.app
//                                            through the app's cron endpoint with $VERCEL_TOKEN (GitHub Actions)
//
// Needs Google Chrome. Set CHROME_PATH if it is not in the usual place.
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { config } from "dotenv";
import {
  listPreviewTargets,
  looksLikeErrorPage,
  savePortfolioPreview,
  toPreviewImage,
} from "../src/lib/portfolio-previews.ts";

config({ path: ".env.local" });
config();

const VIEWPORT = { width: 1440, height: 900 };
const LOAD_TIMEOUT_MS = 30_000;
/** Many portfolios fade or type in after load. */
const SETTLE_MS = 6_000;
const CONCURRENCY = 3;
const DEBUG_PORT = 9334;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const next = argv[index + 1];
    args[token.slice(2)] = next && !next.startsWith("--") ? (index += 1, next) : "true";
  }
  return args;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
  ];
  const found = candidates.find((candidate) => candidate && existsSync(candidate));
  if (!found) throw new Error("Google Chrome not found. Set CHROME_PATH.");
  return found;
}

/** Where captures go: Supabase directly, or the app's cron endpoint. */
function createSink(args) {
  if (args.origin) {
    const token = process.env.VERCEL_TOKEN;
    if (!token) throw new Error("--origin needs VERCEL_TOKEN.");
    const endpoint = new URL("/api/cron/portfolio-previews", args.origin);
    const headers = { Authorization: `Bearer ${token}` };
    return {
      async targets() {
        const url = new URL(endpoint);
        if (args.all) url.searchParams.set("all", "1");
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`Listing targets failed: HTTP ${response.status}`);
        return (await response.json()).targets;
      },
      async save(target, screenshot) {
        const url = new URL(endpoint);
        url.searchParams.set("id", target.id);
        url.searchParams.set("website", target.website);
        // Shrink before sending: full screenshots can be bigger than a request body may be.
        const body = screenshot ? (await toPreviewImage(screenshot)).webp : new Uint8Array();
        const response = await fetch(url, {
          method: "PUT",
          headers: { ...headers, "Content-Type": "image/webp" },
          body,
        });
        if (!response.ok) throw new Error(`Saving ${target.id} failed: HTTP ${response.status}`);
        return (await response.json()).status;
      },
    };
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    targets: () => listPreviewTargets(admin, { all: Boolean(args.all) }),
    save: (target, screenshot) =>
      savePortfolioPreview(admin, { id: target.id, website: target.website, screenshot }),
  };
}

/** One page over the DevTools protocol: load, let it settle, screenshot the first screen. */
async function capture(url) {
  const page = await (
    await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" })
  ).json();
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const replies = new Map();
  let markLoaded;
  const loaded = new Promise((resolve) => (markLoaded = resolve));
  let status = null;
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && replies.has(message.id)) replies.get(message.id)(message);
    if (message.method === "Page.loadEventFired") markLoaded();
    // The last page document's status, after any redirects.
    if (message.method === "Network.responseReceived" && message.params.type === "Document") {
      status = message.params.response.status;
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++nextId;
      replies.set(id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });

  try {
    await send("Page.enable");
    await send("Network.enable");
    await send("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });
    const navigation = await send("Page.navigate", { url });
    if (navigation.result?.errorText) return null;
    await Promise.race([loaded, sleep(LOAD_TIMEOUT_MS)]);
    await sleep(SETTLE_MS);
    const text = await send("Runtime.evaluate", {
      expression: "document.body ? document.body.innerText.slice(0, 2000) : ''",
      returnByValue: true,
    });
    if (looksLikeErrorPage(status, text.result?.result?.value ?? "")) return null;
    const shot = await Promise.race([send("Page.captureScreenshot", { format: "png" }), sleep(15_000)]);
    return shot?.result?.data ? Buffer.from(shot.result.data, "base64") : null;
  } finally {
    socket.close();
    await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close/${page.id}`).catch(() => {});
  }
}

const args = parseArgs(process.argv.slice(2));
// --id captures that member even when their preview is not due.
if (args.id) args.all = "true";
const sink = createSink(args);
let targets = await sink.targets();
if (args.id) targets = targets.filter((target) => target.id === args.id);
console.log(`${targets.length} site${targets.length === 1 ? "" : "s"} to capture`);
if (!targets.length) process.exit(0);

const profile = mkdtempSync(path.join(tmpdir(), "portfolio-previews-"));
const chrome = spawn(chromePath(), [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--mute-audio",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${DEBUG_PORT}`,
  "about:blank",
]);

const counts = { ok: 0, failed: 0, stale: 0, error: 0 };
try {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`).then(() => true, () => false)) break;
    await sleep(250);
  }
  const queue = [...targets];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let target = queue.shift(); target; target = queue.shift()) {
        try {
          const screenshot = await capture(target.url).catch(() => null);
          const status = await sink.save(target, screenshot);
          counts[status] = (counts[status] ?? 0) + 1;
          console.log(`${status.padEnd(6)} ${target.url}`);
        } catch (error) {
          counts.error += 1;
          console.error(`error  ${target.url}: ${error.message}`);
        }
      }
    }),
  );
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}

console.log(
  `Captured ${counts.ok}, failed ${counts.failed}, skipped ${counts.stale} changed websites, errors ${counts.error}.`,
);
if (counts.error) process.exit(1);
