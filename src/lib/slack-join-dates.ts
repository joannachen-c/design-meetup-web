export type SlackJoinDate = {
  email: string;
  slackUserId: string | null;
  joinedAt: string;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMemberSince(date: Date) {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Slack join date when we have one, otherwise when the portal account was made. */
export function memberSinceLabel(
  slackJoinedAt: string | null | undefined,
  profileCreatedAt: string | null | undefined,
) {
  for (const value of [slackJoinedAt, profileCreatedAt]) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return formatMemberSince(date);
  }
  return null;
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

// Slack's member analytics export labels these a little differently by plan.
const EMAIL_HEADERS = [/^e-?mail( address)?$/i, /e-?mail/i];
const JOINED_HEADERS = [
  /^account created/i,
  /^date joined/i,
  /^joined/i,
  /^claimed date/i,
  /created/i,
];
const USER_ID_HEADERS = [/^user ?id$/i];

function findColumn(headers: string[], patterns: RegExp[]) {
  for (const pattern of patterns) {
    const index = headers.findIndex((header) => pattern.test(header.trim()));
    if (index !== -1) return index;
  }
  return -1;
}

function toIsoDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withZone = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)
    ? `${trimmed.replace(" ", "T")}Z`
    : trimmed;
  const time = Date.parse(withZone);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

/** Parse the CSV from Slack admin → Analytics → Members → Export. */
export function joinDatesFromSlackCsv(text: string): SlackJoinDate[] {
  const [headers = [], ...rows] = parseCsv(text);
  const emailIndex = findColumn(headers, EMAIL_HEADERS);
  const joinedIndex = findColumn(headers, JOINED_HEADERS);
  if (joinedIndex === -1 && headers.includes("expiration-timestamp")) {
    throw new Error(
      "This is the Manage members export, which has no join dates. In Slack, export Analytics → Members instead (it has an \"Account created\" column).",
    );
  }
  if (emailIndex === -1 || joinedIndex === -1) {
    throw new Error(
      `Could not find an email column and a join-date column in the CSV. Headers: ${headers.join(", ")}`,
    );
  }
  const userIdIndex = findColumn(headers, USER_ID_HEADERS);

  const records: SlackJoinDate[] = [];
  for (const cells of rows) {
    const email = (cells[emailIndex] || "").trim().toLowerCase();
    const joinedAt = toIsoDate(cells[joinedIndex] || "");
    if (!email.includes("@") || !joinedAt) continue;
    records.push({
      email,
      slackUserId:
        userIdIndex === -1 ? null : cells[userIdIndex]?.trim() || null,
      joinedAt,
    });
  }
  return earliestByEmail(records);
}

type SlackMessage = { subtype?: string; user?: string; ts?: string };

/**
 * Everyone lands in the workspace's default channel when they join, so the
 * first `channel_join` message per person there is their Slack join date.
 */
export function joinDatesFromChannelJoins(
  messages: SlackMessage[],
  emailsByUserId: Map<string, string>,
): SlackJoinDate[] {
  const records: SlackJoinDate[] = [];
  for (const message of messages) {
    if (message.subtype !== "channel_join" || !message.user || !message.ts) {
      continue;
    }
    const email = emailsByUserId.get(message.user);
    const seconds = Number(message.ts);
    if (!email || !Number.isFinite(seconds)) continue;
    records.push({
      email: email.trim().toLowerCase(),
      slackUserId: message.user,
      joinedAt: new Date(seconds * 1000).toISOString(),
    });
  }
  return earliestByEmail(records);
}

export function earliestByEmail(records: SlackJoinDate[]) {
  const byEmail = new Map<string, SlackJoinDate>();
  for (const record of records) {
    const current = byEmail.get(record.email);
    if (!current || Date.parse(record.joinedAt) < Date.parse(current.joinedAt)) {
      byEmail.set(record.email, {
        ...record,
        slackUserId: record.slackUserId ?? current?.slackUserId ?? null,
      });
    }
  }
  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}
