import { ImapFlow } from "imapflow";
import { createClient } from "@supabase/supabase-js";
import { siteEmail } from "./site.ts";
import { inquiryTextFromRfc822 } from "./inquiry-rfc822.ts";
import { parsePartnerInquiryEmail } from "./partner-inquiry-parse.ts";

const IMAP_HOST = "imap.gmail.com";
const IMAP_PORT = 993;
const MAILBOXES = ["[Gmail]/All Mail", "INBOX"] as const;

export type PartnerInquiryImportResult = {
  found: number;
  inserted: number;
  skipped: number;
};

export function partnerInquiryRow(
  inquiry: NonNullable<ReturnType<typeof parsePartnerInquiryEmail>>,
) {
  return {
    submission_id: inquiry.submissionId,
    first_name: inquiry.firstName,
    last_name: inquiry.lastName,
    email: inquiry.email,
    interest: inquiry.interest,
    city: inquiry.city,
    created_at: inquiry.submittedAt ?? new Date().toISOString(),
  };
}

export function classifyInsertError(error: { code?: string } | null) {
  if (!error) return "ok" as const;
  if (error.code === "23505") return "duplicate" as const;
  return "failed" as const;
}

async function openMailbox(client: ImapFlow) {
  for (const mailbox of MAILBOXES) {
    try {
      return await client.getMailboxLock(mailbox, { readOnly: true });
    } catch {
      // Try the next well-known Gmail mailbox.
    }
  }
  throw new Error(
    'Could not open "[Gmail]/All Mail" or INBOX. Enable IMAP in Gmail settings.',
  );
}

async function loadInquiriesFromGmail(user: string, password: string) {
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user, pass: password.replace(/\s+/g, "") },
    logger: false,
  });

  await client.connect();
  const lock = await openMailbox(client);

  try {
    const uids =
      (await client.search({ body: "New partner inquiry" }, { uid: true })) ||
      [];
    if (uids.length === 0) return [];

    const inquiries: NonNullable<
      ReturnType<typeof parsePartnerInquiryEmail>
    >[] = [];
    const seen = new Set<string>();

    for await (const message of client.fetch(
      uids,
      { source: true, internalDate: true, uid: true },
      { uid: true },
    )) {
      if (!message.source) continue;
      const text = inquiryTextFromRfc822(message.source);
      if (!text) continue;
      const parsed = parsePartnerInquiryEmail(text);
      if (!parsed || seen.has(parsed.submissionId)) continue;
      if (!parsed.submittedAt && message.internalDate) {
        parsed.submittedAt = new Date(message.internalDate).toISOString();
      }
      seen.add(parsed.submissionId);
      inquiries.push(parsed);
    }

    return inquiries;
  } finally {
    lock.release();
    await client.logout();
  }
}

function gmailCredentials() {
  const user = (process.env.GMAIL_USER || siteEmail).trim().toLowerCase();
  const password = process.env.GMAIL_APP_PASSWORD;
  if (!password || user !== siteEmail) {
    throw new Error("Gmail import credentials are not configured.");
  }
  return { user, password };
}

function createWriteClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase import credentials are not configured.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Read Sponsor Us notification mail from Gmail and insert unique rows.
 * GMAIL_APP_PASSWORD is a Vercel Sensitive env var — this must run on Vercel.
 */
export async function importPartnerInquiriesFromGmail(options?: {
  dryRun?: boolean;
}): Promise<PartnerInquiryImportResult> {
  const { user, password } = gmailCredentials();
  const inquiries = await loadInquiriesFromGmail(user, password);
  const found = inquiries.length;

  if (options?.dryRun || found === 0) {
    return { found, inserted: 0, skipped: 0 };
  }

  const supabase = createWriteClient();
  let inserted = 0;
  let skipped = 0;

  for (const inquiry of inquiries) {
    const { error } = await supabase
      .from("partner_inquiries")
      .insert(partnerInquiryRow(inquiry));
    const outcome = classifyInsertError(error);
    if (outcome === "ok") {
      inserted += 1;
      continue;
    }
    if (outcome === "duplicate") {
      skipped += 1;
      continue;
    }
    throw new Error("Partner inquiry insert failed.");
  }

  return { found, inserted, skipped };
}
