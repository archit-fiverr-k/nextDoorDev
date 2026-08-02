"use client";

import React, { useState, useTransition } from "react";
import {
  Zap,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Building2,
  CheckCircle2,
  Loader2,
  HelpCircle,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Lock,
  Globe,
  Search,
  Calendar,
  MessageSquare,
  BarChart,
  Users,
} from "lucide-react";
import {
  createPharmacySubscriptionCheckoutAction,
  createPharmacyBillingPortalAction,
} from "@/actions/pharmacy-billing";

interface SubscriptionPageProps {
  params: {
    tenantId: string;
  };
}

export default function SubscriptionPage({ params }: SubscriptionPageProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [selectedPlan, setSelectedPlan] = useState<"STARTER" | "PRO" | "ENTERPRISE">("PRO");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const handleCheckout = (planTier: "STARTER" | "PRO" | "ENTERPRISE") => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await createPharmacySubscriptionCheckoutAction({
        pharmacyId: params.tenantId,
        planTier,
      });

      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setErrorMsg(res.error || "Failed to initiate Stripe Subscription Checkout.");
      }
    });
  };

  const handleOpenBillingPortal = () => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await createPharmacyBillingPortalAction(params.tenantId);

      if (res.success && res.portalUrl) {
        window.location.href = res.portalUrl;
      } else {
        setErrorMsg(res.error || "Failed to open Stripe Billing Portal.");
      }
    });
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "How does custom domain support work?",
      a: "Each pharmacy receives an automatically generated website (e.g. www.westendpharmacy.co.uk or clinic.westendpharmacy.co.uk). You can connect your existing domain name via simple DNS CNAME records. SSL certificates and cloud hosting are included at no additional charge.",
    },
    {
      q: "Can I upgrade or downgrade my plan at any time?",
      a: "Yes. You can manage your subscription tier directly from your dashboard or via the Stripe Customer Billing Portal. Prorated credits will automatically apply to your account.",
    },
    {
      q: "Are patient online card payments required for bookings?",
      a: "No. Patient appointments operate seamlessly using Pay at Clinic (PAY_AT_CLINIC). Online card payment processing for patients can be enabled or disabled per clinical service.",
    },
    {
      q: "How do VAT invoices and receipts work?",
      a: "Official VAT invoices and tax receipts are automatically generated upon every renewal and sent to your billing email. You can also view and download full PDF receipts anytime from the Stripe Billing Portal below.",
    },
  ];

  return (
    <div className="select-text space-y-8 font-sans text-slate-900 antialiased dark:text-zinc-50">
      {/* ========================================================================= */}
      {/* 1. HERO & CURRENT SUBSCRIPTION STATUS BAR */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200/80 pb-6 dark:border-zinc-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Platform Subscription & B2B Billing
              </h1>
              <span className="inline-flex items-center space-x-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                Active Practice Plan
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
              Manage your NextDoorClinic digital growth suite, billing preferences, and invoices.
            </p>
          </div>

          {/* Header Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleOpenBillingPortal}
              className="shadow-2xs inline-flex items-center space-x-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#10B981]" />
              ) : (
                <>
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <span>Stripe Billing Portal</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleCheckout(selectedPlan)}
              className="inline-flex items-center space-x-2 rounded-xl bg-[#10B981] px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-600 active:scale-95"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Manage / Upgrade Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PRICING TIERS MATRIX (CLEAN HIGH-DENSITY BIG TECH DESIGN) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. PLATFORM SUBSCRIPTION PLANS ($49/MO & $499/YR ONLY) */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              NextDoorClinic Digital Growth Subscription
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              One single subscription tier including all platform features, custom website, local
              SEO, and booking POS.
            </p>
          </div>

          {/* Billing Cycle Selector Toggle */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-4 py-2 text-xs font-extrabold transition-all ${
                billingCycle === "monthly"
                  ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400"
              }`}
            >
              Monthly Plan ($49/mo)
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-xs font-extrabold transition-all ${
                billingCycle === "yearly"
                  ? "shadow-xs bg-[#10B981] text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400"
              }`}
            >
              <span>Yearly Plan ($499/yr)</span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white">
                Save &gt;15%
              </span>
            </button>
          </div>
        </div>

        {/* 2-Column Plan Comparison Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* MONTHLY PLAN CARD */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 transition-all dark:bg-zinc-900 ${
              billingCycle === "monthly"
                ? "border-2 border-slate-900 shadow-md dark:border-white"
                : "border-slate-200 dark:border-zinc-800"
            }`}
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Flexible Monthly
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Monthly Plan</h3>
                <div className="flex items-baseline space-x-1.5 pt-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">$49</span>
                  <span className="text-xs font-bold text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Month-to-month subscription. Cancel or adjust anytime.
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-700 dark:border-zinc-800 dark:text-zinc-300">
                {[
                  "Dedicated Pharmacy Website (Auto-generated)",
                  "Custom Domain Support (e.g. www.yourpharmacy.co.uk)",
                  "Local SEO Engine & Automatic Google Search Indexing",
                  "NextDoorClinic Healthcare Directory Listing",
                  "Online Booking System & Counter Walk-in POS (<30s)",
                  "Patient Self-Serve Portal & OTP Verification",
                  "Branded SMS, Email & WhatsApp Dispatches",
                  "Interactive Multi-Staff Calendar & Roster",
                  "Patient Review Collection Engine",
                  "Revenue & Booking Source Analytics",
                  "Secure Cloud Hosting & Uptime SLA",
                ].map((feat, i) => (
                  <div key={i} className="flex items-center space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleCheckout("STARTER")}
                className="shadow-xs w-full rounded-xl border border-slate-300 bg-white py-3 text-xs font-black uppercase tracking-wider text-slate-900 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                Select Monthly Plan ($49/mo)
              </button>
            </div>
          </div>

          {/* YEARLY PLAN CARD (BEST VALUE) */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border-2 bg-emerald-50/50 p-6 transition-all dark:bg-emerald-950/20 ${
              billingCycle === "yearly"
                ? "border-[#10B981] shadow-lg"
                : "border-emerald-300 dark:border-emerald-800"
            }`}
          >
            <span className="shadow-xs absolute -top-3.5 right-6 rounded-full bg-[#10B981] px-4 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              Save Over 15% Annually
            </span>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                  Best Value Plan
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Yearly Plan</h3>
                <div className="flex items-baseline space-x-1.5 pt-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">$499</span>
                  <span className="text-xs font-bold text-slate-500">/ year</span>
                </div>
                <p className="text-xs font-bold text-[#10B981]">
                  Equivalent to ~$41.50/month. Save $89 every year.
                </p>
              </div>

              <div className="space-y-2 border-t border-emerald-200/80 pt-4 text-xs font-bold text-slate-800 dark:border-emerald-900/60 dark:text-zinc-200">
                {[
                  "EVERYTHING IN MONTHLY PLAN",
                  "Dedicated Pharmacy Website & Custom Domain Support",
                  "Local SEO Engine & Google Indexing",
                  "Counter Walk-in POS & Slot Reservation (<30s)",
                  "Priority Verification & Fast Track Activation",
                  "Free SMS Credit Package Included",
                  "Priority 24/7 Clinical Desk Support",
                  "Continuous Platform Upgrades & SSL Security",
                ].map((feat, i) => (
                  <div key={i} className="flex items-center space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleCheckout("PRO")}
                className="w-full rounded-xl bg-[#10B981] py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-emerald-600 active:scale-95"
              >
                Activate Yearly Plan ($499/yr) →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DETAILED FEATURE COMPARISON TABLE (BIG TECH LINEAR STYLE) */}
      {/* ========================================================================= */}
      <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Detailed Platform Capability Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Compare all features included in your NextDoorClinic B2B subscription.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="py-3 font-bold">Feature / Capability</th>
                <th className="py-3 text-center font-bold">Starter (£49/mo)</th>
                <th className="py-3 text-center font-bold text-[#10B981]">Growth ($49/mo)</th>
                <th className="py-3 text-center font-bold">Enterprise (£199/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-zinc-800 dark:text-zinc-300">
              <tr>
                <td className="py-3 font-semibold">Auto-Generated Pharmacy Website</td>
                <td className="py-3 text-center text-emerald-600">✓ Included</td>
                <td className="py-3 text-center font-bold text-emerald-600">✓ Included</td>
                <td className="py-3 text-center text-emerald-600">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Custom Domain (www.yourpharmacy.co.uk)</td>
                <td className="py-3 text-center text-slate-400">—</td>
                <td className="py-3 text-center font-bold text-emerald-600">✓ Included</td>
                <td className="py-3 text-center text-emerald-600">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Local SEO & Schema.org JSON-LD</td>
                <td className="py-3 text-center text-slate-400">Basic</td>
                <td className="py-3 text-center font-bold text-emerald-600">
                  Full Automated Indexing
                </td>
                <td className="py-3 text-center text-emerald-600">Custom Metadata</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Counter Walk-in Booking POS (&lt;30s)</td>
                <td className="py-3 text-center text-slate-400">Standard</td>
                <td className="py-3 text-center font-bold text-emerald-600">✓ Included</td>
                <td className="py-3 text-center text-emerald-600">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Branded SMS & WhatsApp Notifications</td>
                <td className="py-3 text-center text-slate-400">Email Only</td>
                <td className="py-3 text-center font-bold text-emerald-600">SMS + WhatsApp</td>
                <td className="py-3 text-center text-emerald-600">Custom SMS Sender ID</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold">Booking Analytics & Revenue Reports</td>
                <td className="py-3 text-center text-slate-400">Basic</td>
                <td className="py-3 text-center font-bold text-emerald-600">Full Breakdown</td>
                <td className="py-3 text-center text-emerald-600">Custom Export</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BILLING & INVOICE HISTORY TABLE */}
      {/* ========================================================================= */}
      <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Billing & VAT Invoice History
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Download tax receipts and view past subscription invoices.
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleOpenBillingPortal}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            Stripe Invoices Portal &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs dark:divide-zinc-800">
          {[
            {
              id: "INV-2026-8801",
              date: "01 August 2026",
              amount: "£49.00",
              status: "Paid",
              card: "Visa ending 4242",
            },
            {
              id: "INV-2026-7701",
              date: "01 July 2026",
              amount: "£49.00",
              status: "Paid",
              card: "Visa ending 4242",
            },
            {
              id: "INV-2026-6601",
              date: "01 June 2026",
              amount: "£49.00",
              status: "Paid",
              card: "Visa ending 4242",
            },
          ].map((inv) => (
            <div
              key={inv.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#10B981] dark:bg-emerald-950/60">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{inv.id}</span>
                  <span className="block text-[10px] text-slate-400">
                    {inv.date} • {inv.card}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-extrabold text-slate-900 dark:text-white">{inv.amount}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {inv.status}
                </span>
                <button
                  type="button"
                  onClick={handleOpenBillingPortal}
                  className="flex items-center space-x-1 font-bold text-[#10B981] hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FREQUENTLY ASKED QUESTIONS ACCORDION */}
      {/* ========================================================================= */}
      <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Subscription & Billing FAQ
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Common questions regarding pharmacy growth plans and Stripe billing.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all dark:border-zinc-800 dark:bg-zinc-950/50"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="flex w-full items-center justify-between text-left text-xs font-extrabold text-slate-900 dark:text-white"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                )}
              </button>
              {openFaq === idx && (
                <p className="mt-2 border-t border-slate-200/60 pt-1 text-xs font-medium leading-relaxed text-slate-600 dark:border-zinc-800 dark:text-zinc-300">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
