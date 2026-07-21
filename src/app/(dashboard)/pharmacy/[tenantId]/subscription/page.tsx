"use client";

import React, { useState } from "react";
import {
  Zap,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface SubscriptionPageProps {
  params: {
    tenantId: string;
  };
}

export default function SubscriptionPage({ params }: SubscriptionPageProps) {
  const [currentPlan, setCurrentPlan] = useState("Growth");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Starter",
      monthlyPrice: "£49",
      yearlyPrice: "£39",
      features: [
        "1 Pharmacy Location",
        "Up to 2 Staff Accounts",
        "Online Booking Engine",
        "Email Notifications",
        "Standard Analytics",
      ],
      popular: false,
    },
    {
      name: "Growth",
      monthlyPrice: "£99",
      yearlyPrice: "£79",
      features: [
        "Up to 3 Locations",
        "Unlimited Staff Accounts",
        "Advanced Patient CRM & Charts",
        "SMS & WhatsApp Notifications",
        "Custom Branding & Domain",
        "Priority Support Desk",
      ],
      popular: true,
    },
    {
      name: "Enterprise Group",
      monthlyPrice: "£249",
      yearlyPrice: "£199",
      features: [
        "Unlimited Pharmacy Group Locations",
        "Custom API & EHR System Sync",
        "Dedicated Account Manager",
        "99.9% SLA Uptime Guarantee",
        "Custom Contract & BACS Billing",
      ],
      popular: false,
    },
  ];

  return (
    <div className="select-text space-y-6">
      {/* Header Banner */}
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Subscription & B2B Plan Management
              </h1>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                Active Subscription
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Your next auto-renewal date is August 20, 2026 (£99.00/month).
            </p>
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-3 py-1.5 ${billingCycle === "monthly" ? "bg-white font-bold text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-slate-100" : "text-slate-500"}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-lg px-3 py-1.5 ${billingCycle === "yearly" ? "bg-white font-bold text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-slate-100" : "text-slate-500"}`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>
      </div>

      {/* Plan Cards Matrix */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlan;
          return (
            <div
              key={plan.name}
              className={`relative space-y-5 rounded-2xl border bg-white p-6 shadow-sm transition-all dark:bg-zinc-950 ${
                plan.popular
                  ? "border-teal-500 ring-2 ring-teal-500/20 dark:ring-teal-500/10"
                  : "border-slate-200/80 dark:border-zinc-800/80"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  Most Popular for Pharmacies
                </span>
              )}

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
                  {plan.name}
                </h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                    {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="text-xs font-medium text-slate-400">/ month</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-2 text-xs text-slate-700 dark:border-zinc-900 dark:text-zinc-300">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 shrink-0 text-teal-600" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  disabled={isCurrent}
                  onClick={() => setCurrentPlan(plan.name)}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all ${
                    isCurrent
                      ? "cursor-default bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-600"
                      : "bg-slate-900 text-white shadow-sm hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
                  }`}
                >
                  {isCurrent ? "Current Plan" : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
