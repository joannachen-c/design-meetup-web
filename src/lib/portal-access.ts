import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { userHasPortalAccess } from "@/lib/membership-service";

export async function requirePaidMembership(nextPath = "/portal") {
  const user = await requireUser(nextPath);
  if (!(await userHasPortalAccess(user.id))) {
    redirect("/portal/subscribe");
  }
  return user;
}
