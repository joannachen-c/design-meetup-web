import { TIER_CATALOG, type Tier } from "@/lib/membership";

const PILLARS = [
  {
    title: "Events",
    body: "A guaranteed RSVP to every Design Meetup event, so you never land on a waitlist, plus member-only events throughout the year.",
  },
  {
    title: "Community",
    body: "A member directory to find and reach other designers, and bi-weekly coworking sessions to make things alongside them.",
  },
  {
    title: "Career",
    body: "Job opportunities and recruiting support from advisors and members, plus warm intros to design leads at partner companies for Professional members.",
  },
];

const PLAN_AUDIENCE: Record<Tier, string> = {
  student: "For undergraduate designers",
  professional: "For designers working in industry",
};

export function MembershipOverview() {
  return (
    <div className="grid w-full gap-5">
      <p className="m-0 text-pretty">
        Membership gets you closer to the community behind our events in NYC,
        LA, and the Bay Area: a guaranteed spot at every event, a regular place
        to work alongside other designers, and a direct line to the advisors
        and design leads who are hiring.
      </p>
      <dl className="m-0 grid gap-4">
        {PILLARS.map((pillar) => (
          <div key={pillar.title}>
            <dt className="font-bold">{pillar.title}</dt>
            <dd className="m-0 text-pretty text-muted">{pillar.body}</dd>
          </div>
        ))}
      </dl>
      <ul className="m-0 grid list-none gap-3 rounded-[20px] bg-surface-muted p-5">
        {(Object.keys(TIER_CATALOG) as Tier[]).map((tier) => (
          <li
            key={tier}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4"
          >
            <span className="font-bold">{TIER_CATALOG[tier].name}</span>
            <span className="whitespace-nowrap font-bold">
              {TIER_CATALOG[tier].priceLabel}
            </span>
            <span className="col-span-2 text-muted">{PLAN_AUDIENCE[tier]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
