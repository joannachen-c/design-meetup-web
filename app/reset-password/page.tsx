import type { Metadata } from "next";
import { AuthMemberPhoto } from "@/components/portal/AuthMemberPhoto";
import { ResetPasswordForm } from "@/components/portal/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

function nextFromSearch(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("/")) return "/portal";
  return value;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = nextFromSearch(params.next);

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
            <h1 className="m-0 mb-10 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.06em] lowercase">
              choose a new password.
            </h1>
            <ResetPasswordForm nextPath={nextPath} />
          </div>
        </div>
      </div>
      <AuthMemberPhoto />
    </div>
  );
}