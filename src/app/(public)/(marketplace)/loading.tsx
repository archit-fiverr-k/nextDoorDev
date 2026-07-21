import React from "react";

export default function MarketplaceLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse select-none space-y-8 px-6 py-10">
      {/* Title block skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 rounded-lg bg-slate-200" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid items-start gap-8 lg:grid-cols-4">
        {/* Left filter panel skeleton */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="space-y-3 pt-4">
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-200" />
          </div>
        </div>

        {/* Right content listings skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-3">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 rounded bg-slate-200" />
                  <div className="h-4 w-32 rounded bg-slate-200" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-3/4 rounded bg-slate-100" />
              </div>
              <div className="h-8 rounded-xl bg-slate-100 pt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
