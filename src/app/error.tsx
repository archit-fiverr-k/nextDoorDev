"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { formatErrorMessage } from "@/lib/error-utils";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("🔴 Global Application Error Caught:", error);
  }, [error]);

  const userMessage = formatErrorMessage(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-slate-100">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Brand Header */}
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl font-black text-slate-900 dark:text-white">
            NextDoor<span className="text-[#10B981]">Clinic</span>
          </span>
        </div>

        {/* Icon & Error Card */}
        <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
              Something went wrong
            </h1>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
              {userMessage}
            </p>
          </div>

          {error.digest && (
            <div className="rounded-xl bg-slate-50 p-2.5 font-mono text-[10px] text-slate-400 dark:bg-zinc-950">
              Reference Code: {error.digest}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
            <button
              onClick={() => reset()}
              className="shadow-xs flex min-h-[44px] flex-1 items-center justify-center space-x-2 rounded-xl bg-[#10B981] px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:bg-emerald-600 active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="flex min-h-[44px] items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <Home className="h-4 w-4 text-slate-400" />
              <span>Return Home</span>
            </Link>
          </div>
        </div>

        {/* Security & Support Footer */}
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
          Need assistance? Contact our 24/7 patient support team at{" "}
          <a
            href="mailto:support@nextdoorclinic.com"
            className="font-semibold text-[#10B981] hover:underline"
          >
            support@nextdoorclinic.com
          </a>
        </p>
      </div>
    </div>
  );
}
