import { ImapFlow } from "imapflow";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { parsePartnerInquiryEmail } from "../src/lib/partner-inquiry-parse.ts";
import { siteEmail } from "../src/lib/site.ts";
import { inquiryTextFromRfc822 } from "./lib/inquiry-rfc822.mjs";

config({ path: ".env.local" });
config();

const IMAP_HOST = "imap.gmail.com";
const IMAP_PORT = 993;
const MAILBOXES = ["[Gmail]/All Mail", "INBOX"];

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

async function openMailbox(client) {
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

async function loadInquiriesFromGmail(user, password) {
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

    const inquiries = [];
    const seen = new Set();

    for await (const message of client.fetch(
      uids,
      { source: true, internalDate: true, uid: true },
      { uid: true },
    )) {
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

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!user || !password || user.toLowerCase() !== siteEmail) {
    console.error(
      "Missing GMAIL_USER / GMAIL_APP_PASSWORD in .env.local (GMAIL_USER must be contactdesignmeetup@gmail.com).",
    );
    process.exit(1);
  }

  if (!url || !serviceKey) {
    console.error(
      "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  console.log("Reading partner inquiries from Gmail…");
  const inquiries = await loadInquiriesFromGmail(user, password);
  console.log(`Found ${inquiries.length} unique inquiry email(s).`);

  if (dryRun || inquiries.length === 0) {
    if (dryRun) console.log("Dry run — no rows written.");
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let inserted = 0;
  let skipped = 0;

  for (const inquiry of inquiries) {
    const row = {
      submission_id: inquiry.submissionId,
      first_name: inquiry.firstName,
      last_name: inquiry.lastName,
      email: inquiry.email,
      interest: inquiry.interest,
      city: inquiry.city,
      created_at: inquiry.submittedAt ?? new Date().toISOString(),
    };
    const { error } = await supabase.from("partner_inquiries").insert(row);
    if (!error) {
      inserted += 1;
      continue;
    }
    if (error.code === "23505") {
      skipped += 1;
      continue;
    }
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  console.log(
    `Imported ${inserted} partner inquir${inserted === 1 ? "y" : "ies"} (${skipped} already present).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
