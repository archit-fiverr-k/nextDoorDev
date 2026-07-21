"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Calendar,
  Users,
  Building,
  Activity,
  CheckCircle2,
  Clock,
  Lock,
  Smartphone,
  Check,
  ChevronDown,
  X,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  MousePointerClick,
  FileCheck2,
  Database,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

interface B2bLandingProps {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: "super_admin" | "platform_admin" | "pharmacy";
    pharmacyId?: string | null;
  };
}

export function B2bLanding({ user }: B2bLandingProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    pharmacyName: "",
    email: "",
    phone: "",
    branches: "1",
  });

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.pharmacyName && formData.email) {
      setDemoSubmitted(true);
    }
  };

  const faqs = [
    {
      q: "How does the custom branding work? Do patients see NextDoorClinic?",
      a: "No. The booking flow is completely whitelabel. It lives on a sub-domain (e.g., yourname.nextdoorclinic.co.uk) or integrates directly with your existing website. Your logo, colors, and business name are the only elements patients see. NextDoorClinic branding is invisible.",
    },
    {
      q: "Can we set limits so we don't get overbooked?",
      a: "Yes. You have granular control over booking slots, service durations, buffer times, and maximum booking limits. You can block specific dates, set operational hours, and pause automated bookings instantly from your branch dashboard.",
    },
    {
      q: "How are notifications sent? Are there extra charges for SMS?",
      a: "Automated confirmation, reminder, and rescheduling notifications are sent via both email and SMS. The platform features an integrated communications gateway so you don't need to configure external SMS credits or API keys today.",
    },
    {
      q: "Is it compliant with UK healthcare data protection standards?",
      a: "Yes. NextDoorClinic is built from the ground up for UK pharmacy operations. The platform supports your GDPR compliance, registers communications, implements strict role-based access control, tracks audit logs, and supports secure data exports.",
    },
    {
      q: "Can patients reschedule or cancel their own bookings?",
      a: "Yes, you can enable self-service rescheduling. If enabled, patients receive a secure, private token link in their SMS/email confirmation. They can move or cancel their slot themselves, freeing up your phone line.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-800">
      {/* 1. Global Announcement Header */}
      <div className="flex select-none items-center justify-center space-x-2 border-b border-slate-800 bg-slate-950 px-4 py-2 text-center text-xs font-semibold text-white">
        <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-950">
          New Release
        </span>
        <span>Version 2.4 Whitelabel Engine is now live for all UK pharmacies.</span>
      </div>

      {/* 2. Main Header */}
      <header className="h-18 sticky top-0 z-50 flex select-none items-center justify-between border-b border-slate-200/60 bg-white/95 px-6 shadow-sm backdrop-blur-md lg:px-8">
        <Link href="#" className="group flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white shadow-md shadow-emerald-500/10 transition-transform group-hover:scale-105">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold leading-none tracking-tight text-slate-900">
              NextDoorClinic
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              B2B Portal
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="text-slate-650 hidden items-center space-x-8 text-xs font-semibold lg:flex">
          <Link href="#features" className="transition-colors hover:text-emerald-600">
            Platform Features
          </Link>
          <Link href="#problem" className="transition-colors hover:text-emerald-600">
            The Problem
          </Link>
          <Link href="#how-it-works" className="transition-colors hover:text-emerald-600">
            Patient Flow
          </Link>
          <Link href="#compliance" className="transition-colors hover:text-emerald-600">
            UK Compliance
          </Link>
          <Link href="#comparison" className="transition-colors hover:text-emerald-600">
            Why Us
          </Link>
          <Link href="#faq" className="transition-colors hover:text-emerald-600">
            FAQ
          </Link>
        </nav>

        {/* CTA Section */}
        <div className="flex items-center space-x-3.5">
          {user ? (
            <>
              {user.role === "super_admin" && (
                <Link
                  href="/admin"
                  className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2 text-xs font-bold text-emerald-600 transition-colors hover:bg-slate-100 hover:text-emerald-700"
                >
                  Super Admin
                </Link>
              )}
              {user.role === "platform_admin" && (
                <Link
                  href="/admin"
                  className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2 text-xs font-bold text-emerald-600 transition-colors hover:bg-slate-100 hover:text-emerald-700"
                >
                  Admin Console
                </Link>
              )}
              {user.role === "pharmacy" && (
                <Link
                  href={`/pharmacy/${user.pharmacyId}`}
                  className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  Workspace
                </Link>
              )}
              <form
                action={async () => {
                  await logoutAction();
                }}
              >
                <button
                  type="submit"
                  className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-rose-600"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
              >
                Admin Sign In
              </Link>
              <Link
                href="#demo"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-500 px-5 text-xs font-bold text-white shadow-sm shadow-emerald-500/10 transition-all hover:scale-[1.02] hover:bg-emerald-600 active:scale-[0.98]"
              >
                Book a Demo
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="border-slate-150 relative overflow-hidden border-b bg-gradient-to-tr from-slate-50 via-slate-50 to-emerald-50/20 pb-20 pt-16 md:pb-28 md:pt-24 lg:pb-36 lg:pt-32">
        {/* Soft background grid accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            {/* Tagline */}
            <div className="inline-flex select-none items-center space-x-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-sm">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>Independent Pharmacy Booking Platform</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="select-text text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Your Pharmacy Deserves More Than a{" "}
              <span className="relative inline-block text-emerald-600">Generic Booking System</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto max-w-2xl text-sm font-normal leading-relaxed text-slate-500 sm:text-base md:text-lg">
              Stop losing patients to generic NHS lists and phone interruptions. NextDoorClinic
              provides premium, whitelabel booking engines that integrate with your branch website,
              automate communication, and reduce call admin by 82%.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col justify-center gap-3.5 pt-4 sm:flex-row">
              <Link
                href="#demo"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-500 px-8 text-xs font-bold text-white shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.02] hover:bg-emerald-600 active:scale-[0.98]"
              >
                Request a Custom Demo
              </Link>
              <Link
                href="#features"
                className="text-slate-655 inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-8 text-xs font-bold shadow-sm transition-all hover:scale-[1.01] hover:bg-slate-50"
              >
                See Platform Features
              </Link>
            </div>
          </div>

          {/* Interactive B2B CSS Dashboard Mockup */}
          <div className="relative mx-auto mt-16 max-w-5xl select-none overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl md:mt-20">
            {/* Mockup Toolbar Header */}
            <div className="border-slate-150 flex items-center justify-between border-b bg-slate-50 px-5 py-3.5">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-slate-200" />
                <span className="h-3 w-3 rounded-full bg-slate-200" />
                <span className="h-3 w-3 rounded-full bg-slate-200" />
                <span className="ml-4 h-1.5 w-32 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                <Shield className="mr-1 h-3.5 w-3.5" />
                <span>UK SECURITY ACTIVE</span>
              </div>
            </div>

            {/* Mockup Body grid */}
            <div className="grid min-h-[380px] grid-cols-12 gap-0 bg-slate-50/50">
              {/* Left sidebar Mock */}
              <div className="border-slate-150 col-span-3 hidden space-y-4 border-r bg-white p-4 md:block">
                <div className="space-y-2">
                  <div className="h-2 w-12 rounded-full bg-slate-200" />
                  <div className="border-slate-150 h-7 w-full rounded-xl border bg-slate-100" />
                </div>
                <div className="space-y-1 pt-2">
                  <div className="flex h-8 w-full items-center rounded-xl border border-emerald-500/15 bg-emerald-500/10 px-3 text-[11px] font-bold text-emerald-700">
                    <Calendar className="mr-2 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>Booking Schedule</span>
                  </div>
                  <div className="flex h-8 w-full items-center rounded-xl px-3 text-[11px] font-bold text-slate-500">
                    <Users className="mr-2 h-3.5 w-3.5 shrink-0" />
                    <span>Patient CRM</span>
                  </div>
                  <div className="flex h-8 w-full items-center rounded-xl px-3 text-[11px] font-bold text-slate-500">
                    <Clock className="mr-2 h-3.5 w-3.5 shrink-0" />
                    <span>Availability Settings</span>
                  </div>
                  <div className="flex h-8 w-full items-center rounded-xl px-3 text-[11px] font-bold text-slate-500">
                    <Building className="mr-2 h-3.5 w-3.5 shrink-0" />
                    <span>Branding Controls</span>
                  </div>
                </div>
              </div>

              {/* Main Content Area Mock */}
              <div className="col-span-12 space-y-6 p-6 md:col-span-9">
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                      Daily Appointments
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-extrabold text-slate-900">42</span>
                      <span className="text-[10px] font-bold text-emerald-600">+18%</span>
                    </div>
                  </div>
                  <div className="space-y-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                      Call Volume Reduction
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-extrabold text-slate-900">-82%</span>
                      <span className="text-[10px] font-bold text-emerald-600">Target hit</span>
                    </div>
                  </div>
                  <div className="space-y-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                      Patient Satisfaction
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-extrabold text-slate-900">99.2%</span>
                      <span className="text-[10px] font-bold text-emerald-600">NHS Rating</span>
                    </div>
                  </div>
                </div>

                {/* Today's slots list simulation */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Live Bookings Feed
                    </h4>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                      Real-Time Sync Active
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-xs hover:bg-slate-50">
                      <div className="flex min-w-0 items-center space-x-3">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        <span className="truncate font-bold text-slate-800">Flu Vaccination</span>
                        <span className="text-[10px] text-slate-400">• Johnathan Doe</span>
                      </div>
                      <div className="flex shrink-0 items-center space-x-3">
                        <span className="text-[10px] font-bold text-slate-500">10:15 AM</span>
                        <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700">
                          Confirmed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-xs hover:bg-slate-50">
                      <div className="flex min-w-0 items-center space-x-3">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        <span className="truncate font-bold text-slate-800">COVID-19 Booster</span>
                        <span className="text-[10px] text-slate-400">• Sarah Connor</span>
                      </div>
                      <div className="flex shrink-0 items-center space-x-3">
                        <span className="text-[10px] font-bold text-slate-500">11:00 AM</span>
                        <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700">
                          Confirmed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-xs hover:bg-slate-50">
                      <div className="flex min-w-0 items-center space-x-3">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                        <span className="truncate font-bold text-slate-800">Health Screening</span>
                        <span className="text-[10px] text-slate-400">• David Vance</span>
                      </div>
                      <div className="flex shrink-0 items-center space-x-3">
                        <span className="text-[10px] font-bold text-slate-500">11:30 AM</span>
                        <span className="rounded border border-amber-100 bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
                          Pending OTP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Float Alert Card Simulation */}
            <div className="absolute bottom-4 right-4 flex max-w-sm animate-bounce items-center space-x-3 rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-xs text-white shadow-xl duration-1000">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold">Reminder Dispatched</p>
                <p className="text-[10px] text-slate-400">
                  SMS & Email reminder sent to Johnathan Doe
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trust Statistics Section */}
      <section className="border-b border-slate-200/60 bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="mb-10 select-none text-center">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              B2B Scale Metrics
            </span>
            <p className="text-slate-455 text-xs font-semibold">
              Empowering clinics, family pharmacies, and multi-branch groups across Great Britain
            </p>
          </div>

          <div className="grid select-text grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
            <div className="space-y-1 text-center">
              <span className="block text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                250k+
              </span>
              <span className="text-xs font-medium text-slate-500">Appointments Managed</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="block text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                250+
              </span>
              <span className="text-xs font-medium text-slate-500">UK Pharmacy Branches</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="block text-3xl font-extrabold tracking-tight text-emerald-600 sm:text-4xl">
                98.4%
              </span>
              <span className="text-xs font-medium text-slate-500">Booking Completion Rate</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="block text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                4.9/5
              </span>
              <span className="text-xs font-medium text-slate-500">
                Patient Satisfaction Rating
              </span>
            </div>
          </div>

          {/* Trusted Badges */}
          <div className="mt-14 flex select-none flex-wrap items-center justify-center gap-10 border-t border-slate-100 pt-8 opacity-40">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              NHS REGISTERED PHARMACIES
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              INDEPENDENT PRESCRIBERS
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              REGIONAL CLINIC GROUPS
            </span>
          </div>
        </div>
      </section>

      {/* 5. Problem Section */}
      <section id="problem" className="border-slate-150 border-b bg-slate-50 py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl space-y-3 text-center">
            <span className="text-slate-450 block text-[10px] font-extrabold uppercase tracking-widest">
              The Operational Bottleneck
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Pharmacy Bookings Shouldn&apos;t Feel Like Running a Call Centre
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Your pharmacists are highly trained clinical experts. They shouldn&apos;t waste their
              time answering route check calls or writing slot details in paper diaries.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Phone Interruptions</h3>
              <p className="text-xs font-normal leading-relaxed text-slate-500">
                Answering routine booking calls while treating patients breaks clinical focus, slows
                down prescriptions, and frustrates in-branch customers.
              </p>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Missed Appointments</h3>
              <p className="text-xs font-normal leading-relaxed text-slate-500">
                Without automatic reminders, patients forget slots, leaving doctors and treatment
                rooms unoccupied and losing private clinic revenue opportunities.
              </p>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Manual Diaries</h3>
              <p className="text-xs font-normal leading-relaxed text-slate-500">
                Maintaining booking details on paper ledgers makes calendar overlaps common,
                prevents central reporting, and makes multi-branch audit verification impossible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Solution Section */}
      <section className="border-b border-slate-200/60 bg-white py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left: Marketing copy */}
            <div className="space-y-6 lg:col-span-5">
              <span className="text-slate-450 block text-[10px] font-extrabold uppercase tracking-widest">
                Next-Gen Solution
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                A Unified Clinic Hub Custom-Branded For You
              </h2>
              <p className="text-xs font-normal leading-relaxed text-slate-500 sm:text-sm">
                NextDoorClinic gives your branch a fully integrated system that simplifies B2B
                bookings. It handles scheduling automatically, sends reminders, and compiles
                records.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Eliminate Phone Friction</h4>
                    <p className="text-slate-450 text-[11px]">
                      Let patients schedule appointments online in 60 seconds.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Your Brand, Your Value</h4>
                    <p className="text-slate-450 text-[11px]">
                      Whitelabel branding hides the platform, showcasing only your name and logo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Real-Time Integrity</h4>
                    <p className="text-slate-450 text-[11px]">
                      No phantom slots. Availability updates match your real branch calendar
                      instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Premium mockups */}
            <div className="relative rounded-3xl border border-slate-200/80 bg-slate-50 p-6 sm:p-8 lg:col-span-7">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-slate-50 via-slate-50 to-emerald-500/5" />
              <div className="relative space-y-6">
                {/* Simulated booking flow visual */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                    Branded Booking Window (Flu Vaccination)
                  </span>
                  <div className="space-y-2">
                    <div className="flex h-10 items-center justify-between rounded-xl border border-emerald-500 bg-emerald-50/20 px-3.5 text-xs font-bold text-emerald-800">
                      <span>Mon 10 Aug - 10:15 AM Slot</span>
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="grid grid-cols-2 gap-3.5 pt-1">
                      <div className="flex h-8 items-center rounded-lg border border-slate-200/60 bg-slate-100 px-3 text-[10px] font-medium text-slate-500">
                        First Name: Johnathan
                      </div>
                      <div className="flex h-8 items-center rounded-lg border border-slate-200/60 bg-slate-100 px-3 text-[10px] font-medium text-slate-500">
                        Last Name: Doe
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated notification card */}
                <div className="ml-auto max-w-sm space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white shadow-md">
                  <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Automated Email Dispatched</span>
                  </div>
                  <p className="text-xs font-bold">Booking Confirmation</p>
                  <p className="text-slate-450 text-[10px] leading-relaxed">
                    Sent to john.doe@gmail.com with custom directions and branch contact info.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How It Works Section */}
      <section id="how-it-works" className="border-slate-150 border-b bg-slate-50 py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl space-y-3 text-center">
            <span className="text-slate-450 block text-[10px] font-extrabold uppercase tracking-widest">
              Patient Booking Experience
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              From Discovery to Confirmation in Under a Minute
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              An incredibly simple booking journey designed to maximize conversion and reduce
              friction.
            </p>
          </div>

          <div className="relative grid select-none grid-cols-1 gap-6 md:grid-cols-4">
            <div className="relative space-y-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-slate-655 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold">
                1
              </span>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-950">
                Patient Visits Website
              </h4>
              <p className="text-[11px] leading-normal text-slate-500">
                Patient visits your branch website or clicks your social media listing.
              </p>
            </div>

            <div className="relative space-y-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-slate-655 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold">
                2
              </span>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-950">
                Clicks Book Link
              </h4>
              <p className="text-[11px] leading-normal text-slate-500">
                Taps the book link and opens your dedicated, whitelabel scheduling wizard.
              </p>
            </div>

            <div className="relative space-y-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-md shadow-emerald-500/10">
                3
              </span>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-950">
                Selects Slot & Books
              </h4>
              <p className="text-[11px] leading-normal text-slate-500">
                Picks service, available date, time slot, and enters basic info under a minute.
              </p>
            </div>

            <div className="relative space-y-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-slate-655 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold">
                4
              </span>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-950">
                Instant Notification
              </h4>
              <p className="text-[11px] leading-normal text-slate-500">
                Patient receives SMS confirmation. Pharmacy dashboard updates in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. UK Compliance Section */}
      <section id="compliance" className="border-b border-slate-200/60 bg-white py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl space-y-3 text-center">
            <span className="text-slate-450 block text-[10px] font-extrabold uppercase tracking-widest">
              Governance & Safety
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Built with UK Pharmacy Requirements in Mind
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              We provide tools to support you with your operational and data protection
              responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <Shield className="h-5 w-5 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-900">ICO Registered Support</h4>
              <p className="text-slate-450 text-[10px] leading-relaxed">
                Matches the data principles of the Information Commissioner&apos;s Office register.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <Lock className="h-5 w-5 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-900">UK GDPR Compliance</h4>
              <p className="text-slate-450 text-[10px] leading-relaxed">
                Equipped with patient consent logs, right-to-be-forgotten deletes, and data audits.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <Users className="h-5 w-5 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-900">Granular Role Permissions</h4>
              <p className="text-slate-450 text-[10px] leading-relaxed">
                Separate capabilities for branch pharmacists, operational staff, and admins.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <FileCheck2 className="h-5 w-5 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-900">Audit Logs Trail</h4>
              <p className="text-slate-450 text-[10px] leading-relaxed">
                Every login, slot modification, or patient file edit is logged to ensure audit
                readiness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. B2B Comparison Section */}
      <section id="comparison" className="border-slate-150 border-b bg-slate-50 py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl space-y-3 text-center">
            <span className="text-slate-450 block text-[10px] font-extrabold uppercase tracking-widest">
              Business Transformation
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Traditional Systems vs. NextDoorClinic
            </h2>
          </div>

          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="text-slate-450 border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-5">Capability</th>
                  <th className="p-5">Traditional Method</th>
                  <th className="border-x border-emerald-500/10 bg-emerald-500/5 p-5 text-emerald-800">
                    NextDoorClinic
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-655 divide-y divide-slate-100 font-semibold">
                <tr>
                  <td className="p-5 font-bold text-slate-900">Booking Source</td>
                  <td className="text-slate-450 p-5">Manual phone triage / Paper records</td>
                  <td className="border-x border-emerald-500/10 bg-emerald-500/5 p-5 text-emerald-800">
                    Secure 60-second online portal
                  </td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Branding Identity</td>
                  <td className="text-slate-450 p-5">Generic plugins or external portal lists</td>
                  <td className="border-x border-emerald-500/10 bg-emerald-500/5 p-5 text-emerald-800">
                    100% custom colors and logo
                  </td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Patient Reminders</td>
                  <td className="text-slate-450 p-5">Manual phone reminders or none</td>
                  <td className="border-x border-emerald-500/10 bg-emerald-500/5 p-5 text-emerald-800">
                    Automated email and SMS updates
                  </td>
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Customer Records</td>
                  <td className="text-slate-450 p-5">Fragmented databases or paper files</td>
                  <td className="border-x border-emerald-500/10 bg-emerald-500/5 p-5 text-emerald-800">
                    Centralized B2B Patient CRM database
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 10. FAQ Accordion Section */}
      <section id="faq" className="border-b border-slate-200/60 bg-white py-20">
        <div className="mx-auto w-full max-w-4xl px-6">
          <div className="mb-16 select-none space-y-3 text-center">
            <span className="text-slate-455 block text-[10px] font-extrabold uppercase tracking-widest">
              Common Questions
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="flex w-full cursor-pointer select-none items-center justify-between p-5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 sm:text-sm"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`text-slate-450 h-4 w-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs font-normal leading-relaxed text-slate-500">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. Final CTA Form Section */}
      <section id="demo" className="relative bg-slate-950 py-20 text-white md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,#10b981_10%,transparent_100%)] opacity-20" />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left text */}
            <div className="space-y-6 lg:col-span-6">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to Modernise Your Pharmacy Booking Experience?
              </h2>
              <p className="text-xs font-normal leading-relaxed text-slate-400 sm:text-sm">
                Join independent UK pharmacies running on NextDoorClinic. Get in touch to book a
                live demonstration or schedule a consultation with our product advisors.
              </p>

              <div className="space-y-4 text-xs font-semibold text-slate-300">
                <div className="flex items-center space-x-3">
                  <Check className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Interactive 15-minute screen share demo</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Custom branding review with your logo and colors</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Migration support from paper ledgers or legacy software</span>
                </div>
              </div>
            </div>

            {/* Right form */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
                {demoSubmitted ? (
                  <div className="space-y-4 py-10 text-center duration-200 animate-in zoom-in-95">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold">Consultation Booked</h3>
                    <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-400">
                      Thank you,{" "}
                      <span className="font-extrabold text-emerald-400">{formData.name}</span>. A
                      clinical solutions specialist will reach out to you at{" "}
                      <span className="font-extrabold text-slate-200">{formData.email}</span> within
                      2 business hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleDemoSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Elizabeth Vance"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Pharmacy / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.pharmacyName}
                        onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                        className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="e.g. Northside Wellness"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="name@business.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Mobile / Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. 07700 900123"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Number of Branches
                      </label>
                      <select
                        value={formData.branches}
                        onChange={(e) => setFormData({ ...formData, branches: e.target.value })}
                        className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs font-semibold text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="1">1 branch (Independent)</option>
                        <option value="2-5">2 to 5 branches</option>
                        <option value="6-20">6 to 20 branches</option>
                        <option value="20+">More than 20 branches</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-emerald-500 text-xs font-extrabold uppercase tracking-wide text-slate-950 shadow-md shadow-emerald-500/10 transition-all hover:bg-emerald-600"
                    >
                      <span>Submit Request</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="select-none border-t border-slate-200/80 bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand block */}
          <div className="col-span-2 space-y-4">
            <Link href="#" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-base font-bold text-white shadow-sm">
                N
              </div>
              <span className="text-md font-extrabold tracking-tight text-slate-950">
                NextDoorClinic
              </span>
            </Link>
            <p className="max-w-sm text-[11px] font-normal leading-relaxed text-slate-500">
              NextDoorClinic is a UK healthcare technology SaaS enabling pharmacies to manage online
              booking systems, patient logs, and automated notifications under their own whitelabel
              brand identity.
            </p>
          </div>

          {/* Links block 1 */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Platform Solutions
            </h4>
            <div className="text-slate-655 flex flex-col space-y-2 text-[11px] font-bold">
              <Link href="#features" className="transition-colors hover:text-slate-900">
                Whitelabel Booking
              </Link>
              <Link href="#features" className="transition-colors hover:text-slate-900">
                Branch Dashboard
              </Link>
              <Link href="#features" className="transition-colors hover:text-slate-900">
                Patient CRM log
              </Link>
            </div>
          </div>

          {/* Links block 2 */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Compliance
            </h4>
            <div className="text-slate-655 flex flex-col space-y-2 text-[11px] font-bold">
              <Link href="#compliance" className="transition-colors hover:text-slate-900">
                UK GDPR Support
              </Link>
              <Link href="#compliance" className="transition-colors hover:text-slate-900">
                ICO Register Standard
              </Link>
              <Link href="#compliance" className="transition-colors hover:text-slate-900">
                Secure Audit Logging
              </Link>
            </div>
          </div>

          {/* Links block 3 */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Administrator Access
            </h4>
            <div className="text-slate-655 flex flex-col space-y-2 text-[11px] font-bold">
              <Link href="/login" className="transition-colors hover:text-slate-900">
                Sign In
              </Link>
              <Link href="/register/pharmacy" className="transition-colors hover:text-slate-900">
                Create Account
              </Link>
              <Link href="#demo" className="transition-colors hover:text-slate-900">
                Book B2B Consultation
              </Link>
            </div>
          </div>
        </div>

        <div className="text-slate-455 mx-auto mt-8 flex w-full max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-[10px] font-bold md:flex-row">
          <p>&copy; {new Date().getFullYear()} NextDoorClinic. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="transition-colors hover:text-slate-900">
              Platform Terms of Service
            </Link>
            <Link href="#" className="transition-colors hover:text-slate-900">
              Data Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
