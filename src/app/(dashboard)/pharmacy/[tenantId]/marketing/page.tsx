"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Tag,
  Gift,
  Mail,
  FileText,
  Share2,
  Plus,
  Percent,
  Calendar,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface MarketingPageProps {
  params: {
    tenantId: string;
  };
}

export default function MarketingPage({ params }: MarketingPageProps) {
  const [activeTab, setActiveTab] = useState<"promotions" | "coupons" | "email" | "announcements">(
    "promotions"
  );
  const [showCouponModal, setShowCouponModal] = useState(false);

  const mockCoupons = [
    {
      code: "SUMMER20",
      discount: "20% OFF",
      service: "Travel Vaccination",
      usage: "42 / 100",
      expiry: "Aug 31, 2026",
      status: "ACTIVE",
    },
    {
      code: "HEALTH10",
      discount: "£10 OFF",
      service: "Blood Testing Screening",
      usage: "18 / 50",
      expiry: "Sep 15, 2026",
      status: "ACTIVE",
    },
  ];

  return (
    <div className="select-text space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Marketing & Patient Growth Hub
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Launch promo coupons, referral incentives, email marketing blasts, and booking widget
            announcements.
          </p>
        </div>

        <button
          onClick={() => setShowCouponModal(true)}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
        >
          <Plus className="h-4 w-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Tabs bar */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-semibold dark:border-zinc-800">
        {(["promotions", "coupons", "email", "announcements"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 capitalize transition-all ${
              activeTab === tab
                ? "bg-slate-900 font-bold text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Active Promotions & Coupons */}
      {(activeTab === "promotions" || activeTab === "coupons") && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {mockCoupons.map((c, idx) => (
            <div
              key={idx}
              className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-extrabold text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-mono text-base font-extrabold tracking-wider text-slate-900 dark:text-slate-50">
                      {c.code}
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">{c.service}</p>
                  </div>
                </div>

                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {c.discount}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-medium text-slate-500 dark:border-zinc-900 dark:text-zinc-400">
                <span>Redemptions: {c.usage}</span>
                <span>Expires: {c.expiry}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Email Campaigns */}
      {activeTab === "email" && (
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
            <Mail className="h-4 w-4 text-teal-600" />
            <span>Broadcast Patient Email Blast</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Email Subject Line
              </label>
              <input
                type="text"
                placeholder="e.g. Protect Your Family: Flu & Travel Vaccinations Now Available"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Target Audience
              </label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900">
                <option>All Registered Patients (1,420)</option>
                <option>Patients visited in last 90 days (380)</option>
                <option>Travel Vaccine Patients (210)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Campaign Message Content
              </label>
              <textarea
                rows={5}
                placeholder="Write your email campaign copy here..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <button
              onClick={() => alert("Email campaign queued for delivery!")}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-950"
            >
              Send Campaign Blast
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Announcements */}
      {activeTab === "announcements" && (
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Booking Page Top Announcement Banner</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">Banner Text</label>
              <input
                type="text"
                defaultValue="⚡ Walk-in appointments available for Ear Wax Removal and Travel Advisory today!"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                defaultChecked
                id="banner-active"
                className="rounded text-teal-600"
              />
              <label
                htmlFor="banner-active"
                className="font-bold text-slate-800 dark:text-slate-200"
              >
                Display Announcement Banner on Public Booking Engine
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-md space-y-6 overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Create Promo Code
              </h3>
              <button
                onClick={() => setShowCouponModal(false)}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 dark:bg-zinc-900"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-700 dark:text-zinc-300">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. AUTUMN15"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-bold uppercase outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Discount Value
                  </label>
                  <input
                    type="text"
                    placeholder="15% or £10"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    defaultValue={100}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 dark:border-zinc-900">
              <button
                onClick={() => setShowCouponModal(false)}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-950"
              >
                Publish Promo Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
