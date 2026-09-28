import { randomBytes } from "node:crypto";
import tls from "node:tls";
import { siteEmail, siteName } from "./site";

export type GmailEmail = {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465;

export function gmailConfigured() {
  const user = process.env.GMAIL_USER?.trim();
  const password = process.env.GMAIL_APP_PASSWORD;
  return Boolean(user && password && user.toLowerCase() === siteEmail);
}

export async function sendGmailEmails(emails: GmailEmail[]) {
  const user = process.env.GMAIL_USER?.trim();
  const password = process.env.GMAIL_APP_PASSWORD;
  if (!user || !password || user.toLowerCase() !== siteEmail) {
    throw new Error("Gmail is not configured.");
  }

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

export function buildRawEmail(email: GmailEmail) {
  const headers = [
    `From: ${siteName} <${siteEmail}>`,
    `To: ${email.to}`,
    email.replyTo ? `Reply-To: ${email.replyTo}` : null,
    `Subject: ${encodeHeader(email.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
  ].filter((line): line is string => Boolean(line));

  if (!email.html) {
    const body = Buffer.from(email.text, "utf8").toString("base64");
    headers.push(
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
    );
    return `${headers.join("\r\n")}\r\n\r\n${chunkBase64(body)}`;
  }

  const boundary = `dm_${randomBytes(12).toString("hex")}`;
  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  const textPart = [
    `Content-Type: text/plain; charset=UTF-8`,
    "Content-Transfer-Encoding: base64",
    "",
    chunkBase64(Buffer.from(email.text, "utf8").toString("base64")),
  ].join("\r\n");
  const htmlPart = [
    `Content-Type: text/html; charset=UTF-8`,
    "Content-Transfer-Encoding: base64",
    "",
    chunkBase64(Buffer.from(email.html, "utf8").toString("base64")),
  ].join("\r\n");

  return [
    headers.join("\r\n"),
    "",
    `--${boundary}`,
    textPart,
    `--${boundary}`,
    htmlPart,
    `--${boundary}--`,
  ].join("\r\n");
}

function encodeHeader(value: string) {
  return /^[\x00-\x7F]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function chunkBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
}
