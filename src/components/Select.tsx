"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";

export type SelectOption = {
  label: string;
  value: string;
};

// Matches the menu's `p-1`, in px.
const MENU_PADDING = 4;

type SelectProps = {
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
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

// The menu is ours, but the primitive keeps the parts that are easy to get
// wrong: focus return, typeahead, arrow-key roving, and collision handling.
export function Select({
  className = "",
  disabled = false,
  id,
  name,
  onValueChange,
  options,
  placeholder,
  value,
  "aria-label": ariaLabel,
}: SelectProps) {
  // Default to content width; callers can pass grow / an explicit w-* to fill a row.
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

  return (
    <SelectPrimitive.Root
      disabled={disabled}
      name={name}
      value={value}
      onValueChange={onValueChange}
    >
      <SelectPrimitive.Trigger
        className={triggerClassName}
        id={id}
        aria-label={ariaLabel}
      >
        <span className="min-w-0 truncate leading-[1.2]">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="size-4 shrink-0 text-muted transition-transform duration-150 ease-out group-data-[state=open]:-rotate-180 motion-reduce:transition-none" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        {/* The menu is the trigger's box inflated by its own 1-unit padding, so
            every row lands exactly on the trigger's footprint: alignOffset and
            the extra min-width cancel that padding out, and each row repeats the
            trigger's pl-4 / pr-3 so label and indicator sit on the same axes as
            the trigger's label and chevron. */}
        <SelectPrimitive.Content
          align="start"
          alignOffset={-MENU_PADDING}
          className="select-menu z-50 max-h-[var(--radix-select-content-available-height)] min-w-[calc(var(--radix-select-trigger-width)+8px)] overflow-hidden rounded-[10px] bg-white p-1 font-['Alte_Haas_Grotesk',sans-serif] text-base shadow-lg ring-1 ring-black/5"
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                className="flex min-h-10 cursor-pointer items-center justify-between gap-4 rounded-[7px] py-2 pr-3 pl-4 text-base text-ink outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-surface-muted"
                key={option.value}
                value={option.value}
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator asChild>
                  <CheckIcon />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
