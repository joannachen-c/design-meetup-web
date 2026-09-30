"use client";

import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import {
  ADVISOR_RELATIONSHIPS,
  ADVISOR_RELATIONSHIP_LABELS,
  isAdvisorRelationship,
} from "@/lib/advisor-directory";

import { useAdvisors } from "./AdvisorsProvider";

export const relationshipSelectOptions = [
  { label: "All relationships", value: "all" },
  ...ADVISOR_RELATIONSHIPS.map((value) => ({
    label: ADVISOR_RELATIONSHIP_LABELS[value],
    value,
  })),
];

export function useFieldSelectOptions() {
  const { fieldOptions } = useAdvisors();
  return [
    { label: "All fields", value: "all" },
    ...fieldOptions.map((field) => ({ label: field, value: field })),
  ];
}

export function AdvisorFilterBar({ className = "" }: { className?: string }) {
  const { advisors, allAdvisors, filters, isFiltered, setFilters, clearFilters } =
    useAdvisors();
  const fieldSelectOptions = useFieldSelectOptions();

  return (
    <div
      className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}
      role="search"
      aria-label="Filter advisors"
    >
      <Input
        className="min-w-[200px] flex-1 basis-[240px]"
        type="search"
        placeholder={`Search ${allAdvisors.length} people`}
        aria-label="Search advisors"
        value={filters.query}
        onChange={(event) => setFilters({ query: event.target.value })}
      />
      <Select
        aria-label="Relationship"
        options={relationshipSelectOptions}
        value={filters.relationship}
        onValueChange={(value) =>
          setFilters({ relationship: isAdvisorRelationship(value) ? value : "all" })
        }
      />
      <Select
        aria-label="Field"
        options={fieldSelectOptions}
        value={filters.field}
        onValueChange={(value) => setFilters({ field: value })}
      />
      <p className="m-0 min-w-[9ch] px-2 text-sm tabular-nums text-muted" aria-live="polite">
        {advisors.length} of {allAdvisors.length}
      </p>
      {isFiltered ? (
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-[10px] border-0 bg-transparent px-3 text-sm text-ink underline underline-offset-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          onClick={clearFilters}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

export function AdvisorEmptyState() {
  const { clearFilters } = useAdvisors();
  return (
    <div className="grid justify-items-start gap-3 rounded-[11px] bg-surface-muted px-6 py-10">
      <p className="m-0 text-base font-bold text-ink">No advisors match those filters.</p>
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent p-0 text-sm text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        onClick={clearFilters}
      >
        Clear filters
      </button>
    </div>
  );
}
