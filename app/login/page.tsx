import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthMemberPhoto } from "@/components/portal/AuthMemberPhoto";
import { DemoLoginButton } from "@/components/portal/DemoLoginButton";
import { LoginForm } from "@/components/portal/LoginForm";
import { getSessionUser } from "@/lib/auth";

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
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const nextPath = nextFromSearch(params.next);
  if (user) redirect(nextPath);
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex min-h-dvh min-w-0 flex-col px-[clamp(20px,6vw,96px)] pt-[clamp(16px,2vw,30px)] pb-12">
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
        <div className="flex min-h-0 flex-1 flex-col justify-center py-10">
          <div className="w-full max-w-[440px]">
            <h1 className="m-0 mb-4 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.06em]">
              Welcome back.
            </h1>
            <p className="mb-10 max-w-[44ch] text-base leading-normal text-muted">
              Sign in to update your profile and browse the member directory.
            </p>
            {errorParam ? (
              <p className="mb-6 m-0 text-base text-red-700" role="alert">
                {errorParam}
              </p>
            ) : null}
            <LoginForm mode="login" nextPath={nextPath} />
            <DemoLoginButton nextPath={nextPath} />
          </div>
        </div>
      </div>
      <AuthMemberPhoto />
    </div>
  );
}
