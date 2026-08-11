# Partner contact email delivery

## Goal

Replace the partner form's `mailto:` handoff with automatic server-side email
delivery. A successful submission gives Design Meetup an actionable inquiry and
gives the visitor a copy of their responses without opening an email client.

## Delivery

The browser sends a JSON `POST` request to `/api/contact` containing:

- `interest`: `panelist`, `judge`, `sponsor-one`, or `sponsor-series`
- `city`: `sf`, `nyc`, `la`, or `any`
- `email`: the visitor's valid email address
- `company`: an empty honeypot field
- `submissionId`: a client-generated UUID reused when retrying an unchanged
  submission

The route validates and normalizes the payload before performing any external
work. It then sends two emails through Resend:

1. **Internal notification**
   - To: `contactdesignmeetup@gmail.com`
   - From: `CONTACT_FROM_EMAIL`
   - Reply-To: the visitor's email
   - Content: interest, city, visitor email, and submission time
2. **Visitor receipt**
   - To: the visitor's email
   - From: `CONTACT_FROM_EMAIL`
   - Reply-To: `contactdesignmeetup@gmail.com`
   - Content: a concise thank-you and a copy of their interest, city, and email

Both messages are submitted through Resend's batch endpoint with an idempotency
key derived from `submissionId`. The route returns success only after the batch
is accepted. Retrying the same payload within Resend's 24-hour idempotency window
returns the original response instead of sending duplicate messages. Changing
any form value creates a new submission ID. The route does not expose provider
response details to the client.

## Sender identity and configuration

`CONTACT_FROM_EMAIL` uses a Resend-verified Design Meetup domain, for example:

```text
Design Meetup <hello@designmeetup.example>
```

The exact domain is deployment configuration, not source code. Required
server-only environment variables:

```text
RESEND_API_KEY=re_...
CONTACT_FROM_EMAIL=Design Meetup <hello@verified-domain.example>
```

The recipient remains the existing `siteEmail` value,
`contactdesignmeetup@gmail.com`, so there is one source of truth.

The API key and sender identity are configured in local `.env.local` and Vercel
project environment variables. The existing GitHub Actions workflow pulls the
Vercel environment before building and does not need duplicate email secrets.
These variables are never prefixed with `NEXT_PUBLIC_` or serialized to the
browser.

## Form behavior

Submitting no longer navigates to a `mailto:` URL.

- While sending, the primary button displays `Sending…`, is disabled, and blocks
  duplicate submissions.
- On success, the form preserves the selected values and displays:
  `Thanks — we received your note and emailed you a copy.`
- On failure, the form preserves all values and displays:
  `We couldn’t send that. Please try again.`
- Changing a value after success clears the stale success message.
- The status region remains `aria-live="polite"` and adjacent to the form.

## Abuse and validation

- Interest and city are strict allowlists; labels are derived on the server.
- Email is trimmed, syntax-checked, and length-limited.
- Submission IDs must be valid UUIDs and are used only for idempotency.
- The request body has a small maximum accepted size.
- A visually hidden `company` field catches basic bots. A non-empty honeypot
  receives a generic successful response without sending email.
- The route returns `400` for invalid input, `500` for missing server
  configuration, and `502` for provider failure.
- Provider errors are logged server-side without logging the API key or full
  request payload.
- CAPTCHA and persistent per-IP rate limiting are intentionally out of scope for
  this first version. They can be added if production traffic shows abuse.

## Components and boundaries

- `PartnerContactForm` owns form state, request state, and user-facing status.
- `app/api/contact/route.ts` owns HTTP parsing, response codes, and orchestration.
- A small server-only mail module owns validation labels and the two Resend
  payloads so message content can be tested independently of HTTP.
- Resend is instantiated only on the server.

## Testing

Tests cover:

- accepted values produce both correctly addressed messages
- the two messages use one idempotent batch request
- an unchanged client retry reuses its submission ID; changing a value replaces
  it
- internal mail uses visitor `Reply-To`
- visitor receipt uses Design Meetup `Reply-To`
- invalid interest, city, or email does not call Resend
- honeypot submissions do not call Resend
- missing configuration and provider errors return safe failures
- the client posts the selected values instead of using `mailto:`
- the button enters and exits loading state, blocks duplicate submit, and
  preserves values on failure
- success and failure copy uses the existing live status region

The full Node test suite, TypeScript check, and production build are run before
completion. A local end-to-end request can verify validation and client states;
actual inbox delivery requires the configured Resend account and verified
domain.
