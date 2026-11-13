import type { CanceledMember } from "@/lib/canceled-members";

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/Los_Angeles",
      })
    : null;

function stateLabel(member: CanceledMember) {
  const date = formatDate(member.endsAt);
  if (member.state === "scheduled") return date ? `Cancels ${date}` : "Cancels at period end";
  return date ? `Ended ${date}` : "Canceled";
}

/** Organizer list of paying members who canceled or turned off renewal. */
export function CanceledMembersList({ members }: { members: CanceledMember[] }) {
  return (
    <section aria-labelledby="canceled-members" className="mt-4 rounded-[12px] bg-surface-muted p-5">
      <h2 id="canceled-members" className="m-0 text-base font-bold">
        Canceled memberships ({members.length})
      </h2>
      <p className="m-0 mt-1 text-sm text-muted">
        Paying members who canceled, or who turned off renewal and lose access at the end of
        their billing period.
      </p>
      {members.length ? (
        <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-sm">
          {members.map((member) => (
            <li key={member.email} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
              <span className="min-w-0 truncate">
                {member.name ? <span className="font-bold">{member.name} </span> : null}
                <span className={member.name ? "text-muted" : undefined}>{member.email}</span>
              </span>
              <span className="shrink-0 text-muted">
                {member.tier === "student" ? "Student" : "Professional"} · {stateLabel(member)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 mt-3 text-sm">No one has canceled.</p>
      )}
    </section>
  );
}
