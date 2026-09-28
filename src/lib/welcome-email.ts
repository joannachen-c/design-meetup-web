import { gmailConfigured, sendGmailEmails } from "./gmail-smtp";
import { siteEmail, siteName, siteUrl } from "./site";

const INK = "#191919";
const PUBLIC_HOME_URL = "https://www.designmeetup.info";

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

function emailChrome(input: {
  origin: string;
  heading: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
}) {
  const homeUrl = PUBLIC_HOME_URL;
  const logoUrl = `${input.origin}/design-meetup-logo.png`;
  const socialRow = welcomeSocialLinks
    .map(
      (item) =>
        `<td style="padding:0 16px 0 0;vertical-align:middle;"><a href="${item.href}" style="display:inline-block;line-height:0;text-decoration:none;" aria-label="${item.label}"><img src="${input.origin}/email/${item.icon}" alt="${item.label}" width="20" height="20" style="display:block;border:0;outline:none;"></a></td>`,
    )
    .join("");
  const body = input.paragraphs
    .map((paragraph, index) => {
      const margin = index === input.paragraphs.length - 1 ? "0 0 28px" : "0 0 16px";
      return `<p style="margin:${margin};max-width:460px;font-size:16px;line-height:1.5;color:${INK};">${paragraph}</p>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;color:${INK};font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
      <tr>
        <td align="left" style="padding:40px 32px 48px;">
          <a href="${homeUrl}" style="display:inline-block;line-height:0;text-decoration:none;">
            <img src="${logoUrl}" alt="${siteName}" width="48" height="48" style="display:block;border:0;outline:none;border-radius:50%;">
          </a>
          <h1 style="margin:32px 0 16px;font-size:28px;line-height:1.1;letter-spacing:-0.04em;font-weight:700;color:${INK};">${input.heading}</h1>
          ${body}
          <a href="${input.ctaUrl}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;line-height:1;padding:14px 22px;border-radius:10px;">${input.ctaLabel}</a>
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
  const greeting = firstName ? `hi ${firstName.toLowerCase()},` : "hi,";
  const paragraphs = [
    greeting,
    "thanks for creating a design meetup account! we're so excited to have you as part of the community.",
    "log in anytime to view your membership.",
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
    heading: "your account is ready.",
    paragraphs,
    ctaLabel: "View Account",
    ctaUrl: loginUrl,
  });

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
    paragraphs,
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
