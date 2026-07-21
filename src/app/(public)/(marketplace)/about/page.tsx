import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Award,
  CheckCircle2,
  Building,
  Activity,
  Lock,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | NextDoorClinic",
  description:
    "Discover how NextDoorClinic is building the UK's clinical directory and practice infrastructure, connecting patients with verified GPhC independent prescribers and community clinics.",
};

export default function AboutPage() {
  return (
    <div className="w-full bg-white font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* 1. HERO SECTION (Editorial Large Typography) */}
      <section className="border-b border-slate-100 pb-20 pt-16 dark:border-zinc-800/80 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-5xl space-y-8 px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B981]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#10B981]" />
            <span>UK Community Healthcare Infrastructure</span>
          </div>

          <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-[#0F172A] dark:text-white sm:text-6xl lg:text-7xl">
            Reimagining how patients access care in their local community.
          </h1>

          <p className="max-w-3xl pt-2 text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl">
            NextDoorClinic is the United Kingdom&apos;s leading clinical directory and practice
            management technology platform. We bridge the gap between patients needing timely
            clinical consultations and independent GPhC prescribers, private GPs, and specialized
            travel health clinics.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-xl bg-[#10B981] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0e9f6e]"
            >
              <span>Explore Clinical Directory</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/clinical-governance"
              className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-6 py-3.5 text-sm font-bold text-[#0F172A] transition-all hover:bg-slate-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              Read Clinical Standards
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS & INFRASTRUCTURE SCALE (Full-width flat numerical grid) */}
      <section className="border-b border-slate-100 bg-slate-50 py-16 dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
            <div className="space-y-1">
              <p className="text-3xl font-black tracking-tight text-[#0F172A] dark:text-white sm:text-4xl lg:text-5xl">
                500+
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verified UK Clinics
              </p>
              <p className="pt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                Audited GPhC & CQC providers across NHS regions.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-black tracking-tight text-[#10B981] sm:text-4xl lg:text-5xl">
                250,000+
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Appointments Booked
              </p>
              <p className="pt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                Connecting patients to care in under 2 minutes.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-black tracking-tight text-[#0F172A] dark:text-white sm:text-4xl lg:text-5xl">
                99.8%
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clinical Audit Score
              </p>
              <p className="pt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                Adhering to strict NHS Information Governance.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-black tracking-tight text-[#0F172A] dark:text-white sm:text-4xl lg:text-5xl">
                &lt; 24h
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Average Slot Availability
              </p>
              <p className="pt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                Eliminating primary care waiting lists nationwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ASYMMETRICAL EDITORIAL: OUR MISSION & THE HEALTHCARE PROBLEM */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl space-y-20 px-6 lg:px-8">
          {/* Row 1: The Problem */}
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 lg:gap-16">
            <div className="space-y-3 md:col-span-5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                01 / The Challenge
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
                Primary care bottlenecks require a modern solution.
              </h2>
            </div>
            <div className="space-y-4 text-base font-normal leading-relaxed text-slate-600 dark:text-slate-300 md:col-span-7">
              <p>
                For millions of patients across the UK, securing a timely clinical consultation for
                routine healthcare—such as travel vaccinations, microsuction ear wax removal, blood
                diagnostics, or prescription re-orders—has historically involved weeks of waiting.
              </p>
              <p>
                At the same time, thousands of highly trained General Pharmaceutical Council (GPhC)
                Independent Prescribers and community healthcare practices operate with clinical
                capacity right on the high street, yet lack modern digital booking infrastructure to
                connect with local patients.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-slate-100 dark:border-zinc-800/80" />

          {/* Row 2: The Solution */}
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 lg:gap-16">
            <div className="space-y-3 md:col-span-5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#10B981]">
                02 / The Solution
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
                Empowering independent clinics with SaaS technology.
              </h2>
            </div>
            <div className="space-y-4 text-base font-normal leading-relaxed text-slate-600 dark:text-slate-300 md:col-span-7">
              <p>
                NextDoorClinic provides independent community pharmacies and clinics with an
                end-to-end clinical practice management platform. We provide live availability
                management, multi-service checkout workflows, automated SMS & email reminders, and
                integrated patient records.
              </p>
              <p>
                For patients, we offer a single, trusted marketplace where they can compare verified
                local providers, check upfront prices, read GPhC registration credentials, and book
                appointments seamlessly without requiring pre-registration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CLINICAL GOVERNANCE & SAFETY (Dark Slate Contrast Section) */}
      <section className="bg-[#0F172A] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-5xl space-y-16 px-6 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-bold text-[#10B981]">
              <ShieldCheck className="h-4 w-4" />
              <span>Uncompromised Clinical Safety</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Built on strict NHS & GPhC regulatory standards.
            </h2>
            <p className="text-base font-normal leading-relaxed text-slate-300">
              Patient safety and clinical integrity are at the core of everything we build. Every
              clinic listed on NextDoorClinic undergoes rigorous verification before receiving
              active listing status.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-3 border-l-2 border-[#10B981] pl-5">
              <h3 className="text-lg font-bold text-white">GPhC Register Validation</h3>
              <p className="text-xs font-medium leading-relaxed text-slate-400">
                We verify pharmacy premises registration numbers and independent prescriber license
                credentials directly against the GPhC register.
              </p>
            </div>

            <div className="space-y-3 border-l-2 border-slate-700 pl-5">
              <h3 className="text-lg font-bold text-white">CQC Standard Compliance</h3>
              <p className="text-xs font-medium leading-relaxed text-slate-400">
                Clinics offering regulated surgical or diagnostic procedures must hold valid Care
                Quality Commission (CQC) approvals.
              </p>
            </div>

            <div className="space-y-3 border-l-2 border-slate-700 pl-5">
              <h3 className="text-lg font-bold text-white">GDPR & Cyber Security</h3>
              <p className="text-xs font-medium leading-relaxed text-slate-400">
                Patient consultation data is encrypted using AES-256 in transit and at rest,
                complying strictly with NHS Data Security Standards.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4 text-xs font-medium text-slate-400">
            <span>NextDoorClinic Clinical Governance Advisory Board</span>
            <Link href="/clinical-governance" className="font-bold text-[#10B981] hover:underline">
              View Governance Policy &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="border-t border-slate-100 py-20 dark:border-zinc-800/80 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-6 px-6 text-center lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-4xl">
            Ready to find healthcare near you?
          </h2>
          <p className="mx-auto max-w-xl text-base font-medium text-slate-600 dark:text-slate-400">
            Search verified community clinics, compare services, and book your appointment in under
            2 minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-xl bg-[#10B981] px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0e9f6e]"
            >
              <span>Find a Local Clinic</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
