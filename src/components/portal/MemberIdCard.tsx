"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/portal/SocialIcons";
import { PersonSilhouette } from "@/components/portal/PersonSilhouette";
import { socialHref, type ProfileSocialLinks } from "@/lib/membership";
import styles from "./MemberIdCard.module.css";

const MAX_AVATAR_BYTES = 2.5 * 1024 * 1024;

export type MemberIdCardProps = {
  displayName: string;
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
  github?: string | null;
  memberSince?: string | null;
};

type SocialKey = Exclude<keyof ProfileSocialLinks, "website">;

const SOCIAL_META: Array<{
  key: SocialKey;
  label: string;
  Icon: (props: { className?: string }) => React.ReactNode;
}> = [
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "x", label: "X", Icon: XIcon },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "github", label: "GitHub", Icon: GitHubIcon },
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
];

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3Zm-7 10.18v4L12 21l7-3.82v-4L12 17l-7-3.82Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M10 14a4.5 4.5 0 0 0 6.4.2l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4-.2l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </svg>
  );
}

function schoolLabel(school: string | null, year: string | null) {
  if (!school) return null;
  const digits = (year || "").replace(/\D/g, "");
  return digits.length >= 2 ? `${school} ’${digits.slice(-2)}` : school;
}

function roleLabel(position: string | null, company: string | null) {
  if (position && company) return `${position} @ ${company}`;
  return position || company || null;
}

function displayHost(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

function SocialLinks({
  className,
  flipped,
  socials,
  stop,
}: {
  className: string;
  flipped: boolean;
  socials: Array<{
    key: SocialKey;
    label: string;
    href: string;
    Icon: (props: { className?: string }) => React.ReactNode;
  }>;
  stop: (event: React.SyntheticEvent) => void;
}) {
  if (socials.length === 0) return null;

  return (
    <div className={className}>
      {socials.map(({ key, label, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={styles.social}
          onClick={stop}
          onKeyDown={stop}
          tabIndex={flipped ? -1 : 0}
        >
          <Icon />
        </a>
      ))}
    </div>
  );
}

export function MemberIdCard({
  displayName,
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
  github = null,
  memberSince = null,
}: MemberIdCardProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [photo, setPhoto] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const role = roleLabel(position, company);
  const websiteHref = socialHref("website", website);
  const education = schoolLabel(school, year);
  const firstName = displayName.trim().split(/\s+/)[0] || displayName;
  const values = { instagram, x, linkedin, youtube, github };
  const socials = SOCIAL_META.flatMap((item) => {
    const href = socialHref(item.key, values[item.key]);
    return href ? [{ ...item, href }] : [];
  });
  const hasDetails = Boolean(role || websiteHref || location || education);

  function toggle() {
    setFlipped((value) => !value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  }

  async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("choose a jpg, png, or webp image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setUploadError("image is too large. keep it under 2.5 mb.");
      return;
    }
    setUploadError(null);
    const previous = photo;
    setPhoto(URL.createObjectURL(file));
    setUploading(true);
    try {
      const body = new FormData();
      body.append("avatar", file);
      const response = await fetch("/api/portal/avatar", {
        method: "POST",
        credentials: "same-origin",
        body,
      });
      const payload = (await response.json().catch(() => null)) as {
        avatarUrl?: string;
        error?: string;
      } | null;
      if (!response.ok || !payload?.avatarUrl) {
        setPhoto(previous);
        setUploadError(payload?.error || "could not upload photo.");
        return;
      }
      setPhoto(payload.avatarUrl);
      router.refresh();
    } catch {
      setPhoto(previous);
      setUploadError("could not upload photo.");
    } finally {
      setUploading(false);
    }
  }

  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <div className={styles.scene}>
      <div className={styles.tilt}>
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label="Member ID card. Press to flip."
          className={[styles.card, flipped ? styles.flipped : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={toggle}
          onKeyDown={onKeyDown}
        >
          <div className={`${styles.face} ${styles.front}`} aria-hidden={flipped}>
            <img
              className={styles.watermark}
              src="/design-meetup-stamp.png"
              alt=""
              width={320}
              height={320}
              aria-hidden
            />
            <div className={styles.masthead}>
              <p className={styles.docType}>Member ID</p>
              <SocialLinks
                className={styles.socials}
                flipped={flipped}
                socials={socials}
                stop={stop}
              />
            </div>

            <div className={styles.body}>
              <div className={styles.photoColumn}>
                <button
                  type="button"
                  className={styles.photoButton}
                  onClick={(event) => {
                    stop(event);
                    fileRef.current?.click();
                  }}
                  onKeyDown={stop}
                  aria-label={photo ? "Upload new image" : "Upload image"}
                  disabled={uploading}
                  tabIndex={flipped ? -1 : 0}
                >
                  {photo ? (
                    <img src={photo} alt="" className={styles.photo} />
                  ) : (
                    <span className={styles.photoEmpty}>
                      <PersonSilhouette className={styles.silhouette} />
                    </span>
                  )}
                  <span
                    className={[
                      styles.photoOverlay,
                      uploading ? styles.photoOverlayBusy : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <UploadIcon />
                    <span className={styles.photoOverlayLabel}>
                      {uploading
                        ? "uploading…"
                        : photo
                          ? "upload new image"
                          : "upload image"}
                    </span>
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  onClick={stop}
                  onChange={(event) => {
                    void onPhotoChange(event);
                  }}
                />
                {uploadError ? (
                  <p className={styles.uploadError} role="alert">
                    {uploadError}
                  </p>
                ) : (
                  <p className={styles.signature} aria-hidden>
                    {firstName}
                  </p>
                )}
              </div>

              <div className={styles.details}>
                <h2 className={styles.name}>{displayName}</h2>
                {role ? <p className={styles.role}>{role}</p> : null}
                {websiteHref && website ? (
                  <a
                    className={styles.website}
                    href={websiteHref}
                    target="_blank"
                    rel="noreferrer"
                    onClick={stop}
                    onKeyDown={stop}
                    tabIndex={flipped ? -1 : 0}
                  >
                    <LinkIcon />
                    {displayHost(website)}
                  </a>
                ) : null}

                {location || education ? (
                  <div className={styles.facts}>
                    {location ? (
                      <span className={styles.fact}>
                        <PinIcon />
                        {location}
                      </span>
                    ) : null}
                    {education ? (
                      <span className={styles.fact}>
                        <CapIcon />
                        {education}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {memberSince ? (
                  <div className={styles.since}>
                    <p className={styles.sinceLabel}>Member since</p>
                    <p className={styles.sinceValue}>{memberSince}</p>
                  </div>
                ) : null}

                {!hasDetails ? (
                  <Link
                    className={styles.hint}
                    href="/portal/profile"
                    onClick={stop}
                    onKeyDown={stop}
                    tabIndex={flipped ? -1 : 0}
                  >
                    complete your profile
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className={`${styles.face} ${styles.back}`}
            aria-hidden={!flipped}
          >
            <img
              className={styles.backLogo}
              src="/design-meetup-logo-mark.svg"
              alt=""
              width={148}
              height={148}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
