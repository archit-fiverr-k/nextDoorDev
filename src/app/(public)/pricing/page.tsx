"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Building2,
  Zap,
  Globe,
  Search,
  Calendar,
  MessageSquare,
  BarChart,
  Check,
} from "lucide-react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");

  return (
    <div className="min-h-screen select-text bg-white font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* Top Header */}
      <header className="dark:border-zinc-850 sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:bg-zinc-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10B981] text-xs font-black text-white shadow-md">
              NC
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              NextDoorClinic
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register-clinic"
              className="flex items-center space-x-1.5 rounded-xl bg-[#10B981] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-600"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-16 py-12 sm:py-20">
        {/* Title & Billing Cycle Selector */}
        <div className="mx-auto max-w-4xl space-y-6 px-4 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-4 py-1.5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <Sparkles className="h-4 w-4 text-[#10B981]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#10B981]">
              Simple, Transparent B2B Subscription
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Everything Your Pharmacy Needs To Grow
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-slate-600 dark:text-zinc-400">
            Get Found. Get Booked. Grow Your Pharmacy. Replace web developers, SEO agencies, booking
            software, and SMS marketing tools with one affordable subscription.
          </p>

          {/* Billing Toggle Switch */}
          <div className="inline-flex items-center space-x-3 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all ${
                billingCycle === "MONTHLY"
                  ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Monthly Billing ($49/mo)
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("ANNUAL")}
              className={`flex items-center space-x-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all ${
                billingCycle === "ANNUAL"
                  ? "shadow-xs bg-[#10B981] text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <span>Annual Billing ($499/yr)</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white">
                Save &gt;15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-8 px-4 md:grid-cols-2">
          {/* Monthly Plan Card */}
          <div
            className={`space-y-6 rounded-3xl border bg-white p-8 transition-all dark:bg-zinc-900 ${
              billingCycle === "MONTHLY"
                ? "border-2 border-[#10B981] shadow-xl"
                : "border-slate-200 dark:border-zinc-800"
            }`}
          >
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Monthly Plan
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">$49</span>
                <span className="text-xs font-bold text-slate-500">/ month</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Flexible month-to-month subscription. Cancel anytime.
              </p>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
              {[
                "Dedicated Pharmacy Website (Auto-generated)",
                "Custom Domain Support (e.g. www.yourpharmacy.co.uk)",
                "Local SEO & Automated Google Indexing",
                "NextDoorClinic Healthcare Marketplace Listing",
                "Online Booking System & Counter POS",
                "Patient Portal & Self-Serve Appointments",
                "Branded SMS, Email & WhatsApp Dispatches",
                "Interactive Calendar & Staff Roster",
                "Continuous Platform Updates & Cloud Hosting",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href="/register-clinic"
                className="shadow-xs flex items-center justify-center space-x-2 rounded-2xl border border-slate-300 bg-white py-3.5 text-xs font-black uppercase text-slate-900 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <span>Select Monthly Plan</span>
              </Link>
            </div>
          </div>

          {/* Annual Plan Card */}
          <div
            className={`relative space-y-6 rounded-3xl border-2 bg-emerald-50/70 p-8 transition-all dark:bg-emerald-950/30 ${
              billingCycle === "ANNUAL"
                ? "border-2 border-[#10B981] shadow-2xl"
                : "border-emerald-300 dark:border-emerald-800"
            }`}
          >
            <span className="shadow-xs absolute -top-3.5 right-6 rounded-full bg-[#10B981] px-4 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              Best Value (Save &gt;15%)
            </span>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#10B981]">
                Annual Plan
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">$499</span>
                <span className="text-xs font-bold text-slate-500">/ year</span>
              </div>
              <p className="text-xs font-bold text-[#10B981]">
                Equivalent to ~$41.50/month. Save over 15% annually.
              </p>
            </div>

            <div className="space-y-3 border-t border-emerald-200/80 pt-4 dark:border-emerald-900/60">
              {[
                "EVERYTHING IN MONTHLY PLAN",
                "Priority Pharmacy Verification (< 12 hours)",
                "Dedicated Onboarding Specialist",
                "Custom Domain SSL & DNS Setup Support",
                "Priority 24/7 Clinical Desk Support",
                "Free SMS Credit Pack Included",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2.5 text-xs font-black text-slate-900 dark:text-white"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href="/register-clinic"
                className="flex items-center justify-center space-x-2 rounded-2xl bg-[#10B981] py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-emerald-600"
              >
                <span>Select Annual Plan & Save →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Full Feature Checklist */}
        <div className="mx-auto max-w-4xl space-y-8 border-t border-slate-200/80 px-4 pt-16 dark:border-zinc-800">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Every Subscribed Pharmacy Receives
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Zero hidden fees. Complete digital growth infrastructure included.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                title: "Dedicated Website",
                desc: "Auto-generated from your profile, e.g. www.westendpharmacy.co.uk",
              },
              {
                title: "Local SEO Engine",
                desc: "Meta tags, Schema.org JSON-LD, Sitemap & Google indexing",
              },
              {
                title: "Marketplace Exposure",
                desc: "Listed inside NextDoorClinic NHS & private healthcare directory",
              },
              {
                title: "Online Booking System",
                desc: "24/7 real-time availability slots & slot lock engine",
              },
              {
                title: "Counter POS Walk-in Panel",
                desc: "<30 second quick walk-in appointment reservation panel",
              },
              {
                title: "Branded SMS & Email",
                desc: "Confirmations, reminders, OTPs & review requests",
              },
              {
                title: "WhatsApp Notifications",
                desc: "Instant WhatsApp booking confirmations & reminders",
              },
              {
                title: "Patient Portal",
                desc: "Self-serve booking management & review submission",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-start space-x-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#10B981]" />
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{f.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
