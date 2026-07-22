"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Tag, Mail, Plus, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import {
  createCouponAction,
  getPharmacyCouponsAction,
  createCampaignAction,
  getPharmacyCampaignsAction,
} from "@/actions/marketing";

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
  const [isPending, startTransition] = useTransition();

  const [coupons, setCoupons] = useState<
    Array<{
      id: string;
      code: string;
      discountType: string;
      discountValue: number;
      usageLimit: number | null;
      timesUsed: number;
      expiresAt: string | null;
      isActive: boolean;
    }>
  >([]);

  const [campaigns, setCampaigns] = useState<
    Array<{
      id: string;
      title: string;
      type: string;
      status: string;
      clicksCount: number;
      conversionsCount: number;
      revenueGenerated: number;
    }>
  >([]);

  const [loading, setLoading] = useState(true);

  // Form inputs for new coupon
  const [newCode, setNewCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("100");
  const [formError, setFormError] = useState<string | null>(null);

  // Campaign email inputs
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [campaignNotice, setCampaignNotice] = useState<string | null>(null);

  const loadMarketingData = async () => {
    setLoading(true);
    try {
      const [cRes, campRes] = await Promise.all([
        getPharmacyCouponsAction(params.tenantId),
        getPharmacyCampaignsAction(params.tenantId),
      ]);
      if (cRes.success && cRes.coupons) setCoupons(cRes.coupons);
      if (campRes.success && campRes.campaigns) setCampaigns(campRes.campaigns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketingData();
  }, [params.tenantId]);

  const handleCreateCoupon = () => {
    if (!newCode.trim() || !discountValue) {
      setFormError("Code and discount value are required");
      return;
    }
    setFormError(null);

    startTransition(async () => {
      const res = await createCouponAction({
        pharmacyId: params.tenantId,
        code: newCode,
        discountType,
        discountValue: parseFloat(discountValue),
        usageLimit: parseInt(usageLimit) || 100,
      });

      if (res.success) {
        setNewCode("");
        setDiscountValue("");
        setShowCouponModal(false);
        loadMarketingData();
      } else {
        setFormError(res.error || "Failed to create coupon");
      }
    });
  };

  const handleSendCampaign = () => {
    if (!emailSubject.trim() || !emailMessage.trim()) return;

    startTransition(async () => {
      const res = await createCampaignAction({
        pharmacyId: params.tenantId,
        title: emailSubject,
        type: "EMAIL",
        startDate: new Date().toISOString(),
      });

      if (res.success) {
        setEmailSubject("");
        setEmailMessage("");
        setCampaignNotice("Email campaign queued and saved to database!");
        loadMarketingData();
      }
    });
  };

  return (
    <div className="select-text space-y-6">
      {/* Header */}
      <div className="shadow-xs flex flex-col items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Marketing & Patient Growth Hub
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Create coupons, email blasts, and track live conversion analytics persisted to Neon
            PostgreSQL.
          </p>
        </div>

        <button
          onClick={() => setShowCouponModal(true)}
          className="flex items-center space-x-1.5 rounded-md bg-[#000e35] px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
        >
          <Plus className="h-4 w-4" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* Tabs bar */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-semibold dark:border-zinc-800">
        {(["promotions", "coupons", "email", "announcements"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 capitalize transition-all ${
              activeTab === tab
                ? "bg-[#000e35] font-bold text-white dark:bg-slate-100 dark:text-slate-950"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Active Promotions & Coupons */}
      {(activeTab === "promotions" || activeTab === "coupons") && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#000e35]" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <Tag className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                No Active Promo Codes
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Create promo codes to boost patient conversion during checkout.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="shadow-xs space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-sm font-extrabold text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-mono text-base font-extrabold tracking-wider text-slate-900 dark:text-slate-50">
                          {c.code}
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                          Global Service Coupon
                        </p>
                      </div>
                    </div>

                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                      {c.discountType === "PERCENTAGE"
                        ? `${c.discountValue}% OFF`
                        : `£${c.discountValue.toFixed(2)} OFF`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-medium text-slate-500 dark:border-zinc-900 dark:text-zinc-400">
                    <span>
                      Redemptions: {c.timesUsed} / {c.usageLimit || "∞"}
                    </span>
                    <span>
                      Status:{" "}
                      <strong className="text-emerald-600">
                        {c.isActive ? "ACTIVE" : "INACTIVE"}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Email Campaigns */}
      {activeTab === "email" && (
        <div className="shadow-xs space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
            <Mail className="h-4 w-4 text-emerald-600" />
            <span>Broadcast Patient Email Campaign</span>
          </h3>

          {campaignNotice && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{campaignNotice}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Email Subject Line *
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Protect Your Family: Travel & Flu Vaccinations Now Available"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#000e35] dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Target Audience
              </label>
              <select className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900">
                <option>All Registered Patients</option>
                <option>Patients visited in last 90 days</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Campaign Content *
              </label>
              <textarea
                rows={5}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Write your email campaign copy here..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-[#000e35] dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <button
              onClick={handleSendCampaign}
              disabled={isPending}
              className="flex items-center space-x-2 rounded-md bg-[#000e35] px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              <span>Queue & Persist Campaign Blast</span>
            </button>
          </div>

          {/* Active Campaigns Table */}
          {campaigns.length > 0 && (
            <div className="pt-4">
              <h4 className="mb-2 text-xs font-bold text-slate-900 dark:text-white">
                Active Database Campaigns
              </h4>
              <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700 dark:bg-zinc-900 dark:text-zinc-300">
                    <tr>
                      <th className="p-3">Title</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Clicks</th>
                      <th className="p-3">Conversions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 dark:divide-zinc-800 dark:text-zinc-400">
                    {campaigns.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {c.title}
                        </td>
                        <td className="p-3 uppercase">{c.type}</td>
                        <td className="p-3">
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3">{c.clicksCount}</td>
                        <td className="p-3">{c.conversionsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Announcements */}
      {activeTab === "announcements" && (
        <div className="shadow-xs space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Booking Page Top Announcement Banner</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Banner Announcement Text
              </label>
              <input
                type="text"
                defaultValue="Walk-in appointments available for Ear Wax Removal and Travel Advisory today!"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                defaultChecked
                id="banner-active"
                className="rounded text-emerald-600"
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
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex justify-end bg-slate-900/40">
          <div className="h-full w-full max-w-md space-y-6 overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Create Promo Code
              </h3>
              <button
                onClick={() => setShowCouponModal(false)}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:bg-zinc-900"
              >
                Close ✕
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                <AlertCircle className="h-4 w-4" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs font-medium text-slate-700 dark:text-zinc-300">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AUTUMN15"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-bold uppercase outline-none focus:border-[#000e35] dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (£)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="15 or 10"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#000e35] dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Max Redemptions Limit
                </label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 dark:border-zinc-900">
              <button
                onClick={handleCreateCoupon}
                disabled={isPending}
                className="flex w-full items-center justify-center space-x-2 rounded-md bg-[#000e35] py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4" />
                )}
                <span>Publish Promo Code to Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
