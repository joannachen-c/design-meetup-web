"use client";

import { Toaster, toast } from "sonner";

const successToastStyle = {
  background: "#22c55e",
  color: "#fff",
  border: "0",
  borderRadius: "999px",
  padding: "12px 20px",
  boxShadow: "0 10px 28px rgb(16 24 40 / 0.18)",
} as const;

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
    icon: <SuccessCheck />,
    duration: 4000,
    style: successToastStyle,
  });
}

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      duration={4000}
      visibleToasts={3}
      offset={28}
      toastOptions={{
        style: successToastStyle,
      }}
    />
  );
}
