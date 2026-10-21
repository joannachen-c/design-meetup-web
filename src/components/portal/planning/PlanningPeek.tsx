"use client";

import { useEffect, useRef } from "react";
import type { PlanningItem, PlanningPatch } from "@/lib/planning";
import { Field, TextField, type Suggestions } from "./fields";
import { LinksEditor } from "./links";
import { COLUMN_LABEL, type ColumnKey } from "./model";
import { CloseIcon } from "./ui";

const PROPERTIES: ColumnKey[] = ["status", "urgency", "deadline", "poc", "location", "owners", "roles", "updated"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-1">
      <h3 className="m-0 px-2 text-xs font-bold tracking-[0.04em] text-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}

export function PlanningPeek({
  item,
  suggestions,
  autoEditTitle,
  save,
  remove,
  onClose,
}: {
  item: PlanningItem;
  suggestions: Suggestions;
  autoEditTitle: boolean;
  save: (patch: PlanningPatch) => void;
  remove: () => void;
  onClose: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!autoEditTitle) closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [autoEditTitle]);

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 bg-black/[0.12]" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="planning-peek-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[620px] flex-col bg-white shadow-[-16px_0_48px_rgb(18_24_38/0.12)]"
      >
        <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-3">
          <span className="truncate text-sm text-muted">Planning / {item.company}</span>
          <button
            ref={closeButton}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent p-0 text-muted hover:bg-surface-muted hover:text-ink"
          >
            <CloseIcon className="size-3" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-[clamp(12px,4vw,36px)] pt-7 pb-12">
          <h2 id="planning-peek-title" className="m-0">
            <TextField
              value={item.company}
              label="Name"
              variant="peek"
              required
              autoEdit={autoEditTitle}
              className="text-[28px]! leading-[1.15] font-bold tracking-[-0.04em]"
              onSave={(company) => save({ company })}
            />
          </h2>

          <dl className="mt-5 grid gap-px">
            {PROPERTIES.map((key) => (
              <div key={key} className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-2">
                <dt className="flex min-h-8 items-center px-2 text-sm text-muted">{COLUMN_LABEL[key]}</dt>
                <dd className="m-0 min-w-0">
                  <Field column={key} item={item} save={save} variant="peek" suggestions={suggestions} />
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-6 border-t border-black/[0.06] pt-6">
            <Section title="Description">
              <TextField
                value={item.description}
                label="Description"
                variant="peek"
                multiline
                onSave={(description) => save({ description })}
              />
            </Section>
            <Section title="Next step">
              <TextField
                value={item.nextStep}
                label="Next step"
                variant="peek"
                multiline
                onSave={(nextStep) => save({ nextStep })}
              />
            </Section>
            <Section title="Notes">
              <TextField
                value={item.notes}
                label="Notes"
                variant="peek"
                multiline
                onSave={(notes) => save({ notes })}
              />
            </Section>
            <Section title="Docs & links">
              <div className="px-2">
                <LinksEditor links={item.links} onChange={(links) => save({ links })} />
              </div>
            </Section>
          </div>

          <div className="mt-10 border-t border-black/[0.06] pt-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete “${item.company}” from Planning? This can't be undone.`)) remove();
              }}
              className="h-8 cursor-pointer rounded-[7px] border-0 bg-transparent px-2 font-[inherit] text-sm text-muted hover:bg-red-50 hover:text-red-700"
            >
              Delete item
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
