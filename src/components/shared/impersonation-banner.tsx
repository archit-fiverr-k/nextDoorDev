"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { stopImpersonationAction } from "@/actions/admin-settings";
import { EyeOff } from "lucide-react";

export function ImpersonationBanner() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStop = () => {
    startTransition(async () => {
      const res = await stopImpersonationAction();
      if (res.success) {
        router.refresh();
        router.push("/admin");
      } else {
        alert(res.error || "Failed to stop impersonation");
      }
    });
  };

  return (
    <div className="relative z-50 flex items-center justify-between bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md">
      <div className="flex items-center space-x-2">
        <EyeOff className="h-4 w-4 animate-pulse" />
        <span>
          You are currently operating in Impersonation Mode (Super Admin privileges active).
        </span>
      </div>
      <button
        onClick={handleStop}
        disabled={isPending}
        className="cursor-pointer rounded-md bg-white px-3 py-1 font-bold text-amber-700 transition-all hover:bg-slate-100 disabled:opacity-50"
      >
        {isPending ? "Terminating session..." : "Stop Impersonation"}
      </button>
    </div>
  );
}
export default ImpersonationBanner;
