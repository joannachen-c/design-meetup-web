"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { ScrollReveal } from "@/components/ScrollReveal";
import { ArrowUpRightIcon } from "@/components/icons/ArrowUpRightIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import {
  ADVISOR_RELATIONSHIP_LABELS,
  isAdvisorRelationship,
  sortAdvisors,
  type AdvisorSort,
} from "@/lib/advisor-directory";

import { AdvisorEmptyState, relationshipSelectOptions, useFieldSelectOptions } from "../AdvisorFilterBar";
import { useAdvisors } from "../AdvisorsProvider";
import { advisorAvatarClass, advisorFullName, advisorInitials, type Advisor } from "../advisors";
import { sectionHeadingClassName, sectionShellClassName } from "../shared";

const monoLabelClassName = "font-mono text-[11px] uppercase tracking-[0.08em]";
const monoCellClassName = "font-mono text-xs leading-[1.5] text-muted";
const rowGridClassName =
  "grid grid-cols-[48px_minmax(0,1fr)] gap-x-3 min-[1024px]:grid-cols-[48px_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1.2fr)] min-[1024px]:gap-x-4";

function Portrait({ advisor, className }: { advisor: Advisor; className: string }) {
  if (advisor.photoUrl) {
    return (
      <img
        src={advisor.photoUrl}
        alt=""
        className={`${className} object-cover grayscale`}
      />
    );
  }
  return (
    <span
      className={`${className} ${advisorAvatarClass(advisor)} relative grid place-items-center font-bold text-ink`}
      aria-hidden="true"
    >
      {advisorInitials(advisor)}
    </span>
  );
}

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

function HeaderFilter({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onValueChange: (value: string) => void;
}) {
  const active = value !== "all";
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={`${monoLabelClassName} group inline-flex max-w-full cursor-pointer items-center gap-1 rounded-[6px] border-0 bg-transparent px-1.5 py-1 -ml-1.5 hover:bg-gray-200/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink data-[state=open]:bg-gray-200/70 ${active ? "text-ink" : "text-muted"}`}
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        <span className="truncate">{active ? selectedLabel : label}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 transition-transform duration-150 ease-out group-data-[state=open]:-rotate-180 motion-reduce:transition-none" />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          align="start"
          className="select-menu z-50 max-h-[min(360px,var(--radix-select-content-available-height))] min-w-[200px] overflow-hidden rounded-[10px] bg-white p-1 font-['Alte_Haas_Grotesk',sans-serif] text-sm shadow-lg ring-1 ring-black/5"
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                className="flex min-h-9 cursor-pointer items-center justify-between gap-4 rounded-[7px] px-3 py-1.5 text-ink outline-none select-none data-[highlighted]:bg-surface-muted data-[state=checked]:font-bold"
                key={option.value}
                value={option.value}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: AdvisorSort;
  sort: AdvisorSort;
  onSort: (sort: AdvisorSort) => void;
}) {
  const active = sort === sortKey;
  return (
    <button
      type="button"
      className={`${monoLabelClassName} -ml-1.5 inline-flex cursor-pointer items-center gap-1 rounded-[6px] border-0 bg-transparent px-1.5 py-1 hover:bg-gray-200/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink ${active ? "text-ink" : "text-muted"}`}
      aria-pressed={active}
      onClick={() => onSort(active ? "default" : sortKey)}
    >
      {label}
      <span aria-hidden="true" className={active ? "opacity-100" : "opacity-0"}>
        A–Z
      </span>
    </button>
  );
}

function DirectoryRow({
  advisor,
  active,
  onActivate,
  onFieldClick,
}: {
  advisor: Advisor;
  active: boolean;
  onActivate: () => void;
  onFieldClick: (field: string) => void;
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
      <Portrait
        advisor={advisor}
        className="media-inset-edge-soft size-12 rounded-[4px] text-sm"
      />
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
      <span className="col-start-2 flex flex-wrap gap-x-1 gap-y-0.5 min-[1024px]:col-start-auto">
        {advisor.fields.map((field, index) => (
          <button
            key={field}
            type="button"
            className={`${monoCellClassName} cursor-pointer rounded-[4px] border-0 bg-transparent p-0 text-left hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink`}
            onClick={(event) => {
              event.stopPropagation();
              onFieldClick(field);
            }}
            aria-label={`Filter by ${field}`}
          >
            {field}
            {index < advisor.fields.length - 1 ? "," : ""}
          </button>
        ))}
      </span>
    </li>
  );
}

