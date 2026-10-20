"use client";

import {
  type FormEvent,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Input } from "./Input";
import { Primary } from "./Primary";
import { ScrollReveal } from "./ScrollReveal";
import { Select, type SelectOption } from "./Select";

function createSubmissionId() {
  return crypto.randomUUID();
}

const interestOptions = [
  {
    value: "sponsor",
    label: "partnering on an event",
    subject: "Partnering on an event",
  },
  {
    value: "panelist",
    label: "speaking at an event",
    subject: "Speaking at an event",
  },
  {
    value: "judge",
    label: "judging a makeathon",
    subject: "Judging a makeathon",
  },
  {
    value: "venue",
    label: "providing a venue",
    subject: "Providing a venue",
  },
  {
    value: "advisor",
    label: "joining the Board of Advisors",
    subject: "Joining the Board of Advisors",
  },
];

const cityOptions: SelectOption[] = [
  { value: "sf", label: "San Francisco" },
  { value: "nyc", label: "New York" },
  { value: "la", label: "Los Angeles" },
  { value: "any", label: "any city" },
];

const DESKTOP_PARTNER_QUERY = "(min-width: 821px)";

/**
 * Keeps the heading and sentence where vertical centering placed them, then
 * lets the note grow downward. Recentering the whole block on open lifts the
 * field the person is typing in.
 */
export function PartnerCopy({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pin, setPin] = useState<number | null>(null);

  useLayoutEffect(() => {
    const copy = ref.current;
    if (!copy) return;

    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const wide = window.matchMedia(DESKTOP_PARTNER_QUERY).matches;
      const logos = copy.parentElement?.querySelector(".partner-grid");
      const heading = copy.querySelector("h2");
      const form = copy.querySelector("form");
      if (
        !wide ||
        !(logos instanceof HTMLElement) ||
        !(heading instanceof HTMLElement) ||
        !(form instanceof HTMLElement)
      ) {
        setPin(null);
        return;
      }

      const note = form.querySelector(".partner-note");
      const noteHeight = note instanceof HTMLElement ? note.offsetHeight : 0;
      const noteMargin =
        note instanceof HTMLElement
          ? Number.parseFloat(getComputedStyle(note).marginTop) || 0
          : 0;
      const gap = Number.parseFloat(getComputedStyle(copy).rowGap) || 0;
      // offsetHeight already folds in the note's negative margin, which only
      // cancels the form gap and is not part of the resting sentence.
      const resting =
        heading.offsetHeight +
        gap +
        form.offsetHeight -
        noteHeight -
        Math.min(0, noteMargin);
      setPin(Math.max(0, Math.round((logos.offsetHeight - resting) / 2)));
    };

    measure();
    const logos = copy.parentElement?.querySelector(".partner-grid");
    const observer = new ResizeObserver(measure);
    if (logos instanceof HTMLElement) observer.observe(logos);
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <ScrollReveal
      elementRef={ref}
      className="partner-copy"
      style={
        pin === null
          ? undefined
          : { paddingTop: pin, justifyContent: "flex-start" }
      }
    >
      {children}
    </ScrollReveal>
  );
}

