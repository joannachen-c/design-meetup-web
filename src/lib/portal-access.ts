import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  isLocalSessionToken,
  supabasePublishableOrServiceKey,
} from "@/lib/auth-session";
import { userHasPortalAccess } from "@/lib/membership-service";
import { isOrganizerEmail } from "@/lib/organizers";

export async function requirePaidMembership(nextPath = "/portal") {
  const user = await requireUser(nextPath);
  if (!(await userHasPortalAccess(user.id))) {
    redirect("/portal/subscribe");
  }
  return user;
}

/**
 * Local demo sessions are unsigned cookies, so any email can be forged into
 * one. Only trust them for organizer access when Supabase auth is unavailable
 * (local dev), never alongside real Supabase sessions.
 */
export async function isOrganizerSession(user: User) {
  if (!isOrganizerEmail(user.email)) return false;
  if (!supabasePublishableOrServiceKey()) return true;
  const jar = await cookies();
  return !(
    isLocalSessionToken(jar.get(ACCESS_COOKIE)?.value) ||
    isLocalSessionToken(jar.get(REFRESH_COOKIE)?.value)
  );
}

export async function requireOrganizer(nextPath = "/portal") {
  const user = await requireUser(nextPath);
  if (!(await isOrganizerSession(user))) notFound();
  return user;
}
