/**
 * Portal sign-in emails for the four organizers who see the Planning tab.
 * These are the addresses on the signup allowlist (portal accounts can only be
 * created from allowlisted emails), not the personal inboxes used for the
 * partner-inquiry Cc.
 */
export const ORGANIZER_EMAILS = [
  "studio@liumichelle.com", // Michelle Liu
  "michelletliu@g.ucla.edu", // Michelle Liu (alternate; not on the signup allowlist)
  "iy53@cornell.edu", // Ilyssa Yan
  "bl628@cornell.edu", // Brandon Lee
  "jc2887@cornell.edu", // Joanna Chen
] as const;

const organizerEmails = new Set<string>(ORGANIZER_EMAILS);

export const PLANNING_PIPELINE_URL =
  "https://design-meetup-pipeline-michelletlius-projects.vercel.app/";

export function isOrganizerEmail(email: string | null | undefined) {
  return organizerEmails.has((email || "").trim().toLowerCase());
}
