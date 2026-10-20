import assert from "node:assert/strict";
import test from "node:test";
import { buildRawEmail, envelopeRecipients } from "../src/lib/gmail-smtp.ts";
import { partnerInquiryCc } from "../src/lib/partner-inquiry-cc.ts";

const inquiry = {
  to: "contactdesignmeetup@gmail.com",
  cc: partnerInquiryCc,
  replyTo: "guest@example.com",
  subject: "Design Meetup — Partnering on an event",
  text: "New partner inquiry",
};

test("partner inquiries copy the founders and directors", () => {
  assert.deepEqual(
    partnerInquiryCc.map((mailbox) => [mailbox.name, mailbox.email]),
    [
      ["Brandon Lee", "brandon.lee1357@gmail.com"],
      ["Ilyssa Yan", "iy53@cornell.edu"],
      ["Joanna Chen", "joannachen876@gmail.com"],
      ["Michelle Liu", "studio@liumichelle.com"],
    ],
  );
});

test("the inquiry envelope delivers to the inbox and each Cc", () => {
  assert.deepEqual(envelopeRecipients(inquiry), [
    "contactdesignmeetup@gmail.com",
    "brandon.lee1357@gmail.com",
    "iy53@cornell.edu",
    "joannachen876@gmail.com",
    "studio@liumichelle.com",
  ]);
});

test("a repeated Cc address is only one SMTP recipient", () => {
  assert.deepEqual(
    envelopeRecipients({
      to: "contactdesignmeetup@gmail.com",
      cc: [{ email: "ContactDesignMeetup@gmail.com" }],
      subject: "Again",
      text: "Again",
    }),
    ["contactdesignmeetup@gmail.com"],
  );
});

test("the raw inquiry message lists the team on Cc and keeps Reply-To", () => {
  const raw = buildRawEmail(inquiry);
  assert.match(
    raw,
    /^Cc: Brandon Lee <brandon\.lee1357@gmail\.com>, Ilyssa Yan <iy53@cornell\.edu>, Joanna Chen <joannachen876@gmail\.com>, Michelle Liu <studio@liumichelle\.com>\r\n/m,
  );
  assert.match(raw, /^To: contactdesignmeetup@gmail\.com\r\n/m);
  assert.match(raw, /^Reply-To: guest@example\.com\r\n/m);
});

test("messages without a Cc omit the header", () => {
  const raw = buildRawEmail({
    to: "guest@example.com",
    replyTo: "contactdesignmeetup@gmail.com",
    subject: "We received your Design Meetup note",
    text: "Thanks",
  });
  assert.doesNotMatch(raw, /^Cc:/m);
  assert.deepEqual(envelopeRecipients({
    to: "guest@example.com",
    subject: "We received your Design Meetup note",
    text: "Thanks",
  }), ["guest@example.com"]);
});

test("mailbox headers reject injected recipients", () => {
  assert.throws(
    () =>
      envelopeRecipients({
        to: "guest@example.com\r\nBcc: other@example.com",
        subject: "Nope",
        text: "Nope",
      }),
    /Invalid email recipient/,
  );
});
