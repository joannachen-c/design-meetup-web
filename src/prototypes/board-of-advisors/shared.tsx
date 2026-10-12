import type { ReactNode } from "react";

import {
  advisorAvatarClass,
  advisorFullName,
  advisorInitials,
  type Advisor,
} from "./advisors";

export const sectionHeadingClassName =
  "m-0 text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]";

export const sectionShellClassName =
  "board-advisors bg-surface px-[clamp(20px,6vw,96px)] py-[clamp(80px,10vw,160px)] text-black max-[820px]:py-[80px]";

type AvatarSize = "sm" | "md" | "lg";

const avatarSizeClassName: Record<AvatarSize, string> = {
  sm: "size-9 text-[11px] min-[821px]:size-10 min-[821px]:text-xs",
  md: "size-11 text-xs min-[821px]:size-12 min-[821px]:text-sm",
  lg: "size-14 text-sm min-[821px]:size-16 min-[821px]:text-base",
};

export function AdvisorAvatar({
  advisor,
  size = "md",
}: {
  advisor: Advisor;
  size?: AvatarSize;
}) {
  return (
    <span
      className={[
        advisorAvatarClass(advisor),
        avatarSizeClassName[size],
        "media-inset-edge-soft grid shrink-0 place-items-center rounded-full font-bold text-ink",
      ].join(" ")}
      aria-hidden="true"
    >
      {advisorInitials(advisor)}
    </span>
  );
}

export function AdvisorLink({
  advisor,
  children,
  className = "",
}: {
  advisor: Advisor;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={advisor.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${advisorFullName(advisor)}, ${advisor.title} at ${advisor.company}`}
    >
      {children}
    </a>
  );
}

export function AdvisorName({
  advisor,
  className = "text-base font-bold text-ink",
}: {
  advisor: Advisor;
  className?: string;
}) {
  return <span className={className}>{advisorFullName(advisor)}</span>;
}

export function AdvisorMeta({
  advisor,
  className = "text-sm text-muted",
}: {
  advisor: Advisor;
  className?: string;
}) {
  return (
    <span className={className}>
      {advisor.title}
      <span className="text-subtle"> · </span>
      {advisor.company}
    </span>
  );
}
