"use client";

import React from "react";
import { useAidBag } from "@/context/aid-bag-context";
import { ShoppingBag } from "lucide-react";

export function AidBagHeaderButton() {
  const { itemCount, setIsOpen } = useAidBag();

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="relative flex items-center gap-1.5 rounded-xl p-2 text-slate-700 transition-colors hover:text-[#10B981] dark:text-zinc-200"
      title="Open Aid Bag"
    >
      <div className="relative">
        <ShoppingBag className="h-5 w-5 text-[#0F172A] transition-colors hover:text-[#10B981] dark:text-white" />
        {itemCount > 0 && (
          <span className="shadow-xs absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981] text-[10px] font-extrabold text-white animate-in zoom-in-50">
            {itemCount}
          </span>
        )}
      </div>
      <span className="hidden text-xs font-bold text-[#0F172A] dark:text-white sm:inline">
        Aid Bag
      </span>
    </button>
  );
}
