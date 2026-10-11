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
    body: "Job opportunities and recruiting support from advisors and members. Professional members also get personal warm intros to design leads at partner companies.",
  },
];

export function MembershipOverview() {
  return (
    <section aria-label="What Design Meetup membership includes" className="mb-10">
      <p className="m-0 mb-6 max-w-[62ch] text-base leading-[1.6] text-ink text-pretty">
        Design Meetup membership is how you get closer to the community behind
        our events in NYC, LA, and the Bay Area. Members get a guaranteed spot at
        every event, a regular place to work alongside other designers, and a
        direct line to the advisors and design leads who are hiring.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="rounded-[20px] bg-gray-100 p-6">
            <p className="m-0 mb-2 text-xl font-bold tracking-[-0.04em] text-ink">
              {pillar.title}
            </p>
            <p className="m-0 text-base leading-normal text-muted">
              {pillar.body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-6 mb-0 max-w-[62ch] text-base leading-[1.6] text-muted text-pretty">
        Choose Student if you&apos;re an undergraduate designer, or Professional
        if you&apos;re working in industry. Professional includes everything in
        Student.
      </p>
    </section>
  );
}
