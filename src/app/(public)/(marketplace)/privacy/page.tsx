import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy & Data Security | NextDoorClinic",
  description:
    "Learn how NextDoorClinic processes, encrypts, and protects patient personal health data under UK GDPR, DPA 2018, and NHS Information Governance standards.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full bg-white font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* 1. HERO HEADER */}
      <section className="border-b border-slate-100 pb-16 pt-16 dark:border-zinc-800/80 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-4xl space-y-6 px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B981]">
            <Lock className="h-4 w-4" />
            <span>UK GDPR & Data Protection Compliance</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#0F172A] dark:text-white sm:text-5xl lg:text-6xl">
            Privacy Policy & Health Record Security
          </h1>

          <p className="text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-300">
            NextDoorClinic is committed to safeguarding your medical data and personal information.
            This Privacy Policy details how we collect, process, encrypt, and manage patient records
            in compliance with UK General Data Protection Regulation (UK GDPR), the Data Protection
            Act 2018, and NHS Caldicott Principles.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-500">
            <span>Effective Date: July 2024</span>
            <span>&bull;</span>
            <span>Data Controller: NextDoorClinic Health Technologies Ltd</span>
            <span>&bull;</span>
            <span>ICO Registration: ZB892014</span>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL CONTENT LAYOUT */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-14 px-6 lg:px-8">
          {/* Section 1 */}
          <div className="space-y-4 border-b border-slate-100 pb-10 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              01. Information We Collect
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Personal Data & Special Category Health Records
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                When you make an appointment or register a patient profile on NextDoorClinic, we
                collect information necessary to facilitate your clinical care:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 font-medium text-slate-700 dark:text-slate-200">
                <li>
                  Contact Information: Full name, email address, mobile phone number, and
                  residential address.
                </li>
                <li>
                  Clinical Booking Details: Selected pharmacy/clinic, appointment date/time,
                  treatment type, and voluntary consultation notes.
                </li>
                <li>
                  Special Category Data: Pre-existing medical conditions, allergies, or NHS number
                  provided voluntarily to assist your consulting clinician.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4 border-b border-slate-100 pb-10 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              02. How Data is Used
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Lawful Basis & Clinical Communication
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                We process your personal data under the lawful basis of contract performance (to
                book your requested clinical service) and provision of healthcare under UK GDPR
                Article 9(2)(h).
              </p>
              <p>
                Your data is transmitted securely to your chosen registered pharmacy or clinic so
                they can review your record prior to your appointment. We do not sell, rent, or
                trade patient health records to third-party advertisers.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4 border-b border-slate-100 pb-10 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              03. Encryption & Storage
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Data Storage Security & NHS Toolkit Alignment
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                All patient data is stored within ISO 27001-certified UK data centers. Electronic
                data is encrypted using AES-256 encryption at rest and TLS 1.3 encryption in
                transit. Our infrastructure aligns with the NHS Data Security and Protection Toolkit
                (DSPT).
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-4 border-b border-slate-100 pb-10 dark:border-zinc-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              04. Your Rights
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Subject Access Requests (SARs) & Data Portability
            </h2>
            <div className="space-y-3 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              <p>Under UK GDPR, you hold full rights regarding your personal data:</p>
              <ul className="list-disc space-y-1.5 pl-5 font-medium text-slate-700 dark:text-slate-200">
                <li>
                  Right to Access: Request a full copy of your personal health data processed by
                  NextDoorClinic.
                </li>
                <li>
                  Right to Rectification: Correct any incomplete or inaccurate medical profile
                  information.
                </li>
                <li>
                  Right to Erasure: Request account deletion (subject to statutory medical record
                  retention rules).
                </li>
              </ul>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              05. Data Protection Officer
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Contact our Information Rights Team
            </h2>
            <p className="text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              For privacy inquiries, Subject Access Requests, or Caldicott guardian matters, please
              contact{" "}
              <strong className="text-[#0F172A] dark:text-white">dpo@nextdoorclinic.co.uk</strong>{" "}
              or write to NextDoorClinic Health Technologies Ltd, 12 Wardour St, Soho, London, W1D
              1AN.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
