"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  CalendarCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Phone,
  Building,
  HelpCircle,
  AlertCircle,
  FileText,
  UserCheck,
  HeartPulse,
  Award,
  BadgeCheck,
  Check,
  Info,
  Calendar,
  X,
  User,
  Stethoscope,
  ChevronDown,
  Navigation,
  ArrowLeft,
  Share2,
} from "lucide-react";

export interface ServicePageViewProps {
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string | null;
    postcode: string | null;
    phone: string;
    email: string;
    description: string | null;
    logoUrl: string | null;
    brandColor: string | null;
    availability: { dayOfWeek: number; openTime: string; closeTime: string }[];
  };
  service: {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number;
    category: string | null;
    prepNotes: string | null;
    instructions: string | null;
    imageUrl: string | null;
  };
  relatedServices: {
    id: string;
    name: string;
    price: number;
    duration: number;
    pharmacySlug: string;
  }[];
  nearbyPharmacies: {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string | null;
    ratingScore: number;
  }[];
  lastReviewedDate: string;
}

export function getServiceEditorialImage(
  serviceName: string,
  category: string | null,
  customUrl?: string | null
): string {
  if (customUrl && customUrl.startsWith("/")) {
    return customUrl;
  }

  const nameLower = serviceName.toLowerCase();
  const catLower = (category || "").toLowerCase();

  if (
    nameLower.includes("travel") ||
    nameLower.includes("yellow fever") ||
    nameLower.includes("typhoid") ||
    nameLower.includes("rabies") ||
    catLower.includes("travel")
  ) {
    return "/assets/travel_vaccine_hero.png";
  }
  if (
    nameLower.includes("blood test") ||
    nameLower.includes("screening") ||
    nameLower.includes("cholesterol") ||
    nameLower.includes("diabetes") ||
    nameLower.includes("thyroid")
  ) {
    return "/assets/blood_test_hero.png";
  }
  if (
    nameLower.includes("pressure") ||
    nameLower.includes("bp check") ||
    nameLower.includes("cardiovascular") ||
    nameLower.includes("heart")
  ) {
    return "/assets/blood_pressure_hero.png";
  }
  if (
    nameLower.includes("flu") ||
    nameLower.includes("covid") ||
    nameLower.includes("booster") ||
    nameLower.includes("vaccin") ||
    nameLower.includes("immunis")
  ) {
    return "/assets/flu_vaccine_hero.png";
  }
  if (
    nameLower.includes("ear") ||
    nameLower.includes("wax") ||
    nameLower.includes("suction") ||
    nameLower.includes("hearing")
  ) {
    return "/assets/ear_wax_hero.png";
  }

  return "/assets/pharmacy_consultation.png";
}

