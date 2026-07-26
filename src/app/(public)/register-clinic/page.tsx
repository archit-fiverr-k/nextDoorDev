"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RegisterWizard } from "../../(auth)/register/register-wizard";
import {
  ShieldCheck,
  HelpCircle,
  CheckSquare,
  ArrowLeft,
  ChevronDown,
  Building2,
  Lock,
  BadgeCheck,
  CheckCircle2,
  FileText,
} from "lucide-react";

export default function RegisterClinicPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqItems = [
    {
      q: "How long does verification take?",
      a: "Registrations are reviewed by our operations desk within 24 working hours under regulatory clinical protocols. Once approved, your clinic directory profile becomes instantly live.",
    },
    {
      q: "Can I manage services & opening hours later?",
      a: "Yes. You can activate services, alter opening hour slots, update staff rosters, configure blackout windows, and set prices anytime from your provider dashboard.",
    },
    {
      q: "What GPhC details are required?",
      a: "You need to supply your official General Pharmaceutical Council (GPhC) premises reference or clinical registration number for automated regulatory lookup.",
    },
  ];

  return (
    <div className="flex min-h-screen select-text flex-col justify-between bg-slate-50/50 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* Top minimal header */}
      <header className="dark:border-zinc-850 sticky top-0 z-50 select-none border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:bg-zinc-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-[#10B981] dark:text-zinc-400"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
            <span className="text-slate-300 dark:text-zinc-800">|</span>
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10B981] text-xs font-black text-white shadow-md">
                NC
              </div>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                NextDoorClinic
              </span>
            </Link>
          </div>

          <div className="hidden items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-50/80 px-3.5 py-1.5 dark:border-emerald-900/60 dark:bg-emerald-950/40 sm:flex">
            <ShieldCheck className="h-4 w-4 text-[#10B981]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
              Clinic Registration Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* LEFT: REGISTRATION WIZARD (Wrapped in a premium card) */}
          <div className="space-y-6">
            <div className="dark:border-zinc-850 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl dark:bg-zinc-900 sm:p-8">
              <div className="dark:border-zinc-850 mb-6 select-none space-y-2 border-b border-slate-100 pb-6">
                <div className="flex items-center space-x-2">
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#10B981] dark:bg-emerald-950/50">
                    B2B Healthcare Provider Onboarding
                  </span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Register Practice Workspace
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Establish your clinic directory branch, opening hours, GPhC accreditation, and
                  subscription billing.
                </p>
              </div>

              <RegisterWizard />
            </div>
          </div>

          {/* RIGHT: HELPER CONTENT SIDEBAR */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            {/* Compliance Banner */}
            <div className="space-y-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-[#000e35] p-6 text-white shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-[#10B981]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    UK Regulatory Compliance
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-400">
                    NHS & GPhC Audit Verified
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                NextDoorClinic is designed in partnership with accredited UK prescribers. All branch
                listings conform strictly to General Pharmaceutical Council (GPhC) and Care Quality
                Commission (CQC) scope protocols.
              </p>
            </div>

            {/* Onboarding checklist */}
            <div className="shadow-xs dark:border-zinc-850 space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 dark:bg-zinc-900">
              <h3 className="dark:border-zinc-850 flex select-none items-center gap-2 border-b border-slate-100 pb-3 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                <CheckSquare className="h-4 w-4 text-[#10B981]" />
                Onboarding Requirements
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: "Registered GPhC Reference Number",
                    desc: "Your premises ID synchronizes with official pharmaceutical registers.",
                  },
                  {
                    title: "Verification Certificate Upload",
                    desc: "Supply a registration document or utility certificate to approve your branch.",
                  },
                  {
                    title: "Authorized Payment Method",
                    desc: "Valid billing details required to activate monthly/annual provider plan.",
                  },
                  {
                    title: "Audit Log Verification",
                    desc: "Every registration request creates a timestamped compliance record.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-black text-[#10B981] dark:bg-emerald-950/60">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold leading-tight text-slate-800 dark:text-zinc-200">
                        {item.title}
                      </h4>
                      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Onboarding FAQ Accordion */}
            <div className="shadow-xs dark:border-zinc-850 space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 dark:bg-zinc-900">
              <h3 className="dark:border-zinc-850 flex select-none items-center gap-2 border-b border-slate-100 pb-3 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                <HelpCircle className="h-4 w-4 text-[#10B981]" />
                Onboarding FAQ
              </h3>

              <div className="space-y-2">
                {faqItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="dark:bg-zinc-850 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all dark:border-zinc-800"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                          openFaq === idx ? "rotate-180 text-[#10B981]" : ""
                        }`}
                      />
                    </button>
                    {openFaq === idx && (
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-500 animate-in fade-in dark:text-zinc-400">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="dark:border-zinc-850 select-none border-t border-slate-200/80 bg-white py-6 text-center dark:bg-zinc-950">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          © {new Date().getFullYear()} NextDoorClinic Marketplace. All Rights Reserved. NHS & GPhC
          Verified System.
        </p>
      </footer>
    </div>
  );
}
