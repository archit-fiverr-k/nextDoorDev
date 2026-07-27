"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Sparkles,
  ShieldCheck,
  Star,
  ArrowRight,
  ChevronRight,
  Clock,
  Building2,
  BadgeCheck,
  CheckCircle2,
  Calendar,
  Phone,
  Navigation,
  Smartphone,
  ChevronDown,
  ChevronUp,
  FileText,
  SlidersHorizontal,
  RotateCcw,
  HeartPulse,
  Scale,
  Activity,
  Plane,
  Droplet,
  Syringe,
  Ear,
  Building,
  Check,
} from "lucide-react";
import { SearchBar } from "./search-bar";
import { HeroIllustration } from "./hero-illustration";

export interface LandingPageViewProps {
  approvedProviders: any[];
}

// Quick Search Chips
const QUICK_CHIPS = [
  { label: "Travel Vaccinations", href: "/services?query=travel" },
  { label: "Blood Tests", href: "/services?query=blood" },
  { label: "Weight Management", href: "/services?query=weight" },
  { label: "Ear Wax Removal", href: "/services?query=ear" },
  { label: "Flu Vaccination", href: "/services?query=flu" },
  { label: "COVID Booster", href: "/services?query=covid" },
  { label: "Health Screening", href: "/services?query=screening" },
];

// Popular Services
const POPULAR_SERVICES = [
  {
    id: "ps-1",
    title: "Microsuction Ear Wax Clearance",
    category: "Ear Care",
    price: "£55.00",
    duration: "20 mins",
    image: "/assets/ear_wax_hero.png",
    href: "/services?query=ear",
    rating: 4.9,
  },
  {
    id: "ps-2",
    title: "Travel Health & Yellow Fever Screening",
    category: "Travel Medicine",
    price: "£45.00",
    duration: "15 mins",
    image: "/assets/travel_vaccine_hero.png",
    href: "/services?query=travel",
    rating: 4.9,
  },
  {
    id: "ps-3",
    title: "Full Biomarker Blood Screen",
    category: "Diagnostics",
    price: "£79.00",
    duration: "15 mins",
    image: "/assets/blood_test_hero.png",
    href: "/services?query=blood",
    rating: 4.8,
  },
  {
    id: "ps-4",
    title: "Cardiovascular & BP Screening",
    category: "Cardiology",
    price: "FREE (NHS)",
    duration: "10 mins",
    image: "/assets/blood_pressure_hero.png",
    href: "/services?query=bp",
    rating: 5.0,
  },
];

// Healthcare Category Tile Cards
const HEALTHCARE_CATEGORIES = [
  {
    title: "Travel Health",
    desc: "Vaccinations, anti-malarial tablets & certificate issuance.",
    img: "/assets/travel_vaccine_hero.png",
    href: "/services?query=travel",
    count: "12 Services",
  },
  {
    title: "Blood Testing Suite",
    desc: "Cholesterol, thyroid, hormone & full health biomarker panels.",
    img: "/assets/blood_test_hero.png",
    href: "/services?query=blood",
    count: "24 Tests",
  },
  {
    title: "Vaccinations & Boosters",
    desc: "NHS & private flu, Covid-19, Shingles & HPV immunisations.",
    img: "/assets/flu_vaccine_hero.png",
    href: "/services?query=vaccine",
    count: "8 Immunisations",
  },
  {
    title: "Microsuction Ear Care",
    desc: "Gentle ear wax removal by GPhC registered clinicians.",
    img: "/assets/ear_wax_hero.png",
    href: "/services?query=ear",
    count: "ENT Certified",
  },
  {
    title: "Weight Management",
    desc: "Clinically monitored prescription weight reduction programs.",
    img: "/assets/pharmacy_consultation.png",
    href: "/services?query=weight",
    count: "Personalised",
  },
  {
    title: "Women's & Men's Health",
    desc: "Discrete consultations, HRT & sexual health testing.",
    img: "/assets/hero-pharmacist.jpg",
    href: "/services?query=health",
    count: "Private & Confidential",
  },
];

