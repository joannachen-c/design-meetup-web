/**
 * Record when each email joined the Design Meetup Slack so the member ID card
 * can show it as "member since".
 *
 * Slack's API has no "joined at" field, so there are two sources:
 *
 *   1. CSV (most accurate). In Slack: workspace settings → Analytics →
 *      Members → Export (CSV). Needs an owner/admin on a paid plan.
 *        npm run import:slack-members -- --csv ~/Downloads/members.csv
 *
 *   2. API. Uses the first time each person shows up in the default channel
 *      (#general), which Slack adds everyone to on join. Needs SLACK_BOT_TOKEN
 *      from a Slack app with channels:history, channels:read, users:read and
 *      users:read.email, and the app invited to #general. Free workspaces only
 *      keep 90 days of history, so older members are skipped.
 *        npm run import:slack-members
 *
 * Add --dry-run to print what would be written. Rows go to public.slack_members
 * when Supabase is configured, otherwise to .data/slack-members.json. An
 * existing earlier date is never replaced with a later one.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  earliestByEmail,
  joinDatesFromChannelJoins,
  joinDatesFromSlackCsv,
} from "../src/lib/slack-join-dates.ts";

config({ path: ".env.local" });
config();

const LOCAL_PATH = path.join(process.cwd(), ".data", "slack-members.json");

function parseArgs(argv) {
  const csvIndex = argv.indexOf("--csv");
  return {
    dryRun: argv.includes("--dry-run"),
    csv: csvIndex === -1 ? null : argv[csvIndex + 1],
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function slack(method, params, token) {
  const url = new URL(`https://slack.com/api/${method}`);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.set(key, String(value));
  }
  for (;;) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 429) {
      await sleep(Number(response.headers.get("retry-after") || 1) * 1000);
      continue;
    }
    const body = await response.json();
    if (!body.ok) {
      throw new Error(`Slack ${method} failed: ${body.error}`);
    }
    return body;
  }
}

async function slackPages(method, params, key, token) {
  const items = [];
  let cursor;
  do {
    const body = await slack(method, { ...params, cursor }, token);
    items.push(...(body[key] || []));
    cursor = body.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return items;
}

async function joinDatesFromSlackApi(token) {
  const users = await slackPages("users.list", { limit: 200 }, "members", token);
  const emailsByUserId = new Map();
  for (const user of users) {
    const email = user.profile?.email;
    if (email && !user.is_bot) emailsByUserId.set(user.id, email);
  }
  console.log(`Found ${emailsByUserId.size} Slack member(s) with an email.`);

  const channels = await slackPages(
    "conversations.list",
    { types: "public_channel", exclude_archived: true, limit: 200 },
    "channels",
    token,
  );
  const general = channels.find((channel) => channel.is_general);
  if (!general) throw new Error("Could not find the workspace's default channel.");

  console.log(`Reading join messages in #${general.name}…`);
  const messages = await slackPages(
    "conversations.history",
    { channel: general.id, limit: 999 },
    "messages",
    token,
  );
  return joinDatesFromChannelJoins(messages, emailsByUserId);
}

function supabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function readExisting(supabase) {
  if (supabase) {
    const { data, error } = await supabase
      .from("slack_members")
      .select("email,slack_user_id,joined_at");
    if (error) {
      throw new Error(
        `Could not read public.slack_members. Run supabase/migrations/20260929040000_create_slack_members.sql first. (${error.message})`,
      );
    }
    return data.map((row) => ({
      email: row.email,
      slackUserId: row.slack_user_id,
      joinedAt: new Date(row.joined_at).toISOString(),
    }));
  }
  try {
    return JSON.parse(await readFile(LOCAL_PATH, "utf8"));
  } catch {
    return [];
  }
}

async function main() {
  const { dryRun, csv } = parseArgs(process.argv.slice(2));
  const token = process.env.SLACK_BOT_TOKEN?.trim();

  let incoming;
  if (csv) {
    incoming = joinDatesFromSlackCsv(await readFile(csv, "utf8"));
  } else if (token) {
    incoming = await joinDatesFromSlackApi(token);
  } else {
    console.error(
      "Pass --csv <Slack member analytics export> or set SLACK_BOT_TOKEN in .env.local.",
    );
    process.exit(1);
  }
  console.log(`Found join dates for ${incoming.length} email(s).`);

  if (dryRun) {
    for (const row of incoming) console.log(`  ${row.email}  ${row.joinedAt}`);
    console.log("Dry run — nothing written.");
    return;
  }

  const supabase = supabaseClient();
  const existing = await readExisting(supabase);
  const merged = earliestByEmail([...existing, ...incoming]);

  if (supabase) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("slack_members").upsert(
      merged.map((row) => ({
        email: row.email,
        slack_user_id: row.slackUserId,
        joined_at: row.joinedAt,
        updated_at: now,
      })),
      { onConflict: "email" },
    );
    if (error) throw new Error(error.message);
    console.log(`Saved ${merged.length} row(s) to public.slack_members.`);
    return;
  }

  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await writeFile(LOCAL_PATH, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`Saved ${merged.length} row(s) to ${LOCAL_PATH}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
