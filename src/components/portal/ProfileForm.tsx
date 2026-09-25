"use client";

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { Input } from "@/components/Input";
import { Primary } from "@/components/Primary";

export function ProfileForm({
  initialName,
  initialEmail,
  initialAvatarUrl,
}: {
  initialName: string;
  initialEmail: string;
  initialAvatarUrl?: string | null;
}) {
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
      className="grid max-w-xl gap-8"
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="size-24 rounded-full object-cover"
              width={96}
              height={96}
            />
          ) : (
            <span
              className="block size-24 rounded-full bg-skeleton"
              aria-hidden
            />
          )}
        </div>
        <div className="grid gap-2">
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
          <p className="m-0 text-sm text-subtle lowercase">
            jpg, png, or webp · under 2.5 mb
          </p>
        </div>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-bold text-muted">name</span>
        <Input
          name="displayName"
          type="text"
          required
          defaultValue={initialName}
          autoComplete="name"
          placeholder="Michelle Liu"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-bold text-muted">email</span>
        <Input
          name="email"
          type="email"
          required
          defaultValue={initialEmail}
          autoComplete="email"
          placeholder="you@example.com"
        />
      </label>

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
