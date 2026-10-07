"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

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
  monoCellClassName,
  monoLabelClassName,
} from "./directory-ui";

const rowGridClassName =
  "grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 min-[1024px]:grid-cols-[40px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_96px_minmax(0,1fr)_88px] min-[1024px]:gap-x-5";

function SpotlightPanel({ advisor }: { advisor: Advisor | undefined }) {
  const reduceMotion = useReducedMotion();

  return (
    <aside
      className="hidden min-[821px]:sticky min-[821px]:top-24 min-[821px]:block min-[821px]:self-start"
      aria-live="polite"
      aria-label="Selected advisor"
    >
      <div>
        <AnimatePresence mode="wait" initial={false}>
          {advisor ? (
            <motion.div
              key={advisor.slug}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <Portrait
                advisor={advisor}
                className="aspect-[4/5] w-full rounded-[3px] text-6xl tracking-[-0.06em]"
              />
              <div className="grid gap-1.5 pt-4">
                <p className="m-0 text-lg font-bold leading-tight tracking-[-0.02em] text-ink">
                  {advisorFullName(advisor)}
                </p>
                <p className="m-0 text-sm leading-snug text-ink">{advisor.title}</p>
                <p className={`${monoCellClassName} m-0`}>
                  {[advisor.company, advisorLocationLabel(advisor)].filter(Boolean).join(" — ")}
                </p>
                {advisor.bio ? (
                  <p className="m-0 pt-2 text-sm leading-[1.6] text-muted">{advisor.bio}</p>
                ) : null}
                <SocialLinks advisor={advisor} className="-ml-1.5 pt-1" />
              </div>
            </motion.div>
          ) : (
            <div className="grid aspect-[4/5] place-items-center rounded-[3px] bg-surface-muted text-sm text-muted">
              No one selected
            </div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function TableRow({
  advisor,
  active,
  onActivate,
}: {
  advisor: Advisor;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <li
      className={`${rowGridClassName} items-center rounded-[6px] px-2 py-2 transition-colors duration-150 ease-out motion-reduce:transition-none ${active ? "bg-surface-muted" : "bg-transparent"}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      data-active={active ? "" : undefined}
    >
      <Portrait advisor={advisor} className="size-10 rounded-[3px] text-xs" />
      {advisor.href === "#" ? (
        <span className="min-w-0 truncate text-base font-bold leading-tight text-ink">
          {advisorFullName(advisor)}
        </span>
      ) : (
        <a
          className="group inline-flex min-w-0 items-center gap-1 self-center text-base font-bold leading-tight text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          href={advisor.href}
          target="_blank"
          rel="noreferrer"
        >
          <span className="truncate">{advisorFullName(advisor)}</span>
          <ArrowUpRightIcon className="size-3.5 shrink-0 text-muted transition-transform duration-150 ease-out group-hover:-translate-y-px group-hover:translate-x-px motion-reduce:transition-none" />
        </a>
      )}
      <span
        className={`${monoCellClassName} col-start-2 min-[1024px]:col-start-auto min-[1024px]:truncate`}
        title={advisor.title}
      >
        {advisor.title}
      </span>
      <span
        className={`${monoCellClassName} col-start-2 text-ink min-[1024px]:col-start-auto min-[1024px]:truncate`}
        title={advisor.company}
      >
        {advisor.company}
      </span>
      <span className={`${monoCellClassName} col-start-2 text-ink min-[1024px]:col-start-auto`}>
        {advisorLocationLabel(advisor)}
      </span>
      <FieldTags advisor={advisor} limit={1} className="col-start-2 min-[1024px]:col-start-auto" />
      <SocialLinks
        advisor={advisor}
        className="col-start-2 -ml-1.5 min-[1024px]:col-start-auto min-[1024px]:ml-0 min-[1024px]:justify-end"
      />
    </li>
  );
}

export function AdvisorTableView({
  rows,
  sort,
  onSort,
}: {
  rows: Advisor[];
  sort: AdvisorSort;
  onSort: (sort: AdvisorSort) => void;
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const activeAdvisor = rows.find((advisor) => advisor.slug === activeSlug) ?? rows[0];

  useEffect(() => {
    if (activeSlug && !rows.some((advisor) => advisor.slug === activeSlug)) {
      setActiveSlug(null);
    }
  }, [rows, activeSlug]);

  return (
    <div className="grid min-w-0 gap-[clamp(24px,3vw,40px)] min-[821px]:grid-cols-[200px_minmax(0,1fr)] min-[1280px]:grid-cols-[220px_minmax(0,1fr)]">
      <SpotlightPanel advisor={activeAdvisor} />
      <div className="min-w-0">
        <div
          className={`${rowGridClassName} items-center px-2 pb-2`}
          role="group"
          aria-label="Sort and filter columns"
        >
          <span aria-hidden="true" />
          <SortHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
          <span className="hidden min-[1024px]:block">
            <span className={`${monoLabelClassName} inline-flex py-1 text-muted`}>Title</span>
          </span>
          <span className="hidden min-[1024px]:block">
            <SortHeader label="Company" sortKey="company" sort={sort} onSort={onSort} />
          </span>
          <span className="col-start-2 flex flex-wrap gap-x-3 min-[1024px]:contents">
            <span className="min-w-0">
              <LocationFilter />
            </span>
            <span className="min-w-0">
              <FieldFilter />
            </span>
          </span>
          <span className={`${monoLabelClassName} hidden py-1 text-right text-muted min-[1024px]:block`}>
            Links
          </span>
        </div>

        {rows.length === 0 ? (
          <AdvisorEmptyState />
        ) : (
          <ol className="m-0 list-none p-0" aria-label="Board of Advisors table">
            {rows.map((advisor) => (
              <TableRow
                key={advisor.slug}
                advisor={advisor}
                active={advisor.slug === activeAdvisor?.slug}
                onActivate={() => setActiveSlug(advisor.slug)}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
