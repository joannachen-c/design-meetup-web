import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { requireUser } from "@/lib/auth";
import { displayNameFromEmail } from "@/lib/membership";
import { ensureProfile, getProfile } from "@/lib/membership-service";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

function errorMessage(code: string | undefined) {
  switch (code) {
    case "required":
      return "name and email are required.";
    case "avatar-size":
      return "keep the photo under 2.5 mb.";
    case "avatar-type":
      return "use a jpg, png, or webp image.";
    default:
      return code || null;
  }
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser("/portal/profile");
  await ensureProfile({ id: user.id, email: user.email });
  const profile = await getProfile(user.id);
  const params = await searchParams;
  const name =
    profile?.displayName?.trim() ||
    displayNameFromEmail(user.email || "member");
  const email = profile?.email || user.email || "";
  const message = errorMessage(params.error);

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(24px,3vw,40px)] pb-24 lowercase">
      <Link
        href="/portal"
        className="mb-8 inline-flex min-h-11 items-center rounded-[10px] text-base text-muted no-underline hover:text-ink"
      >
        back to home
      </Link>
      <h1 className="m-0 mb-4 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em]">
        your profile
      </h1>
      <p className="mb-12 max-w-[48ch] text-base leading-normal text-muted normal-case">
        update how you show up in the member portal — photo, name, and email.
      </p>

      {params.saved ? (
        <p
          className="mb-8 rounded-[20px] bg-accent-primary px-4 py-3 text-base text-ink"
          role="status"
        >
          profile saved.
        </p>
      ) : null}
      {message ? (
        <p className="mb-8 text-base text-red-700" role="alert">
          {message}
        </p>
      ) : null}

      <ProfileForm
        initialName={name}
        initialEmail={email}
        initialAvatarUrl={profile?.avatarUrl ?? null}
      />
    </main>
  );
}
