import type { Metadata } from "next";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { ProfileSavedToast } from "@/components/portal/ProfileSavedToast";
import { displayNameFromEmail } from "@/lib/membership";
import { ensureProfile, getProfile } from "@/lib/membership-service";
import { requirePaidMembership } from "@/lib/portal-access";

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
  const user = await requirePaidMembership("/portal/profile");
  await ensureProfile({ id: user.id, email: user.email });
  const profile = await getProfile(user.id);
  const params = await searchParams;
  const name =
    profile?.displayName?.trim() ||
    displayNameFromEmail(user.email || "member");
  const email = profile?.email || user.email || "";
  const message = errorMessage(params.error);

  return (
    <main className="w-full px-[clamp(20px,6vw,96px)] pt-[clamp(32px,5vw,64px)] pb-24 lowercase">
      <ProfileSavedToast saved={params.saved === "1"} />
      {message ? (
        <p className="mb-8 text-base text-red-700" role="alert">
          {message}
        </p>
      ) : null}

      <div className="upcoming-events">
        <h1 className="upcoming-events-copy m-0 max-w-[10ch] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.06em] text-balance">
          your profile
        </h1>
        <div className="upcoming-events-embed min-w-0">
          <ProfileForm
            initialName={name}
            initialEmail={email}
            initialAvatarUrl={profile?.avatarUrl ?? null}
            initialSchool={profile?.school ?? ""}
            initialYear={profile?.year ?? ""}
            initialCompany={profile?.company ?? ""}
            initialPosition={profile?.position ?? ""}
            initialLocation={profile?.location ?? ""}
            initialWebsite={profile?.website ?? ""}
            initialInstagram={profile?.instagram ?? ""}
            initialX={profile?.x ?? ""}
            initialLinkedin={profile?.linkedin ?? ""}
            initialYoutube={profile?.youtube ?? ""}
            initialGithub={profile?.github ?? ""}
          />
        </div>
      </div>
    </main>
  );
}
