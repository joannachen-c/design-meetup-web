"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { showErrorToast } from "@/components/AppToaster";
import {
  STATUSES,
  TEAM,
  URGENCIES,
  type PlanningItem,
  type PlanningPatch,
} from "@/lib/planning";
import { Field, type OptionKind, type Suggestions } from "./planning/fields";
import {
  COLUMN_KEYS,
  COLUMN_LABEL,
  COLUMN_WIDTH,
  DEFAULT_VIEW,
  EMPTY_FILTERS,
  GROUP_LABEL,
  NAME_WIDTH,
  SORT_LABEL,
  STATUS_LABEL,
  URGENCY_LABEL,
  compareBy,
  groupItems,
  itemMatches,
  loadView,
  locationColor,
  saveView,
  type Filters,
  type Group,
  type GroupBy,
  type SortBy,
  type View,
} from "./planning/model";
import { PlanningCalendar } from "./planning/PlanningCalendar";
import { PlanningPeek } from "./planning/PlanningPeek";
import {
  Avatar,
  CheckIcon,
  CloseIcon,
  ChevronIcon,
  MenuList,
  Popover,
  PlusIcon,
  StatusIcon,
  TagChip,
  UrgencyIcon,
  usePopoverAnchor,
} from "./planning/ui";

const REFRESH_MS = 10_000;
const API = "/api/portal/planning";
const ROW_BG = "bg-surface group-hover:bg-[oklch(97.9%_0.003_264.542)]";
const LINE = "border-black/[0.07]";
// Sticky cells don't carry collapsed borders, so the pinned column draws its own edge.
const PINNED_EDGE = "shadow-[inset_-1px_0_0_rgb(0_0_0/0.07)]";

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong.");
  return payload;
}

const uniqueSorted = (values: string[]) =>
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

