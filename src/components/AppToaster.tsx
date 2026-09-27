"use client";

import { Toaster, toast } from "sonner";
import { Toast, ToastCheckIcon } from "@/components/Toast";

export function showSuccessToast(message: string) {
  toast.custom(
    () => (
      <Toast className="text-ink" icon={<ToastCheckIcon />}>
        {message}
      </Toast>
    ),
    { duration: 4000 },
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
