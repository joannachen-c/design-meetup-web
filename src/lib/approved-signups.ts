/** Parsing for the "approve members" form and the Google Sheets sync. No server imports, so tests can load it. */

export type ApprovedSignup = { email: string; addedBy: string | null; createdAt: string };

const EMAIL_PATTERN = /^[^\s@,;<>()]+@[^\s@,;<>()]+\.[^\s@,;<>()]+$/;

export const MAX_APPROVALS_PER_REQUEST = 500;

/** Splits pasted text on commas, semicolons and whitespace; strips "mailto:" and <angle brackets>. */
export function parseApprovalEmails(raw: unknown) {
  const items = Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === "string")
    : typeof raw === "string"
      ? [raw]
      : [];
  const valid = new Set<string>();
  const invalid = new Set<string>();
  for (const token of items.join("\n").split(/[\s,;]+/)) {
    const email = token
      .trim()
      .replace(/^mailto:/i, "")
      .replace(/^<|>$/g, "")
      .toLowerCase();
    if (!email) continue;
    if (EMAIL_PATTERN.test(email)) valid.add(email);
    else invalid.add(token.trim());
  }
  return { valid: [...valid], invalid: [...invalid] };
}
