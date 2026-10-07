"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ArrowUpRightIcon } from "@/components/icons/ArrowUpRightIcon";
import type { AdvisorSort } from "@/lib/advisor-directory";

import { advisorFullName, type Advisor } from "./advisors";
import {
  AdvisorEmptyState,
  FieldFilter,
  LocationFilter,
  Portrait,
  SocialLinks,
  SortHeader,
  advisorLocationLabel,
  monoCellClassName,
  monoLabelClassName,
} from "./directory-ui";

function AdvisorCard({ advisor, index }: { advisor: Advisor; index: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li
      layout={!reduceMotion}
      className="group relative flex list-none flex-col"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{
        duration: 0.24,
        delay: reduceMotion ? 0 : Math.min(index, 18) * 0.014,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Portrait
        advisor={advisor}
        className="aspect-[4/5] w-full rounded-[3px] text-4xl tracking-[-0.06em] transition-[filter] duration-200 ease-out group-hover:grayscale-0 motion-reduce:transition-none"
      />
      <div className="flex flex-1 flex-col gap-0.5 pt-3">
        {advisor.href === "#" ? (
          <span className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink">
            {advisorFullName(advisor)}
          </span>
        ) : (
          <a
            className="inline-flex items-start gap-1 text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ink"
            href={advisor.href}
            target="_blank"
            rel="noreferrer"
          >
            <span className="min-w-0">{advisorFullName(advisor)}</span>
            <ArrowUpRightIcon className="mt-0.5 size-3 shrink-0 text-subtle opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 motion-reduce:transition-none" />
          </a>
        )}
        <div className="truncate text-[13px] leading-snug text-muted" title={advisor.title}>
          {advisor.title}
        </div>
        <div className="flex flex-col items-start min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between min-[520px]:gap-2">
          <div className={`${monoCellClassName} w-full min-w-0 truncate text-ink min-[520px]:w-auto`}>
            {advisor.company}
            {advisor.locations.length > 0 ? (
              <span className="text-subtle"> · {advisorLocationLabel(advisor)}</span>
            ) : null}
          </div>
          <SocialLinks advisor={advisor} className="-ml-1.5 shrink-0 min-[520px]:-mr-1.5 min-[520px]:ml-0" />
        </div>
      </div>
    </motion.li>
  );
}

export function AdvisorCardsView({
  rows,
  sort,
  onSort,
}: {
  rows: Advisor[];
  sort: AdvisorSort;
  onSort: (sort: AdvisorSort) => void;
}) {
  return (
    <div className="grid min-w-0 gap-6">
      <div
        className="flex flex-wrap items-center gap-x-8 gap-y-1"
        role="group"
        aria-label="Sort and filter cards"
      >
        <span className="flex items-center gap-x-4">
          <span className={`${monoLabelClassName} text-subtle`}>Sort</span>
          <SortHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
          <SortHeader label="Company" sortKey="company" sort={sort} onSort={onSort} />
        </span>
        <span className="flex items-center gap-x-4">
          <span className={`${monoLabelClassName} text-subtle`}>Filter</span>
          <LocationFilter />
          <FieldFilter />
        </span>
      </div>

      {rows.length === 0 ? (
        <AdvisorEmptyState />
      ) : (
        <ul
          className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-10 p-0 min-[520px]:grid-cols-3 min-[820px]:grid-cols-4 min-[1024px]:grid-cols-5 min-[1024px]:gap-x-5 min-[1280px]:grid-cols-6"
          aria-label="Board of Advisors cards"
        >
          <AnimatePresence mode="popLayout">
            {rows.map((advisor, index) => (
              <AdvisorCard key={advisor.slug} advisor={advisor} index={index} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
