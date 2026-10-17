import type { Advisor } from "@/lib/advisor-directory";

export type { Advisor };

export function advisorFullName(advisor: Advisor) {
  return `${advisor.firstName} ${advisor.lastName}`;
}

export function advisorInitials(advisor: Advisor) {
  return `${advisor.firstName[0]}${advisor.lastName[0]}`.toUpperCase();
}

const avatarPalette = [
  "bg-[#e8edf5]",
  "bg-[#f0ebe3]",
  "bg-[#e5f0ea]",
  "bg-[#f3e8ee]",
  "bg-[#ebe8f5]",
  "bg-surface-muted",
] as const;

export function advisorAvatarClass(advisor: Advisor) {
  const hash =
    advisor.firstName.charCodeAt(0) * 31 + advisor.lastName.charCodeAt(0);
  return avatarPalette[hash % avatarPalette.length];
}
