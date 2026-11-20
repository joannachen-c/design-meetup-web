import type { Metadata } from "next";
import { MemberDirectory } from "@/components/portal/MemberDirectory";
import { listApprovedSignupEmails } from "@/lib/approved-signups-store";
import { sortDirectory } from "@/lib/directory";
import { pendingMembers, toMemberCard, toTeamRow } from "@/lib/directory-people";
import { profileDetailsComplete } from "@/lib/membership";
import { listDirectoryRows } from "@/lib/membership-service";
import { isOrganizerSession, requirePaidMembership } from "@/lib/portal-access";
import { listSlackJoinDates } from "@/lib/slack-members";

export const metadata: Metadata = {
  title: "Directory",
  robots: { index: false, follow: false },
};

async function directoryProps(organizer: boolean) {
  const rows = await listDirectoryRows();
  // Team-only fields are projected here on the server; members never receive them.
  if (organizer) {
    const [slackJoinDates, portalApproved] = await Promise.all([
      listSlackJoinDates(),
      listApprovedSignupEmails(),
    ]);
    const portalApprovedSet = new Set(portalApproved);
    return {
      rows,
      mode: "team" as const,
      members: sortDirectory(
        rows.map((row) => {
          const email = row.profile.email.toLowerCase();
          return toTeamRow(row, slackJoinDates.get(email) ?? null, portalApprovedSet.has(email));
        }),
      ),
      pending: pendingMembers(
        rows.map((row) => row.profile.email),
        portalApproved,
      ),
    };
  }
  return { rows, mode: "member" as const, members: sortDirectory(rows.map(toMemberCard)) };
}

export default async function PortalDirectoryPage() {
  const user = await requirePaidMembership("/portal/directory");
  const { rows, ...props } = await directoryProps(await isOrganizerSession(user));
  const own = rows.find((row) => row.profile.id === user.id);

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24">
      <MemberDirectory
        {...props}
        viewerId={user.id}
        nudge={!own || !profileDetailsComplete(own.profile)}
      />
    </main>
  );
}
