"use client";

import { type FormEvent, useId, useState } from "react";
import { Input } from "./Input";
import { Primary } from "./Primary";
import { Select, type SelectOption } from "./Select";

const CONTACT_EMAIL = "contactdesignmeetup@gmail.com";

const interestOptions = [
  {
    value: "sponsor",
    label: "sponsoring an event",
    subject: "Sponsoring an event",
  },
  { value: "panelist", label: "being a panelist", subject: "Being a panelist" },
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
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedInterest =
      interestOptions.find((option) => option.value === interest) ??
      interestOptions[0];
    const selectedCity =
      cityOptions.find((option) => option.value === city) ?? cityOptions[0];
    const subject = `Design Meetup — ${selectedInterest.subject}`;
    const fullName = `${firstName} ${lastName}`.trim();
    const body = `Hi Design Meetup,\n\nMy name is ${fullName}.\nI'm interested in ${selectedInterest.label} in ${selectedCity.label}.\n\nReach me at ${email}.`;

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form
      className="partner-form flex w-fit max-w-full flex-col gap-3 text-base leading-[1.2] text-body max-[820px]:gap-6"
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
            setSent(false);
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
            setSent(false);
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
            setSent(false);
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
            setSent(false);
          }}
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-3">
        <span>Reach me at</span>
        <label className="sr-only" htmlFor={`${fieldId}-email`}>
          Email address
        </label>
        <Input
          className="min-w-[12rem] grow basis-[12rem]"
          id={`${fieldId}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="yourname@company.com"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSent(false);
          }}
        />
        <Primary type="submit">Send</Primary>
      </div>
      {/* w-0 keeps the confirmation out of the form's fit-content width so the
          rows above keep a shared right edge. */}
      <p
        aria-live="polite"
        className="m-0 w-0 min-w-full text-pretty text-base text-muted empty:hidden"
        role="status"
      >
        {sent
          ? "Thanks — an email draft is ready in your mail app. Send it and we’ll reply soon."
          : ""}
      </p>
    </form>
  );
}
