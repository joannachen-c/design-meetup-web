"use client";

import {
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Input } from "@/components/Input";
import { Primary } from "@/components/Primary";
import {
  InstagramIcon,
  LinkedInIcon,
  GitHubIcon,
  WebsiteIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/portal/SocialIcons";

type ProfileFormProps = {
  initialName: string;
  initialEmail: string;
  initialAvatarUrl?: string | null;
  initialLocation?: string;
  initialSchool?: string;
  initialYear?: string;
  initialCompany?: string;
  initialPosition?: string;
  initialWebsite?: string;
  initialInstagram?: string;
  initialX?: string;
  initialLinkedin?: string;
  initialYoutube?: string;
  initialGithub?: string;
};

type FieldErrors = { firstName?: string; email?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const firstName = String(form.get("firstName") || "").trim();
  const email = String(form.get("email") || "").trim();
  if (!firstName) errors.firstName = "first name is required.";
  if (!email) errors.email = "email is required.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "enter a valid email.";
  return errors;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid content-start gap-2">
      <label htmlFor={id} className="text-sm font-bold text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="m-0 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
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
  icon: ReactNode;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="grid content-start gap-2">
      <span className="text-sm font-bold text-muted">{label}</span>
      <span className="flex min-h-11 items-center gap-2 rounded-[10px] bg-surface-muted px-3 focus-within:ring-2 focus-within:ring-accent-primary">
        <span className="shrink-0 text-muted">{icon}</span>
        {prefix ? (
          <span className="shrink-0 text-base text-subtle">{prefix}</span>
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

const invalidInputClassName = "ring-2 ring-red-500 focus-visible:ring-red-500";

export function ProfileForm({
  initialName,
  initialEmail,
  initialAvatarUrl,
  initialLocation = "",
  initialSchool = "",
  initialYear = "",
  initialCompany = "",
  initialPosition = "",
  initialWebsite = "",
  initialInstagram = "",
  initialX = "",
  initialLinkedin = "",
  initialYoutube = "",
  initialGithub = "",
}: ProfileFormProps) {
  const idPrefix = useId();
  const [initialFirstName, ...restOfName] = initialName.trim().split(/\s+/);
  const initialLastName = restOfName.join(" ");
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const avatarInputId = fieldId("avatar");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialAvatarUrl ?? null,
  );

  function clearFieldError(name: keyof FieldErrors) {
    if (!fieldErrors[name]) return;
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      setAvatarError("choose a jpg, png, or webp image.");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      event.target.value = "";
      setAvatarError("image is too large. keep it under 2.5 mb.");
      return;
    }
    setAvatarError(null);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    event.preventDefault();
    if (pending) return;

    const data = new FormData(form);
    const errors = validate(data);
    setFieldErrors(errors);
    if (errors.firstName || errors.email) {
      document
        .getElementById(fieldId(errors.firstName ? "firstName" : "email"))
        ?.focus();
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/portal/profile", {
        method: "POST",
        credentials: "same-origin",
        body: data,
      });

      if (response.redirected) {
        window.location.assign(response.url);
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error || "could not save profile.");
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
      noValidate
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-16"
    >
      <div className="order-first flex flex-col items-center gap-3 text-center lg:order-last lg:pt-7">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="size-[120px] rounded-full object-cover"
            width={120}
            height={120}
          />
        ) : (
          <span
            className="block size-[120px] rounded-full bg-skeleton"
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
        <p className="m-0 text-sm text-subtle">jpg, png, or webp</p>
        {avatarError ? (
          <p className="m-0 text-sm text-red-700" role="alert">
            {avatarError}
          </p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-10">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <Field
              id={fieldId("firstName")}
              label="first name"
              error={fieldErrors.firstName}
            >
              <Input
                id={fieldId("firstName")}
                name="firstName"
                type="text"
                defaultValue={initialFirstName}
                autoComplete="given-name"
                aria-invalid={fieldErrors.firstName ? true : undefined}
                aria-describedby={
                  fieldErrors.firstName
                    ? `${fieldId("firstName")}-error`
                    : undefined
                }
                className={fieldErrors.firstName ? invalidInputClassName : ""}
                onChange={() => clearFieldError("firstName")}
              />
            </Field>
            <Field id={fieldId("lastName")} label="last name">
              <Input
                id={fieldId("lastName")}
                name="lastName"
                type="text"
                defaultValue={initialLastName}
                autoComplete="family-name"
              />
            </Field>
          </div>
          <Field id={fieldId("email")} label="email" error={fieldErrors.email}>
            <Input
              id={fieldId("email")}
              name="email"
              type="email"
              defaultValue={initialEmail}
              autoComplete="email"
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={
                fieldErrors.email ? `${fieldId("email")}-error` : undefined
              }
              className={fieldErrors.email ? invalidInputClassName : ""}
              onChange={() => clearFieldError("email")}
            />
          </Field>
          <Field id={fieldId("school")} label="school">
            <Input
              id={fieldId("school")}
              name="school"
              type="text"
              defaultValue={initialSchool}
              autoComplete="organization"
            />
          </Field>
          <Field id={fieldId("year")} label="year">
            <Input
              id={fieldId("year")}
              name="year"
              type="text"
              defaultValue={initialYear}
              autoComplete="off"
            />
          </Field>
          <Field id={fieldId("position")} label="position">
            <Input
              id={fieldId("position")}
              name="position"
              type="text"
              defaultValue={initialPosition}
              autoComplete="organization-title"
            />
          </Field>
          <Field id={fieldId("company")} label="company">
            <Input
              id={fieldId("company")}
              name="company"
              type="text"
              defaultValue={initialCompany}
              autoComplete="organization"
            />
          </Field>
          <Field id={fieldId("location")} label="location">
            <Input
              id={fieldId("location")}
              name="location"
              type="text"
              defaultValue={initialLocation}
              autoComplete="address-level2"
            />
          </Field>
        </div>

        <section className="grid gap-5">
          <h2 className="m-0 text-xl font-bold tracking-[-0.04em]">
            links
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <SocialField
              name="website"
              label="website"
              icon={<WebsiteIcon />}
              defaultValue={initialWebsite}
              placeholder="portfolio.com"
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
            <SocialField
              name="github"
              label="github"
              prefix="github.com/"
              icon={<GitHubIcon />}
              defaultValue={initialGithub}
              placeholder="username"
            />
          </div>
        </section>

        {error ? (
          <p className="m-0 text-base text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <Primary
          type="submit"
          variant="ink"
          loading={pending}
          disabled={pending}
        >
          save profile
        </Primary>
      </div>
    </form>
  );
}
