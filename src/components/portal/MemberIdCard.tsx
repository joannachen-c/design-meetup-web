"use client";

import Link from "next/link";
import { useState } from "react";
import {
  InstagramIcon,
  LinkedInIcon,
  WebsiteIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/portal/SocialIcons";
import { socialHref, type ProfileSocialLinks } from "@/lib/membership";

export type MemberIdCardProps = {
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  school?: string | null;
  year?: string | null;
  company?: string | null;
  position?: string | null;
  website?: string | null;
  instagram?: string | null;
  x?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  tierLabel?: string | null;
  memberSince?: string | null;
};

function PersonSilhouette() {
  return (
    <svg
      className="member-id-photo-person"
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
    >
      <circle cx="28" cy="20" r="10" fill="currentColor" />
      <path
        d="M8 48c2.5-10.5 10-16 20-16s17.5 5.5 20 16"
        fill="currentColor"
      />
    </svg>
  );
}

const SOCIAL_META: Array<{
  key: keyof ProfileSocialLinks;
  label: string;
  Icon: (props: { className?: string }) => React.ReactNode;
}> = [
  { key: "website", label: "website", Icon: WebsiteIcon },
  { key: "instagram", label: "instagram", Icon: InstagramIcon },
  { key: "x", label: "x", Icon: XIcon },
  { key: "linkedin", label: "linkedin", Icon: LinkedInIcon },
  { key: "youtube", label: "youtube", Icon: YouTubeIcon },
];

export function MemberIdCard({
  displayName,
  email,
  avatarUrl = null,
  school = null,
  year = null,
  company = null,
  position = null,
  website = null,
  instagram = null,
  x = null,
  linkedin = null,
  youtube = null,
  tierLabel = null,
  memberSince = null,
}: MemberIdCardProps) {
  const [flipped, setFlipped] = useState(false);

  const detailRows = [
    school ? { label: "school", value: school } : null,
    year ? { label: "year", value: year } : null,
    company ? { label: "company", value: company } : null,
    position ? { label: "position", value: position } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const socials = SOCIAL_META.map((item) => {
    const value = { website, instagram, x, linkedin, youtube }[item.key];
    const href = socialHref(item.key, value);
    return href ? { ...item, href } : null;
  }).filter(Boolean) as Array<{
    key: keyof ProfileSocialLinks;
    label: string;
    href: string;
    Icon: (props: { className?: string }) => React.ReactNode;
  }>;

  return (
    <div className="member-id-scene">
      <button
        type="button"
        className={["member-id-card", flipped ? "is-flipped" : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => setFlipped((value) => !value)}
        aria-label={
          flipped
            ? "Flip member ID card to front"
            : "Flip member ID card to back"
        }
      >
        <div className="member-id-face member-id-front">
          <div className="member-id-front-grid">
            <div className="member-id-photo-wrap">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="member-id-photo"
                  width={112}
                  height={112}
                />
              ) : (
                <Link
                  href="/portal/profile"
                  className="member-id-photo-empty"
                  onClick={(event) => event.stopPropagation()}
                >
                  <PersonSilhouette />
                  <span>add photo</span>
                </Link>
              )}
            </div>
            <div className="member-id-front-copy">
              <p className="member-id-kicker">member id</p>
              <h2 className="member-id-name">{displayName}</h2>
              <p className="member-id-email">{email}</p>
              {tierLabel ? (
                <p className="member-id-tier">{tierLabel} plan</p>
              ) : null}
              {detailRows.length > 0 ? (
                <dl className="member-id-meta">
                  {detailRows.map((row) => (
                    <div key={row.label} className="member-id-meta-row">
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="member-id-hint">
                  <Link
                    href="/portal/profile"
                    onClick={(event) => event.stopPropagation()}
                  >
                    complete your profile
                  </Link>
                </p>
              )}
              {socials.length > 0 ? (
                <div className="member-id-socials">
                  {socials.map(({ key, label, href, Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="member-id-social"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="member-id-stamp" aria-hidden>
            <img src="/design-meetup-stamp.png" alt="" width={96} height={96} />
          </div>
        </div>

        <div
          className="member-id-face member-id-back"
          aria-hidden={flipped ? undefined : true}
        >
          <div className="member-id-back-pattern" />
          <div className="member-id-back-content">
            <img
              className="member-id-back-logo"
              src="/design-meetup-stamp.png"
              alt=""
              width={72}
              height={72}
            />
            <p className="member-id-back-title">design meetup</p>
            <p className="member-id-back-sub">
              a space for the world&apos;s most ambitious creatives.
            </p>
            <div className="member-id-back-chip">
              <span>{tierLabel || "guest"}</span>
              <span>{memberSince || "join the crew"}</span>
            </div>
            {socials.length > 0 ? (
              <div className="member-id-socials member-id-socials-back">
                {socials.map(({ key, label, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="member-id-social"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            ) : null}
            <div className="member-id-barcode" aria-hidden>
              {Array.from({ length: 28 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    width: index % 5 === 0 ? 3 : 1.5,
                    opacity: index % 3 === 0 ? 0.35 : 0.85,
                  }}
                />
              ))}
            </div>
            <p className="member-id-back-footer">nyc · sf · la</p>
          </div>
        </div>
      </button>
    </div>
  );
}
