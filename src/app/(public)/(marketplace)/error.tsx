"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketplace Router Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-xl select-none space-y-6 px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-sm">
        <AlertCircle className="h-6 w-6" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-900">Directory System Error</h3>
        <p className="mx-auto max-w-sm text-xs font-normal leading-relaxed text-slate-500">
          An error occurred while communicating with the UK pharmacy registry. Let&apos;s try
          resetting the connection or returning home.
        </p>
      </div>

      <div className="flex select-none flex-col justify-center gap-3 text-xs font-bold sm:flex-row">
        <button
          onClick={() => reset()}
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-5 text-white shadow-sm transition-all hover:bg-blue-700"
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          <span>Retry Connection</span>
        </button>
        <Link
          href="/providers"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-slate-700 shadow-sm transition-all hover:bg-slate-50"
        >
          <Home className="mr-1.5 h-4 w-4" />
          <span>Providers Home</span>
        </Link>
      </div>
    </div>
  );
}
