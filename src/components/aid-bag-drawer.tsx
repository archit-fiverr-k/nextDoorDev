"use client";

import React from "react";
import { useAidBag } from "@/context/aid-bag-context";
import { X, Trash2, Calendar, ShoppingBag, ShieldCheck, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AidBagDrawer() {
  const { items, removeItem, clearBag, isOpen, setIsOpen, totalPrice, totalDuration, itemCount } =
    useAidBag();
  const router = useRouter();

  if (!isOpen) return null;

  const primaryPharmacySlug = items[0]?.pharmacySlug || "west-end-pharmacy";

  const handleProceedToBooking = () => {
    setIsOpen(false);
    const serviceIds = items.map((i) => i.id).join(",");
    router.push(
      `/book/${primaryPharmacySlug}?services=${encodeURIComponent(serviceIds)}&schedule=true`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans antialiased">
      {/* Backdrop */}
      <div
        className="backdrop-blur-xs absolute inset-0 bg-slate-900/60 transition-opacity animate-in fade-in"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex w-screen max-w-md flex-col justify-between border-l border-slate-200/80 bg-white text-slate-900 shadow-2xl duration-300 animate-in slide-in-from-right dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
          {/* 1. Aid Bag Drawer Header */}
          <div className="dark:border-zinc-850 flex items-center justify-between border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#0F172A] dark:text-white">
                    Your Aid Bag
                  </h2>
                  <span className="rounded-full bg-[#10B981] px-2 py-0.5 text-[10px] font-black text-white">
                    {itemCount} {itemCount === 1 ? "Service" : "Services"}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Selected treatments for checkout
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 2. Aid Bag Drawer Body (List of Treatments) */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="space-y-3 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-zinc-900">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Your Aid Bag is Empty
                </h3>
                <p className="mx-auto max-w-xs text-xs font-medium text-slate-500">
                  Browse clinical services and click &quot;Add to Aid Bag&quot; to queue your
                  treatments.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">
                      {item.name}
                    </h4>
                    {item.pharmacyName && (
                      <p className="text-[10px] font-semibold text-slate-500">
                        {item.pharmacyName}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-1 text-[10px] font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#10B981]" />
                        {item.duration} mins
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 space-y-2 text-right">
                    <span className="block text-xs font-extrabold text-[#10B981]">
                      £{item.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition-colors hover:text-rose-500"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 3. Aid Bag Drawer Footer (Totals & Checkout) */}
          {items.length > 0 && (
            <div className="dark:border-zinc-850 space-y-4 border-t border-slate-100 bg-slate-50/50 p-6 dark:bg-zinc-900/40">
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Time:</span>
                  <span className="font-bold text-[#0F172A] dark:text-white">
                    {totalDuration} minutes
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GPhC Clinical Consultation:</span>
                  <span className="font-bold text-[#10B981]">Included</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm dark:border-zinc-800">
                  <span className="font-extrabold text-[#0F172A] dark:text-white">
                    Total Amount Due:
                  </span>
                  <span className="text-lg font-black text-[#10B981]">
                    £{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleProceedToBooking}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#0e9f6e]"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Proceed to Booking Process</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={clearBag}
                  className="w-full py-2 text-center text-[11px] font-semibold text-slate-400 transition-colors hover:text-slate-600"
                >
                  Clear Aid Bag
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 text-[10px] font-medium text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
                <span>GPhC Registered & NHS Pharmacy First Compliant</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
