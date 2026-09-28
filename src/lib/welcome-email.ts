import { gmailConfigured, sendGmailEmails } from "./gmail-smtp";
import { siteEmail, siteName, siteUrl } from "./site";

const MUTED = "#6a7282";
const INK = "#191919";

export const welcomeSocialLinks = [
  {
    label: "Substack",
    href: "https://designmeetup.substack.com/",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${MUTED}" aria-hidden="true"><path d="M22.54 8.24H1.46V5.41h21.08v2.83Zm0-7.24H1.46v2.84h21.08V1Zm0 8.84H1.46V23L12 17.11 22.54 23V9.84Z"/></svg>`,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/designmeetup/",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="${MUTED}" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="${MUTED}" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1" fill="${MUTED}"/></svg>`,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/design-meetup/",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${MUTED}" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.94v5.666H9.351V8.997h3.414v1.561h.047c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.266 2.37 4.266 5.455v6.289ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.12 20.452H3.554V8.997H7.12v11.455Z"/></svg>`,
  },
  {
    label: "X",
    href: "https://x.com/designmeetuphq",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${MUTED}" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg>`,
  },
] as const;

export type WelcomeEmailInput = {
  email: string;
  firstName?: string | null;
  origin?: string;
};

export function buildWelcomeEmail(input: WelcomeEmailInput) {
  const origin = (input.origin || siteUrl).replace(/\/$/, "");
  const loginUrl = `${origin}/login`;
  const logoUrl = `${origin}/design-meetup-logo.png`;
  const firstName = (input.firstName || "").trim();
  const greeting = firstName ? `hi ${firstName.toLowerCase()} — ` : "";
  const text = [
    firstName ? `hi ${firstName.toLowerCase()},` : `hi,`,
    "",
    "thanks for creating a design meetup account. log in anytime to choose a membership and open the portal.",
    "",
    `View Account: ${loginUrl}`,
    "",
    siteName,
  ].join("\n");

  const socialRow = welcomeSocialLinks
    .map(
      (item) =>
        `<td style="padding:0 16px 0 0;vertical-align:middle;"><a href="${item.href}" style="display:inline-block;line-height:0;text-decoration:none;" aria-label="${item.label}">${item.svg}</a></td>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;color:${INK};font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;">
      <tr>
        <td align="left" style="padding:40px 32px 48px;">
          <img src="${logoUrl}" alt="${siteName}" width="48" height="48" style="display:block;border:0;outline:none;">
          <h1 style="margin:32px 0 16px;font-size:28px;line-height:1.1;letter-spacing:-0.04em;font-weight:700;color:${INK};">your account is ready.</h1>
          <p style="margin:0 0 28px;max-width:460px;font-size:16px;line-height:1.5;color:${INK};">${greeting}thanks for creating a design meetup account. log in anytime to choose a membership and open the portal.</p>
          <a href="${loginUrl}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;line-height:1;padding:14px 22px;border-radius:10px;">View Account</a>
          <div style="height:40px;line-height:40px;font-size:0;">&nbsp;</div>
          <div style="border-top:1px solid #ececec;font-size:0;line-height:0;">&nbsp;</div>
          <div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>${socialRow}</tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    to: input.email,
    replyTo: siteEmail,
    subject: "your design meetup account",
    text,
    html,
    loginUrl,
    logoUrl,
  };
}

export function buildGraduationUpgradeEmail(input: WelcomeEmailInput) {
  const origin = (input.origin || siteUrl).replace(/\/$/, "");
  const loginUrl = `${origin}/login`;
  const logoUrl = `${origin}/design-meetup-logo.png`;
  const firstName = (input.firstName || "").trim();
  const greeting = firstName ? `hi ${firstName.toLowerCase()} — ` : "";
  const text = [
    firstName ? `hi ${firstName.toLowerCase()},` : `hi,`,
    "",
    "your graduation date passed, so we moved you to the professional plan ($35 / month).",
    "",
    `View Account: ${loginUrl}`,
    "",
    siteName,
  ].join("\n");

  const socialRow = welcomeSocialLinks
    .map(
      (item) =>
        `<td style="padding:0 16px 0 0;vertical-align:middle;"><a href="${item.href}" style="display:inline-block;line-height:0;text-decoration:none;" aria-label="${item.label}">${item.svg}</a></td>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;color:${INK};font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;">
      <tr>
        <td align="left" style="padding:40px 32px 48px;">
          <img src="${logoUrl}" alt="${siteName}" width="48" height="48" style="display:block;border:0;outline:none;">
          <h1 style="margin:32px 0 16px;font-size:28px;line-height:1.1;letter-spacing:-0.04em;font-weight:700;color:${INK};">you're on professional now.</h1>
          <p style="margin:0 0 28px;max-width:460px;font-size:16px;line-height:1.5;color:${INK};">${greeting}your graduation date passed, so we moved you to the professional plan ($35 / month).</p>
          <a href="${loginUrl}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;line-height:1;padding:14px 22px;border-radius:10px;">View Account</a>
          <div style="height:40px;line-height:40px;font-size:0;">&nbsp;</div>
          <div style="border-top:1px solid #ececec;font-size:0;line-height:0;">&nbsp;</div>
          <div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>${socialRow}</tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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