export function ServicePageView({
  pharmacy,
  service,
  relatedServices,
  nearbyPharmacies,
  lastReviewedDate,
}: ServicePageViewProps) {
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);
  const [showPrepNotes, setShowPrepNotes] = useState(false);

  const heroImage = getServiceEditorialImage(service.name, service.category, service.imageUrl);

  const serviceFaqs = [
    {
      q: `Do I need to prepare in advance for ${service.name}?`,
      a:
        service.prepNotes ||
        `No complex preparation is needed. Please bring a valid form of photo ID and any current prescription medication lists to your consultation.`,
    },
    {
      q: `Who performs the ${service.name} assessment?`,
      a: `All consultations are conducted in a private CQC-compliant clinical room by registered GPhC pharmacists or certified clinical nurse specialists.`,
    },
    {
      q: `Will my NHS GP record be updated?`,
      a: `With your explicit consent, a summary of your consultation and treatment plan can be securely transmitted directly to your registered NHS GP surgery.`,
    },
    {
      q: `Can I cancel or reschedule my appointment?`,
      a: `Yes, you can easily reschedule or cancel up to 2 hours prior to your scheduled slot with zero cancellation fees.`,
    },
  ];

  const mapsQuery = encodeURIComponent(`${pharmacy.name} ${pharmacy.address}`);

  return (
    <div className="min-h-screen select-text bg-white pb-20 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50 md:pb-0">
      {/* ========================================================================= */}
      {/* 1. MOBILE HERO SECTION (App-like viewport fit on Mobile) */}
      {/* ========================================================================= */}
      <section className="dark:border-zinc-850 relative w-full border-b border-slate-200 md:hidden">
        <div className="relative h-[65vh] max-h-[520px] w-full overflow-hidden bg-slate-950 text-white">
          <img
            src={heroImage}
            alt={service.name}
            className="h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/20" />

          {/* Top Navigation */}
          <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
            <Link
              href={`/provider/${pharmacy.slug}`}
              className="flex items-center space-x-1 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{pharmacy.name}</span>
            </Link>
          </div>

          {/* Bottom Overlay Info Card inside Mobile Hero */}
          <div className="absolute bottom-4 left-4 right-4 z-20 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 backdrop-blur-md">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> GPhC Regulated Service
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9 (128 reviews)
              </span>
            </div>

            <h1 className="text-2xl font-black leading-tight tracking-tight text-white">
              {service.name}
            </h1>

            <div className="flex items-center space-x-3 text-xs font-extrabold">
              <span className="text-base text-emerald-400">
                £{Number(service.price).toFixed(2)}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                {service.duration} mins duration
              </span>
            </div>

            <p className="line-clamp-1 flex items-start gap-1 text-xs font-medium text-slate-300">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>
                At {pharmacy.name}, {pharmacy.address}
              </span>
            </p>

            {/* Quick Action Buttons Row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Link
                href={`/book/${pharmacy.slug}?serviceId=${service.id}`}
                className="col-span-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-white shadow-md active:scale-95"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                <span>Book Slot</span>
              </Link>
              <a
                href={`tel:${pharmacy.phone}`}
                className="flex items-center justify-center gap-1 rounded-xl bg-white/20 py-2.5 text-xs font-bold text-white backdrop-blur-md active:scale-95"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call</span>
              </a>
              <a
                href={`https://maps.google.com/?q=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 rounded-xl bg-white/20 py-2.5 text-xs font-bold text-white backdrop-blur-md active:scale-95"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Directions</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DESKTOP HERO SECTION (Hidden on Mobile) */}
      {/* ========================================================================= */}
      <section className="relative hidden border-b border-slate-200 bg-white dark:border-zinc-900 dark:bg-zinc-950 md:block">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> GPhC Regulated Clinical
                  Service
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                  <BadgeCheck className="h-4 w-4 text-blue-600" /> CQC Compliant
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                {service.name}
              </h1>

              <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
                {service.description ||
                  `Professional ${service.name} provided by registered healthcare professionals at ${pharmacy.name}. Book online with instant confirmation and zero deposit required.`}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>{service.duration} mins appointment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-emerald-600" />
                  <span>{pharmacy.name}</span>
                </div>
                <div className="flex items-center space-x-1 text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span>4.9 (128 patient reviews)</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <Link
                  href={`/book/${pharmacy.slug}?serviceId=${service.id}`}
                  className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-500 active:scale-95"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>Book Appointment (£{Number(service.price).toFixed(2)})</span>
                </Link>
                <a
                  href={`tel:${pharmacy.phone}`}
                  className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span>Call Pharmacy</span>
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-5">
              <img src={heroImage} alt={service.name} className="h-80 w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. STICKY MOBILE BOOKING BAR (Fixed at bottom on Mobile) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden">
        <div>
          <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
            Total Price
          </span>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            £{Number(service.price).toFixed(2)}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={`tel:${pharmacy.phone}`}
            className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            title="Call Pharmacy"
          >
            <Phone className="h-4 w-4 text-emerald-600" />
          </a>
          <Link
            href={`/book/${pharmacy.slug}?serviceId=${service.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md active:scale-95"
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 4. PREPARATION & INSTRUCTIONS (Accordion Expandable) */}
        {/* ========================================================================= */}
        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Patient Preparation Guide
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                How to Prepare for Your Appointment
              </h2>
            </div>
            <button
              onClick={() => setShowPrepNotes(!showPrepNotes)}
              className="dark:bg-zinc-850 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-zinc-800 dark:text-zinc-300"
            >
              <span>{showPrepNotes ? "Hide Notes" : "View Notes"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showPrepNotes ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
            {service.instructions ||
              `Please arrive 5 minutes before your scheduled appointment time. Bring any current medications and a form of government-issued ID.`}
          </p>

          {showPrepNotes && service.prepNotes && (
            <div className="dark:border-zinc-850 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600 animate-in fade-in dark:text-zinc-300">
              <strong className="mb-1 block text-slate-900 dark:text-white">
                Clinical Instructions:
              </strong>
              {service.prepNotes}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 5. 6-STEP APPOINTMENT JOURNEY (Visual Timeline) */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Clinical Workflow
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              What Happens During Your Visit
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Online Booking",
                desc: "Select your preferred date & time slot online in under 60 seconds.",
              },
              {
                step: "02",
                title: "Check-in",
                desc: "Arrive at pharmacy reception; enter private consultation suite.",
              },
              {
                step: "03",
                title: "Clinical Assessment",
                desc: "Clinician evaluates medical history, vitals, and symptoms.",
              },
              {
                step: "04",
                title: "Treatment / Testing",
                desc: "Procedure administered under GPhC clinical safety protocols.",
              },
              {
                step: "05",
                title: "Aftercare Guidance",
                desc: "Receive written advice, medication guidelines, and follow-up plan.",
              },
              {
                step: "06",
                title: "GP Notification",
                desc: "Summary report dispatched directly to your NHS GP if requested.",
              },
            ].map((st, idx) => (
              <div
                key={idx}
                className="shadow-xs flex items-start space-x-3 rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-black text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  {st.step}
                </span>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {st.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-zinc-400">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. RELATED SERVICES (Mobile Horizontal Slider) */}
        {/* ========================================================================= */}
        {relatedServices && relatedServices.length > 0 && (
          <section className="space-y-4">
            <div className="border-b border-slate-200 pb-3 dark:border-zinc-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Complementary Care
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Related Services at {pharmacy.name}
              </h2>
            </div>

            <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3">
              {relatedServices.map((rel) => (
                <div
                  key={rel.id}
                  className="flex w-[80vw] max-w-[290px] shrink-0 snap-center flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {rel.name}
                    </h3>
                    <div className="flex items-center justify-between pt-1 text-xs font-bold">
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        £{Number(rel.price).toFixed(2)}
                      </span>
                      <span className="text-slate-400">{rel.duration} mins</span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-zinc-800">
                    <Link
                      href={`/book/${pharmacy.slug}?serviceId=${rel.id}`}
                      className="flex w-full items-center justify-center space-x-1.5 rounded-xl bg-slate-900 py-2 text-xs font-extrabold text-white active:scale-95 dark:bg-white dark:text-slate-900"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      <span>Book Service</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 7. FAQ ACCORDION (Expandable Only) */}
        {/* ========================================================================= */}
        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Service Guidance & FAQs
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Common Questions About {service.name}
            </h2>
          </div>

          <div className="dark:divide-zinc-850 divide-y divide-slate-100">
            {serviceFaqs.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div key={idx} className="py-3">
                  <button
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left text-xs font-extrabold text-slate-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 animate-in fade-in dark:text-zinc-300">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
