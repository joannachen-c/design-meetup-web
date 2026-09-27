"use client";

import { Toaster, toast } from "sonner";
import { Toast, ToastCheckIcon } from "@/components/Toast";

export function showSuccessToast(message: string) {
  toast.custom(
    () => (
      <Toast variant="success" className="whitespace-nowrap" icon={<ToastCheckIcon />}>
        {message}
      </Toast>
    ),
    {
      duration: 4000,
      unstyled: true,
      className: "flex w-max list-none",
    },
  );
}

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      duration={4000}
      visibleToasts={3}
      offset={28}
      style={
        {
          "--width": "max-content",
          fontFamily: "inherit",
        } as React.CSSProperties
      }
      toastOptions={{ unstyled: true }}
    />
  );
}
