import React from "react";

export default function ProviderDashboardLoading() {
  return (
    <div className="animate-pulse select-none space-y-8">
      {/* Title block Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-zinc-800" />
        <div className="dark:bg-zinc-850 h-4 w-96 rounded-lg bg-slate-200" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-950"
          >
            <div className="h-3.5 w-24 rounded-md bg-slate-200 dark:bg-zinc-800" />
            <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
            <div className="bg-slate-150 dark:bg-zinc-850 h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Tables and Side Actions Skeleton */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left Column (3/5) */}
        <div className="space-y-8 lg:col-span-3">
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="h-5 w-40 rounded-md bg-slate-200 dark:bg-zinc-800" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-zinc-900" />
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="h-5 w-40 rounded-md bg-slate-200 dark:bg-zinc-800" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-zinc-900" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (2/5) */}
        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="h-5 w-32 rounded-md bg-slate-200 dark:bg-zinc-800" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-zinc-900" />
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="h-5 w-36 rounded-md bg-slate-200 dark:bg-zinc-800" />
            <div className="space-y-2.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-zinc-900" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
