"use client";

import { type FormEvent, useId, useState } from "react";
import { Input } from "./Input";
import { Primary } from "./Primary";

const SUBSTACK_SUBSCRIBE_URL =
  "https://designmeetup.substack.com/api/v1/free?nojs=true";

export function NewsletterForm() {
  const frameName = useId().replace(/:/g, "");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const trimmed = email.trim();
    if (!trimmed) {
      event.preventDefault();
      return;
    }

    const form = event.currentTarget;
    const firstUrl = form.elements.namedItem("first_url");
    const firstReferrer = form.elements.namedItem("first_referrer");
    if (firstUrl instanceof HTMLInputElement) {
      firstUrl.value = window.location.href;
    }
    if (firstReferrer instanceof HTMLInputElement) {
      firstReferrer.value = document.referrer;
    }

    // Defer success UI so the browser can finish the native iframe POST.
    window.setTimeout(() => {
      setSubscribed(true);
      setEmail("");
    }, 0);
  };

  if (subscribed) {
    return (
      <p
        aria-live="polite"
        className="m-0 text-base text-muted"
        role="status"
      >
        Thank you for signing up!
      </p>
    );
  }

  return (
    <>
      <iframe
        name={frameName}
        title="Substack newsletter signup"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden="true"
      />
      <form
        className="newsletter-form grid grid-cols-[minmax(0,1fr)_auto] gap-2"
        action={SUBSTACK_SUBSCRIBE_URL}
        method="post"
        target={frameName}
        acceptCharset="UTF-8"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="source" value="embed" />
        <input type="hidden" name="first_url" value="" />
        <input type="hidden" name="first_referrer" value="" />
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email here"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Primary type="submit">Subscribe</Primary>
      </form>
    </>
  );
}
