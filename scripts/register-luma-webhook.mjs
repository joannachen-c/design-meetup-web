/**
 * Point the Design Meetup Luma calendar's guest webhooks at the site so
 * members are approved the moment they RSVP. Safe to re-run: an existing
 * webhook for our endpoint is updated and re-activated, not duplicated.
 *
 * Needs LUMA_API_KEY (the same key the site uses) in .env.local or the shell.
 *
 * Usage:
 *   npm run luma:webhook                      # production
 *   npm run luma:webhook -- --origin=https://preview.example.com
 *   npm run luma:webhook -- --dry-run
 */

import { config } from "dotenv";
import { fileURLToPath } from "node:url";

import {
  LUMA_API_BASE,
  LUMA_WEBHOOK_EVENT_TYPES,
  LUMA_WEBHOOK_PATH,
  lumaApiKey,
  lumaWebhookUrl,
} from "../src/lib/luma-member-approvals.ts";

config({ path: ".env.local" });
config();

const DEFAULT_ORIGIN = "https://design-meetup-web.vercel.app";

function argValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function luma(apiKey, path, body) {
  const response = await fetch(`${LUMA_API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      accept: "application/json",
      "x-luma-api-key": apiKey,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Luma ${path} returned ${response.status}: ${payload.message ?? ""}`);
  }
  return payload;
}

function sameEndpoint(webhookUrl, origin) {
  try {
    const url = new URL(webhookUrl);
    return url.origin === new URL(origin).origin && url.pathname === LUMA_WEBHOOK_PATH;
  } catch {
    return false;
  }
}

async function main() {
  const apiKey = lumaApiKey();
  if (!apiKey) throw new Error("LUMA_API_KEY is not set.");
  const origin = argValue("origin") ?? DEFAULT_ORIGIN;
  const dryRun = process.argv.includes("--dry-run");
  const url = lumaWebhookUrl(origin, apiKey);

  const { entries = [] } = await luma(apiKey, "/v1/webhooks/list?pagination_limit=100");
  const existing = entries.find((webhook) => sameEndpoint(webhook.url, origin));
  const redacted = `${origin}${LUMA_WEBHOOK_PATH}?token=…`;

  if (existing && existing.url !== url) {
    // The token changed (new API key), so the old URL can no longer authenticate.
    console.log(`Replacing ${existing.id}: its token no longer matches LUMA_API_KEY.`);
    if (!dryRun) await luma(apiKey, "/v1/webhooks/delete", { id: existing.id });
  } else if (existing) {
    console.log(`Updating ${existing.id} → ${redacted} (${LUMA_WEBHOOK_EVENT_TYPES.join(", ")})`);
    if (!dryRun) {
      await luma(apiKey, "/v2/webhooks/update", {
        id: existing.id,
        event_types: LUMA_WEBHOOK_EVENT_TYPES,
        status: "active",
      });
    }
    return;
  }

  console.log(`Creating webhook → ${redacted} (${LUMA_WEBHOOK_EVENT_TYPES.join(", ")})`);
  if (dryRun) return;
  const created = await luma(apiKey, "/v2/webhooks/create", {
    url,
    event_types: LUMA_WEBHOOK_EVENT_TYPES,
  });
  console.log(`Created ${created.id} (${created.status}).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
