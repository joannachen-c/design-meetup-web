import { gmailConfigured, sendGmailEmails } from "./gmail-smtp";
import { siteEmail, siteName, siteUrl } from "./site";

const INK = "#191919";
const PUBLIC_HOME_URL = "https://www.designmeetup.info";
export const CALENDAR_URL = `${PUBLIC_HOME_URL}/#calendar`;

export const welcomeSocialLinks = [
  {
    label: "Substack",
    href: "https://designmeetup.substack.com/",
    icon: "substack.png",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/designmeetup/",
    icon: "instagram.png",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/design-meetup/",
    icon: "linkedin.png",
  },
  {
    label: "X",
    href: "https://x.com/designmeetuphq",
    icon: "x.png",
  },
] as const;

export type WelcomeEmailInput = {
  email: string;
  firstName?: string | null;
  origin?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paragraph(html: string, margin = "0 0 16px") {
  return `<p style="margin:${margin};max-width:460px;font-size:16px;line-height:1.5;color:${INK};">${html}</p>`;
}

function paragraphsToHtml(paragraphs: string[]) {
  return paragraphs
    .map((item, index) =>
      paragraph(
        escapeHtml(item),
        index === paragraphs.length - 1 ? "0 0 28px" : "0 0 16px",
      ),
    )
    .join("");
}

function ctaButton(label: string, url: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td bgcolor="${INK}" style="background:${INK};border-radius:10px;">
          <a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;line-height:1;padding:14px 22px;border-radius:10px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

function emailChrome(input: {
  origin: string;
  heading?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  closingHtml?: string;
}) {
  const homeUrl = PUBLIC_HOME_URL;
  const logoUrl = `${input.origin}/design-meetup-logo.png`;
  const socialRow = welcomeSocialLinks
    .map(
      (item) =>
        `<td style="padding:0 16px 0 0;vertical-align:middle;"><a href="${escapeHtml(item.href)}" style="display:inline-block;line-height:0;text-decoration:none;" aria-label="${escapeHtml(item.label)}"><img src="${escapeHtml(`${input.origin}/email/${item.icon}`)}" alt="${escapeHtml(item.label)}" width="20" height="20" style="display:block;border:0;outline:none;"></a></td>`,
    )
    .join("");
  const heading = input.heading
    ? `<h1 style="margin:32px 0 16px;font-size:28px;line-height:1.1;letter-spacing:-0.04em;font-weight:700;color:${INK};">${escapeHtml(input.heading)}</h1>`
    : `<div style="height:32px;line-height:32px;font-size:0;">&nbsp;</div>`;
  const cta =
    input.ctaLabel && input.ctaUrl
      ? ctaButton(input.ctaLabel, input.ctaUrl)
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;color:${INK};font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
      <tr>
        <td align="left" style="padding:40px 32px 48px;">
          <a href="${homeUrl}" style="display:inline-block;line-height:0;text-decoration:none;">
            <img src="${logoUrl}" alt="${siteName}" width="48" height="48" style="display:block;border:0;outline:none;border-radius:50%;">
          </a>
          ${heading}
          ${input.bodyHtml}
          ${cta}
          ${input.closingHtml || ""}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:40px;">
            <tr>
              <td style="border-top:1px solid #ececec;font-size:0;line-height:0;height:1px;">&nbsp;</td>
            </tr>
          </table>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
            <tr>${socialRow}</tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, logoUrl, homeUrl };
}

export function buildWelcomeEmail(input: WelcomeEmailInput) {
  const origin = (input.origin || siteUrl).replace(/\/$/, "");
  const loginUrl = `${origin}/login`;
  const firstName = (input.firstName || "").trim();
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const calendarLink = `<a href="${CALENDAR_URL}" style="color:${INK};text-decoration:underline;">here</a>`;
  const bodyHtml = [
    paragraph(escapeHtml(greeting)),
    paragraph(
      "Your Design Meetup account is officially set up. Welcome to the community!",
    ),
    paragraph("You can now:", "0 0 8px"),
    `<ul style="margin:0 0 16px;padding:0 0 0 22px;max-width:460px;font-size:16px;line-height:1.5;color:${INK};">
      <li style="margin:0 0 8px;">Connect with designers in the Slack community</li>
      <li style="margin:0;">Get early and guaranteed access to our events</li>
    </ul>`,
    paragraph(`Take a look at what's coming up in NYC/SF/LA ${calendarLink}.`, "0 0 28px"),
  ].join("");
  const closingHtml = [
    paragraph("&lt;3,", "28px 0 4px"),
    paragraph("Design Meetup", "0 0 8px"),
  ].join("");
  const text = [
    greeting,
    "",
    "Your Design Meetup account is officially set up. Welcome to the community!",
    "",
    "You can now:",
    "- Connect with designers in the Slack community",
    "- Get early and guaranteed access to our events",
    "",
    "Take a look at what's coming up in NYC/SF/LA here.",
    CALENDAR_URL,
    "",
    `View Account: ${loginUrl}`,
    "",
    "<3,",
    "Design Meetup",
  ].join("\n");
  const { html, logoUrl } = emailChrome({
    origin,
    bodyHtml,
    ctaLabel: "View Account",
    ctaUrl: loginUrl,
    closingHtml,
  });

  return {
    to: input.email,
    replyTo: siteEmail,
    subject: "Welcome to Design Meetup",
    text,
    html,
    calendarUrl: CALENDAR_URL,
    logoUrl,
  };
}

export function buildGraduationUpgradeEmail(input: WelcomeEmailInput) {
  const origin = (input.origin || siteUrl).replace(/\/$/, "");
  const loginUrl = `${origin}/login`;
  const firstName = (input.firstName || "").trim();
  const greeting = firstName ? `hi ${firstName.toLowerCase()},` : "hi,";
  const paragraphs = [
    greeting,
    "your graduation date passed, so we moved you to the professional plan ($35 / month).",
  ];
  const text = [
    ...paragraphs,
    "",
    `View Account: ${loginUrl}`,
    "",
    siteName,
  ].join("\n\n");
  const { html, logoUrl } = emailChrome({
    origin,
    heading: "you're on professional now.",
    bodyHtml: paragraphsToHtml(paragraphs),
    ctaLabel: "View Account",
    ctaUrl: loginUrl,
  });

  return {
    to: input.email,
    replyTo: siteEmail,
    subject: "your design meetup plan",
    text,
    html,
    loginUrl,
    logoUrl,
  };
}

async function sendBuiltEmail(
  email: {
    to: string;
    replyTo: string;
    subject: string;
    text: string;
    html: string;
  },
  skipped: string,
  failed: string,
) {
  if (!gmailConfigured()) {
    console.warn(skipped);
    return { ok: false as const };
  }

  try {
    await sendGmailEmails([
      {
        to: email.to,
        replyTo: email.replyTo,
        subject: email.subject,
        text: email.text,
        html: email.html,
      },
    ]);
    return { ok: true as const };
  } catch (error) {
    console.error(failed, {
      error: error instanceof Error ? error.message : "Unknown SMTP error",
      email: email.to,
    });
    return { ok: false as const };
  }
}

export async function sendWelcomeEmail(input: WelcomeEmailInput) {
  return sendBuiltEmail(
    buildWelcomeEmail(input),
    "welcome email skipped: Gmail is not configured",
    "welcome email failed",
  );
}

export async function sendGraduationUpgradeEmail(input: WelcomeEmailInput) {
  return sendBuiltEmail(
    buildGraduationUpgradeEmail(input),
    "graduation upgrade email skipped: Gmail is not configured",
    "graduation upgrade email failed",
  );
}

export type PasswordResetEmailInput = {
  email: string;
  resetUrl: string;
  origin?: string;
};

export function buildPasswordResetEmail(input: PasswordResetEmailInput) {
  const origin = (input.origin || siteUrl).replace(/\/$/, "");
  const paragraphs = [
    "hi,",
    "we got a request to reset your design meetup password. click below to choose a new one.",
    "if you didn't ask for this, you can ignore this email.",
  ];
  const text = [
    ...paragraphs,
    "",
    `Reset Password: ${input.resetUrl}`,
    "",
    siteName,
  ].join("\n\n");
  const { html, logoUrl } = emailChrome({
    origin,
    heading: "reset your password.",
    bodyHtml: paragraphsToHtml(paragraphs),
    ctaLabel: "Reset Password",
    ctaUrl: input.resetUrl,
  });

  return {
    to: input.email,
    replyTo: siteEmail,
    subject: "reset your design meetup password",
    text,
    html,
    resetUrl: input.resetUrl,
    logoUrl,
  };
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  return sendBuiltEmail(
    buildPasswordResetEmail(input),
    "password reset email skipped: Gmail is not configured",
    "password reset email failed",
  );
}
