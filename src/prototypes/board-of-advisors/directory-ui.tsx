"use client";

import type { ReactNode } from "react";

import { LinkedInIcon, XIcon } from "@/components/icons/SocialIcons";
import { Tooltip, TooltipProvider } from "@/components/Tooltip";

import { useAdvisors } from "./AdvisorsProvider";
import { advisorAvatarClass, advisorFullName, advisorInitials, type Advisor } from "./advisors";

export const monoLabelClassName = "font-mono text-[11px] uppercase tracking-[0.08em]";
export const monoCellClassName = "font-mono text-xs leading-[1.5] text-muted";

export const polaroidFrameClassName =
  "rounded-[4px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.08)]";

export const polaroidPaddingClassName = "p-[clamp(6px,0.7vw,10px)]";

export function Portrait({ advisor, className }: { advisor: Advisor; className: string }) {
  if (advisor.photoUrl) {
    return <img
        src={advisor.photoUrl}
        alt=""
        decoding="async"
        className={`${className} bg-surface-muted object-cover grayscale`}
      />;
  }
  return (
    <span
      className={`${className} ${advisorAvatarClass(advisor)} relative grid place-items-center font-bold text-ink`}
      aria-hidden="true"
    >
      {advisorInitials(advisor)}
    </span>
  );
}

export const clearFiltersButtonClassName = `${monoLabelClassName} cursor-pointer rounded-[6px] border-0 bg-transparent px-1.5 py-1 text-ink no-underline hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink`;

export function AdvisorEmptyState() {
  const { clearFilters } = useAdvisors();
  return (
    <div className="grid justify-items-start gap-3 py-10">
      <p className="m-0 text-base font-bold text-ink">No advisors match those filters.</p>
      <button type="button" className={`${clearFiltersButtonClassName} -ml-1.5`} onClick={clearFilters}>
        Clear
      </button>
    </div>
  );
}

export function advisorLocationLabel(advisor: Advisor) {
  return advisor.locations.join(" / ");
}

function GlobeIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2 8h12M8 2c1.6 1.7 2.4 3.7 2.4 6S9.6 12.3 8 14C6.4 12.3 5.6 10.3 5.6 8S6.4 3.7 8 2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SocialLinks({ advisor, className = "" }: { advisor: Advisor; className?: string }) {
  const name = advisorFullName(advisor);
  const links: { href: string; label: string; tooltip: string; icon: ReactNode }[] = [];
  if (advisor.linkedinUrl) {
    links.push({
      href: advisor.linkedinUrl,
      label: `${name} on LinkedIn`,
      tooltip: "LinkedIn",
      icon: <LinkedInIcon className="size-3.5" />,
    });
  }
  if (advisor.xUrl) {
    links.push({
      href: advisor.xUrl,
      label: `${name} on X`,
      tooltip: "X",
      icon: <XIcon className="size-3.5" />,
    });
  }
  if (advisor.websiteUrl) {
    links.push({
      href: advisor.websiteUrl,
      label: `${name}'s website`,
      tooltip: "Website",
      icon: <GlobeIcon className="size-4" />,
    });
  }

  if (links.length === 0) return null;

  return (
    <TooltipProvider>
      <span className={`relative z-[2] flex items-center gap-1 ${className}`}>
        {links.map((link) => (
          <Tooltip key={link.href} content={link.tooltip}>
            <a
              className="grid size-7 place-items-center rounded-full text-muted no-underline transition-colors duration-150 ease-out hover:bg-gray-200/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              onClick={(event) => event.stopPropagation()}
            >
              {link.icon}
            </a>
          </Tooltip>
        ))}
      </span>
    </TooltipProvider>
  );
}
