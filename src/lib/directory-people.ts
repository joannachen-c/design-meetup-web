/**
 * Server-only. Turns profiles into what each directory audience may see.
 * Every field a viewer gets is picked here, so nothing else leaks to the browser.
 */

import { boardOfAdvisorsEmails, isBoardOfAdvisorsEmail } from "./board-of-advisors.ts";
import { cohortForEmail, cohortJoinedAt } from "./cohort.ts";
import { directorySheetEmails } from "./comp-membership.ts";
import { approvedSignupEmails } from "./signup-allowlist.ts";
import { regionsForLocation, normalizeDisciplines, type MemberCard, type PendingMember, type TeamRow } from "./directory.ts";
import {
  displayNameFromEmail,
  profileDetailsComplete,
  socialHref,
  type MembershipStatus,
  type ProfileRecord,
  type Tier,
} from "./membership.ts";
import { memberSinceLabel } from "./slack-join-dates.ts";

type Row = {
  profile: ProfileRecord;
  membership: { tier: Tier; status: MembershipStatus };
};

/** "Product Designer at Figma", "Designer", "UCLA '27", or null. */
export function roleLine(profile: Pick<ProfileRecord, "position" | "company" | "school" | "year">) {
  const position = profile.position?.trim();
  const company = profile.company?.trim();
  if (position && company) return `${position} at ${company}`;
  if (position || company) return position || company || null;
  const school = profile.school?.trim();
  if (!school) return null;
  const year = profile.year?.match(/(\d{4})/)?.[1];
  return year ? `${school} '${year.slice(2)}` : school;
}

export function toMemberCard({ profile, membership }: Row): MemberCard {
  return {
    id: profile.id,
    name: profile.displayName?.trim() || displayNameFromEmail(profile.email),
    avatarUrl: profile.avatarUrl,
    tier: membership.tier,
    advisor: isBoardOfAdvisorsEmail(profile.email),
    role: roleLine(profile),
    school: profile.school?.trim() || null,
    location: profile.location?.trim() || null,
    regions: regionsForLocation(profile.location),
    disciplines: normalizeDisciplines(profile.disciplines),
    links: {
      website: socialHref("website", profile.website),
      instagram: socialHref("instagram", profile.instagram),
      x: socialHref("x", profile.x),
      linkedin: socialHref("linkedin", profile.linkedin),
      youtube: socialHref("youtube", profile.youtube),
      github: socialHref("github", profile.github),
    },
  };
}

/** `portalApproved`: approved from the portal or Sheets, which joins cohort 1 (see cohortForMember). */
export function toTeamRow(row: Row, slackJoinedAt: string | null, portalApproved = false): TeamRow {
  const email = row.profile.email.trim().toLowerCase();
  const cohort = cohortForEmail(email) ?? (portalApproved ? 1 : null);
  const joinedAt = cohortJoinedAt(cohort) ?? slackJoinedAt ?? row.profile.createdAt;
  return {
    ...toMemberCard(row),
    email,
    status: row.membership.status,
    cohort,
    joinedAt,
    memberSince: memberSinceLabel(joinedAt, row.profile.createdAt),
    profileComplete: profileDetailsComplete(row.profile),
  };
}

/** People we expect in the portal who have not made an account yet. */
export function pendingMembers(
  accountEmails: Iterable<string>,
  portalApprovedEmails: string[] = [],
): PendingMember[] {
  const signedUp = new Set([...accountEmails].map((email) => email.trim().toLowerCase()));
  const sources = new Map<string, string[]>();
  const add = (emails: string[], label: string) => {
    for (const raw of emails) {
      const email = raw.trim().toLowerCase();
      if (!email || signedUp.has(email) || email === "demo@designmeetup.info") continue;
      sources.set(email, [...(sources.get(email) ?? []), label]);
    }
  };
  add(boardOfAdvisorsEmails(), "Advisor");
  add(directorySheetEmails(), "Cohort 0");
  add([...approvedSignupEmails(), ...portalApprovedEmails], "Approved signup");
  return [...sources]
    .map(([email, labels]) => ({ email, sources: labels }))
    .sort((a, b) => a.email.localeCompare(b.email));
}
