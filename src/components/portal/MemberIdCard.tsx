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
import styles from "./MemberIdCard.module.css";

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
      className={styles["member-id-photo-person"]}
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

function MetalTexture() {
  return (
    <svg
      className={styles["member-id-metal"]}
      viewBox="0 0 420 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="memberMetalSheen" cx="68%" cy="42%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      {Array.from({ length: 46 }, (_, index) => {
        const r = 8 + index * 7;
        return (
          <circle
            key={r}
            cx="292"
            cy="108"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.085)"
            strokeWidth={index % 3 === 0 ? 1.1 : 0.55}
          />
        );
      })}
      <rect
        width="420"
        height="260"
        fill="url(#memberMetalSheen)"
        opacity="0.9"
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
    <div className={styles["member-id-scene"]}>
      <button
        type="button"
        className={[
          styles["member-id-card"],
          flipped ? styles["is-flipped"] : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => setFlipped((value) => !value)}
        aria-label={
          flipped
            ? "Flip member ID card to front"
            : "Flip member ID card to back"
        }
      >
        <div
          className={`${styles["member-id-face"]} ${styles["member-id-front"]}`}
        >
          <MetalTexture />
          <div className={styles["member-id-front-grid"]}>
            <div className={styles["member-id-photo-wrap"]}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className={styles["member-id-photo"]}
                  width={112}
                  height={112}
                />
              ) : (
                <Link
                  href="/portal/profile"
                  className={styles["member-id-photo-empty"]}
                  onClick={(event) => event.stopPropagation()}
                >
                  <PersonSilhouette />
                  <span>add photo</span>
                </Link>
              )}
            </div>
            <div className={styles["member-id-front-copy"]}>
              <p className={styles["member-id-kicker"]}>member id</p>
              <h2 className={styles["member-id-name"]}>{displayName}</h2>
              <p className={styles["member-id-email"]}>{email}</p>
              {tierLabel ? (
                <p className={styles["member-id-tier"]}>{tierLabel} plan</p>
              ) : null}
              {detailRows.length > 0 ? (
                <dl className={styles["member-id-meta"]}>
                  {detailRows.map((row) => (
                    <div
                      key={row.label}
                      className={styles["member-id-meta-row"]}
                    >
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className={styles["member-id-hint"]}>
                  <Link
                    href="/portal/profile"
                    onClick={(event) => event.stopPropagation()}
                  >
                    complete your profile
                  </Link>
                </p>
              )}
              {socials.length > 0 ? (
                <div className={styles["member-id-socials"]}>
                  {socials.map(({ key, label, href, Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className={styles["member-id-social"]}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className={styles["member-id-chip"]} aria-hidden />
        </div>

        <div
          className={`${styles["member-id-face"]} ${styles["member-id-back"]}`}
          aria-hidden={flipped ? undefined : true}
        >
          <img
            className={styles["member-id-back-logo"]}
            src="/design-meetup-logo.png"
            alt=""
            width={120}
            height={120}
          />
        </div>
      </button>
    </div>
  );
}
