"use client";

import { type FormEvent, useId, useState } from "react";
import { Input } from "../Input";
import { Primary } from "../Primary";
import { Select, type SelectOption } from "../Select";

const roleOptions: SelectOption[] = [
  { value: "senior", label: "a Senior Product Designer" },
  { value: "staff", label: "a Staff or Principal Designer" },
  { value: "engineer", label: "a Design Engineer" },
  { value: "lead", label: "a Design Lead or Manager" },
  { value: "head", label: "a Head of Design" },
  { value: "founding", label: "a Founding Designer" },
];

const cityOptions: SelectOption[] = [
  { value: "nyc", label: "New York" },
  { value: "sf", label: "San Francisco" },
  { value: "la", label: "Los Angeles" },
  { value: "any", label: "any city" },
];

const formatOptions: SelectOption[] = [
  { value: "network", label: "the Network" },
  { value: "dinner", label: "a Hiring Dinner" },
  { value: "both", label: "both, or not sure yet" },
];

// Organization and note are packed into the contact note, which the API caps
// at 1000 characters, so the two inputs together have to stay under it.
const MAX_ORGANIZATION_LENGTH = 120;
const MAX_NOTE_LENGTH = 700;

function labelFor(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function buildTalentNote({
  organization,
  role,
  format,
  note,
}: {
  organization: string;
  role: string;
  format: string;
  note: string;
}) {
  return [
    `Company: ${organization.trim()}`,
    `Hiring: ${labelFor(roleOptions, role)}`,
    `Format: ${labelFor(formatOptions, format)}`,
    note.trim() ? `Message: ${note.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function TalentContactForm() {
  const fieldId = useId();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState(roleOptions[0].value);
  const [city, setCity] = useState(cityOptions[0].value);
  const [format, setFormat] = useState(formatOptions[0].value);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState("");
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const resetStatus = () => {
    if (status === "idle") return;
    setStatus("idle");
    setSubmissionId(crypto.randomUUID());
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
          interest: "talent",
          city,
          email,
          note: buildTalentNote({ organization, role, format, note }),
          company,
          submissionId,
        }),
      });
      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const row = "flex w-full flex-wrap items-center gap-x-3 gap-y-3";

  return (
    <form
      className="flex w-full flex-col gap-3 text-base leading-[1.2] text-ink"
      onSubmit={handleSubmit}
    >
      <div className={row}>
        <span>I’m</span>
        <label className="sr-only" htmlFor={`${fieldId}-first-name`}>
          First name
        </label>
        <Input
          className="min-w-[7rem] grow basis-[7rem]"
          id={`${fieldId}-first-name`}
          name="first-name"
          autoComplete="given-name"
          placeholder="First"
          required
          maxLength={80}
          value={firstName}
          onChange={(event) => {
            setFirstName(event.target.value);
            resetStatus();
          }}
        />
        <label className="sr-only" htmlFor={`${fieldId}-last-name`}>
          Last name
        </label>
        <Input
          className="min-w-[7rem] grow basis-[7rem]"
          id={`${fieldId}-last-name`}
          name="last-name"
          autoComplete="family-name"
          placeholder="Last"
          required
          maxLength={80}
          value={lastName}
          onChange={(event) => {
            setLastName(event.target.value);
            resetStatus();
          }}
        />
      </div>
      <div className={row}>
        <span>from</span>
        <label className="sr-only" htmlFor={`${fieldId}-organization`}>
          Company
        </label>
        <Input
          className="min-w-[10rem] grow basis-[10rem]"
          id={`${fieldId}-organization`}
          name="organization"
          autoComplete="organization"
          placeholder="Company"
          required
          maxLength={MAX_ORGANIZATION_LENGTH}
          value={organization}
          onChange={(event) => {
            setOrganization(event.target.value);
            resetStatus();
          }}
        />
      </div>
      <div className={row}>
        <span>We’re hiring</span>
        <label className="sr-only" htmlFor={`${fieldId}-role`}>
          Role you’re hiring for
        </label>
        <Select
          id={`${fieldId}-role`}
          name="role"
          options={roleOptions}
          value={role}
          onValueChange={(next) => {
            setRole(next);
            resetStatus();
          }}
        />
        <span>in</span>
        <label className="sr-only" htmlFor={`${fieldId}-city`}>
          City
        </label>
        <Select
          id={`${fieldId}-city`}
          name="city"
          options={cityOptions}
          value={city}
          onValueChange={(next) => {
            setCity(next);
            resetStatus();
          }}
        />
      </div>
      <div className={row}>
        <span>We’d like to try</span>
        <label className="sr-only" htmlFor={`${fieldId}-format`}>
          Format
        </label>
        <Select
          id={`${fieldId}-format`}
          name="format"
          options={formatOptions}
          value={format}
          onValueChange={(next) => {
            setFormat(next);
            resetStatus();
          }}
        />
      </div>
      <label className="sr-only" htmlFor={`${fieldId}-note`}>
        Anything else
      </label>
      <textarea
        className="min-h-24 w-full min-w-0 resize-none rounded-[10px] border-0 bg-surface-muted px-4 py-2.5 text-left text-base font-normal leading-[1.4] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        id={`${fieldId}-note`}
        name="note"
        rows={3}
        maxLength={MAX_NOTE_LENGTH}
        placeholder="Team size, timing, links to the roles (optional)"
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          resetStatus();
        }}
      />
      <div className={row}>
        <span>Reach me at</span>
        <label className="sr-only" htmlFor={`${fieldId}-email`}>
          Work email
        </label>
        <Input
          className="min-w-[12rem] grow basis-[12rem] max-[640px]:min-w-0 max-[640px]:basis-full"
          id={`${fieldId}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          maxLength={254}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            resetStatus();
          }}
        />
        <input
          className="hidden"
          aria-hidden="true"
          id={`${fieldId}-company`}
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
        <Primary
          className="max-[640px]:w-full max-[640px]:justify-center"
          type="submit"
          disabled={status === "sending"}
          loading={status === "sending"}
        >
          {status === "sending" ? "Sending..." : "Get matched"}
        </Primary>
      </div>
      <p
        aria-live="polite"
        className="m-0 text-pretty text-base text-muted empty:hidden"
        role="status"
      >
        {status === "sent"
          ? "Thanks! We got your role and emailed you a copy. We’ll be in touch soon."
          : status === "error"
            ? "We couldn’t send that. Please try again."
            : ""}
      </p>
    </form>
  );
}
