import { readFile } from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "./auth";
import { supabaseAuthConfigured } from "./auth-session";
import type { SlackJoinDate } from "./slack-join-dates";

export const LOCAL_SLACK_MEMBERS_PATH = path.join(
  process.cwd(),
  ".data",
  "slack-members.json",
);

async function localSlackJoinedAt(email: string) {
  try {
    const rows = JSON.parse(
      await readFile(LOCAL_SLACK_MEMBERS_PATH, "utf8"),
    ) as SlackJoinDate[];
    return rows.find((row) => row.email === email)?.joinedAt ?? null;
  } catch {
    return null;
  }
}

/** When this email joined the Design Meetup Slack, filled by `npm run import:slack-members`. */
export async function getSlackJoinedAt(email: string | null | undefined) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;

  if (supabaseAuthConfigured()) {
    try {
      const { data, error } = await createAdminClient()
        .from("slack_members")
        .select("joined_at")
        .eq("email", normalized)
        .maybeSingle();
      if (!error) return (data?.joined_at as string | undefined) ?? null;
    } catch {
      // Table not migrated yet; fall through to the local file.
    }
  }
  return localSlackJoinedAt(normalized);
}
