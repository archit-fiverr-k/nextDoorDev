import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  Store,
  HeartPulse,
  ChevronDown,
  User,
  UserPlus,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const pharmacyFirstConditions = [
  { id: "pf-1", label: "Earache", desc: "Aged 1 to 17 years", color: "sky" },
  { id: "pf-2", label: "Impetigo", desc: "Aged 1 year and over", color: "rose" },
  { id: "pf-3", label: "Infected insect bites", desc: "Aged 1 year and over", color: "amber" },
  { id: "pf-4", label: "Shingles", desc: "Aged 18 years and over", color: "emerald" },
  { id: "pf-5", label: "Sinusitis", desc: "Aged 12 years and over", color: "indigo" },
  { id: "pf-6", label: "Sore throat", desc: "Aged 5 years and over", color: "purple" },
  { id: "pf-7", label: "Uncomplicated UTIs", desc: "Women aged 16 to 64", color: "red" },
];

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  // Fetch settings for trust bar ticker carousel
  const settings = await db.systemSetting.findFirst();
  const defaultTicker = [
    "Official UK Healthcare Directory - Search Verified CQC Compliant Partners",
  ];
  const trustTicker =
    settings?.trustTicker && Array.isArray(settings.trustTicker) && settings.trustTicker.length > 0
      ? (settings.trustTicker as string[])
      : defaultTicker;
  const trustTickerTitle = settings?.trustTickerTitle || "Trust Verification:";

  // Compute initials if user is pharmacy or patient
  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((n: string) => n[0] || "")
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  // Compute dashboard href based on user role
  let dashboardHref = "/patient/dashboard";
  if (user?.role === "super_admin" || user?.role === "platform_admin") {
    dashboardHref = "/admin";
  } else if (user?.role === "pharmacy" || user?.role === "staff") {
    dashboardHref = user?.pharmacyId ? `/pharmacy/${user.pharmacyId}` : "/provider";
  } else if (user?.role === "patient") {
    dashboardHref = "/patient/dashboard";
  } else if (user?.pharmacyId) {
    dashboardHref = `/pharmacy/${user.pharmacyId}`;
  }
  return (
    <div className="text-brand-dark flex min-h-screen flex-col overflow-x-hidden bg-brand-bg font-sans antialiased">
      {/* 1. TOP BAR: Informational links & Social links (Hidden on mobile) */}
      <div className="text-brand-muted hidden select-none border-b border-border bg-white text-xs dark:bg-zinc-950 md:block">
        <div className="mx-auto flex h-10 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Left links */}
          <div className="flex items-center space-x-6">
            <Link href="#" className="transition-colors hover:text-brand-teal">
              About Us
            </Link>
            <Link href="#" className="transition-colors hover:text-brand-teal">
              Contact Us
            </Link>
            <Link href="#" className="transition-colors hover:text-brand-teal">
              CQC Standards
            </Link>
            <Link href="/providers" className="transition-colors hover:text-brand-teal">
              Frequently Asked Questions
            </Link>
          </div>

          {/* Right social media links */}
          <div className="flex items-center space-x-4">
            <a href="#" className="transition-colors hover:text-brand-teal">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" className="transition-colors hover:text-brand-teal">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" className="transition-colors hover:text-brand-teal">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="#" className="transition-colors hover:text-brand-teal">
              <Youtube className="h-4 w-4" />
            </a>
            <a href="#" className="transition-colors hover:text-brand-teal">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT PREMIUM HEADER */}
      <header className="sticky top-0 z-50 w-full select-none shadow-sm">
        {/* TOP ROW: Brand logo, informational links, glowing pill badges, and patient auth actions */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur-md dark:border-zinc-900/60 dark:bg-zinc-950/95 lg:px-8">
          {/* Left: Brand logo */}
          <Link href="/" className="group flex shrink-0 items-center">
            <img
              src="/assets/header-logo.png"
              alt="NextDoorClinic Logo"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-[1.02] dark:brightness-0 dark:invert"
            />
          </Link>

          {/* Middle: Informational Links */}
          <div className="hidden items-center space-x-6 lg:flex">
            <Link
              href="/#how-it-works"
              className="text-xs font-bold text-slate-600 transition-colors hover:text-brand-teal"
            >
              How it Works
            </Link>
            <Link
              href="/providers"
              className="text-xs font-bold text-slate-600 transition-colors hover:text-brand-teal"
            >
              FAQs
            </Link>
          </div>

          {/* Right: Patient Login, Sign Up, or Dashboard avatar */}
          <div className="flex shrink-0 items-center space-x-4">
            {user ? (
              <Link
                href={dashboardHref}
                className="flex items-center space-x-2 text-xs font-bold text-slate-700 transition-colors hover:text-brand-teal dark:text-zinc-300 dark:hover:text-brand-teal"
              >
                <span>
                  {user.role === "super_admin" || user.role === "platform_admin"
                    ? "Admin Panel"
                    : "My Dashboard"}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-teal/20 bg-brand-teal/10 text-xs font-bold text-brand-teal dark:bg-zinc-900 dark:text-brand-teal">
                  {user.role === "super_admin" || user.role === "platform_admin" ? "AD" : initials}
                </div>
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="flex h-9 items-center space-x-1.5 rounded-full border border-slate-200/80 bg-white px-4 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <User className="h-3.5 w-3.5 text-brand-teal" />
                  <span>Patient Login</span>
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-bold text-brand-teal transition-colors hover:text-emerald-600"
                >
                  Register
                </Link>
              </div>
            )}

            {/* List your clinic button (light background / blue-gray button) */}
            <Link
              href="/for-providers"
              className="hidden h-9 items-center justify-center rounded-full bg-brand-navy px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-teal active:scale-[0.98] sm:flex"
            >
              List Your Clinic
            </Link>
          </div>
        </div>

        {/* BOTTOM ROW: Solid #0F172A dark slate navigation bar with dropdown menus */}
        <div className="border-slate-850 hidden h-11 items-center border-b bg-[#0F172A] px-6 text-slate-200 shadow-sm lg:flex lg:px-8">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-start">
            {/* Home Icon Link */}
            <Link
              href="/"
              className="flex h-full shrink-0 items-center justify-center px-4 text-slate-400 transition-all hover:bg-slate-800/60 hover:text-white"
            >
              <Home className="h-4 w-4" />
            </Link>

            {/* Men's Health Category Dropdown */}
            <div className="group relative h-full shrink-0">
              <button className="flex h-full cursor-pointer items-center space-x-1.5 border-none bg-transparent px-4 text-xs font-semibold text-slate-300 outline-none transition-all hover:bg-slate-800/40 hover:text-white">
                <span>Men&apos;s Health</span>
                <ChevronDown className="h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:rotate-180 group-hover:text-white" />
              </button>
              <div className="dark:border-zinc-850 invisible absolute left-0 top-full z-50 w-56 translate-y-1 rounded-b-xl border border-slate-200/80 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-950">
                <Link
                  href="/services?query=Hair Loss"
                  className="block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Hair Loss
                </Link>
                <Link
                  href="/services?query=Erectile Dysfunction"
                  className="block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Erectile Dysfunction
                </Link>
                <Link
                  href="/services?query=Premature Ejaculation"
                  className="block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Premature Ejaculation
                </Link>
              </div>
            </div>

            {/* Women's Health Category Dropdown */}
            <div className="group relative h-full shrink-0">
              <button className="flex h-full cursor-pointer items-center space-x-1.5 border-none bg-transparent px-4 text-xs font-semibold text-slate-300 outline-none transition-all hover:bg-slate-800/40 hover:text-white">
                <span>Women&apos;s Health</span>
                <ChevronDown className="h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:rotate-180 group-hover:text-white" />
              </button>
              <div className="dark:border-zinc-850 invisible absolute left-0 top-full z-50 w-56 translate-y-1 rounded-b-xl border border-slate-200/80 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-950">
                <Link
                  href="/services?query=Cystitis"
                  className="block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Cystitis / UTI
                </Link>
                <Link
                  href="/services?query=Period Delay"
                  className="block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Period Delay
                </Link>
                <Link
                  href="/services?query=Contraception"
                  className="block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Contraceptive Pill
                </Link>
              </div>
            </div>

            {/* Minor Ailments (NHS Pharmacy First dropdown) */}
            <div className="group relative h-full shrink-0">
              <button className="flex h-full cursor-pointer items-center space-x-1.5 border-none bg-transparent px-4 text-xs font-semibold text-slate-300 outline-none transition-all hover:bg-slate-800/40 hover:text-white">
                <span>Minor Ailments</span>
                <ChevronDown className="h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:rotate-180 group-hover:text-white" />
              </button>
              <div className="dark:border-zinc-850 invisible absolute left-0 top-full z-50 w-64 translate-y-1 rounded-b-xl border border-slate-200/80 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-950">
                <div className="mb-1.5 select-none border-b border-slate-100 px-4 pb-1.5 dark:border-zinc-900">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    NHS Pharmacy First
                  </span>
                </div>
                {pharmacyFirstConditions.map((cond) => (
                  <Link
                    key={cond.id}
                    href={`/services?query=${encodeURIComponent(cond.label)}`}
                    className="block px-4 py-1.5 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                  >
                    {cond.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* General Health Category Dropdown */}
            <div className="group relative h-full shrink-0">
              <button className="flex h-full cursor-pointer items-center space-x-1.5 border-none bg-transparent px-4 text-xs font-semibold text-slate-300 outline-none transition-all hover:bg-slate-800/40 hover:text-white">
                <span>General Health</span>
                <ChevronDown className="h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:rotate-180 group-hover:text-white" />
              </button>
              <div className="dark:border-zinc-850 invisible absolute left-0 top-full z-50 w-56 translate-y-1 rounded-b-xl border border-slate-200/80 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-950">
                <Link
                  href="/services?query=Blood Pressure Check"
                  className="block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Blood Pressure Check
                </Link>
                <Link
                  href="/services?query=Blood Tests"
                  className="hover:bg-slate-55 block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Blood Screening Tests
                </Link>
              </div>
            </div>

            {/* Travel Health Category Dropdown */}
            <div className="group relative h-full shrink-0">
              <button className="flex h-full cursor-pointer items-center space-x-1.5 border-none bg-transparent px-4 text-xs font-semibold text-slate-300 outline-none transition-all hover:bg-slate-800/40 hover:text-white">
                <span>Travel Health</span>
                <ChevronDown className="h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:rotate-180 group-hover:text-white" />
              </button>
              <div className="dark:border-zinc-850 invisible absolute left-0 top-full z-50 w-56 translate-y-1 rounded-b-xl border border-slate-200/80 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-950">
                <Link
                  href="/services?query=Antimalarials"
                  className="block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Antimalarials
                </Link>
                <Link
                  href="/services?query=Yellow Fever"
                  className="block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Yellow Fever Vaccine
                </Link>
                <Link
                  href="/services?query=Meningitis"
                  className="hover:bg-slate-55 block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Meningitis Vaccine
                </Link>
              </div>
            </div>

            {/* Skin Health Category Dropdown */}
            <div className="group relative h-full shrink-0">
              <button className="flex h-full cursor-pointer items-center space-x-1.5 border-none bg-transparent px-4 text-xs font-semibold text-slate-300 outline-none transition-all hover:bg-slate-800/40 hover:text-white">
                <span>Skin Health</span>
                <ChevronDown className="h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:rotate-180 group-hover:text-white" />
              </button>
              <div className="dark:border-zinc-850 invisible absolute left-0 top-full z-50 w-56 translate-y-1 rounded-b-xl border border-slate-200/80 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-950">
                <Link
                  href="/services?query=Acne"
                  className="hover:bg-slate-55 block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Acne Treatment
                </Link>
                <Link
                  href="/services?query=Eczema"
                  className="hover:bg-slate-55 block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Eczema & Dermatitis
                </Link>
                <Link
                  href="/services?query=Psoriasis"
                  className="hover:bg-slate-55 block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Psoriasis
                </Link>
              </div>
            </div>

            {/* Sexual Health Category Dropdown */}
            <div className="group relative h-full shrink-0">
              <button className="flex h-full cursor-pointer items-center space-x-1.5 border-none bg-transparent px-4 text-xs font-semibold text-slate-300 outline-none transition-all hover:bg-slate-800/40 hover:text-white">
                <span>Sexual Health</span>
                <ChevronDown className="h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:rotate-180 group-hover:text-white" />
              </button>
              <div className="dark:border-zinc-850 invisible absolute left-0 top-full z-50 w-56 translate-y-1 rounded-b-xl border border-slate-200/80 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-950">
                <Link
                  href="/services?query=Chlamydia"
                  className="hover:bg-slate-55 block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Chlamydia Treatment
                </Link>
                <Link
                  href="/services?query=Cold Sores"
                  className="hover:bg-slate-55 block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Oral Herpes / Cold Sores
                </Link>
                <Link
                  href="/services?query=Emergency Contraception"
                  className="hover:bg-slate-55 block px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  Emergency Contraception
                </Link>
              </div>
            </div>

            {/* A-Z Conditions */}
            <Link
              href="/services"
              className="flex h-full shrink-0 items-center px-4 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800/40 hover:text-white"
            >
              A-Z Conditions
            </Link>

            {/* A-Z Treatments */}
            <Link
              href="/services"
              className="flex h-full shrink-0 items-center px-4 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800/40 hover:text-white"
            >
              A-Z Treatments
            </Link>

            {/* Glowing Search Box on bottom right - sized h-8 to fit perfectly in h-11 bar */}
            <div className="ml-auto flex items-center pr-2">
              <Link
                href="/providers"
                className="flex h-8 shrink-0 select-none items-center space-x-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-4 text-xs font-semibold text-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.15)] transition-all duration-200 hover:bg-amber-500/20 hover:shadow-[0_0_14px_rgba(245,158,11,0.3)] dark:text-amber-400"
              >
                <Search className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Search Clinics</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex w-full flex-1 flex-col bg-brand-bg/50 pb-16 md:pb-0">{children}</main>

      {/* Premium Mobile Bottom Navigation Bar (app-like layout, hidden on desktop) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 select-none items-center justify-around border-t border-border bg-white/90 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] backdrop-blur-md dark:bg-zinc-950/90 md:hidden">
        <Link
          href="/"
          className="text-brand-muted flex flex-col items-center justify-center space-y-1 transition-all hover:text-brand-teal"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        <Link
          href="/providers"
          className="text-brand-muted flex flex-col items-center justify-center space-y-1 transition-all hover:text-brand-teal"
        >
          <Store className="h-5 w-5" />
          <span className="text-[10px] font-bold">Clinics</span>
        </Link>

        <Link
          href="/services"
          className="text-brand-muted flex flex-col items-center justify-center space-y-1 transition-all hover:text-brand-teal"
        >
          <HeartPulse className="h-5 w-5" />
          <span className="text-[10px] font-bold">Services</span>
        </Link>

        <Link
          href={user ? dashboardHref : "/login"}
          className="text-brand-muted flex flex-col items-center justify-center space-y-1 transition-all hover:text-brand-teal"
        >
          {user ? (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-teal/20 bg-brand-teal/10 text-[9px] font-extrabold text-brand-teal">
              {user.role === "super_admin" || user.role === "platform_admin" ? "AD" : initials}
            </div>
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
          <span className="text-[10px] font-bold">{user ? "Dashboard" : "Account"}</span>
        </Link>
      </div>

      {/* Premium Redesigned Footer */}
      <footer className="relative select-none overflow-hidden border-t border-border/80 bg-slate-50/60 px-6 py-16 dark:bg-zinc-950/70 lg:px-8">
        {/* Top Accent Gradient Bar */}
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-brand-teal via-emerald-500 to-brand-navy" />

        <div className="mx-auto w-full max-w-7xl space-y-12">
          {/* Top Row: Newsletter Subscribe & Socials */}
          <div className="flex flex-col items-center justify-between gap-8 border-b border-slate-200/60 pb-10 dark:border-zinc-800/60 md:flex-row">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-sm font-bold tracking-tight text-brand-navy dark:text-white">
                Stay updated on local clinical offerings
              </h3>
              <p className="text-brand-muted max-w-sm text-xs font-normal">
                Get monthly health bulletins, clinic onboardings, and community alerts straight to
                your inbox.
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:flex-row md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-10 min-w-[240px] rounded-xl border border-slate-200/80 bg-white px-4 text-xs transition-all focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 dark:border-zinc-800 dark:bg-zinc-900"
              />
              <button className="h-10 rounded-xl bg-brand-navy px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-teal active:scale-[0.98]">
                Subscribe
              </button>
            </div>
          </div>

          {/* Middle Row: 4-Column Directory Grid */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
            {/* Column 1: Brand & Verification details */}
            <div className="space-y-5">
              <div className="flex items-center">
                <img
                  src="/assets/header-logo.png"
                  alt="NextDoorClinic Logo"
                  className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
                />
              </div>
              <p className="text-brand-muted text-xs font-normal leading-relaxed">
                NextDoorClinic is the UK&apos;s verified clinical marketplace. We connect patients
                with registered local community pharmacies, private GPs, and travel vaccination
                clinics.
              </p>

              <div className="space-y-2 border-t border-slate-200/60 pt-2 dark:border-zinc-800/60">
                <div className="flex items-center space-x-2 text-[10px] font-bold text-brand-navy dark:text-slate-200">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-brand-teal" />
                  <span>GPhC Compliant Directory</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-bold text-brand-navy dark:text-slate-200">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-brand-teal" />
                  <span>ICO Data Protection Certified</span>
                </div>
              </div>
            </div>

            {/* Column 2: Patient services B2C */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-white">
                Patient Directory
              </h4>
              <ul className="text-brand-muted space-y-3 text-xs font-medium">
                <li>
                  <Link
                    href="/providers"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Search Local Clinics</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services?query=Travel"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Travel Vaccines Booking</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services?query=Ear"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Microsuction Ear Waxing</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services?query=GP"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Private GP Consultations</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services?query=Blood"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Diagnostic Blood Testing</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Clinic SaaS features B2B */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-white">
                Clinic Solutions
              </h4>
              <ul className="text-brand-muted space-y-3 text-xs font-medium">
                <li>
                  <Link
                    href="/for-providers"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Onboarding & Pricing</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/for-providers"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Practice Management SaaS</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/for-providers"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Roster & Calendar Planner</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/for-providers"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Booking Widget Generator</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/for-providers"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>HIPAA & UK GDPR Safeguards</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Compliance & Corporate */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-white">
                Compliance & Governance
              </h4>
              <ul className="text-brand-muted space-y-3 text-xs font-medium">
                <li>
                  <Link
                    href="/clinical-governance"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Clinical Governance & CQC</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>About NextDoorClinic</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/complaints"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Patient Complaints Policy</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>General Support & Desk</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>UK GDPR Privacy Policy</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Disclaimer and Meta Details */}
          <div className="text-brand-muted space-y-4 border-t border-slate-200/60 pt-8 text-[10px] font-normal leading-relaxed dark:border-zinc-800/60">
            <p>
              <strong>Disclaimer:</strong> NextDoorClinic is an independent directory and technology
              provider. Clinical consultations, treatments, pricing, and medical advice are provided
              directly by registered UK healthcare professionals under respective GPhC or GMC
              regulation at each approved pharmacy or clinic location. All platform communications
              are securely encrypted under UK GDPR guidelines.
            </p>

            <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-200/40 pt-4 font-medium dark:border-zinc-800/40 sm:flex-row">
              <p className="text-brand-muted shrink-0 text-center text-[10px] sm:text-left">
                &copy; {new Date().getFullYear()} NextDoorClinic Ltd. Registered in England & Wales.
                All rights reserved.
              </p>

              {/* Payment & Security Partners badges */}
              <div className="flex select-none flex-wrap items-center justify-center gap-2">
                <span className="rounded border border-slate-200/40 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-zinc-400">
                  Visa
                </span>
                <span className="rounded border border-slate-200/40 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-zinc-400">
                  Mastercard
                </span>
                <span className="rounded border border-slate-200/40 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-zinc-400">
                  Stripe Secure
                </span>
                <span className="rounded border border-slate-200/40 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-zinc-400">
                  Apple Pay
                </span>
                <span className="rounded border border-slate-200/40 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-zinc-400">
                  Google Pay
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-[10px] font-semibold">
                <Link href="/terms" className="transition-colors hover:text-brand-navy">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="transition-colors hover:text-brand-navy">
                  Privacy Policy
                </Link>
                <Link
                  href="/clinical-governance"
                  className="transition-colors hover:text-brand-navy"
                >
                  Clinical Governance
                </Link>
                <Link href="/complaints" className="transition-colors hover:text-brand-navy">
                  Complaints Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
