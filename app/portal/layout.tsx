import { PortalHeader } from "@/components/portal/PortalHeader";
import { requireUser } from "@/lib/auth";
import { displayNameFromEmail } from "@/lib/membership";
import { ensureProfile, getProfile } from "@/lib/membership-service";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/portal");
  await ensureProfile({ id: user.id, email: user.email });
  const profile = await getProfile(user.id);
  const displayName =
    profile?.displayName?.trim() ||
    displayNameFromEmail(user.email || "member");

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <PortalHeader
        displayName={displayName}
        avatarUrl={profile?.avatarUrl ?? null}
      />
      {children}
    </div>
  );
}
