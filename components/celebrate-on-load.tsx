"use client";

import { useEffect } from "react";
import { celebrate } from "@/lib/celebrate";

// Fires confetti once when the page loads with ?celebrate=1, then removes the
// param from the URL so a refresh does not celebrate again.
export function CelebrateOnLoad({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    celebrate();
    const url = new URL(window.location.href);
    url.searchParams.delete("celebrate");
    window.history.replaceState(null, "", url);
  }, [active]);
  return null;
}
