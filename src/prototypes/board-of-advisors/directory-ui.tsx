"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import type { ReactNode } from "react";

import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { LinkedInIcon, XIcon } from "@/components/icons/SocialIcons";
import type { AdvisorSort } from "@/lib/advisor-directory";

import { useAdvisors } from "./AdvisorsProvider";
import { advisorAvatarClass, advisorFullName, advisorInitials, type Advisor } from "./advisors";

export const monoLabelClassName = "font-mono text-[11px] uppercase tracking-[0.08em]";
export const monoCellClassName = "font-mono text-xs leading-[1.5] text-muted";

export function Portrait({ advisor, className }: { advisor: Advisor; className: string }) {
  if (advisor.photoUrl) {
    return <img
        src={advisor.photoUrl}
        alt=""
        decoding="async"
        className={`${className} bg-surface-muted object-cover grayscale`}
      />;
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

function HeaderSelect({
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
        className={`${monoLabelClassName} group -ml-1.5 inline-flex max-w-[calc(100%+0.375rem)] cursor-pointer items-center gap-1 rounded-[6px] border-0 bg-transparent px-1.5 py-1 hover:bg-gray-200/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink data-[state=open]:bg-gray-200/70 ${active ? "text-ink" : "text-muted"}`}
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

export function LocationFilter() {
  const { locationOptions, filters, setFilters } = useAdvisors();
  return (
    <HeaderSelect
      label="Location"
      value={filters.location}
      options={[
        { label: "All locations", value: "all" },
        ...locationOptions.map((location) => ({ label: location, value: location })),
      ]}
      onValueChange={(value) => setFilters({ location: value })}
    />
  );
}

export function FieldFilter() {
  const { fieldOptions, filters, setFilters } = useAdvisors();
  return (
    <HeaderSelect
      label="Field"
      value={filters.field}
      options={[
        { label: "All fields", value: "all" },
        ...fieldOptions.map((field) => ({ label: field, value: field })),
      ]}
      onValueChange={(value) => setFilters({ field: value })}
    />
  );
}

export function SortHeader({
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

export function FieldTags({
  advisor,
  limit,
  className = "",
}: {
  advisor: Advisor;
  limit?: number;
  className?: string;
}) {
  const { setFilters } = useAdvisors();
  const shown = limit ? advisor.fields.slice(0, limit) : advisor.fields;
  const hidden = advisor.fields.slice(shown.length);
  return (
    <span className={`flex flex-wrap items-baseline gap-x-1 gap-y-0.5 ${className}`}>
      {shown.map((field, index) => (
        <button
          key={field}
          type="button"
          className={`${monoCellClassName} relative z-[2] cursor-pointer rounded-[4px] border-0 bg-transparent p-0 text-left hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink`}
          onClick={(event) => {
            event.stopPropagation();
            setFilters({ field });
          }}
          aria-label={`Filter by ${field}`}
        >
          {field}
          {index < shown.length - 1 ? "," : ""}
        </button>
      ))}
      {hidden.length > 0 ? (
        <span className={`${monoCellClassName} text-subtle`} title={hidden.join(", ")}>
          +{hidden.length}
        </span>
      ) : null}
    </span>
  );
}

export function AdvisorEmptyState() {
  const { clearFilters } = useAdvisors();
  return (
    <div className="grid justify-items-start gap-3 py-10">
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

export function advisorLocationLabel(advisor: Advisor) {
  return advisor.locations.join(" / ");
}

function GlobeIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2 8h12M8 2c1.6 1.7 2.4 3.7 2.4 6S9.6 12.3 8 14C6.4 12.3 5.6 10.3 5.6 8S6.4 3.7 8 2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SocialLinks({ advisor, className = "" }: { advisor: Advisor; className?: string }) {
  const name = advisorFullName(advisor);
  const links: { href: string; label: string; icon: ReactNode }[] = [];
  if (advisor.linkedinUrl) {
    links.push({
      href: advisor.linkedinUrl,
      label: `${name} on LinkedIn`,
      icon: <LinkedInIcon className="size-3.5" />,
    });
  }
  if (advisor.xUrl) {
    links.push({ href: advisor.xUrl, label: `${name} on X`, icon: <XIcon className="size-3.5" /> });
  }
  if (advisor.websiteUrl) {
    links.push({
      href: advisor.websiteUrl,
      label: `${name}'s website`,
      icon: <GlobeIcon className="size-4" />,
    });
  }

  if (links.length === 0) return null;

  return (
    <span className={`relative z-[2] flex items-center gap-1 ${className}`}>
      {links.map((link) => (
        <a
          key={link.href}
          className="grid size-7 place-items-center rounded-full text-muted no-underline transition-colors duration-150 ease-out hover:bg-gray-200/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.label}
          onClick={(event) => event.stopPropagation()}
        >
          {link.icon}
        </a>
      ))}
    </span>
  );
}
