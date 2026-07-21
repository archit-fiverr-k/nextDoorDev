import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service & Clinical Terms | NextDoorClinic",
  description:
    "Review NextDoorClinic's Terms of Service, booking marketplace policies, cancellation terms, and clinical consultation agreements.",
};

export default function TermsPage() {
  return (
    <div className="w-full bg-white font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* 1. HERO HEADER */}
      <section className="border-b border-slate-100 pb-16 pt-16 dark:border-zinc-800/80 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-4xl space-y-6 px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B981]">
            <FileText className="h-4 w-4" />
            <span>Marketplace Terms & Conditions</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#0F172A] dark:text-white sm:text-5xl lg:text-6xl">
            Terms of Service & Clinical Booking Agreement
          </h1>

          <p className="text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-300">
            These Terms of Service govern your use of the NextDoorClinic directory and practice
            technology platform. By searching, booking, or managing appointments through our
            website, you agree to these terms.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-500">
            <span>Last Updated: July 2024</span>
            <span>&bull;</span>
            <span>Applies to: Patients & Marketplace Visitors</span>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL CONTENT LAYOUT */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-14 px-6 lg:px-8">
          {/* Section 1 */}
          <div className="space-y-4 border-b border-slate-100 pb-10 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              01. Marketplace Infrastructure
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Platform Role & Healthcare Provider Responsibility
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                NextDoorClinic provides technology connecting patients with independent healthcare
                providers. Clinical services are rendered directly by the registered pharmacy,
                private GP practice, or travel clinic selected during booking.
              </p>
              <p>
                Each healthcare provider is independently responsible for clinical decision-making,
                patient consultations, prescribing appropriateness, and professional indemnity
                insurance under GPhC or GMC regulations.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4 border-b border-slate-100 pb-10 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              02. Booking & Approval
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Appointment Requests & Pharmacy Manual Approval
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                When you submit a booking request through NextDoorClinic, the appointment status
                defaults to{" "}
                <strong className="font-bold text-[#0F172A] dark:text-white">
                  Pending Pharmacy Approval
                </strong>
                . The pharmacy owner or head pharmacist reviews your request to ensure clinical
                suitability and schedule alignment.
              </p>
              <p>
                Your appointment is finalized once the clinic approves the booking. You will receive
                email and portal notifications immediately upon confirmation.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4 border-b border-slate-100 pb-10 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              03. Cancellations & Rescheduling
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Patient Cancellation & Missed Appointment Policies
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                Patients may cancel or request rescheduling of appointments up to 24 hours prior to
                the scheduled consultation time directly through their Patient Portal dashboard
                without penalty.
              </p>
              <p>
                Cancellations within 24 hours or missed appointments (&quot;no-shows&quot;) may be
                subject to clinic consultation fees as determined by the specific provider&apos;s
                policy.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-4 border-b border-slate-100 pb-10 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              04. Patient Verification
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Identity Verification & Accuracy of Information
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                Patients must provide accurate personal, contact, and medical history information.
                Clinicians reserve the right to verify government-issued photo identification (e.g.
                Passport or UK Driving Licence) prior to dispensing prescription medication or
                conducting clinical procedures.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              05. Legal Contact
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Questions Regarding Terms
            </h2>
            <p className="text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              For questions regarding these terms, please contact{" "}
              <strong className="text-[#0F172A] dark:text-white">legal@nextdoorclinic.co.uk</strong>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
