"use client";

import { useEffect } from "react";
import { showSuccessToast } from "@/components/AppToaster";

export function ProfileSavedToast({ saved }: { saved: boolean }) {
  useEffect(() => {
    if (!saved) return;
    showSuccessToast("Profile updated.");
    const url = new URL(window.location.href);
    if (url.searchParams.has("saved")) {
      url.searchParams.delete("saved");
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, "", next);
    }
  }, [saved]);

  return null;
}
