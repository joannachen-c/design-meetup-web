"use client";

import { useState, type ReactNode } from "react";
import { TEAM, type PlanningItem, type PlanningPatch, type Status, type Urgency } from "@/lib/planning";
import {
  ISO_DATE,
  STATUS_LABEL,
  URGENCY_LABEL,
  daysSince,
  formatAgo,
  formatDeadline,
  isActive,
  isStale,
  type ColumnKey,
} from "./model";
import {
  MenuList,
  OptionPicker,
  People,
  Popover,
  StatusIcon,
  TagChip,
  UrgencyIcon,
  Avatar,
  usePopoverAnchor,
} from "./ui";

export type Variant = "cell" | "peek";
export type OptionKind = "location" | "owners" | "roles";
export type Suggestions = {
  locations: string[];
  people: string[];
  roles: string[];
  /** Removes a value from every item that uses it, which also drops it from the pickers. */
  deleteOption: (kind: OptionKind, value: string) => void;
};
type OptionFieldProps = FieldProps & { options: string[]; onDelete: (value: string) => void };

const teamNames = new Set<string>(TEAM.map((member) => member.name));
type FieldProps = { item: PlanningItem; save: (patch: PlanningPatch) => void; variant: Variant };

const triggerClass: Record<Variant, string> = {
  cell: "flex h-9 w-full min-w-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent px-2 text-left font-[inherit] text-sm text-ink hover:bg-black/[0.03] focus-visible:bg-black/[0.05] focus-visible:outline-none",
  peek: "flex min-h-8 w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-[6px] border-0 bg-transparent px-2 py-1 text-left font-[inherit] text-sm text-ink hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none",
};

function Trigger({
  variant,
  label,
  onClick,
  children,
}: {
  variant: Variant;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={triggerClass[variant]}>
      {children}
    </button>
  );
}

const Empty = ({ variant }: { variant: Variant }) =>
  variant === "peek" ? <span className="text-subtle">Empty</span> : null;

