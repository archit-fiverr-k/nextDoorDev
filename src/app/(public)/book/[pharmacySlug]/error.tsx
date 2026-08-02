"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Search, ArrowLeft } from "lucide-react";
import { formatErrorMessage } from "@/lib/error-utils";

export default function BookingErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("🔴 Booking Wizard Error Caught:", error);
  }, [error]);

  const userMessage = formatErrorMessage(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-slate-100">
      <div className="w-full max-w-lg space-y-6 text-center">
        {/* Brand Header */}
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl font-black text-slate-900 dark:text-white">
            NextDoor<span className="text-[#10B981]">Clinic</span>
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Booking Assistant
          </span>
        </div>

        {/* Error Card */}
        <div className="space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertCircle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
              Unable to complete booking step
            </h1>
            <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
              {userMessage}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
            <button
              onClick={() => reset()}
              className="shadow-xs flex min-h-[44px] flex-1 items-center justify-center space-x-2 rounded-xl bg-[#10B981] px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:bg-emerald-600 active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Step</span>
            </button>

            <Link
              href="/search"
              className="flex min-h-[44px] items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <Search className="h-4 w-4 text-[#10B981]" />
              <span>Back to Clinic Search</span>
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
          Your booking information is safe. If you need help, please contact patient support at{" "}
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
