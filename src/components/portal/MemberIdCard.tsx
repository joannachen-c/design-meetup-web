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
  memberId?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
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
      className={styles.silhouette}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
    >
      <circle cx="28" cy="20" r="10" fill="currentColor" />
      <path d="M8 48c2.5-10.5 10-16 20-16s17.5 5.5 20 16" fill="currentColor" />
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

function formatMemberId(id: string | null | undefined) {
  const hex = (id || "").replace(/[^a-f0-9]/gi, "").toUpperCase();
  if (hex.length < 8) return "DM ————";
  return `DM ${hex.slice(0, 4)} ${hex.slice(4, 8)}`;
}

export function MemberIdCard({
  displayName,
  memberId = null,
  avatarUrl = null,
  location = null,
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

  const optionalRows = [
    location ? { label: "location", value: location } : null,
    school ? { label: "school", value: school } : null,
    year ? { label: "year", value: year } : null,
    company ? { label: "company", value: company } : null,
    position ? { label: "position", value: position } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const rows = [
    { label: "name", value: displayName },
    { label: "plan", value: tierLabel || "—" },
    ...optionalRows,
    ...(memberSince ? [{ label: "since", value: memberSince }] : []),
  ];

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
    <div className={styles.scene}>
      <div className={styles.tilt}>
        <button
          type="button"
          className={[styles.card, flipped ? styles.flipped : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setFlipped((value) => !value)}
          aria-label={
            flipped
              ? "Flip member ID card to front"
              : "Flip member ID card to back"
          }
        >
          <div className={`${styles.face} ${styles.front}`}>
            <div className={styles.header}>
              <span className={styles.brand}>
                <img
                  src="/design-meetup-logo.png"
                  alt=""
                  width={22}
                  height={22}
                />
                design meetup
              </span>
              <span className={styles.docType}>member id</span>
            </div>

            <div className={styles.body}>
              <div className={styles.photoColumn}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className={styles.photo}
                    width={104}
                    height={136}
                  />
                ) : (
                  <Link
                    href="/portal/profile"
                    className={styles.photoEmpty}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <PersonSilhouette />
                    <span>add photo</span>
                  </Link>
                )}
                <p className={styles.signature} aria-hidden>
                  {displayName}
                </p>
              </div>

              <div className={styles.details}>
                <p className={styles.number}>{formatMemberId(memberId)}</p>
                <dl className={styles.fields}>
                  {rows.map((row, index) => (
                    <div key={row.label} className={styles.field}>
                      <dt>
                        <span className={styles.fieldIndex}>{index + 1}</span>
                        {row.label}
                      </dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {optionalRows.length === 0 ? (
                  <p className={styles.hint}>
                    <Link
                      href="/portal/profile"
                      onClick={(event) => event.stopPropagation()}
                    >
                      complete your profile
                    </Link>
                  </p>
                ) : null}
                {socials.length > 0 ? (
                  <div className={styles.socials}>
                    {socials.map(({ key, label, href, Icon }) => (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className={styles.social}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Icon />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className={styles.ghostPhoto}
                width={44}
                height={56}
                aria-hidden
              />
            ) : null}
          </div>

          <div
            className={`${styles.face} ${styles.back}`}
            aria-hidden={flipped ? undefined : true}
          >
            <img
              className={styles.backLogo}
              src="/design-meetup-logo.png"
              alt=""
              width={120}
              height={120}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
