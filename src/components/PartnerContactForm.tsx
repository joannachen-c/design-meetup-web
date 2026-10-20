"use client";

import { type FormEvent, useId, useState } from "react";
import { Input } from "./Input";
import { Primary } from "./Primary";
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

export function PartnerContactForm() {
  const fieldId = useId();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [interest, setInterest] = useState(interestOptions[0].value);
  const [city, setCity] = useState(cityOptions[0].value);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [company, setCompany] = useState("");
  const [submissionId, setSubmissionId] = useState(createSubmissionId);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const revealNote = () => {
    setShowNote(true);
  };

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
      {showNote ? (
        <div className="flex w-0 min-w-full flex-col gap-2">
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
      ) : null}
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
