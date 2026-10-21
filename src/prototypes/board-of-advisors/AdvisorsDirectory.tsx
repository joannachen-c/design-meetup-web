"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { ScrollReveal } from "@/components/ScrollReveal";

import { AdvisorCardsView } from "./AdvisorCardsView";
import { AdvisorFilterMenu } from "./AdvisorFilterMenu";
import { AdvisorTableView } from "./AdvisorTableView";
import { AdvisorViewToggle, type AdvisorView } from "./AdvisorViewToggle";
import { useAdvisors } from "./AdvisorsProvider";
import { monoLabelClassName } from "./directory-ui";
import { sectionHeadingClassName, sectionShellClassName } from "./shared";

export function AdvisorsDirectory({
  view,
  onViewChange,
}: {
  view: AdvisorView;
  onViewChange: (view: AdvisorView) => void;
}) {
  const { advisors, allAdvisors, filters, setFilters } = useAdvisors();
  const reduceMotion = useReducedMotion();
  // Off for the first render so restoring ?view= from the URL on load fades instead of morphing.
  const [morphReady, setMorphReady] = useState(false);
  const [userSwitchedView, setUserSwitchedView] = useState(false);
  const morph = morphReady && !reduceMotion;

  useEffect(() => setMorphReady(true), []);

  const changeView = (next: AdvisorView) => {
    setUserSwitchedView(true);
    onViewChange(next);
  };

  return (
    <section className={sectionShellClassName} id="advisors" aria-labelledby="advisors-title">
      <ScrollReveal>
        <h2 className={sectionHeadingClassName} id="advisors-title">
          Board of Advisors
        </h2>
        <p className="m-0 mt-5 max-w-[54ch] text-pretty text-base leading-[1.6] text-secondary">
          The mentors, speakers, and collaborators who shape our Design Meetup community.
        </p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <div className="mt-[clamp(40px,6vw,72px)] flex items-center justify-end pb-7">
          <div className="flex w-full min-w-0 items-center justify-end gap-2 min-[640px]:w-auto">
            <label className="relative flex min-w-0 flex-1 items-center min-[640px]:w-[260px] min-[640px]:flex-none">
              <span className="sr-only">Search advisors</span>
              <svg
                className="pointer-events-none absolute left-3 size-4 text-subtle"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="m10.5 10.5 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
              </svg>
              <input
                className={`${monoLabelClassName} min-h-10 w-full rounded-full border-0 bg-surface-muted py-2 pr-4 pl-9 normal-case tracking-normal text-ink placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary`}
                type="search"
                placeholder={`Search ${allAdvisors.length} people`}
                value={filters.query}
                onChange={(event) => setFilters({ query: event.target.value })}
              />
            </label>
            <AdvisorFilterMenu />
            <AdvisorViewToggle view={view} onChange={changeView} />
          </div>
        </div>

        {/* popLayout keeps both views mounted for one frame so each photo's layoutId can morph between them. */}
        <div className="relative">
          <LayoutGroup>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={view}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {view === "table" ? (
                  <AdvisorTableView rows={advisors} morph={morph} />
                ) : (
                  <AdvisorCardsView rows={advisors} morph={morph} revealOnScroll={!userSwitchedView} />
                )}
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>

      </ScrollReveal>
    </section>
  );
}
