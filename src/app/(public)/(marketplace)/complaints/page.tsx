import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Clock, ShieldCheck, Phone, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Patient Complaints Policy & Escalation Framework | NextDoorClinic",
  description:
    "Review NextDoorClinic's formal 3-stage patient complaint resolution process, Duty of Candour guidelines, and independent Ombudsman escalation options.",
};

export default function ComplaintsPage() {
  return (
    <div className="w-full bg-white font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* 1. HERO HEADER */}
      <section className="border-b border-slate-100 pb-16 pt-16 dark:border-zinc-800/80 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-4xl space-y-6 px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B981]">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Patient Advocacy & Feedback Policy</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#0F172A] dark:text-white sm:text-5xl lg:text-6xl">
            Patient Complaints & Resolution Policy
          </h1>

          <p className="text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-300">
            NextDoorClinic is committed to providing an exceptional healthcare experience. If your
            care or booking experience falls below expectations, we operate a transparent, fair, and
            thorough 3-stage complaint resolution process.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-500">
            <span>SLA: 24h Initial Response</span>
            <span>&bull;</span>
            <span>Policy: NHS Compliant Complaints Protocol</span>
          </div>
        </div>
      </section>

      {/* 2. 3-STAGE RESOLUTION FRAMEWORK (Editorial Asymmetrical Layout) */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-16 px-6 lg:px-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
              Our 3-Stage Resolution Framework
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              We investigate all complaints impartially, ensuring lessons learned lead to continuous
              service improvement.
            </p>
          </div>

          {/* Timeline Steps */}
          <div className="space-y-12">
            {/* Stage 1 */}
            <div className="grid grid-cols-1 items-start gap-6 border-l-2 border-[#10B981] pl-6 md:grid-cols-12">
              <div className="space-y-1 md:col-span-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
                  Stage 01
                </span>
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                  Local Resolution
                </h3>
                <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
                  <Clock className="h-3.5 w-3.5" /> Acknowledged within 24 hours
                </p>
              </div>
              <div className="text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300 md:col-span-8">
                Submit your complaint to our Patient Advocacy Desk at{" "}
                <strong className="font-bold text-[#0F172A] dark:text-white">
                  complaints@nextdoorclinic.co.uk
                </strong>
                . Our clinical operations team will acknowledge your report within 24 hours and
                liaise with the consulting pharmacy/clinic to achieve immediate resolution.
              </div>
            </div>

            {/* Stage 2 */}
            <div className="grid grid-cols-1 items-start gap-6 border-l-2 border-slate-300 pl-6 dark:border-zinc-700 md:grid-cols-12">
              <div className="space-y-1 md:col-span-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Stage 02
                </span>
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                  Formal Investigation
                </h3>
                <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
                  <Clock className="h-3.5 w-3.5" /> Full report in 10 business days
                </p>
              </div>
              <div className="text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300 md:col-span-8">
                If Stage 1 does not resolve your concern, your case is escalated to our Head of
                Clinical Governance. A full investigation into clinical records, booking timelines,
                and staff consultations is conducted, culminating in a detailed written outcome
                report within 10 business days.
              </div>
            </div>

            {/* Stage 3 */}
            <div className="grid grid-cols-1 items-start gap-6 border-l-2 border-slate-300 pl-6 dark:border-zinc-700 md:grid-cols-12">
              <div className="space-y-1 md:col-span-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Stage 03
                </span>
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                  External Escalation
                </h3>
                <p className="text-xs font-medium text-slate-500">Independent Regulatory Bodies</p>
              </div>
              <div className="space-y-2 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300 md:col-span-8">
                <p>
                  If you remain dissatisfied following our formal response, you have the right to
                  escalate your complaint to independent healthcare ombudsman bodies:
                </p>
                <ul className="list-disc space-y-1 pl-5 text-xs font-medium text-slate-700 dark:text-slate-200">
                  <li>Parliamentary and Health Service Ombudsman (PHSO): www.ombudsman.org.uk</li>
                  <li>
                    General Pharmaceutical Council (GPhC Concerns Desk): www.pharmacyregulation.org
                  </li>
                  <li>Care Quality Commission (CQC): www.cqc.org.uk</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Box */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
              Submit a Complaint or Feedback
            </h3>
            <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              Please email{" "}
              <strong className="font-bold text-[#0F172A] dark:text-white">
                complaints@nextdoorclinic.co.uk
              </strong>{" "}
              with your appointment reference code, pharmacy name, and a summary of your concern.
              Our Patient Advocacy team will assist you immediately.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-5 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0e9f6e]"
              >
                <span>Contact Patient Advocacy Desk</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
