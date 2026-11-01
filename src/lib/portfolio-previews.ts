/**
 * Server-only. Portfolio site screenshots for the member directory.
 * No Next.js imports, so the capture script can load this with plain Node.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { socialHref } from "./membership.ts";

export const PREVIEW_BUCKET = "portfolio-previews";
export const PREVIEW_WIDTH = 800;
export const PREVIEW_HEIGHT = 500;
/** Sites change; a preview older than this is captured again. */
export const RECAPTURE_AFTER_DAYS = 7;
/** Failed captures (blocked, broken, stuck on a loader) are retried less often. */
export const RETRY_FAILED_AFTER_DAYS = 3;

const PORTAL_STATUSES = new Set(["active", "trialing", "past_due"]);
const DAY_MS = 24 * 60 * 60 * 1000;

export type PreviewRecord = {
  website: string;
  status: "ok" | "failed";
  capturedAt: string;
};

export type PreviewTarget = {
  id: string;
  /** The profile's website as saved, used to tell whether a capture is still current. */
  website: string;
  /** The address to open. */
  url: string;
};

/** Whether a member's site needs a (new) screenshot. */
export function previewDue(
  website: string,
  preview: PreviewRecord | null | undefined,
  now = Date.now(),
) {
  if (!preview || preview.website !== website) return true;
  const age = now - Date.parse(preview.capturedAt);
  const limit = preview.status === "ok" ? RECAPTURE_AFTER_DAYS : RETRY_FAILED_AFTER_DAYS;
  return !(age < limit * DAY_MS);
}

/** Only a capture of the member's current website is worth showing. */
export function currentPreview(website: string | null | undefined, preview: PreviewRecord | null | undefined) {
  const saved = (website || "").trim();
  return Boolean(saved && preview?.status === "ok" && preview.website === saved);
}

const ERROR_PAGE_TEXT =
  /application error|client-side exception|page (?:doesn't|does not|could not be|was not) (?:exist|found)|page not found|deployment_not_found|\b404\b|\b50[023]\b/i;

/** An error response, or a near-empty page that only says something went wrong. */
export function looksLikeErrorPage(status: number | null, text: string) {
  if (status !== null && status >= 400) return true;
  const visible = text.replace(/\s+/g, " ").trim();
  return visible.length < 400 && ERROR_PAGE_TEXT.test(visible);
}

/**
 * Share of a frame taken by its single most common color. A loading screen
 * or blank page is nearly all one color; minimal portfolios measured up to 0.989.
 */
export const BLANK_FRAME_SHARE = 0.993;

function dominantColorShare(pixels: Buffer) {
  const counts = new Map<number, number>();
  for (let i = 0; i < pixels.length; i += 3) {
    const bucket = ((pixels[i] >> 4) << 8) | ((pixels[i + 1] >> 4) << 4) | (pixels[i + 2] >> 4);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  let mode = 0;
  let best = -1;
  for (const [bucket, count] of counts) if (count > best) [mode, best] = [bucket, count];
  const center = [((mode >> 8) & 15) * 16 + 8, ((mode >> 4) & 15) * 16 + 8, (mode & 15) * 16 + 8];
  let near = 0;
  for (let i = 0; i < pixels.length; i += 3) {
    if (center.every((value, channel) => Math.abs(pixels[i + channel] - value) <= 20)) near += 1;
  }
  return near / (pixels.length / 3);
}

/** Crops a 1440x900 screenshot to the card's 16:10 frame as WebP, and flags blank frames. */
export async function toPreviewImage(screenshot: Buffer) {
  // Loaded here so the directory, which only reads preview records, never pulls in sharp.
  const { default: sharp } = await import("sharp");
  const frame = sharp(screenshot).rotate().resize(PREVIEW_WIDTH, PREVIEW_HEIGHT, {
    fit: "cover",
    position: "top",
  });
  const sample = await frame.clone().resize(160, 100, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const blank = dominantColorShare(sample) >= BLANK_FRAME_SHARE;
  const webp = await frame.webp({ quality: 64 }).toBuffer();
  return { webp, blank };
}

/** Members with portal access and a website whose screenshot is missing, stale, or for an old address. */
export async function listPreviewTargets(
  admin: SupabaseClient,
  { all = false, now = Date.now() }: { all?: boolean; now?: number } = {},
): Promise<PreviewTarget[]> {
  const [{ data: members, error }, previews] = await Promise.all([
    admin.from("memberships").select("status,stripe_subscription_id,profiles(id,website)"),
    listPreviewRecords(admin),
  ]);
  if (error) throw new Error(`Could not load members: ${error.message}`);
  return (members ?? []).flatMap((row) => {
    const joined = row.profiles as unknown;
    const profile = (Array.isArray(joined) ? joined[0] : joined) as
      | { id: string; website: string | null }
      | null;
    const subscription = String(row.stripe_subscription_id || "");
    const website = (profile?.website || "").trim();
    const url = socialHref("website", website);
    if (
      !profile ||
      !url ||
      !PORTAL_STATUSES.has(String(row.status)) ||
      !subscription.startsWith("sub_") ||
      subscription.startsWith("sub_local_")
    ) {
      return [];
    }
    if (!all && !previewDue(website, previews.get(profile.id), now)) return [];
    return [{ id: profile.id, website, url }];
  });
}

/** The directory card's image, or null when there is no capture of the member's current website. */
export function previewUrl(
  id: string,
  website: string | null | undefined,
  preview: PreviewRecord | null | undefined,
) {
  if (!preview || !currentPreview(website, preview)) return null;
  return `/api/portal/preview/${id}?v=${Date.parse(preview.capturedAt)}`;
}

export async function listPreviewRecords(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("portfolio_previews")
    .select("profile_id,website,status,captured_at");
  if (error) throw new Error(`Could not load portfolio previews: ${error.message}`);
  return new Map<string, PreviewRecord>(
    (data ?? []).map((row) => [
      row.profile_id as string,
      {
        website: row.website as string,
        status: row.status as PreviewRecord["status"],
        capturedAt: row.captured_at as string,
      },
    ]),
  );
}

/**
 * Stores one capture. `screenshot: null` records a failed capture so the site
 * is retried later instead of every run.
 */
export async function savePortfolioPreview(
  admin: SupabaseClient,
  { id, website, screenshot }: { id: string; website: string; screenshot: Buffer | null },
): Promise<"ok" | "failed" | "stale"> {
  const { data: profile, error } = await admin
    .from("profiles")
    .select("website")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load profile: ${error.message}`);
  // The member changed their website while this was being captured.
  if ((profile?.website || "").trim() !== website) return "stale";

  const image = screenshot ? await toPreviewImage(screenshot) : null;
  const status = image && !image.blank ? "ok" : "failed";
  if (status === "failed") {
    // A site that is down for a day keeps its last good screenshot; it stays due, so it is retried.
    const { data: existing } = await admin
      .from("portfolio_previews")
      .select("website,status")
      .eq("profile_id", id)
      .maybeSingle();
    if (existing?.status === "ok" && existing.website === website) return "failed";
  }
  if (image && status === "ok") {
    const { error: uploadError } = await admin.storage
      .from(PREVIEW_BUCKET)
      .upload(`${id}.webp`, image.webp, { contentType: "image/webp", upsert: true });
    if (uploadError) throw new Error(`Preview upload failed: ${uploadError.message}`);
  }
  const { error: saveError } = await admin.from("portfolio_previews").upsert({
    profile_id: id,
    website,
    status,
    captured_at: new Date().toISOString(),
  });
  if (saveError) throw new Error(`Could not save preview: ${saveError.message}`);
  return status;
}
