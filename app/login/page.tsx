import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const nextPath = nextFromSearch(params.next);
  if (user) redirect(nextPath);

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-16 px-[clamp(20px,6vw,96px)] pt-[clamp(16px,2vw,30px)] pb-12">
        <a
          href="/"
          className="text-xl font-bold leading-none tracking-[-0.06em] text-ink no-underline"
        >
          design meetup
        </a>
        <div className="w-full max-w-[440px]">
          <h1 className="m-0 mb-4 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.06em]">
            Welcome back.
          </h1>
          <p className="mb-10 max-w-[44ch] text-base leading-normal text-muted">
            Sign in to update your profile and browse the member directory.
          </p>
          <LoginForm mode="login" nextPath={nextPath} />
        </div>
        <div className="flex gap-6 text-sm text-subtle">
          <span>designmeetup.info</span>
          <span>members portal</span>
        </div>
      </div>
      <div className="hidden min-w-0 p-[clamp(16px,2vw,30px)] pr-[clamp(20px,6vw,96px)] pl-[clamp(16px,2vw,24px)] lg:flex">
        <div className="flex min-h-[320px] flex-1 items-end rounded-[11px] bg-skeleton p-6">
          <span className="text-sm font-bold text-subtle">
            member photograph
          </span>
        </div>
      </div>
    </div>
  );
}
