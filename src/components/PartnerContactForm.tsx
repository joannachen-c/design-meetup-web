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
  const [company, setCompany] = useState("");
  const [submissionId, setSubmissionId] = useState(createSubmissionId);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

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
      className="partner-form flex w-fit max-w-full flex-col gap-3 text-base leading-[1.2] text-body"
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
            setFirstName(event.target.value);
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
            setLastName(event.target.value);
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
            setEmail(event.target.value);
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
      {/* w-0 keeps the confirmation out of the form's fit-content width so the
          rows above keep a shared right edge. */}
      <p
        aria-live="polite"
        className="m-0 w-0 min-w-full text-pretty text-base text-muted empty:hidden"
        role="status"
      >
        {status === "sent"
          ? "Thanks — we received your note and emailed you a copy."
          : status === "error"
            ? "We couldn’t send that. Please try again."
            : ""}
      </p>
    </form>
  );
}
