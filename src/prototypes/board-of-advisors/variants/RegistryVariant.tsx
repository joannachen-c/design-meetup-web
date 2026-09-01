import { ScrollReveal } from "@/components/ScrollReveal";
import {
  advisorFullName,
  advisors,
  type Advisor,
} from "../advisors";

const sectionHeadingClassName =
  "m-0 text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]";

function AdvisorRow({ advisor }: { advisor: Advisor }) {
  return (
    <li className="border-t border-gray-200 first:border-t-0">
      <a
        className="group grid gap-0.5 py-3 no-underline transition-colors duration-150 ease-out hover:bg-surface-muted/60 focus-visible:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink motion-reduce:transition-none sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:items-baseline sm:gap-x-6 sm:py-3.5"
        href={advisor.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`${advisorFullName(advisor)} on LinkedIn`}
      >
        <span className="text-base font-bold text-ink transition-colors duration-150 ease-out group-hover:text-black group-focus-visible:text-black">
          {advisorFullName(advisor)}
        </span>
        <span className="text-base text-muted">
          {advisor.title}
          <span className="text-subtle"> · </span>
          {advisor.company}
        </span>
      </a>
    </li>
  );
}

export function RegistryVariant() {
  const midpoint = Math.ceil(advisors.length / 2);
  const leftColumn = advisors.slice(0, midpoint);
  const rightColumn = advisors.slice(midpoint);

  return (
    <section
      className="board-advisors bg-surface px-[clamp(20px,6vw,96px)] py-[clamp(80px,10vw,160px)] text-black max-[820px]:py-[80px]"
      id="advisors"
      aria-labelledby="advisors-title-registry"
    >
      <ScrollReveal className="grid min-w-0 gap-10 md:grid-cols-[minmax(150px,0.32fr)_minmax(0,1fr)] md:gap-16">
        <div className="min-w-0">
          <h2 className={sectionHeadingClassName} id="advisors-title-registry">
            Board of Advisors
          </h2>
          <p className="m-0 mt-5 max-w-[36ch] text-pretty text-base leading-[1.6] text-ink">
            Designers and builders who guide our community&apos;s direction.
          </p>
        </div>
        <div className="grid min-w-0 gap-x-[clamp(24px,4vw,48px)] min-[821px]:grid-cols-2">
          <ol className="m-0 list-none p-0" aria-label="Board of Advisors, first half">
            {leftColumn.map((advisor) => (
              <AdvisorRow advisor={advisor} key={advisorFullName(advisor)} />
            ))}
          </ol>
          <ol className="m-0 list-none p-0" aria-label="Board of Advisors, second half">
            {rightColumn.map((advisor) => (
              <AdvisorRow advisor={advisor} key={advisorFullName(advisor)} />
            ))}
          </ol>
        </div>
      </ScrollReveal>
    </section>
  );
}