// 4 How It Works Steps
const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Search Service",
    desc: "Type your treatment or select a quick category near your town or postcode.",
  },
  {
    step: "02",
    title: "Choose Clinic",
    desc: "Compare verified GPhC pharmacies by rating, distance, price, and availability.",
  },
  {
    step: "03",
    title: "Book Instantly",
    desc: "Select your preferred date & time slot with instant email notification.",
  },
  {
    step: "04",
    title: "Attend Appointment",
    desc: "Visit your local pharmacy clinic and receive professional clinical care.",
  },
];

// Editorial Patient Reviews
const PATIENT_REVIEWS = [
  {
    name: "Dr. Jonathan Hayes",
    role: "Verified Patient • Leeds",
    quote:
      "Found an ear wax microsuction slot within 2 hours at Briggate Pharmacy. Seamless booking and outstanding clinical service.",
    rating: 5,
    avatar: "/assets/demo-pharmacy-1.jpg",
  },
  {
    name: "Sarah Jenkins",
    role: "Verified Patient • Birmingham",
    quote:
      "Got my travel health consultation and yellow fever certificate all done under 20 minutes. Highly recommended platform!",
    rating: 5,
    avatar: "/assets/pharmacy_consultation.png",
  },
  {
    name: "David Miller",
    role: "Verified Patient • Manchester",
    quote:
      "NextDoorClinic made finding a same-day blood screening ridiculously simple. Transparent pricing with zero hidden fees.",
    rating: 5,
    avatar: "/assets/hero-pharmacist.jpg",
  },
];

// Healthcare Editorial Articles
const HEALTHCARE_ARTICLES = [
  {
    title: "Why Ear Wax Microsuction is Safer Than Ear Syringing",
    category: "Clinical Advice",
    date: "20 July 2026",
    img: "/assets/ear_wax_hero.png",
    readTime: "4 min read",
    href: "/services?query=ear",
  },
  {
    title: "Essential Travel Vaccines for Southeast Asia & Africa",
    category: "Travel Health",
    date: "18 July 2026",
    img: "/assets/travel_vaccine_hero.png",
    readTime: "5 min read",
    href: "/services?query=travel",
  },
  {
    title: "Understanding Your Biomarker Blood Test Results",
    category: "Diagnostics",
    date: "15 July 2026",
    img: "/assets/blood_test_hero.png",
    readTime: "6 min read",
    href: "/services?query=blood",
  },
];

