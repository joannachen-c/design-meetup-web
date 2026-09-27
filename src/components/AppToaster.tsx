"use client";

import { Toaster, toast } from "sonner";

function SuccessCheck() {
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white"
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.4 6.2 4.7 8.5 9.6 3.4"
          stroke="#22c55e"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function showSuccessToast(message: string) {
  toast.success(message, {
    unstyled: true,
    icon: <SuccessCheck />,
    duration: 4000,
    className:
      "flex flex-row flex-nowrap items-center gap-3 whitespace-nowrap rounded-full bg-[#22c55e] px-5 py-3 text-base font-semibold text-white shadow-[0_10px_28px_rgb(16_24_40/0.18)]",
    style: { width: "max-content" },
  });
}

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      duration={4000}
      visibleToasts={3}
      offset={28}
      style={{ "--width": "max-content" } as React.CSSProperties}
      toastOptions={{ unstyled: true }}
    />
  );
}
