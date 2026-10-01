"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { ArrowUpRightIcon } from "@/components/icons/ArrowUpRightIcon";
import { ADVISOR_RELATIONSHIP_LABELS, type AdvisorSort } from "@/lib/advisor-directory";

import { advisorFullName, type Advisor } from "./advisors";
import {
  AdvisorEmptyState,
  FieldFilter,
  FieldTags,
  Portrait,
  RelationshipFilter,
  SortHeader,
  monoCellClassName,
  monoLabelClassName,
} from "./directory-ui";

const rowGridClassName =
  "grid grid-cols-[48px_minmax(0,1fr)] gap-x-3 min-[1024px]:grid-cols-[48px_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1.2fr)] min-[1024px]:gap-x-4";

function SpotlightPanel({ advisor }: { advisor: Advisor | undefined }) {
  const reduceMotion = useReducedMotion();

  return (
    <aside
      className="hidden min-[821px]:sticky min-[821px]:top-24 min-[821px]:block min-[821px]:self-start"
      aria-live="polite"
      aria-label="Selected advisor"
    >
      <div className="rounded-[11px] bg-white p-3 shadow-[0_3px_10px_rgba(0,0,0,0.06)]">
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
                className="media-inset-edge-soft aspect-[4/5] w-full rounded-[7px] text-[clamp(4rem,9vw,7.5rem)] tracking-[-0.06em]"
              />
              <div className="grid gap-2 px-2 pt-4 pb-2">
                <p className="m-0 text-xl font-bold leading-tight tracking-[-0.02em] text-ink">
                  {advisorFullName(advisor)}
                </p>
                <p className="m-0 text-sm leading-snug text-muted">
                  {advisor.title} · {advisor.company}
                </p>
                <p className={`${monoLabelClassName} m-0 pt-1 text-ink`}>
                  {ADVISOR_RELATIONSHIP_LABELS[advisor.relationship]}
                </p>
                {advisor.bio ? (
                  <p className="m-0 text-sm leading-[1.6] text-ink">{advisor.bio}</p>
                ) : null}
              </div>
            </motion.div>
          ) : (
            <div className="grid aspect-[4/5] place-items-center rounded-[7px] bg-surface-muted text-sm text-muted">
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
      className={`${rowGridClassName} relative items-center border-t border-gray-200 px-3 py-3 transition-colors duration-150 ease-out motion-reduce:transition-none ${active ? "bg-surface-muted" : "bg-transparent"}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      data-active={active ? "" : undefined}
    >
      <span
        className={`absolute inset-y-0 left-0 w-[3px] bg-ink transition-opacity duration-150 ease-out ${active ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      />
      <Portrait advisor={advisor} className="media-inset-edge-soft size-12 rounded-[4px] text-sm" />
      <a
        className="group inline-flex min-w-0 items-center gap-1 self-center text-base font-bold leading-tight text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        href={advisor.href}
        target="_blank"
        rel="noreferrer"
      >
        <span className="truncate">{advisorFullName(advisor)}</span>
        <ArrowUpRightIcon className="size-3.5 shrink-0 text-muted transition-transform duration-150 ease-out group-hover:-translate-y-px group-hover:translate-x-px motion-reduce:transition-none" />
      </a>
      <span className={`${monoCellClassName} col-start-2 min-[1024px]:col-start-auto`}>
        {advisor.title}, {advisor.company}
      </span>
      <span className={`${monoCellClassName} col-start-2 text-ink min-[1024px]:col-start-auto`}>
        {ADVISOR_RELATIONSHIP_LABELS[advisor.relationship]}
      </span>
      <FieldTags advisor={advisor} className="col-start-2 min-[1024px]:col-start-auto" />
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
    <div className="grid min-w-0 gap-[clamp(24px,3vw,40px)] min-[821px]:grid-cols-[minmax(240px,0.38fr)_minmax(0,1fr)]">
      <SpotlightPanel advisor={activeAdvisor} />
      <div className="min-w-0 overflow-hidden rounded-[8px] border border-gray-200">
        <div
          className={`${rowGridClassName} items-center bg-surface-muted px-3 py-2`}
          role="group"
          aria-label="Sort and filter columns"
        >
          <span aria-hidden="true" />
          <SortHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
          <span className="hidden min-[1024px]:block">
            <SortHeader label="Title & Organization" sortKey="company" sort={sort} onSort={onSort} />
          </span>
          <span className="col-start-2 flex flex-wrap gap-x-3 min-[1024px]:contents">
            <span className="min-w-0">
              <RelationshipFilter />
            </span>
            <span className="min-w-0">
              <FieldFilter />
            </span>
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="border-t border-gray-200 p-3">
            <AdvisorEmptyState />
          </div>
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