export function LandingPageView({ approvedProviders }: LandingPageViewProps) {
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [hasProviderInterest, setHasProviderInterest] = useState(false);

  useEffect(() => {
    try {
      const storedIntent =
        localStorage.getItem("ndc_provider_intent") === "true" ||
        document.cookie.includes("ndc_provider_intent=true");
      if (storedIntent) {
        setHasProviderInterest(true);
      }
    } catch (err) {
      // Ignore SSR / browser security errors
    }

    const handleScroll = () => {
      if (window.scrollY > 420) {
        setShowStickySearch(true);
      } else {
        setShowStickySearch(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const markProviderInterest = () => {
    try {
      localStorage.setItem("ndc_provider_intent", "true");
      document.cookie = "ndc_provider_intent=true; path=/; max-age=31536000;";
    } catch (err) {
      // Ignore fallback
    }
  };

  return (
    <div className="w-full select-text bg-white pb-20 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Clean Original Color Palette + Nurse Consultation Right Side) */}
      {/* ========================================================================= */}
      <section className="dark:border-zinc-850 relative overflow-hidden border-b border-slate-200/80 bg-[#FAFAFA] px-4 py-8 text-slate-900 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8 lg:py-14">
        {/* Soft Background Mesh */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#10B981]/15 blur-3xl" />

        <div className="mx-auto max-w-7xl">
          {/* Pharmacy Owner Announcement Header Banner (Only shown to users who clicked/showed provider registration interest) */}
          {hasProviderInterest && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-2.5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <Building2 className="h-4 w-4 text-[#10B981]" />
                <span>Are you an independent pharmacy owner or healthcare provider?</span>
              </div>
              <Link
                href="/register-clinic"
                onClick={markProviderInterest}
                className="inline-flex items-center space-x-1 text-xs font-extrabold text-[#10B981] hover:underline"
              >
                <span>List Your Clinic & Services →</span>
              </Link>
            </div>
          )}

          <div className="grid items-center gap-8 lg:grid-cols-12">
            {/* Left Copy & Search (Exposed immediately in viewport) */}
            <div className="space-y-5 lg:col-span-7">
              {/* Trust Badges Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/70 px-3 py-1 text-[11px] font-black uppercase text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" /> CQC & GPhC Regulated
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  • NHS Partner Network
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-[#10B981]">
                  What healthcare service do you need today?
                </p>
                <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-[#0F172A] dark:text-white sm:text-5xl lg:text-[3.4rem]">
                  <span className="block">Find trusted healthcare providers,</span>
                  <span className="mt-2 block sm:mt-3 lg:mt-3.5">
                    <span className="relative inline-block text-[#10B981]">
                      book in minutes.
                      <svg
                        className="absolute -bottom-1.5 left-0 h-2 w-full text-[#10B981]"
                        viewBox="0 0 200 8"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0 6 Q50 0 100 6 T200 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </span>
                </h1>
              </div>

              {/* Search Bar Container */}
              <div className="relative z-30 w-full max-w-2xl">
                <SearchBar className="rounded-2xl shadow-xl" />
              </div>

              {/* Quick Search Chips */}
              <div className="space-y-2 pt-1">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                  Popular Searches:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHIPS.map((chip, idx) => (
                    <Link
                      key={idx}
                      href={chip.href}
                      className="shadow-xs rounded-full border border-slate-200 bg-white px-3.5 py-1 text-[11px] font-bold text-slate-700 transition-all hover:border-[#10B981] hover:bg-[#10B981] hover:text-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      {chip.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Hero Image (Nurse Consultation Room Illustration) */}
            <div className="relative z-10 hidden lg:col-span-5 lg:block">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STICKY FLOATING SEARCH BAR (Appears on scroll) */}
      {/* ========================================================================= */}
      {showStickySearch && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-2xl -translate-x-1/2 duration-300 animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <Link
              href="/services"
              className="flex items-center space-x-2 px-4 text-xs font-bold text-slate-700 dark:text-zinc-300"
            >
              <Search className="h-4 w-4 text-[#10B981]" />
              <span>What healthcare service do you need?</span>
            </Link>

            <Link
              href="/services"
              className="rounded-full bg-[#10B981] px-5 py-2 text-xs font-extrabold text-white shadow-md hover:bg-emerald-600"
            >
              Search
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. POPULAR SERVICES VISUAL DISCOVERY CAROUSEL */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="dark:border-zinc-850 flex items-end justify-between border-b border-slate-200/80 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
              Popular Clinical Services
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Book High-Demand Treatments
            </h2>
          </div>

          <Link
            href="/services"
            className="hidden items-center space-x-1 text-xs font-extrabold text-[#10B981] hover:underline sm:flex"
          >
            <span>View All Services</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Carousel / Responsive Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_SERVICES.map((svc) => (
            <div
              key={svc.id}
              className="shadow-xs dark:border-zinc-850 group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white transition-all hover:border-[#10B981]/40 hover:shadow-md dark:bg-zinc-900"
            >
              <div className="space-y-3">
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={svc.image}
                    alt={svc.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    {svc.category}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-[#10B981] px-3 py-1 text-xs font-black text-white shadow-md">
                    {svc.price}
                  </span>
                </div>

                <div className="space-y-2 p-5">
                  <div className="flex items-center space-x-1 text-xs font-bold text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{svc.rating}</span>
                    <span className="font-normal text-slate-400">• {svc.duration}</span>
                  </div>

                  <h3 className="text-sm font-black leading-snug text-slate-900 dark:text-white">
                    {svc.title}
                  </h3>
                </div>
              </div>

              <div className="dark:border-zinc-850 mt-2 flex items-center justify-between gap-2 border-t border-slate-100 p-5 pt-0">
                <Link
                  href={svc.href}
                  className="shadow-xs flex w-full items-center justify-center space-x-1.5 rounded-xl bg-[#10B981] py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-600 active:scale-95"
                >
                  <span>Book Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HEALTHCARE CATEGORIES (Large image tiles) */}
      {/* ========================================================================= */}
      <section className="dark:border-zinc-850 border-y border-slate-200/80 bg-slate-50 py-12 dark:bg-zinc-900/60">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
              Healthcare Directory
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Explore Healthcare Categories
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Select a clinical category to discover specialized local pharmacies and accredited
              healthcare providers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HEALTHCARE_CATEGORIES.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.href}
                className="group relative flex h-64 flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-[#10B981]/40 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              >
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                <div className="relative z-10 space-y-1.5 text-white">
                  <span className="inline-block rounded-full bg-[#10B981] px-3 py-0.5 text-[10px] font-black text-white backdrop-blur-md">
                    {cat.count}
                  </span>
                  <h3 className="text-lg font-black">{cat.title}</h3>
                  <p className="line-clamp-2 text-xs text-slate-300">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PHARMACY OWNERS / CLINIC PARTNERS TARGETING SECTION */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-[#000e35] via-[#0F172A] to-slate-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-emerald-400">
                <Building2 className="h-4 w-4" /> For Pharmacy Owners & Clinical Managers
              </span>

              <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                Grow Your Pharmacy with Private Clinical Services
              </h2>

              <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-300">
                Join the UK&apos;s leading digital healthcare booking network. List your
                GPhC-registered pharmacy, showcase your PGD clinical services, and attract
                high-intent local private patients.
              </p>

              {/* Value Bullet Points */}
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#10B981]" />
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Full Slot Control</h4>
                    <p className="text-[11px] text-slate-400">
                      Configure appointment durations and blackout hours effortlessly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#10B981]" />
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Automatic Payouts</h4>
                    <p className="text-[11px] text-slate-400">
                      Direct stripe payouts with zero upfront monthly subscription fee.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#10B981]" />
                  <div>
                    <h4 className="text-xs font-extrabold text-white">GPhC & CQC Auditing</h4>
                    <p className="text-[11px] text-slate-400">
                      Automated consultation logging and patient consent record keeping.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#10B981]" />
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Automated Patient SMS</h4>
                    <p className="text-[11px] text-slate-400">
                      Instant appointment confirmations and reminder notifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/register-clinic"
                  className="inline-flex items-center space-x-2 rounded-2xl bg-[#10B981] px-6 py-3.5 text-xs font-black text-white shadow-lg transition-all hover:bg-emerald-600 active:scale-95"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Register Your Clinic Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center space-x-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 hover:text-white"
                >
                  <span>Provider Sign In</span>
                </Link>
              </div>
            </div>

            {/* Right Card Illustration / SaaS Dashboard Box */}
            <div className="lg:col-span-5">
              <div className="relative space-y-4 overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/90 p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 animate-ping rounded-full bg-emerald-400" />
                    <span className="text-xs font-black text-white">Provider Operations Desk</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    NextDoorClinic Partner
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-400">Briggate Pharmacy • Leeds</span>
                      <span className="text-slate-400">Today</span>
                    </div>
                    <p className="text-lg font-black text-white">
                      £1,420.00{" "}
                      <span className="text-xs font-normal text-slate-400">this week</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-3 text-xs font-semibold">
                      <span>Microsuction Ear Clearance</span>
                      <span className="font-bold text-emerald-400">10:00 AM • Booked</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-3 text-xs font-semibold">
                      <span>Yellow Fever Travel Consultation</span>
                      <span className="font-bold text-emerald-400">11:30 AM • Booked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. NEARBY CLINICS & FEATURED PROVIDERS */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="dark:border-zinc-850 flex items-end justify-between border-b border-slate-200/80 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
              Verified Providers
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Featured Local Pharmacies
            </h2>
          </div>

          <Link
            href="/providers"
            className="flex items-center space-x-1 text-xs font-extrabold text-[#10B981] hover:underline"
          >
            <span>View All Providers</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {approvedProviders.length > 0
            ? approvedProviders.map((p) => (
                <div
                  key={p.id}
                  className="dark:border-zinc-850 group flex flex-col justify-between space-y-4 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:border-[#10B981]/40 hover:shadow-md dark:bg-zinc-900"
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#10B981] text-base font-black text-white shadow-md">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {p.name}
                        </h3>
                        <p className="max-w-[200px] truncate text-xs text-slate-500 dark:text-zinc-400">
                          {p.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-bold text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>4.9</span>
                      <span className="font-normal text-slate-400">
                        (148 reviews) • GPhC Verified
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/provider/${p.slug || p.id}`}
                    className="shadow-xs flex items-center justify-center space-x-1.5 rounded-xl bg-[#10B981] py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-600"
                  >
                    <span>View Clinic & Book</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            : [
                {
                  name: "Briggate Pharmacy",
                  address: "85 Briggate, Leeds, LS1 6AZ",
                  slug: "briggate-pharmacy",
                },
                {
                  name: "Bullring Pharmacy",
                  address: "High Street, Birmingham, B5 4BU",
                  slug: "bullring-pharmacy",
                },
                {
                  name: "West End Pharmacy",
                  address: "Oxford Street, London, W1D 1BS",
                  slug: "west-end-pharmacy",
                },
              ].map((p, idx) => (
                <div
                  key={idx}
                  className="dark:border-zinc-850 group flex flex-col justify-between space-y-4 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:border-[#10B981]/40 hover:shadow-md dark:bg-zinc-900"
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#10B981] text-base font-black text-white shadow-md">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {p.name}
                        </h3>
                        <p className="max-w-[200px] truncate text-xs text-slate-500 dark:text-zinc-400">
                          {p.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-bold text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>4.9</span>
                      <span className="font-normal text-slate-400">
                        (148 reviews) • GPhC Verified
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/provider/${p.slug}`}
                    className="shadow-xs flex items-center justify-center space-x-1.5 rounded-xl bg-[#10B981] py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-600"
                  >
                    <span>View Clinic & Book</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HOW IT WORKS (4 Illustrated Steps) */}
      {/* ========================================================================= */}
      <section className="border-y border-slate-800 bg-slate-900 py-14 text-white">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
              Simple & Fast
            </span>
            <h2 className="text-2xl font-black text-white sm:text-3xl">How NextDoorClinic Works</h2>
            <p className="text-xs text-slate-300">
              Book verified local healthcare appointments in under 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step, idx) => (
              <div
                key={idx}
                className="relative space-y-3 rounded-3xl border border-slate-800 bg-slate-950/60 p-6"
              >
                <span className="text-2xl font-black text-[#10B981]">{step.step}</span>
                <h3 className="text-base font-extrabold text-white">{step.title}</h3>
                <p className="text-xs text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PATIENT REVIEWS (Editorial Testimonials) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
            Verified Reviews
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            Trusted by Thousands of UK Patients
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PATIENT_REVIEWS.map((rev, idx) => (
            <div
              key={idx}
              className="shadow-xs dark:border-zinc-850 space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 dark:bg-zinc-900"
            >
              <div className="flex items-center space-x-1 text-amber-500">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs font-medium italic text-slate-700 dark:text-zinc-300">
                &ldquo;{rev.quote}&rdquo;
              </p>
              <div className="flex items-center space-x-3 border-t border-slate-100 pt-2 dark:border-zinc-800">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                  <img src={rev.avatar} alt={rev.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{rev.name}</h4>
                  <p className="text-[10px] text-slate-400">{rev.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. HEALTHCARE ARTICLES */}
      {/* ========================================================================= */}
      <section className="dark:border-zinc-850 border-t border-slate-200/80 bg-slate-50 py-12 dark:bg-zinc-900/60">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="dark:border-zinc-850 flex items-end justify-between border-b border-slate-200/80 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                Medical Advice & Insights
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Healthcare Guidance
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {HEALTHCARE_ARTICLES.map((art, idx) => (
              <div
                key={idx}
                className="shadow-xs dark:border-zinc-850 group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white transition-all hover:border-[#10B981]/40 hover:shadow-md dark:bg-zinc-900"
              >
                <div className="space-y-3">
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                    <img
                      src={art.img}
                      alt={art.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                      {art.category}
                    </span>
                  </div>

                  <div className="space-y-2 p-5">
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
                      <span>{art.date}</span>
                      <span>•</span>
                      <span>{art.readTime}</span>
                    </div>

                    <h3 className="text-sm font-black leading-snug text-slate-900 dark:text-white">
                      {art.title}
                    </h3>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={art.href}
                    className="inline-flex items-center space-x-1 text-xs font-black text-[#10B981] hover:underline"
                  >
                    <span>Read Guide →</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
