import { createHash, timingSafeEqual } from "node:crypto";

/** Bearer-token check for Muse. Fails closed when the token isn't configured. */
export function isPlanningApiToken(header: string | null, expected: string | undefined) {
  const configured = expected?.trim() ?? "";
  if (configured.length < 32 || !header?.startsWith("Bearer ")) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header.slice(7).trim()), digest(configured));
}
