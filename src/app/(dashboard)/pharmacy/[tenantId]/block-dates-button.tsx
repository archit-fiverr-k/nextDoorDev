"use client";

import { Ban } from "lucide-react";

export function BlockDatesButton() {
  return (
    <div
      className="flex cursor-pointer items-center space-x-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:bg-zinc-900/50"
      onClick={() =>
        alert("Blocked Date feature configuration is located under Availability settings.")
      }
    >
      <Ban className="h-5 w-5 shrink-0 text-rose-500" />
      <div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
          Block Vacation Dates
        </h4>
        <p className="mt-0.5 text-[10px] text-slate-500">Add holidays or branch closure dates.</p>
      </div>
    </div>
  );
}
