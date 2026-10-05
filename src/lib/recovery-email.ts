export const RECOVERY_EMAIL_SUBJECT = "Choose a new Design Meetup password";

export const RECOVERY_RESET_URL =
  "https://designmeetup.info/reset-password?token_hash={{ .TokenHash }}&type=recovery";

const INK = "#191919";
const HOME = "https://designmeetup.info";
const LOGO = `${HOME}/design-meetup-logo.png`;

const SOCIALS = [
  ["Substack", "https://designmeetup.substack.com/", `${HOME}/email/substack.png`],
  ["Instagram", "https://www.instagram.com/designmeetup/", `${HOME}/email/instagram.png`],
  ["LinkedIn", "https://www.linkedin.com/company/design-meetup/", `${HOME}/email/linkedin.png`],
  ["X", "https://x.com/designmeetuphq", `${HOME}/email/x.png`],
] as const;

/** Go template pasted into Supabase → Authentication → Email Templates → Reset password. */
export function supabaseRecoveryEmailHtml() {
  const socialRow = SOCIALS.map(
    ([label, href, icon]) =>
      `<td style="padding:0 16px 0 0;vertical-align:middle;"><a href="${href}" style="display:inline-block;line-height:0;text-decoration:none;" aria-label="${label}"><img src="${icon}" alt="${label}" width="20" height="20" style="display:block;border:0;outline:none;"></a></td>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;color:${INK};font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
      <tr>
        <td align="left" style="padding:40px 32px 48px;">
          <a href="${HOME}" style="display:inline-block;line-height:0;text-decoration:none;">
            <img src="${LOGO}" alt="Design Meetup" width="48" height="48" style="display:block;border:0;outline:none;border-radius:50%;">
          </a>
          <h1 style="margin:32px 0 16px;font-size:28px;line-height:1.1;letter-spacing:-0.04em;font-weight:700;color:${INK};">${RECOVERY_EMAIL_SUBJECT}</h1>
          <p style="margin:0 0 16px;max-width:460px;font-size:16px;line-height:1.5;color:${INK};">This is a password reset for your Design Meetup account. Click below to choose a new password.</p>
          <p style="margin:0 0 28px;max-width:460px;font-size:16px;line-height:1.5;color:${INK};">If you didn't ask for this, you can ignore this email.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td bgcolor="${INK}" style="background:${INK};border-radius:10px;">
                <a href="${RECOVERY_RESET_URL}" target="_blank" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;line-height:1;padding:14px 22px;border-radius:10px;">Reset Password</a>
              </td>
            </tr>
          </table>
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
</html>
`;
}
