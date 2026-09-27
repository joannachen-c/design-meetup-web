import { headers } from "next/headers";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { requireUser } from "@/lib/auth";
import { displayNameFromEmail } from "@/lib/membership";
import {
  ensureProfile,
  getProfile,
  maybeUpgradeGraduatedStudent,
  userHasPortalAccess,
} from "@/lib/membership-service";
import { originFromHeaders, siteUrl } from "@/lib/site";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/portal");
  await ensureProfile({ id: user.id, email: user.email });
  await maybeUpgradeGraduatedStudent({
    userId: user.id,
    origin: originFromHeaders(await headers()) ?? siteUrl,
  });
  const profile = await getProfile(user.id);
  const displayName =
    profile?.displayName?.trim() ||
    displayNameFromEmail(user.email || "member");
  const paid = await userHasPortalAccess(user.id);

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <PortalHeader
        displayName={displayName}
        avatarUrl={profile?.avatarUrl ?? null}
        paid={paid}
      />
      {children}
    </div>
  );
}
