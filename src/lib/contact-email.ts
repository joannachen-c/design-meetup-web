import { gmailConfigured, sendGmailEmails } from "@/lib/gmail-smtp";
import { siteEmail, siteName } from "@/lib/site";

export const contactInterestOptions = {
  sponsor: {
    label: "partnering on an event",
    subject: "Partnering on an event",
  },
  panelist: {
    label: "speaking at an event",
    subject: "Speaking at an event",
  },
  judge: {
    label: "judging a makeathon",
    subject: "Judging a makeathon",
  },
  venue: {
    label: "providing a venue",
    subject: "Providing a venue",
  },
  advisor: {
    label: "joining the Board of Advisors",
    subject: "Joining the Board of Advisors",
  },
} as const;

export const contactCityOptions = {
  sf: "San Francisco",
  nyc: "New York",
  la: "Los Angeles",
  any: "any city",
} as const;

type ContactInterest = keyof typeof contactInterestOptions;
type ContactCity = keyof typeof contactCityOptions;

export type ContactSubmission = {
  firstName: string;
  lastName: string;
  interest: ContactInterest[];
  city: ContactCity;
  email: string;
  submissionId: string;
};

const CONTACT_INTEREST_KEYS = Object.keys(
  contactInterestOptions,
) as ContactInterest[];

/** Normalize one or many interest values into option order; reject empties/unknowns. */
export function normalizeContactInterests(
  value: unknown,
): ContactInterest[] | null {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : null;
  if (!raw || raw.length === 0) return null;
  const unique = new Set<string>();
  for (const entry of raw) {
    if (typeof entry !== "string" || !(entry in contactInterestOptions)) {
      return null;
    }
    unique.add(entry);
  }
  if (unique.size === 0) return null;
  return CONTACT_INTEREST_KEYS.filter((key) => unique.has(key));
}

export function formatInterestLabels(interests: ContactInterest[]) {
  return interests.map((key) => contactInterestOptions[key].label).join(", ");
}

export function formatInterestSubjects(interests: ContactInterest[]) {
  return interests.map((key) => contactInterestOptions[key].subject).join(" + ");
}

export function serializeInterests(interests: ContactInterest[]) {
  return interests.join(",");
}


type ContactEmail = {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;

export function validateContactSubmission(
  payload: unknown,
): ContactSubmission | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const firstName = normalizeName(record.firstName);
  const lastName = normalizeName(record.lastName);
  const email = normalizeEmail(record.email);
  const interest = normalizeContactInterests(record.interest);
  const city = record.city;
  const submissionId = record.submissionId;

  if (!firstName || !lastName || !email) return null;
  if (!interest) {
    return null;
  }
  if (typeof city !== "string" || !(city in contactCityOptions)) {
    return null;
  }
  if (typeof submissionId !== "string" || !isUuid(submissionId)) {
    return null;
  }

  return {
    firstName,
    lastName,
    interest,
    city: city as ContactCity,
    email,
    submissionId,
  };
}

export function buildContactEmailBatch(
  submission: ContactSubmission,
): ContactEmail[] {
  const interestLabel = formatInterestLabels(submission.interest);
  const city = contactCityOptions[submission.city];
  const fullName = `${submission.firstName} ${submission.lastName}`;
  const subject = `${siteName} — ${formatInterestSubjects(submission.interest)}`;
  const internalText = [
    "New partner inquiry",
    "",
    `Name: ${fullName}`,
    `Email: ${submission.email}`,
    `Interest: ${interestLabel}`,
    `City: ${city}`,
    `Submitted: ${new Date().toISOString()}`,
  ].join("\n");
  const receiptText = [
    `Hi ${submission.firstName},`,
    "",
    "Thanks so much for reaching out to Design Meetup! We’re excited to learn more about what you have in mind and will get back to you soon.",
    "",
    "Your request:",
    `Interest: ${interestLabel}`,
    `City: ${city}`,
    `Email: ${submission.email}`,
    "",
    "Warmly,",
    "Design Meetup",
  ].join("\n");

  return [
    {
      to: siteEmail,
      replyTo: submission.email,
      subject,
      text: internalText,
    },
    {
      to: submission.email,
      replyTo: siteEmail,
      subject: `We received your ${siteName} note`,
      text: receiptText,
    },
  ];
}

export async function sendContactEmails(submission: ContactSubmission) {
  if (!gmailConfigured()) {
    return { ok: false, status: 500 } as const;
  }

  try {
    await sendGmailEmails(buildContactEmailBatch(submission));
  } catch (error) {
    console.error("Contact email provider failed", {
      error: error instanceof Error ? error.message : "Unknown SMTP error",
      submissionId: submission.submissionId,
    });
    return { ok: false, status: 502 } as const;
  }

  return { ok: true, status: 200 } as const;
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length <= MAX_NAME_LENGTH ? normalized : "";
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase();
  if (normalized.length > MAX_EMAIL_LENGTH) return "";
  return EMAIL_PATTERN.test(normalized) ? normalized : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
