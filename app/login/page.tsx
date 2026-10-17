import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthMemberPhoto } from "@/components/portal/AuthMemberPhoto";
import { LoginForm } from "@/components/portal/LoginForm";
import { getSessionUser } from "@/lib/auth";
import {
  ensureDemoMembership,
  userHasPortalAccess,
} from "@/lib/membership-service";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

function nextFromSearch(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("/")) return "/portal";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
    reset?: string | string[];
  }>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const nextPath = nextFromSearch(params.next);
  if (user) {
    await ensureDemoMembership(user.email, user.id);
    if (
      !(await userHasPortalAccess(user.id)) &&
      !nextPath.startsWith("/portal/subscribe")
    ) {
      redirect("/portal/subscribe");
    }
    redirect(nextPath);
  }
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;
  const resetParam = Array.isArray(params.reset) ? params.reset[0] : params.reset;
  const passwordSaved = resetParam === "1" || resetParam === "true";

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex min-w-0 flex-col px-[clamp(20px,6vw,96px)] pt-[clamp(16px,2vw,30px)] pb-4 lg:min-h-dvh lg:pb-12">
        <a
          href="/"
          className="wordmark shrink-0 leading-[0] no-underline focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
          aria-label="Design Meetup home"
        >
          <img
            className="wordmark-logo border-0 outline-none"
            src="/design-meetup-logo.png"
            alt=""
            width={60}
            height={60}
            decoding="async"
          />
        </a>
        <div className="flex min-h-0 flex-1 flex-col justify-start py-10 lg:justify-center">
          <div className="w-full max-w-[440px]">
            <h1 className="m-0 mb-10 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.06em]">
              Welcome back.
            </h1>
            {passwordSaved ? (
              <p className="mb-6 m-0 text-base text-ink">
                Password saved. Log in with your new password.
              </p>
            ) : null}
            {errorParam ? (
              <p className="mb-6 m-0 text-base text-red-700" role="alert">
                {errorParam}
              </p>
            ) : null}
            <LoginForm mode="login" nextPath={nextPath} />
          </div>
        </div>
      </div>
      <AuthMemberPhoto />
    </div>
  );
}