export function DirectoryVariant() {
  const { advisors, allAdvisors, filters, isFiltered, setFilters, clearFilters } =
    useAdvisors();
  const fieldSelectOptions = useFieldSelectOptions();
  const [sort, setSort] = useState<AdvisorSort>("default");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const rows = useMemo(() => sortAdvisors(advisors, sort), [advisors, sort]);
  const activeAdvisor = rows.find((advisor) => advisor.slug === activeSlug) ?? rows[0];

  useEffect(() => {
    if (activeSlug && !rows.some((advisor) => advisor.slug === activeSlug)) {
      setActiveSlug(null);
    }
  }, [rows, activeSlug]);

  return (
    <section
      className={sectionShellClassName}
      id="advisors"
      aria-labelledby="advisors-title-directory"
    >
      <ScrollReveal>
        <h2 className={sectionHeadingClassName} id="advisors-title-directory">
          Board of Advisors
        </h2>
        <p className="m-0 mt-5 max-w-[54ch] text-pretty text-base leading-[1.6] text-ink">
          The people who shape Design Meetup — search the network or narrow it
          down by how they work with us and what they know.
        </p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <div className="mt-[clamp(40px,6vw,72px)] grid min-w-0 gap-[clamp(24px,3vw,40px)] min-[821px]:grid-cols-[minmax(240px,0.38fr)_minmax(0,1fr)]">
          <SpotlightPanel advisor={activeAdvisor} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <div className="flex items-center gap-2">
                <span className={`${monoLabelClassName} rounded-full bg-white px-3 py-2 text-ink shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
                  Our network
                </span>
                <a
                  className={`${monoLabelClassName} inline-flex items-center gap-1 rounded-full px-3 py-2 text-ink no-underline hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
                  href="/#partner"
                >
                  Apply to join
                  <ArrowUpRightIcon className="size-3.5 shrink-0" />
                </a>
              </div>
              <label className="relative flex min-w-[220px] flex-1 items-center min-[520px]:max-w-[280px] min-[520px]:flex-none">
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
                  className={`${monoLabelClassName} min-h-10 w-full rounded-full border-0 bg-white py-2 pr-4 pl-9 normal-case tracking-normal text-ink shadow-[0_1px_4px_rgba(0,0,0,0.08)] placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary`}
                  type="search"
                  placeholder={`Search ${allAdvisors.length} people`}
                  value={filters.query}
                  onChange={(event) => setFilters({ query: event.target.value })}
                />
              </label>
            </div>

            <div className="overflow-hidden rounded-[8px] border border-gray-200">
              <div
                className={`${rowGridClassName} items-center bg-surface-muted px-3 py-2`}
                role="group"
                aria-label="Sort and filter columns"
              >
                <span aria-hidden="true" />
                <SortHeader label="Name" sortKey="name" sort={sort} onSort={setSort} />
                <span className="hidden min-[1024px]:block">
                  <SortHeader label="Title & Organization" sortKey="company" sort={sort} onSort={setSort} />
                </span>
                <span className="col-start-2 flex flex-wrap gap-x-3 min-[1024px]:contents">
                  <span className="min-w-0">
                    <HeaderFilter
                      label="Relationship"
                      value={filters.relationship}
                      options={relationshipSelectOptions}
                      onValueChange={(value) =>
                        setFilters({ relationship: isAdvisorRelationship(value) ? value : "all" })
                      }
                    />
                  </span>
                  <span className="min-w-0">
                    <HeaderFilter
                      label="Field"
                      value={filters.field}
                      options={fieldSelectOptions}
                      onValueChange={(value) => setFilters({ field: value })}
                    />
                  </span>
                </span>
              </div>

              {rows.length === 0 ? (
                <div className="border-t border-gray-200 p-3">
                  <AdvisorEmptyState />
                </div>
              ) : (
                <ol className="m-0 list-none p-0" aria-label="Board of Advisors directory">
                  {rows.map((advisor) => (
                    <DirectoryRow
                      key={advisor.slug}
                      advisor={advisor}
                      active={advisor.slug === activeAdvisor?.slug}
                      onActivate={() => setActiveSlug(advisor.slug)}
                      onFieldClick={(field) => setFilters({ field })}
                    />
                  ))}
                </ol>
              )}
            </div>

            <div className="flex min-h-10 items-center justify-between gap-3 pt-3">
              <p className={`${monoLabelClassName} m-0 tabular-nums text-muted`} aria-live="polite">
                {rows.length} of {allAdvisors.length} people
              </p>
              {isFiltered ? (
                <button
                  type="button"
                  className={`${monoLabelClassName} cursor-pointer rounded-full border-0 bg-transparent px-3 py-2 text-ink underline underline-offset-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