function ToolbarMenu({
  label,
  buttonLabel,
  active = false,
  width = 240,
  trigger,
  children,
}: {
  label: string;
  buttonLabel?: string;
  active?: boolean;
  width?: number;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const { anchor, toggle, close } = usePopoverAnchor();
  return (
    <>
      <button
        type="button"
        aria-label={buttonLabel}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        onClick={toggle}
        className={[
          "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[7px] border-0 px-2.5 font-[inherit] text-sm whitespace-nowrap transition-colors",
          active || anchor ? "bg-surface-muted text-ink" : "bg-transparent text-muted hover:bg-surface-muted hover:text-ink",
        ].join(" ")}
      >
        {trigger}
      </button>
      {anchor ? (
        <Popover anchor={anchor} label={label} width={width} onClose={close}>
          {children(close)}
        </Popover>
      ) : null}
    </>
  );
}

function MenuHeading({ children }: { children: ReactNode }) {
  return <p className="m-0 px-2 pt-2 pb-1 text-xs font-bold tracking-[0.04em] text-muted uppercase">{children}</p>;
}

function ToggleRow({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-[7px] border-0 bg-transparent px-2 text-left font-[inherit] text-sm text-ink hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      {on ? <CheckIcon className="size-4 shrink-0 text-muted" /> : null}
    </button>
  );
}

type FilterKey = keyof Filters;

function filterSections(suggestions: Suggestions, locations: string[]) {
  return [
    {
      key: "status" as const,
      label: "Status",
      options: STATUSES.map((status) => ({
        value: status,
        node: (
          <>
            <StatusIcon status={status} />
            {STATUS_LABEL[status]}
          </>
        ),
        text: STATUS_LABEL[status],
      })),
    },
    {
      key: "urgency" as const,
      label: "Urgency",
      options: URGENCIES.map((urgency) => ({
        value: urgency,
        node: (
          <>
            <UrgencyIcon urgency={urgency} />
            {URGENCY_LABEL[urgency]}
          </>
        ),
        text: URGENCY_LABEL[urgency],
      })),
    },
    {
      key: "location" as const,
      label: "Location",
      options: locations.map((location) => ({
        value: location,
        node: location ? <TagChip tag={location} color={locationColor(location)} /> : <span className="text-muted">No location</span>,
        text: location || "No location",
      })),
    },
    {
      key: "owners" as const,
      label: "Owners",
      options: suggestions.people.map((name) => ({
        value: name,
        node: (
          <>
            <Avatar name={name} />
            <span className="truncate">{name}</span>
          </>
        ),
        text: name,
      })),
    },
    {
      key: "roles" as const,
      label: "Roles",
      options: suggestions.roles.map((role) => ({ value: role, node: <TagChip tag={role} />, text: role })),
    },
  ];
}

export function PlanningBoard({ initialItems }: { initialItems: PlanningItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [viewLoaded, setViewLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [peek, setPeek] = useState<{ id: string; autoEdit: boolean } | null>(null);
  const pending = useRef(0);

  useEffect(() => {
    setView(loadView());
    setViewLoaded(true);
  }, []);
  useEffect(() => {
    if (viewLoaded) saveView(view);
  }, [view, viewLoaded]);

  const refresh = useCallback(async () => {
    if (pending.current > 0 || document.visibilityState !== "visible") return;
    try {
      const { items: latest } = await requestJson(API);
      if (pending.current === 0) setItems(latest);
    } catch {
      // A missed poll is retried on the next tick.
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(refresh, REFRESH_MS);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const mutate = useCallback(async (run: () => Promise<void>, rollback: () => void) => {
    pending.current += 1;
    try {
      await run();
    } catch (error) {
      rollback();
      showErrorToast(error instanceof Error ? error.message : "Could not save that change.");
    } finally {
      pending.current -= 1;
    }
  }, []);

  const save = useCallback(
    (id: string, patch: PlanningPatch) => {
      let before: PlanningItem | undefined;
      setItems((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          before = item;
          return { ...item, ...patch };
        }),
      );
      void mutate(
        async () => {
          const { item } = await requestJson(`${API}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
          });
          setItems((current) => current.map((other) => (other.id === id ? item : other)));
        },
        () => setItems((current) => current.map((item) => (item.id === id && before ? before : item))),
      );
    },
    [mutate],
  );

  const remove = useCallback(
    (id: string) => {
      let removed: PlanningItem | undefined;
      setItems((current) => {
        removed = current.find((item) => item.id === id);
        return current.filter((item) => item.id !== id);
      });
      setPeek(null);
      void mutate(
        async () => {
          await requestJson(`${API}/${id}`, { method: "DELETE" });
        },
        () => setItems((current) => (removed ? [...current, removed] : current)),
      );
    },
    [mutate],
  );

  const create = useCallback(
    (defaults: PlanningPatch) => {
      void mutate(async () => {
        const { item } = await requestJson(API, {
          method: "POST",
          body: JSON.stringify({ company: "Untitled", ...defaults }),
        });
        setItems((current) => [...current, item]);
        setPeek({ id: item.id, autoEdit: true });
      }, () => {});
    },
    [mutate],
  );

  const deleteOption = useCallback(
    (kind: OptionKind, value: string) => {
      const uses = (item: PlanningItem) =>
        kind === "location" ? item.location === value : item[kind].includes(value);
      const affected = items.filter(uses);
      const count = `${affected.length} item${affected.length === 1 ? "" : "s"}`;
      if (!window.confirm(`Delete “${value}”? It will be removed from ${count}.`)) return;
      for (const item of affected) {
        save(
          item.id,
          kind === "location" ? { location: "" } : { [kind]: item[kind].filter((entry) => entry !== value) },
        );
      }
      setView((current) => ({
        ...current,
        filters: { ...current.filters, [kind]: current.filters[kind].filter((entry) => entry !== value) },
      }));
    },
    [items, save],
  );

  const suggestions = useMemo<Suggestions>(
    () => ({
      locations: uniqueSorted(items.map((item) => item.location)),
      people: [...new Set([...TEAM.map((member) => member.name), ...uniqueSorted(items.flatMap((item) => item.owners))])],
      roles: uniqueSorted(items.flatMap((item) => item.roles)),
      deleteOption,
    }),
    [items, deleteOption],
  );

  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () => items.filter((item) => itemMatches(item, view.filters, needle)).sort(compareBy(view.sortBy)),
    [items, view.filters, view.sortBy, needle],
  );
  const groups = groupItems(visible, view.groupBy);
  const columns = COLUMN_KEYS;
  const tableWidth = NAME_WIDTH + columns.reduce((sum, key) => sum + COLUMN_WIDTH[key], 0) + 48;
  const activeFilters = (Object.keys(view.filters) as FilterKey[]).filter((key) => view.filters[key].length);
  const allLocations = [...suggestions.locations, ...(items.some((item) => !item.location) ? [""] : [])];
  const sections = filterSections(suggestions, allLocations);

  const peekItem = peek ? items.find((item) => item.id === peek.id) : undefined;
  useEffect(() => {
    if (peek && !peekItem && pending.current === 0) setPeek(null);
  }, [peek, peekItem]);

  const updateView = (patch: Partial<View>) => setView((current) => ({ ...current, ...patch }));
  const toggleFilter = (key: FilterKey, value: string) =>
    setView((current) => {
      const values = current.filters[key] as string[];
      const next = values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
      return { ...current, filters: { ...current.filters, [key]: next } };
    });
  const toggleCollapsed = (key: string) =>
    setView((current) => ({
      ...current,
      collapsed: current.collapsed.includes(key)
        ? current.collapsed.filter((entry) => entry !== key)
        : [...current.collapsed, key],
    }));

  const groupIcon = (group: Group) =>
    group.status ? (
      <StatusIcon status={group.status} />
    ) : group.urgency ? (
      <UrgencyIcon urgency={group.urgency} />
    ) : null;

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] font-bold tracking-[-0.06em]">
          Planning
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ul aria-label="Item counts" className="m-0 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0 text-sm text-muted">
            <li className="font-bold text-ink">{items.length} items</li>
            {STATUSES.map((status) => (
              <li
                key={status}
                title={STATUS_LABEL[status]}
                className="inline-flex items-center gap-1.5 tabular-nums"
              >
                <StatusIcon status={status} />
                {items.filter((item) => item.status === status).length}
                <span className="sr-only">{STATUS_LABEL[status]}</span>
              </li>
            ))}
          </ul>
          <button
          type="button"
          onClick={() => create({})}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[7px] border-0 bg-surface-muted pr-3 pl-2.5 font-[inherit] text-sm font-bold text-ink transition-colors hover:bg-gray-200"
        >
          <PlusIcon className="size-4" />
          New item
        </button>
        </div>
      </div>

      <div className="mt-10">
        <PlanningCalendar
          items={items}
          onOpen={(id) => setPeek({ id, autoEdit: false })}
          onMove={(id, day) => save(id, { deadline: day })}
        />
      </div>

      <div className={`mt-12 flex flex-wrap items-center gap-1 border-b ${LINE} pb-2`}>
        <label className="relative mr-1 flex h-8 w-full items-center min-[640px]:w-64">
          <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute left-2.5 size-3.5 text-subtle">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="sr-only">Search planning items</span>
          <input
            type="search"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-8 w-full rounded-[7px] border-0 bg-surface-muted pr-2.5 pl-8 font-[inherit] text-sm text-ink outline-none placeholder:text-subtle focus:shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
          />
        </label>

        <ToolbarMenu
          label="Filter"
          width={260}
          active={activeFilters.length > 0}
          trigger={
            <>
              <svg aria-hidden viewBox="0 0 16 16" className="size-3.5">
                <path d="M2.5 4h11M4.5 8h7M6.5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Filter{activeFilters.length ? ` · ${activeFilters.length}` : ""}
            </>
          }
        >
          {() => (
            <div className="grid">
              {sections.map((section) =>
                section.options.length ? (
                  <div key={section.key}>
                    <MenuHeading>{section.label}</MenuHeading>
                    {section.options.map((option) => (
                      <ToggleRow
                        key={option.value || "none"}
                        on={(view.filters[section.key] as string[]).includes(option.value)}
                        onClick={() => toggleFilter(section.key, option.value)}
                      >
                        {option.node}
                      </ToggleRow>
                    ))}
                  </div>
                ) : null,
              )}
            </div>
          )}
        </ToolbarMenu>

        <ToolbarMenu
          label="Group by"
          buttonLabel={`Group by: ${GROUP_LABEL[view.groupBy]}`}
          width={200}
          trigger={
            <>
              Group: <span className="text-ink">{GROUP_LABEL[view.groupBy]}</span>
            </>
          }
        >
          {(close) => (
            <MenuList<GroupBy>
              options={GROUP_LABEL}
              value={view.groupBy}
              onPick={(groupBy) => {
                updateView({ groupBy });
                close();
              }}
            />
          )}
        </ToolbarMenu>

        <ToolbarMenu
          label="Sort by"
          buttonLabel={`Sort by: ${SORT_LABEL[view.sortBy]}`}
          width={200}
          trigger={
            <>
              Sort: <span className="text-ink">{SORT_LABEL[view.sortBy]}</span>
            </>
          }
        >
          {(close) => (
            <MenuList<SortBy>
              options={SORT_LABEL}
              value={view.sortBy}
              onPick={(sortBy) => {
                updateView({ sortBy });
                close();
              }}
            />
          )}
        </ToolbarMenu>

      </div>

      {activeFilters.length ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {activeFilters.map((key) => {
            const section = sections.find((entry) => entry.key === key);
            const labels = (view.filters[key] as string[]).map(
              (value) => section?.options.find((option) => option.value === value)?.text ?? value,
            );
            return (
              <button
                key={key}
                type="button"
                aria-label={`Remove ${section?.label} filter`}
                onClick={() => setView((current) => ({ ...current, filters: { ...current.filters, [key]: [] } }))}
                className="inline-flex h-7 max-w-80 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-surface-muted px-2.5 font-[inherit] text-xs text-ink hover:bg-skeleton"
              >
                <span className="text-muted">{section?.label}:</span>
                <span className="truncate">{labels.join(", ")}</span>
                <CloseIcon className="size-2 text-muted" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => updateView({ filters: EMPTY_FILTERS })}
            className="h-7 cursor-pointer rounded-full border-0 bg-transparent px-2 font-[inherit] text-xs text-muted hover:text-ink"
          >
            Clear
          </button>
        </div>
      ) : null}

      {visible.length || view.groupBy === "status" || view.groupBy === "urgency" ? (
        <div className="overflow-x-auto">
          <table
            className="w-full table-fixed border-collapse text-sm [--name-col:300px] max-[640px]:[--name-col:190px]"
            style={{ minWidth: tableWidth }}
          >
            <colgroup>
              <col style={{ width: "var(--name-col)" }} />
              {columns.map((key) => (
                <col key={key} style={{ width: COLUMN_WIDTH[key] }} />
              ))}
              <col />
            </colgroup>
            <thead>
              <tr>
                <th
                  scope="col"
                  className={`sticky left-0 z-[2] h-9 border-b ${LINE} bg-surface px-3 text-left text-[13px] font-normal text-muted ${PINNED_EDGE}`}
                >
                  Name
                </th>
                {columns.map((key) => (
                  <th
                    key={key}
                    scope="col"
                    className={`h-9 border-b border-l ${LINE} px-2 text-left text-[13px] font-normal whitespace-nowrap text-muted`}
                  >
                    {COLUMN_LABEL[key]}
                  </th>
                ))}
                <th aria-hidden className={`border-b ${LINE}`} />
              </tr>
            </thead>
            {groups.map((group) => {
              const collapsed = view.groupBy !== "none" && view.collapsed.includes(group.key);
              return (
                <tbody key={group.key}>
                  {view.groupBy !== "none" ? (
                    <tr>
                      <th scope="rowgroup" colSpan={columns.length + 2} className="p-0 pt-5 text-left font-normal">
                        <div className="sticky left-0 flex w-fit items-center gap-0.5 pb-1">
                          <button
                            type="button"
                            aria-expanded={!collapsed}
                            onClick={() => toggleCollapsed(group.key)}
                            className="flex h-7 cursor-pointer items-center gap-1.5 rounded-[6px] border-0 bg-transparent px-1.5 font-[inherit] text-sm font-bold text-muted hover:bg-surface-muted hover:text-ink"
                          >
                            <ChevronIcon open={!collapsed} className="size-3 text-muted" />
                            {groupIcon(group)}
                            {group.label}
                            <span className="font-normal text-subtle">{group.items.length}</span>
                          </button>
                          <button
                            type="button"
                            aria-label={`New item in ${group.label}`}
                            onClick={() => create(group.defaults)}
                            className="grid size-7 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent text-subtle hover:bg-surface-muted hover:text-ink"
                          >
                            <PlusIcon className="size-3.5" />
                          </button>
                        </div>
                      </th>
                    </tr>
                  ) : null}
                  {collapsed
                    ? null
                    : group.items.map((item) => (
                        <tr key={item.id} className="group">
                          <td className={`sticky left-0 z-[1] border-b ${LINE} p-0 ${ROW_BG} ${PINNED_EDGE}`}>
                            <button
                              type="button"
                              aria-label={`Open ${item.company}`}
                              onClick={() => setPeek({ id: item.id, autoEdit: false })}
                              className="flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 border-0 bg-transparent px-3 text-left font-[inherit] text-sm font-bold text-ink"
                            >
                              {view.groupBy !== "status" && !columns.includes("status") ? (
                                <StatusIcon status={item.status} />
                              ) : null}
                              <span className="truncate">{item.company}</span>
                              <span className="ml-auto shrink-0 rounded-[5px] bg-white px-1.5 text-xs font-normal text-muted opacity-0 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] group-hover:opacity-100 group-focus-within:opacity-100">
                                Open
                              </span>
                            </button>
                          </td>
                          {columns.map((key) => (
                            <td key={key} className={`border-b border-l ${LINE} p-0 ${ROW_BG}`}>
                              <Field
                                column={key}
                                item={item}
                                save={(patch) => save(item.id, patch)}
                                variant="cell"
                                suggestions={suggestions}
                              />
                            </td>
                          ))}
                          <td className={`border-b ${LINE} ${ROW_BG}`} />
                        </tr>
                      ))}
                  {collapsed ? null : (
                    <tr>
                      <td colSpan={columns.length + 2} className="p-0">
                        <button
                          type="button"
                          onClick={() => create(group.defaults)}
                          className="sticky left-0 flex h-8 cursor-pointer items-center gap-1.5 border-0 bg-transparent px-3 font-[inherit] text-sm text-subtle hover:text-ink"
                        >
                          <PlusIcon className="size-3.5" />
                          New
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      ) : (
        <div className="grid justify-items-start gap-2 py-16">
          <p className="m-0 text-sm text-muted">
            {items.length ? "Nothing matches these filters." : "No items yet."}
          </p>
          {items.length ? (
            <button
              type="button"
              onClick={() => {
                updateView({ filters: EMPTY_FILTERS });
                setQuery("");
              }}
              className="h-8 cursor-pointer rounded-[7px] border-0 bg-surface-muted px-3 font-[inherit] text-sm text-ink"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      )}

      {peek && peekItem ? (
        <PlanningPeek
          key={peekItem.id}
          item={peekItem}
          suggestions={suggestions}
          autoEditTitle={peek.autoEdit}
          save={(patch) => save(peekItem.id, patch)}
          remove={() => remove(peekItem.id)}
          onClose={() => setPeek(null)}
        />
      ) : null}
    </main>
  );
}
