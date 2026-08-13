import tls from "node:tls";
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
  interest: ContactInterest;
  city: ContactCity;
  email: string;
  submissionId: string;
};

type ContactEmail = {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465;

export function validateContactSubmission(
  payload: unknown,
): ContactSubmission | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const firstName = normalizeName(record.firstName);
  const lastName = normalizeName(record.lastName);
  const email = normalizeEmail(record.email);
  const interest = record.interest;
  const city = record.city;
  const submissionId = record.submissionId;

  if (!firstName || !lastName || !email) return null;
  if (typeof interest !== "string" || !(interest in contactInterestOptions)) {
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
    interest: interest as ContactInterest,
    city: city as ContactCity,
    email,
    submissionId,
  };
}

export function buildContactEmailBatch(
  submission: ContactSubmission,
): ContactEmail[] {
  const interest = contactInterestOptions[submission.interest];
  const city = contactCityOptions[submission.city];
  const fullName = `${submission.firstName} ${submission.lastName}`;
  const subject = `${siteName} — ${interest.subject}`;
  const internalText = [
    "New partner inquiry",
    "",
    `Name: ${fullName}`,
    `Email: ${submission.email}`,
    `Interest: ${interest.label}`,
    `City: ${city}`,
    `Submitted: ${new Date().toISOString()}`,
  ].join("\n");
  const receiptText = [
    `Hi ${submission.firstName},`,
    "",
    "Thanks so much for reaching out to Design Meetup! We’re excited to learn more about what you have in mind and will get back to you soon.",
    "",
    "Your request:",
    `Interest: ${interest.label}`,
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
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;

  if (!user || !password || user.toLowerCase() !== siteEmail) {
    return { ok: false, status: 500 } as const;
  }

  try {
    await sendWithGmailSmtp(user, password, buildContactEmailBatch(submission));
  } catch (error) {
    console.error("Contact email provider failed", {
      error: error instanceof Error ? error.message : "Unknown SMTP error",
      submissionId: submission.submissionId,
    });
    return { ok: false, status: 502 } as const;
  }

  return { ok: true, status: 200 } as const;
}

async function sendWithGmailSmtp(
  user: string,
  password: string,
  emails: ContactEmail[],
) {
  const client = new SmtpClient(SMTP_HOST, SMTP_PORT);

  try {
    await client.connect();
    await client.command(`EHLO ${siteName.replace(/\s+/g, "-").toLowerCase()}`);
    await client.command(
      `AUTH PLAIN ${Buffer.from(`\0${user}\0${password.replace(/\s+/g, "")}`).toString("base64")}`,
      235,
    );

    for (const email of emails) {
      await client.command(`MAIL FROM:<${siteEmail}>`);
      await client.command(`RCPT TO:<${email.to}>`);
      await client.command("DATA", 354);
      await client.writeData(buildRawEmail(email));
    }

    await client.command("QUIT", 221);
  } finally {
    client.close();
  }
}

class SmtpClient {
  private socket: tls.TLSSocket | null = null;
  private buffer = "";
  private pending:
    | {
        resolve: (value: string) => void;
        reject: (error: Error) => void;
      }
    | null = null;

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {}

  connect() {
    return new Promise<void>((resolve, reject) => {
      const socket = tls.connect(
        { host: this.host, port: this.port, servername: this.host },
        () => {
          this.socket = socket;
        },
      );

      socket.setEncoding("utf8");
      socket.setTimeout(15000);
      socket.on("data", (chunk) => this.handleData(String(chunk)));
      socket.on("error", reject);
      socket.on("timeout", () => reject(new Error("SMTP connection timed out")));

      this.readResponse(220).then(() => resolve(), reject);
    });
  }

  async command(command: string, expectedCode: number | number[] = 250) {
    this.write(`${command}\r\n`);
    return this.readResponse(expectedCode);
  }

  async writeData(message: string) {
    this.write(`${message}\r\n.\r\n`);
    return this.readResponse(250);
  }

  close() {
    this.socket?.destroy();
    this.socket = null;
  }

  private write(value: string) {
    if (!this.socket) throw new Error("SMTP socket is not connected");
    this.socket.write(value);
  }

  private readResponse(expectedCode: number | number[]) {
    const expected = Array.isArray(expectedCode)
      ? expectedCode
      : [expectedCode];

    return new Promise<string>((resolve, reject) => {
      this.pending = {
        resolve: (response) => {
          const code = Number(response.slice(0, 3));

          if (!expected.includes(code)) {
            reject(new Error(`Unexpected SMTP response: ${response}`));
            return;
          }

          resolve(response);
        },
        reject,
      };
      this.flushResponse();
    });
  }

  private handleData(chunk: string) {
    this.buffer += chunk;
    this.flushResponse();
  }

  private flushResponse() {
    if (!this.pending) return;

    const lines = this.buffer.split(/\r?\n/);
    const completeIndex = lines.findIndex((line) => /^\d{3} /.test(line));

    if (completeIndex === -1) return;

    const response = lines.slice(0, completeIndex + 1).join("\n");
    this.buffer = lines.slice(completeIndex + 1).join("\n");
    const pending = this.pending;
    this.pending = null;
    pending.resolve(response);
  }
}

function buildRawEmail(email: ContactEmail) {
  const body = Buffer.from(email.text, "utf8").toString("base64");
  const headers = [
    `From: ${siteName} <${siteEmail}>`,
    `To: ${email.to}`,
    `Reply-To: ${email.replyTo}`,
    `Subject: ${encodeHeader(email.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];

  return `${headers.join("\r\n")}\r\n\r\n${chunkBase64(body)}`;
}

function encodeHeader(value: string) {
  return /^[\x00-\x7F]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function chunkBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
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
