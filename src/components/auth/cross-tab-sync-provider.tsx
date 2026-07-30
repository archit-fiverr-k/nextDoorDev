"use client";

import React, { useEffect } from "react";

export function CrossTabSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel("ndc_auth_sync");

    channel.onmessage = (event) => {
      if (event.data?.type === "LOGOUT") {
        console.log("⚡ Cross-tab logout received. Redirecting to landing page...");
        window.location.href = "/";
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  return <>{children}</>;
}

/**
 * Helper to trigger cross-tab logout signal
 */
export function broadcastLogout() {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    const channel = new BroadcastChannel("ndc_auth_sync");
    channel.postMessage({ type: "LOGOUT", timestamp: Date.now() });
    channel.close();
  }
}
