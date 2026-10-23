import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser, requireUser } from "@/lib/auth";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  isLocalSessionToken,
} from "@/lib/auth-session";
import { isOrganizer, userHasPortalAccess } from "@/lib/membership-service";
import { isPlanningApiToken } from "@/lib/planning-token";

export async function requirePaidMembership(nextPath = "/portal") {
  const user = await requireUser(nextPath);
  if (!(await userHasPortalAccess(user.id))) {
    redirect("/portal/subscribe");
  }
  return user;
}

/** Local demo sessions are unsigned cookies, so their user id can be forged. */
export async function isOrganizerSession(user: User) {
  const jar = await cookies();
  if (
    isLocalSessionToken(jar.get(ACCESS_COOKIE)?.value) ||
    isLocalSessionToken(jar.get(REFRESH_COOKIE)?.value)
  ) {
    return false;
  }
  return isOrganizer(user.id);
}

export async function requireOrganizer(nextPath = "/portal") {
  const user = await requireUser(nextPath);
  if (!(await isOrganizerSession(user))) notFound();
  return user;
}

/** Who is calling the planning API: "muse" for the API token, the organizer's email, or null. */
export async function planningActor(request: Request) {
  if (isPlanningApiToken(request.headers.get("authorization"), process.env.PLANNING_API_TOKEN)) {
    return "muse";
  }
  const user = await getSessionUser();
  if (!user || !(await isOrganizerSession(user))) return null;
  return user.email || user.id;
}
