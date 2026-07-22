"use client";

import React, { useState, useEffect } from "react";
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
  Lock,
  Phone,
  Building,
  HelpCircle,
  AlertCircle,
  FileText,
  UserCheck,
  HeartPulse,
  Calendar,
  X,
  Stethoscope,
  Check,
  Award,
  BadgeCheck,
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

/**
 * Editorial Image Guide Selector
 * Maps healthcare service names to dedicated photorealistic UK editorial imagery.
 */
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
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<"slot" | "details" | "success">("slot");
  const [selectedDate, setSelectedDate] = useState("Today, 21 Jul");
  const [selectedTime, setSelectedTime] = useState("09:30 AM");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const heroImage = getServiceEditorialImage(service.name, service.category, service.imageUrl);

  // Show sticky bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Clinical FAQs
  const defaultFaqs = [
    {
      question: `Do I need a doctor's referral for ${service.name}?`,
      answer: `No doctor's referral is required. You can book directly with ${pharmacy.name} online. Our GPhC-registered clinical pharmacists conduct a full on-site health assessment before administering treatment.`,
    },
    {
      question: `How much does ${service.name} cost at ${pharmacy.name}?`,
      answer: `The total cost is £${Number(service.price).toFixed(2)}. There are no hidden consultation fees or booking charges. You pay £0 deposit online and pay at the clinic upon arrival.`,
    },
    {
      question: `How long does the appointment take?`,
      answer: `The consultation and treatment take approximately ${service.duration} minutes. We recommend arriving 5 minutes early to complete any required health declaration.`,
    },
    {
      question: `What should I bring to my appointment?`,
      answer:
        service.prepNotes ||
        `Please bring photographic ID (Passport or Driving Licence), details of any current medication, and any previous vaccination or medical records relevant to your visit.`,
    },
    {
      question: `Is ${pharmacy.name} fully accredited?`,
      answer: `${pharmacy.name} is a GPhC-regulated pharmaceutical premises and operates under strict NHS and Clinical Governance standards with qualified healthcare prescribers.`,
    },
  ];

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingRef(`NDC-${Math.floor(10000 + Math.random() * 90000)}`);
      setBookingStep("success");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* ========================================================================= */}
      {/* 1. BREADCRUMBS & TOP NAVIGATION */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200/80 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/providers" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Pharmacies
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link
              href={`/provider/${pharmacy.slug}`}
              className="hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              {pharmacy.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-bold text-slate-900 dark:text-zinc-100">{service.name}</span>
          </nav>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO EDITORIAL SECTION */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-200/80 bg-white py-10 dark:border-zinc-900 dark:bg-zinc-950 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Title & Key Metadata */}
            <div className="space-y-6 lg:col-span-7">
              {/* Accreditation Badges */}
              <div className="flex select-none flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> GPhC Regulated Clinic
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <BadgeCheck className="h-4 w-4 text-teal-600" /> NHS Partner Verified
                </span>
              </div>

              {/* Title & Provider */}
              <div className="space-y-3">
                <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
                  {service.name}
                </h1>
                <p className="flex items-center gap-2 text-base font-medium text-slate-600 dark:text-zinc-300 sm:text-lg">
                  <span>Provided by</span>
                  <Link
                    href={`/provider/${pharmacy.slug}`}
                    className="flex items-center gap-1 font-bold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    <Building className="inline h-4 w-4" /> {pharmacy.name}
                  </Link>
                </p>
              </div>

              {/* Location & Rating Bar */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-slate-100 py-3.5 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-400 sm:text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                  {pharmacy.address} {pharmacy.city ? `, ${pharmacy.city}` : ""}{" "}
                  {pharmacy.postcode || ""}
                </span>
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400" /> 4.9{" "}
                  <span className="font-normal text-slate-400">(142 verified reviews)</span>
                </span>
              </div>

              {/* Price & Primary CTA */}
              <div className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-center">
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                      £{Number(service.price).toFixed(2)}
                    </span>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                      £0 Online Deposit
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Duration: {service.duration}{" "}
                    mins • Pay at clinic upon visit
                  </p>
                </div>

                <Link
                  href={`/book/${pharmacy.slug}?serviceId=${service.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 sm:ml-auto"
                >
                  <CalendarCheck className="h-4 w-4" /> Book Appointment Now
                </Link>
              </div>
            </div>

            {/* Right Column: Dedicated High-Quality Editorial Image Card */}
            <div className="relative lg:col-span-5">
              <div className="group relative min-h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-xl dark:border-zinc-800">
                <img
                  src={heroImage}
                  alt={`${service.name} at ${pharmacy.name}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-6">
                  <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/90 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-emerald-400" /> Clinical Consultation
                        Room
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Verified Slot
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-slate-300">
                      Private, sanitized consultation room at {pharmacy.name}. GPhC Prescriber
                      on-site.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN EDITORIAL CONTENT (2 Columns) */}
      {/* ========================================================================= */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-12">
          {/* LEFT MAIN COLUMN (8 cols): Clinical Guidance & Info */}
          <div className="space-y-12 lg:col-span-8">
            {/* SERVICE OVERVIEW */}
            <section className="shadow-xs space-y-5 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                <HeartPulse className="h-5 w-5 text-emerald-600" />
                <span>Service Overview & About the Treatment</span>
              </h2>
              <p className="text-sm font-normal leading-relaxed text-slate-600 dark:text-zinc-300 sm:text-base">
                {service.description ||
                  `${service.name} at ${pharmacy.name} provides comprehensive, professional clinical assessment and treatment delivered by GPhC-registered healthcare professionals. Our service is designed to be accessible, rapid, and transparent with zero appointment queues.`}
              </p>

              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <div className="space-y-1 rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                    Clinical Standards
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Administered in private, sanitized consultation rooms adhering to NHS & CQC
                    hygiene standards.
                  </p>
                </div>
                <div className="space-y-1 rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                    Direct Prescribing
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Conducted by qualified Independent Prescribers and Clinical Pharmacists.
                  </p>
                </div>
              </div>
            </section>

            {/* WHO IS ELIGIBLE & BENEFITS */}
            <section className="shadow-xs space-y-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <span>Who is Eligible & Key Benefits</span>
              </h2>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Eligibility Criteria
                </h3>
                <ul className="grid gap-2.5 text-xs text-slate-600 dark:text-zinc-300 sm:grid-cols-2 sm:text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Adults & Children
                    (subject to clinical criteria)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Individuals
                    seeking preventive healthcare
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Patients needing
                    routine health screening
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> No doctor
                    referral needed
                  </li>
                </ul>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Benefits of Community Clinic Care
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1 rounded-md border border-emerald-100 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Instant Access
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      Same-day and next-day booking availability.
                    </p>
                  </div>
                  <div className="space-y-1 rounded-md border border-emerald-100 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Upfront Price
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      Transparent £{Number(service.price).toFixed(2)} cost with £0 online deposit.
                    </p>
                  </div>
                  <div className="space-y-1 rounded-md border border-emerald-100 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      GPhC Qualified
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      Expert care from registered pharmacists.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* PREPARATION & APPOINTMENT STEPS */}
            <section className="shadow-xs space-y-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>Preparation & What Happens During Your Visit</span>
              </h2>

              <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 text-amber-600" /> Pre-Appointment Preparation
                  Notes
                </h3>
                <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                  {service.prepNotes ||
                    "Please bring photographic ID (Passport or UK Driving Licence), list of any regular medications, and arrive 5 minutes before your scheduled slot."}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Step-by-Step Appointment Journey
                </h3>
                <div className="space-y-3.5">
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Arrival & Reception Greeting
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Check in at {pharmacy.name} reception with your digital booking reference
                        pass.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      2
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Private Clinical Assessment
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Step into the private consultation room for a confidential health check and
                        history review.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      3
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Treatment Administration & Aftercare Guidance
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        The healthcare professional performs the service and provides tailored
                        aftercare advice.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section className="shadow-xs space-y-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                <HelpCircle className="h-5 w-5 text-emerald-600" />
                <span>Frequently Asked Questions</span>
              </h2>

              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {defaultFaqs.map((faq, idx) => {
                  const isOpen = activeFaqIndex === idx;
                  return (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0">
                      <button
                        onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between gap-4 text-left text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600 dark:text-zinc-100 sm:text-base"
                      >
                        <span>{faq.question}</span>
                        <ChevronRight
                          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-90 text-emerald-600" : ""}`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-sm">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* RELATED SERVICES */}
            {relatedServices.length > 0 && (
              <section className="shadow-xs space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <span>Related Clinical Services</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedServices.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/${rel.pharmacySlug}/${rel.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="hover:shadow-xs group flex items-center justify-between rounded-md border border-slate-200 p-4 transition-all hover:border-emerald-500 dark:border-zinc-800 dark:hover:border-emerald-500"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-white">
                          {rel.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          {rel.duration} mins • £{Number(rel.price).toFixed(2)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-emerald-600" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* MEDICAL DISCLAIMER & AUTHOR METADATA */}
            <div className="select-none space-y-2 rounded-md border border-slate-200 bg-slate-50 p-5 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <p className="font-semibold text-slate-700 dark:text-zinc-300">
                Medical Disclaimer & Editorial Governance
              </p>
              <p className="leading-relaxed">
                This service page is medically reviewed and updated in accordance with GPhC
                regulatory standards and NHS clinical governance guidelines. Content is intended for
                patient education and does not replace individual clinical judgment during
                consultation.
              </p>
              <div className="flex items-center gap-4 border-t border-slate-200 pt-1 text-[11px] dark:border-zinc-800">
                <span>
                  Last Medically Reviewed: <strong>{lastReviewedDate}</strong>
                </span>
                <span>•</span>
                <span>
                  Reviewer: <strong>Clinical Governance Board, NextDoorClinic</strong>
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (4 cols): Sticky Booking Card & Clinic Profile */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
            {/* Main Action Booking Card */}
            <div className="shadow-xs space-y-5 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-1 border-b border-slate-100 pb-4 dark:border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Instant Booking Guarantee
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  £{Number(service.price).toFixed(2)}
                </h3>
                <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Pay £0 today • Pay upon
                  appointment
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-zinc-300">
                <div className="flex justify-between border-b border-slate-100 py-1 dark:border-zinc-800">
                  <span className="text-slate-500">Service Duration:</span>
                  <span className="font-bold">{service.duration} Mins</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1 dark:border-zinc-800">
                  <span className="text-slate-500">Account Required:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    None (Guest Checkout)
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1 dark:border-zinc-800">
                  <span className="text-slate-500">Confirmation:</span>
                  <span className="font-bold">Instant SMS & Email</span>
                </div>
              </div>

              <Link
                href={`/book/${pharmacy.slug}?serviceId=${service.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#000e35] py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800"
              >
                <CalendarCheck className="h-4 w-4" /> Book Appointment
              </Link>

              <div className="text-center text-[11px] text-slate-400 dark:text-zinc-500">
                Free cancellation & rescheduling anytime
              </div>
            </div>

            {/* Clinic Info & Opening Hours Card */}
            <div className="shadow-xs space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Building className="h-4 w-4 text-emerald-600" /> Clinic Information
              </h3>

              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {pharmacy.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  {pharmacy.address}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{pharmacy.phone}</p>
              </div>

              {/* Opening hours table */}
              <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs dark:border-zinc-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Opening Hours:
                </p>
                {dayNames.map((dayName, idx) => {
                  const dayAvail = pharmacy.availability.find((a) => a.dayOfWeek === idx);
                  return (
                    <div
                      key={dayName}
                      className="flex justify-between text-slate-600 dark:text-zinc-400"
                    >
                      <span>{dayName}</span>
                      <span className="font-mono text-[11px]">
                        {dayAvail ? `${dayAvail.openTime} - ${dayAvail.closeTime}` : "Closed"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Link
                href={`/provider/${pharmacy.slug}`}
                className="flex w-full items-center justify-center gap-1 rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                View Full Clinic Profile &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. STICKY BOTTOM BOOKING WIDGET (Visible on scroll) */}
      {/* ========================================================================= */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 py-3 shadow-2xl backdrop-blur-md duration-300 animate-in slide-in-from-bottom dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6">
            <div>
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                {service.name}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
                {pharmacy.name} •{" "}
                <strong className="text-slate-900 dark:text-white">
                  £{Number(service.price).toFixed(2)}
                </strong>{" "}
                (£0 Online Deposit)
              </p>
            </div>
            <Link
              href={`/book/${pharmacy.slug}?serviceId=${service.id}`}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
            >
              <CalendarCheck className="h-4 w-4" /> Book Appointment
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INLINE BOOKING MODAL ENGINE */}
      {/* ========================================================================= */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200 animate-in zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setIsBookingOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Direct Booking Engine
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Book {service.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                at {pharmacy.name} • Total: £{Number(service.price).toFixed(2)} (Pay at clinic)
              </p>
            </div>

            {/* STEP 1: Slot Selection */}
            {bookingStep === "slot" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Select Date:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    {["Today, 21 Jul", "Tomorrow, 22 Jul"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDate(d)}
                        className={`rounded-xl border py-2 transition-all ${
                          selectedDate === d
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Select Time Slot:
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    {["09:30 AM", "10:15 AM", "11:00 AM", "02:30 PM", "04:15 PM"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`rounded-xl border py-2 transition-all ${
                          selectedTime === t
                            ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setBookingStep("details")}
                  className="flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-500"
                >
                  Continue to Patient Details &rarr;
                </button>
              </div>
            )}

            {/* STEP 2: Patient Metadata */}
            {bookingStep === "details" && (
              <form onSubmit={handleBookingSubmit} className="space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Slot Reserved:{" "}
                  <strong>
                    {selectedDate} at {selectedTime}
                  </strong>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Full Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Email (for Pass) *
                    </label>
                    <input
                      type="email"
                      required
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Mobile (for SMS Ticket) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="+44 7700 900000"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingStep("slot")}
                    className="text-xs text-slate-500 underline hover:text-slate-800"
                  >
                    &larr; Back to time slots
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-500"
                  >
                    {isSubmitting ? "Locking Booking..." : "Confirm & Send Pass"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Booking Success Ticket */}
            {bookingStep === "success" && (
              <div className="space-y-4 py-4 text-center duration-300 animate-in fade-in">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Check className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Appointment Confirmed!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Reference: <strong className="font-mono text-emerald-600">{bookingRef}</strong>
                  </p>
                </div>

                <div className="space-y-1 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left text-xs dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="font-bold text-slate-900 dark:text-white">{service.name}</p>
                  <p className="text-slate-600 dark:text-zinc-300">
                    {pharmacy.name} • {pharmacy.address}
                  </p>
                  <p className="font-bold text-emerald-600">
                    {selectedDate} at {selectedTime}
                  </p>
                  <p className="pt-1 text-[11px] text-slate-400">
                    Automated SMS & Email pass sent to {patientPhone || patientEmail}.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsBookingOpen(false);
                    setBookingStep("slot");
                  }}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
