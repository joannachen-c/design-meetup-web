"use client";

import { type FormEvent, useId, useState } from "react";
import { Input } from "./Input";
import { Primary } from "./Primary";

export function ApplyNotifyForm() {
  const fieldId = useId();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("sending");

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, company }),
      });
      setStatus(response.ok ? "sent" : "error");
      if (response.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p
        aria-live="polite"
        className="m-0 text-base text-muted"
        role="status"
      >
        We’ll email you when applications open.
      </p>
    );
  }

  return (
    <form
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor={`${fieldId}-email`}>
        Email address
      </label>
      <Input
        id={`${fieldId}-email`}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@email.com"
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (status === "error") setStatus("idle");
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
        onChange={(event) => setCompany(event.currentTarget.value)}
      />
      <Primary
        className="shrink-0"
        type="submit"
        disabled={status === "sending"}
        loading={status === "sending"}
      >
        {status === "sending" ? "Saving..." : "Notify me"}
      </Primary>
      <p
        aria-live="polite"
        className="col-span-full m-0 text-pretty text-base text-muted empty:hidden"
        role="status"
      >
        {status === "error" ? "We couldn’t save that. Please try again." : ""}
      </p>
    </form>
  );
}
