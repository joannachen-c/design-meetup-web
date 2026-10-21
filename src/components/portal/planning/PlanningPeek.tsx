"use client";

import { useEffect, useRef, useState } from "react";
import type { PlanningItem, PlanningLink, PlanningPatch } from "@/lib/planning";
import { Field, TextField, type Suggestions } from "./fields";
import { COLUMN_LABEL, type ColumnKey } from "./model";
import { PlusIcon } from "./ui";

const PROPERTIES: ColumnKey[] = ["status", "urgency", "deadline", "poc", "location", "owners", "roles", "updated"];

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Links({ links, onChange }: { links: PlanningLink[]; onChange: (links: PlanningLink[]) => void }) {
  const [adding, setAdding] = useState(false);
  const inputClass =
    "h-8 min-w-0 rounded-[7px] border-0 bg-surface-muted px-2.5 font-[inherit] text-sm text-ink outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-ink)]";

  return (
    <div className="grid gap-0.5">
      {links.map((link, index) => (
        <div
          key={`${link.url}-${index}`}
          className="group flex min-h-8 items-center gap-2 rounded-[6px] px-2 hover:bg-surface-muted"
        >
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm text-ink underline decoration-black/20 underline-offset-2 hover:decoration-ink"
          >
            {link.label}
            <span className="ml-2 text-muted no-underline">{hostOf(link.url)}</span>
          </a>
          <button
            type="button"
            aria-label={`Remove ${link.label}`}
            onClick={() => onChange(links.filter((_, other) => other !== index))}
            className="grid size-6 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent text-subtle opacity-0 group-hover:opacity-100 hover:text-red-700 focus-visible:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
      {adding ? (
        <form
          className="flex flex-wrap gap-1.5 px-2 py-1"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const url = String(form.get("url") || "").trim();
            if (!url) return;
            onChange([...links, { label: String(form.get("label") || "").trim(), url }]);
            setAdding(false);
          }}
        >
          <input name="label" aria-label="Link label" placeholder="Label" className={`${inputClass} w-36`} />
          <input
            name="url"
            type="url"
            required
            autoFocus
            aria-label="Link URL"
            placeholder="Paste a Google Doc, Figma… link"
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            className="h-8 cursor-pointer rounded-[7px] border-0 bg-ink px-3 font-[inherit] text-sm font-bold text-white"
          >
            Add
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-[6px] border-0 bg-transparent px-2 font-[inherit] text-sm text-muted hover:bg-surface-muted hover:text-ink"
        >
          <PlusIcon className="size-3.5" />
          Add a link
        </button>
      )}
    </div>
  );
}

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
            className="grid size-8 cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent text-lg text-muted hover:bg-surface-muted hover:text-ink"
          >
            ×
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
              <Links links={item.links} onChange={(links) => save({ links })} />
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
