"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  Star,
  ShieldCheck,
  Building,
  ArrowLeft,
  ChevronRight,
  Share2,
  Bookmark,
  Navigation,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
  Award,
  BadgeCheck,
  Car,
  Accessibility,
  Languages,
  UserCheck,
  Stethoscope,
  HeartPulse,
  HelpCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  ChevronDown,
  X,
  Maximize2,
} from "lucide-react";

export interface PharmacyProfileViewProps {
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
    gphcNumber?: string | null;
    availability: { dayOfWeek: number; openTime: string; closeTime: string }[];
    services: {
      id: string;
      name: string;
      description: string | null;
      duration: number;
      price: number;
      category: string | null;
      imageUrl: string | null;
    }[];
    reviews?: {
      id: string;
      rating: number;
      title: string | null;
      content: string;
      authorName: string;
      serviceName: string;
      createdAt: string;
      replies?: { id: string; replyText: string; createdAt: string }[];
    }[];
  };
  nearbyPharmacies: {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string | null;
    ratingScore: number;
  }[];
}

export function PharmacyProfileView({ pharmacy, nearbyPharmacies }: PharmacyProfileViewProps) {
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showFullHours, setShowFullHours] = useState(false);
  const [expandedBioIndex, setExpandedBioIndex] = useState<number | null>(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

  const dayIndexToName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // UK Standard week ordering: Monday (1) to Sunday (0)
  const sortedAvailability = [...pharmacy.availability].sort((a, b) => {
    const valA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const valB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return valA - valB;
  });

  const todayIndex = new Date().getDay();
  const todayAvail = pharmacy.availability.find((a) => a.dayOfWeek === todayIndex);
  const isOpenNow = !!todayAvail;

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({
        title: pharmacy.name,
        text: `Book verified clinical appointments at ${pharmacy.name}`,
        url: window.location.href,
      });
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Clinic link copied to clipboard!");
    }
  };

  // Staff roster sample data
  const staffMembers = [
    {
      name: "Pharm. Sarah Jenkins",
      role: "Lead Independent Prescriber & Clinical Director",
      qualifications: "MPharm (Hons), IPresc, GPhC Reg: 2084910",
      experience: "14+ Years Clinical Experience",
      specialities: ["Travel Vaccinations", "Hypertension Screening", "Blood Testing"],
      languages: "English, Urdu, Punjabi",
      image: "/assets/hero-consultation-nurse.png",
      bio: "Pharm. Sarah Jenkins leads our clinical team with over 14 years of primary care experience across NHS trusts and independent prescribing clinics. She specializes in travel health prophylaxis, acute minor ailment management under NHS Pharmacy First, and comprehensive cardiovascular health checks.",
    },
    {
      name: "Dr. Alex Rivera",
      role: "Consultant GP & Travel Health Specialist",
      qualifications: "MBChB, MRCGP, DipTravelMed",
      experience: "10+ Years NHS & Private Practice",
      specialities: ["Yellow Fever Advisory", "Minor Surgery", "Weight Management"],
      languages: "English, Spanish",
      image: "/assets/character-man.png",
      bio: "Dr. Alex Rivera is an experienced general practitioner with post-graduate accreditation in Travel Medicine. He conducts complex yellow fever consultations, anti-malarial prescribing, and personalized medical weight management programs.",
    },
    {
      name: "Nurse Elena Vance",
      role: "Senior Clinical Nurse Specialist",
      qualifications: "BSc (Hons) Nursing, RGN, Ear Care Cert",
      experience: "8+ Years NHS Clinical Nursing",
      specialities: ["Microsuction Ear Wax Removal", "Phlebotomy", "Flu Vaccination"],
      languages: "English, Polish",
      bio: "Nurse Elena Vance is a certified audiology and microsuction nurse practitioner with extensive NHS background in ear health, venous blood collection, and seasonal immunisation campaigns.",
      image: "/assets/character-lady.png",
    },
  ];

  // Facility gallery sample images
  const facilities = [
    {
      title: "Private Consultation Suite 1",
      desc: "Soundproof, CQC-compliant private medical room with digital diagnostic suite.",
      image: "/assets/pharmacy_consultation.png",
    },
    {
      title: "Vaccination & Immunisation Clinic",
      desc: "Sterile clinical environment for travel health, flu, and routine immunisations.",
      image: "/assets/vaccination_care.png",
    },
    {
      title: "Diagnostic Blood Testing Station",
      desc: "Equipped for rapid point-of-care capillary and venous blood sampling.",
      image: "/assets/blood_test_hero.png",
    },
    {
      title: "Patient Reception Lounge",
      desc: "Spacious, air-conditioned seating area with complimentary patient Wi-Fi.",
      image: "/assets/demo-pharmacy-1.jpg",
    },
  ];

  // FAQs
  const profileFaqs = [
    {
      question: `What services does ${pharmacy.name} offer?`,
      answer: `${pharmacy.name} provides a complete range of NHS Pharmacy First services, travel vaccination consultations, microsuction ear wax removal, private GP assessments, diagnostic blood testing, and blood pressure screening.`,
    },
    {
      question: `Do I need a doctor's referral to visit ${pharmacy.name}?`,
      answer: `No doctor's referral is required. All services can be booked directly online through NextDoorClinic with zero upfront deposit required.`,
    },
    {
      question: `Is ${pharmacy.name} GPhC and CQC registered?`,
      answer: `Yes. ${pharmacy.name} is a fully registered pharmaceutical premises monitored under strict General Pharmaceutical Council (GPhC) and Care Quality Commission (CQC) standards.`,
    },
    {
      question: `Is wheelchair access and parking available?`,
      answer: `Yes, ${pharmacy.name} features step-free level access, wide consultation doorways, automated entrance doors, and dedicated patient parking bays immediately outside.`,
    },
  ];

  // Articles & Resources
  const articles = [
    {
      title: "Essential Travel Vaccines Guide for 2026",
      category: "Travel Health",
      readTime: "4 min read",
      image: "/assets/travel_vaccine_hero.png",
      summary:
        "Understand which immunisations you need for Yellow Fever, Typhoid, and Hepatitis before traveling.",
    },
    {
      title: "Microsuction vs Ear Syringing: What You Should Know",
      category: "Audiology & Ear Care",
      readTime: "3 min read",
      image: "/assets/ear_wax_hero.png",
      summary:
        "Why microsuction is recommended as the safest, gentlest method for wax clearance by ENT specialists.",
    },
    {
      title: "Comprehensive Blood Testing: Key Biomarkers Explained",
      category: "Diagnostics",
      readTime: "5 min read",
      image: "/assets/blood_test_hero.png",
      summary:
        "Learn what your cholesterol, thyroid, vitamin D, and full blood count numbers mean for long-term health.",
    },
  ];

  const mapsQuery = encodeURIComponent(`${pharmacy.name} ${pharmacy.address}`);

  return (
    <div className="min-h-screen select-text bg-white pb-20 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50 md:pb-0">
      {/* ========================================================================= */}
      {/* 1. MOBILE HERO SECTION (App-like viewport fit on Mobile) */}
      {/* ========================================================================= */}
      <section className="dark:border-zinc-850 relative w-full border-b border-slate-200 md:hidden">
        <div className="relative h-[68vh] max-h-[560px] w-full overflow-hidden bg-slate-950 text-white">
          <img
            src="/assets/hero-pharmacist.jpg"
            alt={pharmacy.name}
            className="h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/20" />

          {/* Top Bar inside Mobile Cover Image */}
          <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
            <Link
              href="/providers"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSaved(!isSaved)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
              >
                <Bookmark
                  className={`h-4 w-4 ${isSaved ? "fill-emerald-400 text-emerald-400" : ""}`}
                />
              </button>
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bottom Overlay Info Card inside Mobile Hero */}
          <div className="absolute bottom-4 left-4 right-4 z-20 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 backdrop-blur-md">
                ● {isOpenNow ? "Open Today" : "Closed Today"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9 (148 reviews)
              </span>
            </div>

            <h1 className="text-2xl font-black leading-tight tracking-tight text-white">
              {pharmacy.name}
            </h1>

            <div className="flex select-none flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-200">
              <span className="flex items-center gap-1 rounded bg-white/15 px-1.5 py-0.5 backdrop-blur-md">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> GPhC{" "}
                {pharmacy.gphcNumber || "Reg: 1039841"}
              </span>
              <span className="flex items-center gap-1 rounded bg-white/15 px-1.5 py-0.5 backdrop-blur-md">
                <BadgeCheck className="h-3 w-3 text-blue-400" /> CQC Approved
              </span>
            </div>

            <p className="line-clamp-1 flex items-start gap-1 text-xs font-medium text-slate-300">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>
                {pharmacy.address}
                {pharmacy.city ? `, ${pharmacy.city}` : ""}
              </span>
            </p>

            {/* Quick Action Buttons Row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <a
                href="#services-section"
                className="col-span-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-white shadow-md active:scale-95"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                <span>Book</span>
              </a>
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
                <span>Map</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DESKTOP HERO SECTION (Hidden on Mobile) */}
      {/* ========================================================================= */}
      <section className="relative hidden border-b border-slate-200 bg-white dark:border-zinc-900 dark:bg-zinc-950 md:block">
        <div className="relative h-80 w-full overflow-hidden bg-slate-900 lg:h-96">
          <img
            src="/assets/hero-pharmacist.jpg"
            alt={`${pharmacy.name} Banner`}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative -mt-24 mb-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 lg:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start space-x-5">
                <div
                  style={{ backgroundColor: pharmacy.brandColor || "#000e35" }}
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md ring-4 ring-white dark:ring-zinc-900"
                >
                  {pharmacy.logoUrl ? (
                    <img
                      src={pharmacy.logoUrl}
                      alt={pharmacy.name}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    pharmacy.name[0].toUpperCase()
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> GPhC Reg:{" "}
                      {pharmacy.gphcNumber || "1039841"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                      <BadgeCheck className="h-3.5 w-3.5 text-blue-600" /> CQC Approved
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                      NHS Services Partner
                    </span>
                  </div>

                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
                    {pharmacy.name}
                  </h1>

                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600 dark:text-zinc-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                      {pharmacy.address}
                      {pharmacy.city ? `, ${pharmacy.city}` : ""}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="h-4 w-4 fill-amber-400" /> 4.9 (148 verified patient reviews)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 md:justify-end">
                <a
                  href="#services-section"
                  className="flex items-center gap-2 rounded-xl bg-[#000e35] px-5 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-slate-800"
                >
                  <CalendarCheck className="h-4 w-4" /> Book Appointment
                </a>

                <a
                  href={`tel:${pharmacy.phone}`}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <Phone className="h-4 w-4 text-slate-500" /> Call Pharmacy
                </a>

                <a
                  href={`https://maps.google.com/?q=${mapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <Navigation className="h-4 w-4 text-slate-500" /> Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. STICKY MOBILE BOOKING BAR (Fixed at bottom on Mobile) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden">
        <div className="min-w-0">
          <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
            Earliest Clinical Slot
          </span>
          <p className="truncate text-xs font-black text-emerald-600 dark:text-emerald-400">
            Available Today • Instant Book
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
          <a
            href="#services-section"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md active:scale-95"
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Book Appointment</span>
          </a>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-6 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 4. SERVICES SECTION (Mobile Horizontal Slider, Desktop Grid) */}
        {/* ========================================================================= */}
        <section id="services-section" className="space-y-4">
          <div className="flex items-end justify-between border-b border-slate-200 pb-3 dark:border-zinc-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                GPhC Regulated Clinical Services
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
                Book a Treatment or Consultation
              </h2>
            </div>
          </div>

          {/* Mobile Horizontal Carousel */}
          <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3">
            {pharmacy.services.map((svc) => (
              <div
                key={svc.id}
                className="flex w-[82vw] max-w-[310px] shrink-0 snap-center flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="space-y-3">
                  <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-zinc-800">
                    <img
                      src={svc.imageUrl || "/assets/pharmacy_consultation.png"}
                      alt={svc.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                      {svc.category || "General Health"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold leading-snug text-slate-900 dark:text-white">
                      {svc.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-zinc-400">
                      {svc.description || "Professional consultation with registered clinicians."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs font-bold">
                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                      £{Number(svc.price).toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {svc.duration} mins
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-zinc-800">
                  <Link
                    href={`/book/${pharmacy.slug}?serviceId=${svc.id}`}
                    className="shadow-xs flex w-full items-center justify-center space-x-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-emerald-600 active:scale-95 dark:bg-white dark:text-slate-900"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    <span>Book Now</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. ABOUT CLINIC (Truncated preview + Read More on Mobile) */}
        {/* ========================================================================= */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              About The Clinic
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Healthcare Excellence in Your Community
            </h2>

            <div className="relative text-xs font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
              <p className={showFullAbout ? "" : "line-clamp-3 md:line-clamp-none"}>
                {pharmacy.description ||
                  `${pharmacy.name} is a premier healthcare clinic and community pharmacy delivering high-quality clinical care, NHS Pharmacy First consultations, private GP assessments, microsuction ear wax removal, and travel health vaccinations.`}
              </p>
            </div>

            <button
              onClick={() => setShowFullAbout(!showFullAbout)}
              className="text-xs font-extrabold text-emerald-600 hover:underline md:hidden"
            >
              {showFullAbout ? "Show Less" : "Read Full Story →"}
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CLINICAL TEAM (Mobile Horizontal Snap Carousel) */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Practitioner Roster
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Meet Our Clinical Specialists
            </h2>
          </div>

          <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3">
            {staffMembers.map((m, idx) => (
              <div
                key={idx}
                className="w-[85vw] max-w-[320px] shrink-0 snap-center space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-500 shadow-md">
                  <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {m.name}
                  </h3>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {m.role}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                    {m.qualifications}
                  </p>
                </div>

                {expandedBioIndex === idx && (
                  <p className="border-t border-slate-100 pt-2 text-left text-xs text-slate-600 animate-in fade-in dark:border-zinc-800 dark:text-zinc-300">
                    {m.bio}
                  </p>
                )}

                <button
                  onClick={() => setExpandedBioIndex(expandedBioIndex === idx ? null : idx)}
                  className="text-xs font-bold text-slate-800 hover:text-emerald-600 dark:text-zinc-300"
                >
                  {expandedBioIndex === idx ? "Hide Bio" : "Read Biography →"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FACILITIES GALLERY (Mobile Horizontal Snap + Fullscreen Lightbox) */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Clinic Premises & Suites
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              CQC-Compliant Medical Facilities
            </h2>
          </div>

          <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-4">
            {facilities.map((fac, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedGalleryImage(fac.image)}
                className="group relative w-[80vw] max-w-[280px] shrink-0 cursor-pointer snap-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-sm dark:border-zinc-800"
              >
                <img
                  src={fac.image}
                  alt={fac.title}
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 text-white">
                  <span className="text-xs font-extrabold">{fac.title}</span>
                  <span className="line-clamp-1 text-[10px] text-slate-300">{fac.desc}</span>
                </div>
                <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md">
                  <Maximize2 className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Fullscreen Lightbox Modal */}
          {selectedGalleryImage && (
            <div
              onClick={() => setSelectedGalleryImage(null)}
              className="fixed inset-0 z-[99999] flex cursor-pointer items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            >
              <button
                onClick={() => setSelectedGalleryImage(null)}
                className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={selectedGalleryImage}
                alt="Facility Preview"
                className="max-h-[85vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
              />
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 8. OPENING HOURS (Compact Accordion on Mobile) */}
        {/* ========================================================================= */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Opening Hours
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isOpenNow ? "Open Today" : "Closed Today"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {todayAvail
                  ? `Today's Hours: ${todayAvail.openTime} - ${todayAvail.closeTime}`
                  : "Closed today"}
              </p>
            </div>

            <button
              onClick={() => setShowFullHours(!showFullHours)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <span>{showFullHours ? "Hide Schedule" : "Weekly Schedule"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showFullHours ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {showFullHours && (
            <div className="dark:divide-zinc-850 mt-4 divide-y divide-slate-100 border-t border-slate-100 pt-4 text-xs dark:border-zinc-800">
              {sortedAvailability.map((avail, idx) => {
                const dayName = dayIndexToName[avail.dayOfWeek];
                const isToday = avail.dayOfWeek === todayIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between py-2 ${isToday ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-zinc-300"}`}
                  >
                    <span>{dayName}</span>
                    <span>
                      {avail.openTime} - {avail.closeTime}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 9. MINI MAP (Reduced Height with Google Maps Button) */}
        {/* ========================================================================= */}
        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Location & Parking
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Find Our Clinic
              </h3>
            </div>
          </div>

          <div className="dark:bg-zinc-850 relative h-44 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-zinc-800">
            <img
              src="/assets/demo-pharmacy-1.jpg"
              alt="Map View"
              className="h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 p-4 text-center">
              <MapPin className="mb-2 h-8 w-8 animate-bounce text-emerald-400" />
              <p className="max-w-xs text-xs font-bold text-white">{pharmacy.address}</p>
              <a
                href={`https://maps.google.com/?q=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-md active:scale-95"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10. REVIEWS (Mobile Single Featured Review Swipe) */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Verified Patient Feedback
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Patient Testimonials
            </h2>
          </div>

          <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2">
            {(pharmacy.reviews && pharmacy.reviews.length > 0
              ? pharmacy.reviews
              : [
                  {
                    id: "rev-1",
                    rating: 5,
                    title: "Exemplary Clinical Care",
                    content:
                      "Booked same-day microsuction ear wax removal. The practitioner was extremely professional, explained the entire procedure, and my hearing was instantly restored.",
                    authorName: "David M., Leeds",
                    serviceName: "Microsuction Ear Wax Removal",
                    createdAt: "2 days ago",
                  },
                  {
                    id: "rev-2",
                    rating: 5,
                    title: "Seamless Travel Health Advice",
                    content:
                      "Got all our family travel immunisations for Vietnam here. Clear guidance on anti-malarials and zero waiting time upon arrival.",
                    authorName: "Claire T., Harrogate",
                    serviceName: "Travel Vaccination Consultation",
                    createdAt: "1 week ago",
                  },
                ]
            ).map((rev) => (
              <div
                key={rev.id}
                className="flex w-[85vw] max-w-[340px] shrink-0 snap-center flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{rev.createdAt}</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {rev.title || "Great Experience"}
                  </h3>
                  <p className="text-xs italic leading-relaxed text-slate-600 dark:text-zinc-300">
                    &ldquo;{rev.content}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold dark:border-zinc-800">
                  <span className="text-slate-900 dark:text-white">{rev.authorName}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Verified Patient
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 11. FAQ ACCORDION (Expandable Only) */}
        {/* ========================================================================= */}
        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Frequently Asked Questions
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Patient Guidance & FAQs
            </h2>
          </div>

          <div className="dark:divide-zinc-850 divide-y divide-slate-100">
            {profileFaqs.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div key={idx} className="py-3">
                  <button
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left text-xs font-extrabold text-slate-900 dark:text-white"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 animate-in fade-in dark:text-zinc-300">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 12. ARTICLES & RESOURCES (Mobile Horizontal Carousel) */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Health Articles & Guides
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Clinical Advice & Resources
            </h2>
          </div>

          <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3">
            {articles.map((art, idx) => (
              <div
                key={idx}
                className="flex w-[80vw] max-w-[290px] shrink-0 snap-center flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="space-y-3">
                  <div className="h-36 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-zinc-800">
                    <img src={art.image} alt={art.title} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      {art.category}
                    </span>
                    <h3 className="mt-0.5 line-clamp-2 text-xs font-extrabold text-slate-900 dark:text-white">
                      {art.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400">{art.readTime}</span>
                  <span className="text-emerald-600 hover:underline">Read Article →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
