"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ArrowUpRightIcon } from "@/components/icons/ArrowUpRightIcon";
import type { AdvisorSort } from "@/lib/advisor-directory";

import { advisorFullName, type Advisor } from "./advisors";
import {
  AdvisorEmptyState,
  FieldFilter,
  FieldTags,
  LocationFilter,
  Portrait,
  SocialLinks,
  SortHeader,
  advisorLocationLabel,
  monoLabelClassName,
} from "./directory-ui";

function AdvisorCard({ advisor, index }: { advisor: Advisor; index: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li
      layout={!reduceMotion}
      className="group relative flex list-none flex-col rounded-[14px] bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_rgba(0,0,0,0.05)] transition-shadow duration-200 ease-out focus-within:shadow-[0_2px_4px_rgba(0,0,0,0.05),0_12px_28px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.05),0_12px_28px_rgba(0,0,0,0.1)] motion-reduce:transition-none"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.26,
        delay: reduceMotion ? 0 : Math.min(index, 14) * 0.018,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="relative overflow-hidden rounded-[9px]">
        <Portrait
          advisor={advisor}
          className="media-inset-edge-soft aspect-[4/5] w-full rounded-[9px] text-[clamp(2.25rem,3.4vw,3.25rem)] tracking-[-0.06em] transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <span
          className="pointer-events-none absolute inset-0 rounded-[9px] bg-[linear-gradient(180deg,rgb(255_255_255/0.45)_0%,rgb(255_255_255/0)_55%,rgb(0_0_0/0.04)_100%)]"
          aria-hidden="true"
        />
        {advisor.locations.length > 0 ? (
          <span
            className={`${monoLabelClassName} absolute top-2 left-2 z-[2] rounded-full bg-white/85 px-2.5 py-1 text-[10px] text-ink backdrop-blur-sm`}
          >
            {advisorLocationLabel(advisor)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2 pt-3.5 pb-2">
        {advisor.href === "#" ? (
          <span className="text-base font-bold leading-tight tracking-[-0.01em] text-ink">
            {advisorFullName(advisor)}
          </span>
        ) : (
          <a
            className="inline-flex items-start justify-between gap-2 text-base font-bold leading-tight tracking-[-0.01em] text-ink no-underline after:absolute after:inset-0 after:rounded-[14px] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink"
            href={advisor.href}
            target="_blank"
            rel="noreferrer"
          >
            <span className="min-w-0">{advisorFullName(advisor)}</span>
            <ArrowUpRightIcon className="mt-0.5 size-3.5 shrink-0 text-subtle transition-[color,transform] duration-150 ease-out group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-ink motion-reduce:transition-none" />
          </a>
        )}
        <p className="m-0 text-sm leading-snug text-muted">
          {advisor.title}
          <span className="text-subtle"> · </span>
          {advisor.company}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <FieldTags advisor={advisor} className="min-w-0 pb-1" />
          <SocialLinks advisor={advisor} className="-mr-1 shrink-0" />
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
    <div className="grid min-w-0 gap-4">
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-[8px] bg-surface-muted px-3 py-2"
        role="group"
        aria-label="Sort and filter cards"
      >
        <span className={`${monoLabelClassName} text-subtle`}>Sort</span>
        <SortHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
        <SortHeader label="Organization" sortKey="company" sort={sort} onSort={onSort} />
        <span className="mx-1 hidden h-4 w-px bg-gray-300 min-[520px]:block" aria-hidden="true" />
        <span className={`${monoLabelClassName} text-subtle`}>Filter</span>
        <LocationFilter />
        <FieldFilter />
      </div>

      {rows.length === 0 ? (
        <AdvisorEmptyState />
      ) : (
        <ul
          className="m-0 grid list-none grid-cols-2 gap-3 p-0 min-[640px]:grid-cols-3 min-[1024px]:grid-cols-4 min-[1024px]:gap-4 min-[1280px]:grid-cols-5"
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
