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

function LedgerRow({ advisor }: { advisor: Advisor }) {
  return (
    <li className="border-t border-gray-200 first:border-t-0">
      <AdvisorLink
        advisor={advisor}
        className="group flex items-start gap-3 py-4 no-underline transition-colors duration-150 ease-out hover:bg-surface-muted/50 focus-visible:bg-surface-muted/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink motion-reduce:transition-none"
      >
        <AdvisorAvatar advisor={advisor} size="lg" />
        <span className="grid min-w-0 gap-1 pt-0.5">
          <AdvisorName advisor={advisor} />
          <AdvisorMeta advisor={advisor} />
        </span>
      </AdvisorLink>
    </li>
  );
}

export function InlineLedgerVariant() {
  const midpoint = Math.ceil(advisors.length / 2);
  const leftColumn = advisors.slice(0, midpoint);
  const rightColumn = advisors.slice(midpoint);

  return (
    <section
      className={sectionShellClassName}
      id="advisors"
      aria-labelledby="advisors-title-ledger"
    >
      <ScrollReveal>
        <h2 className={sectionHeadingClassName} id="advisors-title-ledger">
          Board of Advisors
        </h2>
        <p className="m-0 mt-5 max-w-[54ch] text-pretty text-base leading-[1.6] text-ink">
          Larger portraits stacked above each name — registry structure with
          more visual weight per person.
        </p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <div className="mt-[clamp(40px,6vw,72px)] grid min-w-0 gap-x-[clamp(24px,4vw,48px)] min-[821px]:grid-cols-2">
          <ol className="m-0 list-none p-0" aria-label="Board of Advisors, first half">
            {leftColumn.map((advisor) => (
              <LedgerRow advisor={advisor} key={advisorFullName(advisor)} />
            ))}
          </ol>
          <ol className="m-0 list-none p-0" aria-label="Board of Advisors, second half">
            {rightColumn.map((advisor) => (
              <LedgerRow advisor={advisor} key={advisorFullName(advisor)} />
            ))}
          </ol>
        </div>
      </ScrollReveal>
    </section>
  );
}
