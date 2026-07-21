"use client";

import React, { useState } from "react";
import {
  Clock,
  Tag,
  ArrowRight,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Info,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { BookingWizard } from "../../booking-wizard";

interface ServiceBookingViewProps {
  pharmacy: any;
  category: any;
  service: any;
  servicesList: any[];
  currentUser: any;
  pharmacySlug: string;
  categorySlug: string;
  serviceSlug: string;
}

export function ServiceBookingView({
  pharmacy,
  category,
  service,
  servicesList,
  currentUser,
  pharmacySlug,
  categorySlug,
  serviceSlug,
}: ServiceBookingViewProps) {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const brandColor = pharmacy.brandColor || "#10B981";
  const pharmacyName = pharmacy.displayName || pharmacy.name;

  // Custom Editorial Medical content templates based on categories
  const getClinicalSections = () => {
    if (categorySlug === "travel-health") {
      return {
        overview:
          "Our comprehensive travel clinical service is designed to provide you with the essential immunizations, malaria prevention medications, and clinical safety guidance required for overseas travel. Consultations are performed by certified pharmacist prescribers.",
        whoFor:
          "Anyone traveling to tropical, developing, or high-risk geographic destinations globally. Ideal for holidaymakers, business travelers, and family visits.",
        journey: [
          {
            title: "Risk Assessment",
            desc: "Detailed analysis of your itinerary, medical history, and activities.",
          },
          {
            title: "Immunizations & Prescriptions",
            desc: "Administration of required vaccines (e.g. Yellow Fever, Hepatitis, Typhoid) and supply of malaria prevention tables.",
          },
          {
            title: "Travel Certification",
            desc: "Issue of official vaccination certs (such as the ICVP card).",
          },
        ],
        prep: "Please bring your complete travel itinerary details, departure dates, and any past vaccination history records to your consultation.",
        aftercare:
          "You may experience mild soreness or redness at the injection site. This typically subsides within 24–48 hours. Avoid heavy physical activity on the day of vaccination.",
      };
    } else if (categorySlug === "vaccinations") {
      return {
        overview:
          "Immunization protects you, your family, and the wider community from contagious viruses and diseases. Our clinical vaccination clinic provides quick, safe, and professional immunizations in private consultation rooms.",
        whoFor:
          "Individuals seeking seasonal protection (such as flu or COVID boosters), corporate wellness programs, and school or travel immunization requirements.",
        journey: [
          {
            title: "Clinical Pre-Check",
            desc: "Verification of allergy declarations and temperature screening.",
          },
          {
            title: "Safe Injection",
            desc: "Vaccine administration using high-standard clinical safety guidelines.",
          },
          {
            title: "Observation",
            desc: "Brief post-injection waiting period to ensure no immediate reaction occurs.",
          },
        ],
        prep: "Ensure you wear loose clothing that allows easy access to your upper arm. Do not attend if you are currently running a fever or feeling unwell.",
        aftercare:
          "Rest the arm, drink plenty of water, and use mild pain relief (like paracetamol) if you experience a temporary mild headache or muscle soreness.",
      };
    } else {
      return {
        overview: `Our professional clinical clinic for ${service.name} is designed to offer verified assessments, diagnoses, and treatments for common health conditions. Consultations take place in private rooms.`,
        whoFor: `Patients seeking expert medical advice, quick diagnostics, and same-day treatment plans for ${service.name} without long hospital delays.`,
        journey: [
          {
            title: "Private Consultation",
            desc: "Symptom review and medical history evaluation with a clinical practitioner.",
          },
          {
            title: "Clinical Checkup",
            desc: "Physical checking, testing, or screening if indicated.",
          },
          {
            title: "Prescription & Plan",
            desc: "Immediate supply of necessary medications or recommendation pathways.",
          },
        ],
        prep: "Write down a list of symptoms, their duration, and any current medications you are taking.",
        aftercare:
          "Follow the prescriber's guidelines exactly. Complete the full course of any prescribed treatment, even if symptoms improve.",
      };
    }
  };

  const clinicGuide = getClinicalSections();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-800 dark:bg-zinc-950 dark:text-zinc-200">
      {/* 1. SECURE HERO HEADER STRIP */}
      <div className="flex h-12 items-center border-b border-slate-800 bg-[#0F172A] text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 text-xs font-semibold text-slate-400">
          <nav className="flex items-center space-x-2">
            <Link href={`/book/${pharmacySlug}`} className="transition-colors hover:text-white">
              {pharmacyName}
            </Link>
            <span>/</span>
            <Link
              href={`/book/${pharmacySlug}/${categorySlug}`}
              className="transition-colors hover:text-white"
            >
              {category.name}
            </Link>
            <span>/</span>
            <span className="max-w-[180px] truncate text-white sm:max-w-none">{service.name}</span>
          </nav>

          <div className="xs:flex hidden items-center space-x-2 text-[10px] uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>GPhC Registered Premises</span>
          </div>
        </div>
      </div>

      {/* 2. CLINICAL GUIDE EDITORIAL HERO */}
      <div className="dark:border-zinc-850/80 select-none border-b border-slate-200/80 bg-white py-12 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 px-6 md:grid-cols-3">
          {/* Hero Left & Mid: Main text */}
          <div className="space-y-4 md:col-span-2">
            <span
              className="rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white"
              style={{ backgroundColor: brandColor }}
            >
              {category.name}
            </span>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
              {service.name}
            </h1>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
              {service.description || clinicGuide.overview}
            </p>

            <div className="text-slate-450 flex flex-wrap gap-4 pt-2 text-xs font-bold dark:text-zinc-500">
              <span className="flex items-center">
                <Clock className="mr-1 h-4 w-4 text-slate-400" />
                <span>Duration: {service.duration} mins</span>
              </span>
              <span className="flex items-center">
                <Tag className="mr-1 h-4 w-4 text-slate-400" />
                <span>Starting from £{Number(service.price).toFixed(2)}</span>
              </span>
              <span className="flex items-center">
                <ShieldCheck className="mr-1 h-4 w-4 text-slate-400" />
                <span>NHS Verified Protocol</span>
              </span>
            </div>
          </div>

          {/* Hero Right: Booking Snapshot Card */}
          <div className="relative space-y-4 overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] p-6 text-white shadow-md">
            <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-emerald-500/5 blur-xl" />
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              Book Consult
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold tracking-tight">NHS & Private</span>
              <span className="text-2xl font-black text-emerald-400">
                £{Number(service.price).toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] leading-normal text-slate-400">
              Pick a slot and complete details online. No registration required.
            </p>
            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full cursor-pointer select-none rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-emerald-600"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </div>

      {/* 3. EDITORIAL DETAIL COLUMNS */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-3">
        {/* Main Editorial Body (Left 2 Columns) */}
        <div className="space-y-12 md:col-span-2">
          {/* Section 1: Overview */}
          <section className="space-y-4">
            <h2 className="border-b border-slate-200/60 pb-2 text-lg font-black uppercase tracking-wider text-slate-900 dark:border-zinc-900 dark:text-white">
              01. Service Overview & Suitability
            </h2>
            <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-sm">
              {clinicGuide.overview}
            </p>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-900 dark:bg-zinc-900/40">
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
                <Info size={14} className="text-slate-500" />
                Who should consider this treatment?
              </h4>
              <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
                {clinicGuide.whoFor}
              </p>
            </div>
          </section>

          {/* Section 2: How it works */}
          <section className="space-y-6">
            <h2 className="border-b border-slate-200/60 pb-2 text-lg font-black uppercase tracking-wider text-slate-900 dark:border-zinc-900 dark:text-white">
              02. Your Patient Journey
            </h2>
            <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-sm">
              We focus on clinical accuracy, patient comfort, and clear explanations. Here is what
              to expect:
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {clinicGuide.journey.map((step, idx) => (
                <div
                  key={idx}
                  className="dark:border-zinc-850 space-y-2 rounded-xl border border-slate-200/80 bg-white p-5 dark:bg-zinc-950"
                >
                  <div
                    className="flex size-6 items-center justify-center rounded-full text-[10px] font-black text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    {idx + 1}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</h4>
                  <p className="text-[11px] font-semibold leading-relaxed text-slate-500 dark:text-zinc-400">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Preparation & Care */}
          <section className="space-y-4">
            <h2 className="border-b border-slate-200/60 pb-2 text-lg font-black uppercase tracking-wider text-slate-900 dark:border-zinc-900 dark:text-white">
              03. Preparation & Post-Appointment Care
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
                  <Sparkles size={14} className="text-amber-500" />
                  Pre-Appointment Instructions
                </h4>
                <p className="text-[11px] font-semibold leading-relaxed text-slate-500 dark:text-zinc-400 sm:text-xs">
                  {clinicGuide.prep}
                </p>
                {service.prepNotes && (
                  <p className="mt-2 rounded-lg border border-amber-500/10 bg-amber-500/5 p-2 text-[11px] font-bold text-amber-600">
                    💡 Note: {service.prepNotes}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="flex flex-1 items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
                  💡 Aftercare Guidelines
                </h4>
                <p className="text-[11px] font-semibold leading-relaxed text-slate-500 dark:text-zinc-400 sm:text-xs">
                  {clinicGuide.aftercare}
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Safety & Disclaimers */}
          <section className="space-y-3 rounded-2xl border border-rose-500/10 bg-rose-500/5 p-5">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <AlertTriangle size={15} />
              Important Safety Information & Medical Disclaimer
            </h4>
            <p className="text-[11px] font-semibold leading-relaxed text-slate-500 dark:text-zinc-400">
              This clinical consultation service is subject to professional triage. If our
              clinicians evaluate that you are not eligible for treatment or that alternative
              medical routes are required, a referral or slot refund will be initiated immediately.
            </p>
            <p className="text-[10px] italic text-slate-400">
              * In case of emergency or severe symptoms, please dial 999 or proceed to your nearest
              NHS Accident & Emergency department immediately.
            </p>
          </section>
        </div>

        {/* Sticky Clinic Profile Sidebar (Right Column) */}
        <div className="space-y-6">
          {/* Clinic Hours & Contacts */}
          <div className="dark:border-zinc-850 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
            <h3 className="border-b border-slate-100 pb-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:border-zinc-900 dark:text-white">
              Clinic Premises & Location
            </h3>

            <div className="space-y-3 text-xs font-bold text-slate-600 dark:text-zinc-400">
              <div className="flex items-start space-x-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{pharmacy.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{pharmacy.phone}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-slate-400">
                NHS Certified branch
              </span>
              <div className="inline-block rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-bold leading-none text-emerald-600 dark:text-emerald-400">
                CQC APPROVED PARTNER
              </div>
            </div>
          </div>

          {/* Related services directory */}
          <div className="dark:border-zinc-850 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
            <h3 className="border-b border-slate-100 pb-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:border-zinc-900 dark:text-white">
              Other Clinical Services
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-zinc-900">
              {servicesList
                .filter((s) => s.id !== service.id)
                .slice(0, 3)
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2.5 text-xs font-bold"
                  >
                    <span className="truncate pr-4 text-slate-700 dark:text-zinc-300">
                      {s.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      £{Number(s.price).toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL OVERLAY: FULL-SCREEN INTEGRATED BOOKING WIZARD */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm duration-200 animate-in fade-in">
          <BookingWizard
            pharmacy={pharmacy}
            services={servicesList}
            currentUser={currentUser}
            initialServiceId={service.id}
            onClose={() => setShowBookingModal(false)}
          />
        </div>
      )}
    </div>
  );
}
