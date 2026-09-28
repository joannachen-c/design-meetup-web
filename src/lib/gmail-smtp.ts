import { randomBytes } from "node:crypto";
import dns from "node:dns";
import { resolve4 } from "node:dns/promises";
import net from "node:net";
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
const SMTP_STARTTLS_PORT = 587;
const EMAIL_IN_TEXT = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const SMTP_TIMEOUT_MS = 8000;

dns.setDefaultResultOrder("ipv4first");

export function gmailCredentials() {
  const rawUser = (process.env.GMAIL_USER || siteEmail).trim();
  const user =
    rawUser.match(EMAIL_IN_TEXT)?.[0]?.toLowerCase() || siteEmail.toLowerCase();
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "") || "";
  if (!password) return null;
  return { user, password };
}

export function gmailConfigured() {
  return Boolean(gmailCredentials());
}

export function gmailConfigStatus() {
  return {
    hasUser: Boolean(process.env.GMAIL_USER?.trim()),
    hasPassword: Boolean(process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "")),
    configured: gmailConfigured(),
  };
}

export async function sendGmailEmails(emails: GmailEmail[]) {
  const credentials = gmailCredentials();
  if (!credentials) {
    throw new Error("Gmail is not configured.");
  }

  const { user, password } = credentials;
  const client = await connectSmtp();

  try {
    await client.command(`EHLO ${siteName.replace(/\s+/g, "-").toLowerCase()}`);
    await client.command(
      `AUTH PLAIN ${Buffer.from(`\0${user}\0${password}`).toString("base64")}`,
      235,
    );

    for (const email of emails) {
      await client.command(`MAIL FROM:<${user}>`);
      await client.command(`RCPT TO:<${email.to}>`);
      await client.command("DATA", 354);
      await client.writeData(buildRawEmail(email, user));
    }

    await client.command("QUIT", 221);
  } finally {
    client.close();
  }
}

type SmtpTarget = {
  host: string;
  port: number;
  servername: string;
  family?: 4 | 6;
  starttls?: boolean;
};

async function connectSmtp() {
  const targets = await smtpTargets();
  let lastError: Error | undefined;

  for (const target of targets) {
    const client = new SmtpClient(target);
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("SMTP connection failed");
      client.close();
    }
  }

  throw lastError || new Error("SMTP connection failed");
}

async function smtpTargets() {
  let ipv4s: string[] = [];
  try {
    ipv4s = await resolve4(SMTP_HOST);
  } catch {
    ipv4s = [];
  }
  const ip = ipv4s[0];
  const targets: SmtpTarget[] = [];
  if (ip) {
    targets.push({
      host: ip,
      port: SMTP_PORT,
      servername: SMTP_HOST,
    });
    targets.push({
      host: ip,
      port: SMTP_STARTTLS_PORT,
      servername: SMTP_HOST,
      starttls: true,
    });
  }
  targets.push({
    host: SMTP_HOST,
    port: SMTP_PORT,
    servername: SMTP_HOST,
    family: 4,
  });
  targets.push({
    host: SMTP_HOST,
    port: SMTP_STARTTLS_PORT,
    servername: SMTP_HOST,
    family: 4,
    starttls: true,
  });
  return targets;
}

class SmtpClient {
  private socket: net.Socket | tls.TLSSocket | null = null;
  private buffer = "";
  private pending:
    | {
        resolve: (value: string) => void;
        reject: (error: Error) => void;
      }
    | null = null;

  private readonly target: SmtpTarget;

  constructor(target: SmtpTarget) {
    this.target = target;
  }

  async connect() {
    if (this.target.starttls) {
      await this.connectStartTls();
      return;
    }
    await this.connectImplicitTls();
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

  private connectImplicitTls() {
    return new Promise<void>((resolve, reject) => {
      const socket = tls.connect({
        host: this.target.host,
        port: this.target.port,
        servername: this.target.servername,
        ...(this.target.family ? { family: this.target.family } : {}),
      });
      this.bindSocket(socket);
      this.readResponse(220).then(resolve, reject);
    });
  }

  private async connectStartTls() {
    await new Promise<void>((resolve, reject) => {
      const socket = net.connect({
        host: this.target.host,
        port: this.target.port,
        ...(this.target.family ? { family: this.target.family } : {}),
      });
      this.bindSocket(socket);
      this.readResponse(220).then(resolve, reject);
    });

    await this.command(`EHLO ${siteName.replace(/\s+/g, "-").toLowerCase()}`);
    await this.command("STARTTLS", 220);

    const plain = this.socket;
    if (!plain) throw new Error("SMTP socket is not connected");
    plain.removeAllListeners("data");
    plain.removeAllListeners("error");
    plain.removeAllListeners("timeout");
    this.buffer = "";

    await new Promise<void>((resolve, reject) => {
      const secure = tls.connect(
        {
          socket: plain,
          servername: this.target.servername,
        },
        () => resolve(),
      );
      this.bindSocket(secure);
      secure.once("error", reject);
    });
  }

  private bindSocket(socket: net.Socket | tls.TLSSocket) {
    this.socket = socket;
    socket.setEncoding("utf8");
    socket.setTimeout(SMTP_TIMEOUT_MS);
    socket.removeAllListeners("data");
    socket.removeAllListeners("timeout");
    socket.on("data", (chunk) => this.handleData(String(chunk)));
    socket.on("error", (error) => {
      this.failPending(
        error instanceof Error ? error : new Error(String(error)),
      );
    });
    socket.on("timeout", () => {
      this.failPending(new Error("SMTP connection timed out"));
    });
  }

  private write(value: string) {
    if (!this.socket) throw new Error("SMTP socket is not connected");
    this.socket.write(value);
  }

  private failPending(error: Error) {
    if (!this.pending) return;
    const pending = this.pending;
    this.pending = null;
    pending.reject(error);
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

export function buildRawEmail(email: GmailEmail, fromAddress = siteEmail) {
  const headers = [
    `From: ${siteName} <${fromAddress}>`,
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