export function TextField({
  value,
  label,
  variant,
  multiline = false,
  autoEdit = false,
  required = false,
  className = "",
  onSave,
}: {
  value: string;
  label: string;
  variant: Variant;
  multiline?: boolean;
  autoEdit?: boolean;
  required?: boolean;
  className?: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(autoEdit ? value : null);

  if (draft === null) {
    return (
      <button
        type="button"
        aria-label={`${label}: ${value || "empty"}. Edit`}
        onClick={() => setDraft(value)}
        className={`${triggerClass[variant]} cursor-text ${multiline && variant === "peek" ? "items-start whitespace-pre-wrap" : ""} ${className}`}
      >
        {value ? (
          <span className={variant === "cell" ? "truncate" : "min-w-0 break-words"}>{value}</span>
        ) : (
          <Empty variant={variant} />
        )}
      </button>
    );
  }

  const commit = () => {
    const next = draft.trim();
    setDraft(null);
    if (next === value || (required && !next)) return;
    onSave(next);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setDraft(null);
    }
    if (event.key === "Enter" && (!multiline || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      commit();
    }
  };
  const fieldClass = `w-full border-0 bg-white font-[inherit] text-sm text-ink outline-none ${className}`;

  if (multiline && variant === "peek") {
    return (
      <textarea
        autoFocus
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className={`${fieldClass} min-h-24 resize-none rounded-[6px] px-2 py-1 leading-[1.5] [field-sizing:content] shadow-[inset_0_0_0_1.5px_var(--color-ink)]`}
      />
    );
  }
  return (
    <input
      autoFocus
      aria-label={label}
      value={draft}
      onFocus={(event) => autoEdit && event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className={`${fieldClass} ${
        variant === "cell"
          ? "h-9 px-2 shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
          : "min-h-8 rounded-[6px] px-2 py-1 shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
      }`}
    />
  );
}

export function StatusField({ item, save, variant }: FieldProps) {
  const { anchor, toggle, close } = usePopoverAnchor();
  return (
    <>
      <Trigger variant={variant} label={`Status for ${item.company}: ${STATUS_LABEL[item.status]}`} onClick={toggle}>
        <StatusIcon status={item.status} />
        <span className={`truncate ${isActive(item) ? "" : "text-muted"}`}>{STATUS_LABEL[item.status]}</span>
      </Trigger>
      {anchor ? (
        <Popover anchor={anchor} label="Status" width={210} onClose={close}>
          <MenuList<Status>
            options={STATUS_LABEL}
            value={item.status}
            icon={(status) => <StatusIcon status={status} />}
            onPick={(status) => {
              save({ status });
              close();
            }}
          />
        </Popover>
      ) : null}
    </>
  );
}

export function UrgencyField({ item, save, variant }: FieldProps) {
  const { anchor, toggle, close } = usePopoverAnchor();
  return (
    <>
      <Trigger variant={variant} label={`Urgency for ${item.company}: ${URGENCY_LABEL[item.urgency]}`} onClick={toggle}>
        <UrgencyIcon urgency={item.urgency} />
        <span className={`truncate ${item.urgency === "normal" ? "text-muted" : ""}`}>{URGENCY_LABEL[item.urgency]}</span>
      </Trigger>
      {anchor ? (
        <Popover anchor={anchor} label="Urgency" width={180} onClose={close}>
          <MenuList<Urgency>
            options={URGENCY_LABEL}
            value={item.urgency}
            icon={(urgency) => <UrgencyIcon urgency={urgency} />}
            onPick={(urgency) => {
              save({ urgency });
              close();
            }}
          />
        </Popover>
      ) : null}
    </>
  );
}

export function DeadlineField({ item, save, variant }: FieldProps) {
  const { anchor, toggle, close } = usePopoverAnchor();
  const deadline = formatDeadline(item.deadline);
  const overdue = deadline.days !== null && deadline.days < 0 && isActive(item);
  const soon = deadline.days !== null && deadline.days >= 0 && deadline.days <= 3;
  const iso = ISO_DATE.test(item.deadline);
  const inputClass =
    "h-8 w-full rounded-[7px] border-0 bg-surface-muted px-2.5 font-[inherit] text-sm text-ink outline-none";

  return (
    <>
      <Trigger variant={variant} label={`Deadline for ${item.company}: ${item.deadline || "none"}`} onClick={toggle}>
        {item.deadline ? (
          <span
            suppressHydrationWarning
            title={deadline.title}
            className={`truncate ${overdue ? "text-red-700" : soon ? "font-bold" : ""}`}
          >
            {deadline.label}
            {variant === "peek" && deadline.days !== null ? (
              <span className="text-muted"> · {deadline.title}</span>
            ) : null}
          </span>
        ) : (
          <Empty variant={variant} />
        )}
      </Trigger>
      {anchor ? (
        <Popover anchor={anchor} label="Deadline" width={240} onClose={close}>
          <div className="grid gap-2 p-1.5">
            <label className="grid gap-1 text-xs text-muted">
              Date
              <input
                type="date"
                value={iso ? item.deadline : ""}
                onChange={(event) => event.target.value && save({ deadline: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              Or text
              <input
                key={item.deadline}
                defaultValue={iso ? "" : item.deadline}
                placeholder="ASAP, Nov 2026…"
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  const value = event.currentTarget.value.trim();
                  if (value) save({ deadline: value });
                  close();
                }}
                className={inputClass}
              />
            </label>
            {item.deadline ? (
              <button
                type="button"
                onClick={() => {
                  save({ deadline: "" });
                  close();
                }}
                className="h-8 cursor-pointer rounded-[7px] border-0 bg-transparent px-2 text-left font-[inherit] text-sm text-muted hover:bg-surface-muted"
              >
                Clear
              </button>
            ) : null}
          </div>
        </Popover>
      ) : null}
    </>
  );
}

export function LocationField({ item, save, variant, options, onDelete }: OptionFieldProps) {
  const { anchor, toggle, close } = usePopoverAnchor();
  return (
    <>
      <Trigger variant={variant} label={`Location for ${item.company}: ${item.location || "none"}`} onClick={toggle}>
        {item.location ? <TagChip tag={item.location} /> : <Empty variant={variant} />}
      </Trigger>
      {anchor ? (
        <Popover anchor={anchor} label="Location" width={240} onClose={close}>
          <OptionPicker
            options={options}
            selected={item.location ? [item.location] : []}
            multiple={false}
            placeholder="Search or create a location"
            noun="location"
            onDeleteOption={onDelete}
            render={(value) => <TagChip tag={value} />}
            onChange={(next) => save({ location: next[0] ?? "" })}
            onDone={close}
          />
        </Popover>
      ) : null}
    </>
  );
}

export function PeopleField({ item, save, variant, options, onDelete }: OptionFieldProps) {
  const { anchor, toggle, close } = usePopoverAnchor();
  return (
    <>
      <Trigger
        variant={variant}
        label={`Owners for ${item.company}: ${item.owners.join(", ") || "none"}`}
        onClick={toggle}
      >
        {item.owners.length ? <People names={item.owners} /> : <Empty variant={variant} />}
      </Trigger>
      {anchor ? (
        <Popover anchor={anchor} label="Owners" width={260} onClose={close}>
          <OptionPicker
            options={options}
            selected={item.owners}
            multiple
            placeholder="Search or add a person"
            noun="person"
            onDeleteOption={onDelete}
            canDeleteOption={(name) => !teamNames.has(name)}
            render={(name) => (
              <>
                <Avatar name={name} />
                <span className="truncate">{name}</span>
              </>
            )}
            onChange={(owners) => save({ owners })}
            onDone={close}
          />
        </Popover>
      ) : null}
    </>
  );
}

export function RolesField({ item, save, variant, options, onDelete }: OptionFieldProps) {
  const { anchor, toggle, close } = usePopoverAnchor();
  const shown = variant === "cell" ? item.roles.slice(0, 2) : item.roles;
  return (
    <>
      <Trigger variant={variant} label={`Roles for ${item.company}: ${item.roles.join(", ") || "none"}`} onClick={toggle}>
        {item.roles.length ? (
          <span className={`flex min-w-0 gap-1 ${variant === "peek" ? "flex-wrap" : ""}`}>
            {shown.map((role) => (
              <TagChip key={role} tag={role} />
            ))}
            {item.roles.length > shown.length ? (
              <span className="text-xs text-muted">+{item.roles.length - shown.length}</span>
            ) : null}
          </span>
        ) : (
          <Empty variant={variant} />
        )}
      </Trigger>
      {anchor ? (
        <Popover anchor={anchor} label="Roles" width={240} onClose={close}>
          <OptionPicker
            options={options}
            selected={item.roles}
            multiple
            placeholder="Search or create a role"
            noun="role"
            onDeleteOption={onDelete}
            render={(role) => <TagChip tag={role} />}
            onChange={(roles) => save({ roles })}
            onDone={close}
          />
        </Popover>
      ) : null}
    </>
  );
}

export function UpdatedField({ item, variant }: { item: PlanningItem; variant: Variant }) {
  const stale = isStale(item);
  return (
    <span
      suppressHydrationWarning
      title={stale ? "No changes in two weeks" : undefined}
      className={`flex items-center gap-1.5 px-2 text-sm ${variant === "cell" ? "h-9" : "min-h-8 py-1"} ${stale ? "text-red-700" : "text-muted"}`}
    >
      {stale ? <span aria-hidden className="size-1.5 rounded-full bg-red-700" /> : null}
      {formatAgo(daysSince(item.updatedAt))}
      {stale ? <span className="sr-only">(stale)</span> : null}
    </span>
  );
}

export function Field({
  column,
  item,
  save,
  variant,
  suggestions,
}: {
  column: ColumnKey;
  item: PlanningItem;
  save: (patch: PlanningPatch) => void;
  variant: Variant;
  suggestions: Suggestions;
}) {
  switch (column) {
    case "status":
      return <StatusField item={item} save={save} variant={variant} />;
    case "urgency":
      return <UrgencyField item={item} save={save} variant={variant} />;
    case "deadline":
      return <DeadlineField item={item} save={save} variant={variant} />;
    case "location":
      return (
        <LocationField
          item={item}
          save={save}
          variant={variant}
          options={suggestions.locations}
          onDelete={(value) => suggestions.deleteOption("location", value)}
        />
      );
    case "owners":
      return (
        <PeopleField
          item={item}
          save={save}
          variant={variant}
          options={suggestions.people}
          onDelete={(value) => suggestions.deleteOption("owners", value)}
        />
      );
    case "roles":
      return (
        <RolesField
          item={item}
          save={save}
          variant={variant}
          options={suggestions.roles}
          onDelete={(value) => suggestions.deleteOption("roles", value)}
        />
      );
    case "updated":
      return <UpdatedField item={item} variant={variant} />;
    case "description":
      return (
        <TextField
          value={item.description}
          label={`Description for ${item.company}`}
          variant={variant}
          multiline
          onSave={(description) => save({ description })}
        />
      );
    case "nextStep":
      return (
        <TextField
          value={item.nextStep}
          label={`Next step for ${item.company}`}
          variant={variant}
          multiline
          onSave={(nextStep) => save({ nextStep })}
        />
      );
    case "poc":
      return (
        <TextField
          value={item.poc}
          label={`POC for ${item.company}`}
          variant={variant}
          onSave={(poc) => save({ poc })}
        />
      );
  }
}
