"use client";

import { useState, type FormEvent } from "react";
import { showErrorToast, showSuccessToast } from "@/components/AppToaster";
import type { ApprovedSignup } from "@/lib/approved-signups";

const API = "/api/portal/approved-signups";

type Result = { added: string[]; alreadyApproved: string[]; invalid: string[] };

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Organizer form that lets accepted applicants create a portal account. */
export function ApproveMembersForm({ initialApproved }: { initialApproved: ApprovedSignup[] }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [approved, setApproved] = useState(initialApproved);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: text }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        showErrorToast(payload.error || "Could not approve those emails.");
        return;
      }
      const next = payload as Result;
      setResult(next);
      setText(next.invalid.join("\n"));
      if (next.added.length) {
        showSuccessToast(`Approved ${plural(next.added.length, "email")}`);
        const list = await fetch(API, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
        if (list?.approved) setApproved(list.approved);
      }
    } catch {
      showErrorToast("Could not approve those emails.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="approve-members" className="mt-8 rounded-[12px] bg-surface-muted p-5">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <h2 id="approve-members" className="m-0 text-base font-bold">
            Approve new members
          </h2>
          <p className="m-0 mt-1 text-sm text-muted">
            Paste accepted emails, separated by commas or new lines. They can then sign up at
            designmeetup.info/signup and subscribe. Rows highlighted green in the applications
            sheet are added automatically.
          </p>
        </div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder={"jane@gmail.com\nalex@berkeley.edu"}
          aria-label="Emails to approve"
          className="w-full resize-y rounded-[8px] border border-black/10 bg-surface px-3 py-2 font-[inherit] text-sm text-ink outline-none focus:border-black/30"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="inline-flex h-8 cursor-pointer items-center rounded-[7px] border-0 bg-ink px-3 font-[inherit] text-sm font-bold text-surface transition-opacity disabled:cursor-default disabled:opacity-40"
          >
            {busy ? "Approving…" : "Approve"}
          </button>
          {result ? (
            <p role="status" className="m-0 text-sm text-muted">
              {result.added.length} added
              {result.alreadyApproved.length
                ? ` · ${result.alreadyApproved.length} already approved`
                : ""}
              {result.invalid.length ? (
                <span className="text-red-700"> · {result.invalid.length} not valid (left in the box)</span>
              ) : null}
            </p>
          ) : null}
        </div>
      </form>
      {approved.length ? (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted">
            Approved from the portal ({approved.length})
          </summary>
          <ul className="m-0 mt-2 grid list-none gap-1 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((row) => (
              <li key={row.email} className="truncate" title={row.addedBy ? `Added by ${row.addedBy}` : undefined}>
                {row.email}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