export function PartnerContactForm() {
  const fieldId = useId();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [interest, setInterest] = useState(interestOptions[0].value);
  const [city, setCity] = useState(cityOptions[0].value);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const notePanelRef = useRef<HTMLDivElement>(null);
  const [company, setCompany] = useState("");
  const [submissionId, setSubmissionId] = useState(createSubmissionId);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const revealNote = () => {
    setShowNote(true);
  };

  useLayoutEffect(() => {
    const root = noteRef.current;
    const panel = notePanelRef.current;
    if (!root || !panel) return;
    const target = showNote ? panel.scrollHeight : 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!showNote || reduce) {
      root.style.height = `${target}px`;
      return;
    }
    // The open class and the target height land in one frame. Pin the current
    // height, flush layout, then set the target so the height transition runs.
    const current = root.getBoundingClientRect().height;
    root.style.height = `${current}px`;
    void root.offsetHeight;
    root.style.height = `${target}px`;
  }, [showNote]);

  const resetStatus = () => {
    setStatus("idle");
    setSubmissionId(createSubmissionId());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status === "sending") return;

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          interest,
          city,
          email,
          note,
          company,
          submissionId,
        }),
      });

      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form
      className="partner-form flex w-fit max-w-full flex-col gap-3 text-base leading-[1.2] text-ink max-[820px]:gap-y-3"
      onSubmit={handleSubmit}
    >
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-3">
        <span>My name is</span>
        <label className="sr-only" htmlFor={`${fieldId}-first-name`}>
          First name
        </label>
        <Input
          className="min-w-[8rem] grow basis-[8rem]"
          id={`${fieldId}-first-name`}
          name="first-name"
          autoComplete="given-name"
          placeholder="First"
          required
          value={firstName}
          onChange={(event) => {
            const value = event.target.value;
            setFirstName(value);
            if (value.trim()) revealNote();
            resetStatus();
          }}
        />
        <label className="sr-only" htmlFor={`${fieldId}-last-name`}>
          Last name
        </label>
        <Input
          className="min-w-[8rem] grow basis-[8rem]"
          id={`${fieldId}-last-name`}
          name="last-name"
          autoComplete="family-name"
          placeholder="Last"
          required
          value={lastName}
          onChange={(event) => {
            const value = event.target.value;
            setLastName(value);
            if (value.trim()) revealNote();
            resetStatus();
          }}
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-3">
        <span>I’m interested in</span>
        <label className="sr-only" htmlFor={`${fieldId}-interest`}>
          What you’re interested in
        </label>
        <Select
          id={`${fieldId}-interest`}
          name="interest"
          options={interestOptions}
          value={interest}
          onValueChange={(nextInterest) => {
            setInterest(nextInterest);
            revealNote();
            resetStatus();
          }}
        />
        <span>in</span>
        <label className="sr-only" htmlFor={`${fieldId}-city`}>
          City
        </label>
        <Select
          className="min-w-[8rem] grow basis-[8rem]"
          id={`${fieldId}-city`}
          name="city"
          options={cityOptions}
          value={city}
          onValueChange={(nextCity) => {
            setCity(nextCity);
            revealNote();
            resetStatus();
          }}
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-3">
        <span>Reach me at</span>
        <label className="sr-only" htmlFor={`${fieldId}-email`}>
          Email address
        </label>
        <Input
          className="min-w-[12rem] grow basis-[12rem] max-[640px]:min-w-0 max-[640px]:basis-full"
          id={`${fieldId}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="yourname@company.com"
          required
          value={email}
          onChange={(event) => {
            const value = event.target.value;
            setEmail(value);
            if (value.trim()) revealNote();
            resetStatus();
          }}
        />
        <label className="sr-only" htmlFor={`${fieldId}-company`}>
          Company
        </label>
        <input
          className="hidden"
          id={`${fieldId}-company`}
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => {
            setCompany(event.target.value);
            resetStatus();
          }}
        />
        <Primary
          className="max-[640px]:w-full max-[640px]:justify-center"
          type="submit"
          disabled={status === "sending"}
          loading={status === "sending"}
        >
          {status === "sending" ? "Sending..." : "Send"}
        </Primary>
      </div>
      <div
        ref={noteRef}
        className={`partner-note${showNote ? " is-open" : ""}`}
        inert={!showNote}
      >
        <div className="partner-note-panel" ref={notePanelRef}>
          <label className="sr-only" htmlFor={`${fieldId}-note`}>
            Note
          </label>
          <textarea
            className="min-h-24 w-full min-w-0 resize-none rounded-[10px] border-0 bg-surface-muted px-4 py-2.5 text-left text-base font-normal leading-[1.4] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            id={`${fieldId}-note`}
            name="note"
            rows={3}
            maxLength={1000}
            placeholder="Add a note (optional)"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              resetStatus();
            }}
          />
        </div>
      </div>
      {/* w-0 keeps the confirmation out of the form's fit-content width so the
          rows above keep a shared right edge. */}
      <p
        aria-live="polite"
        className="m-0 w-0 min-w-full text-pretty text-base text-muted empty:hidden"
        role="status"
      >
        {status === "sent"
          ? "Thanks! We received your note and emailed you a copy."
          : status === "error"
            ? "We couldn’t send that. Please try again."
            : ""}
      </p>
    </form>
  );
}
