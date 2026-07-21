import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, FileText, Lock, AlertCircle, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Clinical Governance & Patient Safety Standards | NextDoorClinic",
  description:
    "Explore NextDoorClinic's clinical governance framework, CQC/GPhC regulatory compliance, independent prescribing protocols, and Duty of Candour guidelines.",
};

export default function ClinicalGovernancePage() {
  return (
    <div className="w-full bg-white font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* 1. HERO HEADER */}
      <section className="border-b border-slate-100 pb-16 pt-16 dark:border-zinc-800/80 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-4xl space-y-6 px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B981]">
            <ShieldCheck className="h-4 w-4" />
            <span>Clinical Standards & Regulatory Policy</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#0F172A] dark:text-white sm:text-5xl lg:text-6xl">
            Clinical Governance & Safety Framework
          </h1>

          <p className="text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-300">
            NextDoorClinic operates under strict clinical oversight to ensure every independent
            pharmacy, private GP clinic, and travel health provider on our network delivers safe,
            evidence-based, and patient-centered healthcare.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-500">
            <span>Last Reviewed: July 2024</span>
            <span>&bull;</span>
            <span>Version: 3.2</span>
            <span>&bull;</span>
            <span>Applies to: All Registered Healthcare Providers</span>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL ARTICLE LAYOUT */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-16 px-6 lg:px-8">
          {/* Section 1 */}
          <div className="space-y-4 border-b border-slate-100 pb-12 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              01. Regulatory Compliance
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
              General Pharmaceutical Council (GPhC) & Care Quality Commission (CQC) Standards
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                All community pharmacies listed on NextDoorClinic must maintain active registration
                with the General Pharmaceutical Council (GPhC) in Great Britain or the
                Pharmaceutical Society of Northern Ireland (PSNI).
              </p>
              <p>
                Where regulated clinical procedures are performed—including independent prescribing,
                diagnostic blood testing, or surgical consultations—providers are audited against
                Care Quality Commission (CQC) Fundamental Standards. We verify registration
                credentials directly against official registries prior to activating clinic
                profiles.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4 border-b border-slate-100 pb-12 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              02. Prescribing Protocols
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
              Independent Prescribing & Patient Group Directions (PGDs)
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                Clinical consultations on NextDoorClinic are conducted strictly by qualified
                Independent Prescribers (pharmacists or nurses) or under robust, up-to-date Patient
                Group Directions (PGDs) authored by UK registered medical doctors.
              </p>
              <p>
                Prescribers must practice within their defined clinical competency scope. High-risk
                controlled drugs (Schedule 2 and 3 controlled substances) are not prescribed via
                online marketplace bookings.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4 border-b border-slate-100 pb-12 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              03. Infection Control & Hygiene
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
              Infection Prevention & Clinical Premises Hygiene
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                Every consultation room must meet statutory infection control standards. For
                procedures such as microsuction ear wax removal or blood sampling, clinics must
                utilize single-use sterile consumables, certified autoclaves, and licensed clinical
                waste disposal contracts.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-4 border-b border-slate-100 pb-12 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              04. Transparency & Candour
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
              Duty of Candour & Clinical Incident Reporting
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                NextDoorClinic enforces a transparent Duty of Candour. In the unlikely event of a
                clinical adverse event or booking discrepancy, providers are obligated to inform the
                patient immediately, offer appropriate medical remediation, and log a formal report
                with our Clinical Safety Desk.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              05. Clinical Audit Desk
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
              Contact our Safeguarding & Safety Officer
            </h2>
            <p className="text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              If you have any questions regarding clinical safety, practitioner verification, or
              patient safeguarding, please contact our Clinical Governance Team directly.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-5 py-3 text-xs font-bold text-white transition-all hover:bg-slate-900"
              >
                <span>Contact Clinical Governance Desk</span>
                <FileText className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
