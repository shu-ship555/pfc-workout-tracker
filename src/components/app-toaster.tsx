"use client";

import { Toaster } from "sonner";
import { useSyncExternalStore } from "react";

const mediaQuery = "(min-width: 768px)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(mediaQuery);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(mediaQuery).matches;
}

function getServerSnapshot() {
  return false;
}

export function AppToaster() {
  const isDesktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Toaster
      position={isDesktop ? "top-right" : "top-center"}
      richColors
      closeButton
      style={isDesktop ? { "--width": "320px" } as React.CSSProperties : undefined}
    />
  );
}
