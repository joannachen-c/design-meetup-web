import { createHash } from "node:crypto";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;

const INTEREST_ALIASES = {
  sponsor: "sponsor",
  "partnering on an event": "sponsor",
  "sponsoring one event": "sponsor",
  "sponsoring an event series": "sponsor",
  "sponsoring an event": "sponsor",
  panelist: "panelist",
  "speaking at an event": "panelist",
  "being a panelist": "panelist",
  judge: "judge",
  "judging a makeathon": "judge",
  venue: "venue",
  "providing a venue": "venue",
};

const CITY_ALIASES = {
  sf: "sf",
  "san francisco": "sf",
  nyc: "nyc",
  "new york": "nyc",
  "new york city": "nyc",
  la: "la",
  "los angeles": "la",
  any: "any",
  "any city": "any",
};

export type ParsedPartnerInquiry = {
  firstName: string;
  lastName: string;
  email: string;
  interest: (typeof INTEREST_ALIASES)[keyof typeof INTEREST_ALIASES];
  city: (typeof CITY_ALIASES)[keyof typeof CITY_ALIASES];
  submittedAt: string | null;
  submissionId: string;
};

function lookupAlias<T extends string>(
  value: string,
  aliases: Record<string, T>,
): T | null {
  return aliases[value.trim().toLowerCase()] ?? null;
}

function normalizeName(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length <= MAX_NAME_LENGTH ? normalized : "";
}

function normalizeEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length > MAX_EMAIL_LENGTH) return "";
  return EMAIL_PATTERN.test(normalized) ? normalized : "";
}

/** Stable UUID so re-importing the same Gmail message does not duplicate the row. */
export function historicalInquiryId(parts: {
  email: string;
  interest: string;
  city: string;
  firstName: string;
  lastName: string;
  submittedAt: string | null;
}) {
  const seed = [
    "design-meetup-partner-inquiry",
    parts.email,
    parts.interest,
    parts.city,
    parts.firstName,
    parts.lastName,
    parts.submittedAt ?? "",
  ].join("|");
  const hash = createHash("sha1").update(seed).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function parseSubmittedAt(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Parse the internal "New partner inquiry" notification the form emails
 * to Design Meetup. Visitor receipts and unrelated mail return null.
 */
export function parsePartnerInquiryEmail(
  text: string,
): ParsedPartnerInquiry | null {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
  const start = normalized.search(/^New partner inquiry\b/im);
  if (start === -1) return null;

  const fields: Record<string, string> = {};
  for (const line of normalized.slice(start).split("\n")) {
    const match = /^(Name|Email|Interest|City|Submitted):\s*(.*)$/i.exec(
      line.trim(),
    );
    if (!match) continue;
    fields[match[1].toLowerCase()] = match[2].trim();
  }

  const email = normalizeEmail(fields.email ?? "");
  const interest = fields.interest
    ? lookupAlias(fields.interest, INTEREST_ALIASES)
    : null;
  const city = fields.city ? lookupAlias(fields.city, CITY_ALIASES) : null;
  const name = normalizeName(fields.name ?? "");
  if (!email || !interest || !city || !name) return null;

  const space = name.indexOf(" ");
  const firstName = space === -1 ? name : name.slice(0, space);
  const lastName = space === -1 ? name : name.slice(space + 1);
  const submittedAt = parseSubmittedAt(fields.submitted);

  return {
    firstName,
    lastName,
    email,
    interest,
    city,
    submittedAt,
    submissionId: historicalInquiryId({
      email,
      interest,
      city,
      firstName,
      lastName,
      submittedAt,
    }),
  };
}
