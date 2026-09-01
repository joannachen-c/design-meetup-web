"use client";

import * as Popover from "@radix-ui/react-popover";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";
import type { SelectOption } from "./Select";

// Matches the menu's `p-1`, in px — same footprint alignment as Select.
const MENU_PADDING = 4;

type MultiSelectProps = {
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  onValueChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string[];
  "aria-label"?: string;
};

function CheckIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
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

function formatSelectedLabels(
  value: string[],
  options: SelectOption[],
  placeholder?: string,
) {
  const selected = options.filter((option) => value.includes(option.value));
  if (selected.length === 0) return placeholder ?? "";
  if (selected.length === 1) return selected[0].label;
  if (selected.length === 2) {
    return `${selected[0].label} and ${selected[1].label}`;
  }
  const head = selected
    .slice(0, -1)
    .map((option) => option.label)
    .join(", ");
  return `${head}, and ${selected.at(-1)!.label}`;
}

// Multi-select twin of Select: same trigger/menu language, but the menu stays
// open so several interests can be checked before dismissing.
export function MultiSelect({
  className = "",
  disabled = false,
  id,
  name,
  onValueChange,
  options,
  placeholder,
  value,
  "aria-label": ariaLabel,
}: MultiSelectProps) {
  const hasWidthOverride = /(?:^|\s)(?:w-|min-w-|max-w-|grow|flex-1)(?:\s|$)/.test(
    className,
  );
  const triggerClassName = [
    "group inline-flex min-h-11 max-w-full items-center justify-between gap-1.5 rounded-[10px] border-0 bg-surface-muted py-2.5 pr-3 pl-4 text-left text-base font-normal text-ink",
    hasWidthOverride ? "" : "w-fit",
    "transition-colors duration-150 ease-out",
    "cursor-pointer hover:bg-gray-200 data-[state=open]:bg-gray-200",
    "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface-muted",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const label = formatSelectedLabels(value, options, placeholder);
  const selectedSet = new Set(value);

  const toggle = (optionValue: string) => {
    if (selectedSet.has(optionValue)) {
      // Keep at least one interest so the sentence still reads.
      if (value.length <= 1) return;
      onValueChange(value.filter((entry) => entry !== optionValue));
      return;
    }
    const next = options
      .map((option) => option.value)
      .filter(
        (entry) => entry === optionValue || selectedSet.has(entry),
      );
    onValueChange(next);
  };

  return (
    <Popover.Root>
      {name
        ? value.map((entry) => (
            <input key={entry} type="hidden" name={name} value={entry} />
          ))
        : null}
      <Popover.Trigger
        className={triggerClassName}
        disabled={disabled}
        id={id}
        aria-label={ariaLabel}
        type="button"
      >
        <span className="min-w-0 truncate leading-[1.2]">{label}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted transition-transform duration-150 ease-out group-data-[state=open]:-rotate-180 motion-reduce:transition-none" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          alignOffset={-MENU_PADDING}
          sideOffset={6}
          className="select-menu select-menu-popover z-50 max-h-[var(--radix-popover-content-available-height)] min-w-[calc(var(--radix-popover-trigger-width)+8px)] overflow-hidden rounded-[10px] bg-white p-1 font-['Alte_Haas_Grotesk',sans-serif] text-base shadow-lg ring-1 ring-black/5"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div role="listbox" aria-multiselectable="true" aria-label={ariaLabel}>
            {options.map((option) => {
              const selected = selectedSet.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-4 rounded-[7px] py-2 pr-3 pl-4 text-left text-base text-ink outline-none select-none hover:bg-surface-muted focus-visible:bg-surface-muted"
                  onClick={() => toggle(option.value)}
                >
                  <span>{option.label}</span>
                  {selected ? <CheckIcon /> : <span className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
