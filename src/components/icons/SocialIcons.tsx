import type { SVGProps } from "react";

type SocialIconProps = SVGProps<SVGSVGElement>;

export function SubstackIcon({
  className = "size-[18px]",
  ...props
}: SocialIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M22.54 8.24H1.46V5.41h21.08v2.83Zm0-7.24H1.46v2.84h21.08V1Zm0 8.84H1.46V23L12 17.11 22.54 23V9.84Z" />
    </svg>
  );
}

export function InstagramIcon({
  className = "size-5",
  ...props
}: SocialIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function XIcon({
  className = "size-[18px]",
  ...props
}: SocialIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function LinkedInIcon({
  className = "size-5",
  ...props
}: SocialIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.94v5.666H9.351V8.997h3.414v1.561h.047c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.266 2.37 4.266 5.455v6.289ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.12 20.452H3.554V8.997H7.12v11.455Z" />
    </svg>
  );
}
