"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";

import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { countAdvisorFacetFilters, type AdvisorFilters } from "@/lib/advisor-directory";

import { useAdvisors } from "./AdvisorsProvider";
import { clearFiltersButtonClassName, monoLabelClassName } from "./directory-ui";

type FacetKey = "location" | "field" | "company";

function FilterIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FacetSelect({
  label,
  allLabel,
  value,
  options,
  onValueChange,
}: {
  label: string;
  allLabel: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
}) {
  const active = value !== "all";
  const items = [
    { label: allLabel, value: "all" },
    ...options.map((option) => ({ label: option, value: option })),
  ];
  return (
    <div className="grid gap-1.5">
      <span className={`${monoLabelClassName} text-subtle`}>{label}</span>
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          className={`group flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border-0 bg-surface-muted px-3 text-left text-sm hover:bg-gray-200/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink data-[state=open]:bg-gray-200/70 ${active ? "text-ink" : "text-muted"}`}
          aria-label={`Filter by ${label.toLowerCase()}`}
        >
          <span className="truncate">
            <SelectPrimitive.Value>{active ? value : allLabel}</SelectPrimitive.Value>
          </span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted transition-transform duration-150 ease-out group-data-[state=open]:-rotate-180 motion-reduce:transition-none" />
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="select-menu z-[60] max-h-[min(320px,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[10px] bg-white p-1 font-['Alte_Haas_Grotesk',sans-serif] text-sm shadow-lg ring-1 ring-black/5"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport>
              {items.map((item) => (
                <SelectPrimitive.Item
                  className="flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-[7px] py-1.5 pr-2.5 pl-3 text-ink outline-none select-none data-[highlighted]:bg-surface-muted"
                  key={item.value}
                  value={item.value}
                >
                  <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator asChild>
                    <CheckIcon />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

export function AdvisorFilterMenu() {
  const { filters, setFilters, locationOptions, fieldOptions, companyOptions } = useAdvisors();
  const activeCount = countAdvisorFacetFilters(filters);

  const facets: {
    key: FacetKey;
    label: string;
    allLabel: string;
    options: string[];
  }[] = [
    { key: "location", label: "Location", allLabel: "All locations", options: locationOptions },
    { key: "field", label: "Field", allLabel: "All fields", options: fieldOptions },
    { key: "company", label: "Company", allLabel: "All companies", options: companyOptions },
  ];

  const clearFacets = () => setFilters({ location: "all", field: "all", company: "all" });

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        className={`relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink data-[state=open]:text-ink ${activeCount > 0 ? "text-ink" : "text-muted"}`}
        aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"}
        title="Filters"
      >
        <FilterIcon />
        {activeCount > 0 ? (
          <span
            className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-subtle font-mono text-[10px] leading-none text-white tabular-nums"
            aria-hidden="true"
          >
            {activeCount}
          </span>
        ) : null}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="select-menu z-50 grid w-[min(300px,calc(100vw-32px))] gap-4 rounded-[12px] bg-white p-4 font-['Alte_Haas_Grotesk',sans-serif] shadow-lg ring-1 ring-black/5 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between">
            <span className={`${monoLabelClassName} text-ink`}>Filter</span>
            {activeCount > 0 ? (
              <button type="button" className={clearFiltersButtonClassName} onClick={clearFacets}>
                Clear
              </button>
            ) : null}
          </div>
          {facets.map((facet) => (
            <FacetSelect
              key={facet.key}
              label={facet.label}
              allLabel={facet.allLabel}
              value={filters[facet.key]}
              options={facet.options}
              onValueChange={(value) =>
                setFilters({ [facet.key]: value } as Partial<AdvisorFilters>)
              }
            />
          ))}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
