import { ScrollReveal } from "@/components/ScrollReveal";
import { advisorFullName, advisors, type Advisor } from "../advisors";
import {
  AdvisorAvatar,
  AdvisorLink,
  AdvisorMeta,
  AdvisorName,
  sectionHeadingClassName,
  sectionShellClassName,
} from "../shared";

function RosterRow({ advisor }: { advisor: Advisor }) {
  return (
    <li className="border-t border-gray-200 first:border-t-0">
      <AdvisorLink
        advisor={advisor}
        className="group flex items-center gap-3 py-3 no-underline transition-colors duration-150 ease-out hover:bg-surface-muted/60 focus-visible:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink motion-reduce:transition-none sm:gap-4 sm:py-3.5"
      >
        <AdvisorAvatar advisor={advisor} size="md" />
        <span className="grid min-w-0 flex-1 gap-0.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-baseline sm:gap-x-6">
          <AdvisorName advisor={advisor} />
          <AdvisorMeta advisor={advisor} className="text-base text-muted" />
        </span>
      </AdvisorLink>
    </li>
  );
}

export function RosterVariant() {
  const midpoint = Math.ceil(advisors.length / 2);
  const leftColumn = advisors.slice(0, midpoint);
  const rightColumn = advisors.slice(midpoint);

  return (
    <section
      className={sectionShellClassName}
      id="advisors"
      aria-labelledby="advisors-title-roster"
    >
      <ScrollReveal className="grid min-w-0 gap-10 md:grid-cols-[minmax(150px,0.32fr)_minmax(0,1fr)] md:gap-16">
        <div className="min-w-0">
          <h2 className={sectionHeadingClassName} id="advisors-title-roster">
            Board of Advisors
          </h2>
          <p className="m-0 mt-5 max-w-[36ch] text-pretty text-base leading-[1.6] text-ink">
            Face and name together — a scannable directory with every advisor
            visible at once.
          </p>
        </div>
        <div className="grid min-w-0 gap-x-[clamp(24px,4vw,48px)] min-[821px]:grid-cols-2">
          <ol className="m-0 list-none p-0" aria-label="Board of Advisors, first half">
            {leftColumn.map((advisor) => (
              <RosterRow advisor={advisor} key={advisorFullName(advisor)} />
            ))}
          </ol>
          <ol className="m-0 list-none p-0" aria-label="Board of Advisors, second half">
            {rightColumn.map((advisor) => (
              <RosterRow advisor={advisor} key={advisorFullName(advisor)} />
            ))}
          </ol>
        </div>
      </ScrollReveal>
    </section>
  );
}
