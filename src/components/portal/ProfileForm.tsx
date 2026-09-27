"use client";

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { Input } from "@/components/Input";
import { Primary } from "@/components/Primary";
import {
  InstagramIcon,
  LinkedInIcon,
  WebsiteIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/portal/SocialIcons";

type ProfileFormProps = {
  initialName: string;
  initialEmail: string;
  initialAvatarUrl?: string | null;
  initialSchool?: string;
  initialYear?: string;
  initialCompany?: string;
  initialPosition?: string;
  initialLocation?: string;
  initialWebsite?: string;
  initialInstagram?: string;
  initialX?: string;
  initialLinkedin?: string;
  initialYoutube?: string;
};

function Field({
  label,
  optional = false,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-muted">
        {label}
        {optional ? (
          <>
            {" "}
            <span className="font-normal text-subtle">(optional)</span>
          </>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function SocialField({
  name,
  label,
  prefix,
  icon,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  prefix?: string;
  icon: React.ReactNode;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-muted">{label}</span>
      <span className="flex min-h-11 items-center gap-2 rounded-[10px] bg-surface-muted px-3">
        <span className="shrink-0 text-muted">{icon}</span>
        {prefix ? (
          <span className="shrink-0 text-sm text-subtle">{prefix}</span>
        ) : null}
        <input
          name={name}
          type="text"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="min-h-11 w-full min-w-0 border-0 bg-transparent px-1 text-base text-ink outline-none focus-visible:outline-none"
        />
      </span>
    </label>
  );
}

export function ProfileForm({
  initialName,
  initialEmail,
  initialAvatarUrl,
  initialSchool = "",
  initialYear = "",
  initialCompany = "",
  initialPosition = "",
  initialLocation = "",
  initialWebsite = "",
  initialInstagram = "",
  initialX = "",
  initialLinkedin = "",
  initialYoutube = "",
}: ProfileFormProps) {
  const avatarInputId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialAvatarUrl ?? null,
  );

  function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setError("Keep the photo under 2.5 MB.");
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/portal/profile", {
        method: "POST",
        credentials: "same-origin",
        body: new FormData(form),
      });

      if (response.redirected) {
        window.location.assign(response.url);
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error || "Could not save profile.");
        setPending(false);
        return;
      }

      window.location.assign("/portal/profile?saved=1");
    } catch {
      form.submit();
    }
  }

  return (
    <form
      method="post"
      action="/api/portal/profile"
      encType="multipart/form-data"
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="grid max-w-4xl gap-10"
    >
      <section className="grid gap-6 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-start">
        <div className="grid justify-items-start gap-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="size-[112px] rounded-full object-cover"
              width={112}
              height={112}
            />
          ) : (
            <span
              className="block size-[112px] rounded-full bg-skeleton"
              aria-hidden
            />
          )}
          <label
            htmlFor={avatarInputId}
            className="inline-flex min-h-11 w-fit cursor-pointer items-center rounded-[10px] bg-surface-muted px-4 text-base font-bold text-ink hover:bg-gray-200"
          >
            upload photo
          </label>
          <input
            id={avatarInputId}
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onAvatarChange}
          />
          <p className="m-0 text-sm text-subtle">jpg, png, or webp · under 2.5 mb</p>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="name">
              <Input
                name="displayName"
                type="text"
                required
                defaultValue={initialName}
                autoComplete="name"
              />
            </Field>
            <Field label="email">
              <Input
                name="email"
                type="email"
                required
                defaultValue={initialEmail}
                autoComplete="email"
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="location" optional>
              <Input
                name="location"
                type="text"
                defaultValue={initialLocation}
                autoComplete="address-level2"
              />
            </Field>
            <Field label="school" optional>
              <Input
                name="school"
                type="text"
                defaultValue={initialSchool}
                autoComplete="organization"
              />
            </Field>
            <Field label="year" optional>
              <Input
                name="year"
                type="text"
                defaultValue={initialYear}
                autoComplete="off"
              />
            </Field>
            <Field label="company" optional>
              <Input
                name="company"
                type="text"
                defaultValue={initialCompany}
                autoComplete="organization"
              />
            </Field>
            <Field label="position" optional>
              <Input
                name="position"
                type="text"
                defaultValue={initialPosition}
                autoComplete="organization-title"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="m-0 text-xl font-bold tracking-[-0.04em]">
          website &amp; socials
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SocialField
            name="website"
            label="website"
            icon={<WebsiteIcon />}
            defaultValue={initialWebsite}
            placeholder="liumichelle.com"
          />
          <SocialField
            name="instagram"
            label="instagram"
            prefix="instagram.com/"
            icon={<InstagramIcon />}
            defaultValue={initialInstagram}
            placeholder="username"
          />
          <SocialField
            name="x"
            label="x"
            prefix="x.com/"
            icon={<XIcon />}
            defaultValue={initialX}
            placeholder="username"
          />
          <SocialField
            name="linkedin"
            label="linkedin"
            prefix="linkedin.com/in/"
            icon={<LinkedInIcon />}
            defaultValue={initialLinkedin}
            placeholder="username"
          />
          <SocialField
            name="youtube"
            label="youtube"
            prefix="youtube.com/@"
            icon={<YouTubeIcon />}
            defaultValue={initialYoutube}
            placeholder="username"
          />
        </div>
      </section>

      {error ? (
        <p className="m-0 text-base text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <Primary type="submit" variant="ink" loading={pending} disabled={pending}>
        save profile
      </Primary>
    </form>
  );
}
