import React from "react";
import type { Metadata } from "next";
import { ShieldCheck, HeartPulse, Building2, Eye, ShieldAlert, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "CQC & GPhC Compliance | NextDoorClinic",
  description:
    "Learn about the strict Care Quality Commission (CQC) compliance protocols, General Pharmaceutical Council (GPhC) standards, and patient safeguarding systems utilized by NextDoorClinic.",
};

export default function CqcCompliancePage() {
  return (
    <div className="relative flex-1 overflow-hidden bg-brand-bg px-6 py-16 sm:py-24 lg:px-8">
      {/* Decorative Radial Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--ring)/0.08,transparent_55%),radial-gradient(ellipse_at_bottom_left,var(--accent)/0.05,transparent_50%)]" />

      <div className="mx-auto max-w-4xl space-y-12 sm:space-y-16">
        {/* Header Section */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-teal">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Clinical Assurance</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy dark:text-white sm:text-5xl">
            CQC & GPhC <span className="text-brand-teal">Compliance Standards</span>
          </h1>
          <p className="text-brand-muted mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">
            Patient safety is our primary directive. Discover how NextDoorClinic and our partner
            clinics verify qualifications, ensure clinical safety, and comply with UK statutory
            regulations.
          </p>
        </div>

        {/* CQC Regulatory Framework Overview */}
        <div className="shadow-premium space-y-6 rounded-2xl border border-border/80 bg-white p-8 dark:bg-zinc-950 sm:p-10">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-brand-navy dark:text-white">
            <Building2 className="h-6 w-6 text-brand-teal" />
            The Care Quality Commission (CQC)
          </h2>
          <p className="text-brand-muted text-sm font-normal leading-relaxed">
            The CQC is the independent regulator of all health and social care services in England.
            Under standard regulations, doctors, dentists, clinics, and certain diagnostic providers
            must register with the CQC and receive regular inspections.
          </p>
          <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-5 dark:border-zinc-800/40 dark:bg-zinc-900/40">
            <h3 className="flex items-center gap-2 text-sm font-bold text-brand-navy dark:text-white">
              <CheckCircle className="h-4.5 w-4.5 text-brand-teal" />
              Do community pharmacies need CQC registration?
            </h3>
            <p className="text-brand-muted text-xs font-normal leading-relaxed">
              Standard pharmaceutical and prescription dispensing services in the UK are regulated
              by the <strong>General Pharmaceutical Council (GPhC)</strong> rather than the CQC.
              However, if a community pharmacy hosts private clinic doctors, provides diagnostic
              screening outside standard exemptions, or works with prescribing agencies, CQC
              regulations apply.
            </p>
            <p className="text-brand-muted text-xs font-normal leading-relaxed">
              NextDoorClinic strictly audits providers. We identify CQC registered activities and
              ensure all clinical activities are mapped to their respective statutory regulatory
              body.
            </p>
          </div>
        </div>

        {/* Pillars of Safeguarding */}
        <div className="space-y-6">
          <h2 className="text-center text-xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-2xl">
            Our Patient Safeguarding Safeguards
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-border/80 bg-white p-6 dark:bg-zinc-950">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-brand-navy dark:text-white">
                GPhC Registry Verification
              </h3>
              <p className="text-brand-muted text-xs font-normal leading-relaxed">
                All community pharmacies on our platform are verified against the official General
                Pharmaceutical Council database. We verify register numbers, premises numbers, and
                superintendent pharmacist registrations.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border/80 bg-white p-6 dark:bg-zinc-950">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-brand-navy dark:text-white">
                Clinical Pathway Audit
              </h3>
              <p className="text-brand-muted text-xs font-normal leading-relaxed">
                Our SaaS practice platform maintains comprehensive audit trails. Pharmacy managers
                can trace patient history, verify clinical questionnaire submissions, and review
                appointments to maintain high clinical standard compliance.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border/80 bg-white p-6 dark:bg-zinc-950">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-brand-navy dark:text-white">
                Data Privacy & GDPR
              </h3>
              <p className="text-brand-muted text-xs font-normal leading-relaxed">
                NextDoorClinic takes data protection extremely seriously. All medical queries and
                bookings are secured using TLS encryption and hosted in UK-based secure server
                datacenters compliant with NHS and ICO guidelines.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border/80 bg-white p-6 dark:bg-zinc-950">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-brand-navy dark:text-white">
                Prescribing Standards
              </h3>
              <p className="text-brand-muted text-xs font-normal leading-relaxed">
                Clinical services providing prescription-only medicines (POM) via independent
                prescribing (IP) pharmacists are checked for valid GPhC IP annotations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
