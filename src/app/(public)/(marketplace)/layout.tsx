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
import { MobileHeaderMenu } from "@/components/mobile-header-menu";

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
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error("Auth session error in layout:", err);
  }
  const user = session?.user;

  // Fetch settings for trust bar ticker carousel
  let settings = null;
  try {
    settings = await db.systemSetting.findFirst();
  } catch (err) {
    console.error("System settings DB error in layout:", err);
  }

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

  let pharmacyName = "";
  let pharmacySlug = "";
  const isPharmacyUser = user?.role === "pharmacy" || user?.role === "staff" || !!user?.pharmacyId;

  if (isPharmacyUser && user?.pharmacyId) {
    try {
      const pharm = await db.pharmacy.findUnique({
        where: { id: user.pharmacyId },
        select: { name: true, slug: true },
      });
      if (pharm?.name) {
        pharmacyName = pharm.name;
      }
      if (pharm?.slug) {
        pharmacySlug = pharm.slug;
      }
    } catch (err) {
      console.error("Error fetching pharmacy in layout:", err);
    }
  }

  if (isPharmacyUser && !pharmacyName) {
    pharmacyName = user?.name || "My Pharmacy Clinic";
  }

  // Compute dashboard href based on user role
  let dashboardHref = "/patient/dashboard";
  if (user?.role === "super_admin" || user?.role === "platform_admin") {
    dashboardHref = "/admin";
  } else if (user?.role === "pharmacy" || user?.role === "staff") {
    dashboardHref = user?.pharmacyId ? `/pharmacy/${pharmacySlug || user.pharmacyId}` : "/pharmacy";
  } else if (user?.role === "patient") {
    dashboardHref = "/patient/dashboard";
  } else if (user?.pharmacyId) {
    dashboardHref = `/pharmacy/${pharmacySlug || user.pharmacyId}`;
  }

  // Fetch Master Service Categories from PDF catalogue
  let serviceCategories: any[] = [];
  try {
    serviceCategories = await db.serviceCategory.findMany({
      include: {
        masterServices: {
          where: { status: "ACTIVE" },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("Error fetching service categories for layout menu header:", err);
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
        {/* TOP ROW: Brand logo, mobile menu on top left, informational links, and patient auth actions */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur-md dark:border-zinc-900/60 dark:bg-zinc-950/95 sm:px-6 lg:px-8">
          {/* Left: Mobile Menu (Top Left) + Brand logo */}
          <div className="flex items-center space-x-3">
            {/* 3-Dot Mobile Menu on Top Left */}
            <MobileHeaderMenu
              user={user}
              pharmacyName={pharmacyName}
              dashboardHref={dashboardHref}
              isPharmacyUser={isPharmacyUser}
              serviceCategories={serviceCategories}
            />

            <Link href="/" className="group flex shrink-0 items-center">
              <img
                src="/assets/header-logo.png"
                alt="NextDoorClinic Logo"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-[1.02] dark:brightness-0 dark:invert sm:h-10"
              />
            </Link>
          </div>

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
          <div className="flex shrink-0 items-center space-x-3 sm:space-x-4">
            {user ? (
              <Link
                href={dashboardHref}
                className="flex items-center space-x-2 text-xs font-bold text-slate-700 transition-colors hover:text-brand-teal dark:text-zinc-300 dark:hover:text-brand-teal"
              >
                <span>
                  {user.role === "super_admin" || user.role === "platform_admin"
                    ? "Admin Panel"
                    : isPharmacyUser
                      ? "Pharmacy Dashboard"
                      : "My Dashboard"}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-teal/20 bg-brand-teal/10 text-xs font-bold text-brand-teal dark:bg-zinc-900 dark:text-brand-teal">
                  {user.role === "super_admin" || user.role === "platform_admin" ? "AD" : initials}
                </div>
              </Link>
            ) : (
              <div className="hidden items-center space-x-2.5 sm:flex sm:space-x-4">
                <Link
                  href="/login"
                  className="flex h-9 items-center space-x-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:px-4"
                >
                  <User className="h-3.5 w-3.5 text-brand-teal" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-bold text-brand-teal transition-colors hover:text-emerald-600"
                >
                  Register
                </Link>
              </div>
            )}

            {/* List your clinic button OR Pharmacy Name button (Hidden on Mobile) */}
            {isPharmacyUser ? (
              <Link
                href={dashboardHref}
                className="hidden h-9 items-center justify-center space-x-1.5 rounded-full bg-brand-navy px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-teal active:scale-[0.98] lg:flex"
              >
                <Store className="h-3.5 w-3.5 text-brand-teal" />
                <span className="max-w-[180px] truncate">{pharmacyName}</span>
              </Link>
            ) : (
              <Link
                href="/register-clinic"
                className="hidden h-9 items-center justify-center rounded-full bg-brand-navy px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-teal active:scale-[0.98] lg:flex"
              >
                List Your Clinic
              </Link>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: Compact #0F172A dark slate navigation bar */}
        <div className="border-slate-850 shadow-xs hidden h-10 items-center border-b bg-[#0F172A] px-6 text-slate-200 lg:flex lg:px-8">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-start space-x-1">
            {/* Home Icon Link */}
            <Link
              href="/"
              className="flex h-full shrink-0 items-center justify-center px-3 text-slate-400 transition-all hover:bg-slate-800/60 hover:text-white"
            >
              <Home className="h-4 w-4" />
            </Link>

            {/* Top 4 Primary Categories */}
            {serviceCategories.slice(0, 4).map((cat) => (
              <div key={cat.id} className="group relative h-full shrink-0">
                <button className="flex h-full cursor-pointer items-center space-x-1 border-none bg-transparent px-3 text-xs font-semibold text-slate-300 outline-none transition-all hover:bg-slate-800/40 hover:text-white">
                  <span>{cat.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:rotate-180 group-hover:text-white" />
                </button>
                <div className="dark:border-zinc-850 invisible absolute left-0 top-full z-50 max-h-96 w-64 translate-y-1 overflow-y-auto rounded-b-xl border border-slate-200/80 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-950">
                  <div className="mb-1.5 select-none border-b border-slate-100 px-4 pb-1.5 dark:border-zinc-900">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {cat.name}
                    </span>
                  </div>
                  {cat.masterServices.map((svc: any) => (
                    <Link
                      key={svc.id}
                      href={`/search?service=${encodeURIComponent(svc.name)}`}
                      className="block px-4 py-1.5 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                    >
                      {svc.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* More Categories Dropdown (If > 4 categories exist) */}
            {serviceCategories.length > 4 && (
              <div className="group relative h-full shrink-0">
                <button className="flex h-full cursor-pointer items-center space-x-1 border-none bg-transparent px-3 text-xs font-semibold text-slate-300 outline-none transition-all hover:bg-slate-800/40 hover:text-white">
                  <span>More Categories</span>
                  <ChevronDown className="h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:rotate-180 group-hover:text-white" />
                </button>
                <div className="dark:border-zinc-850 invisible absolute left-0 top-full z-50 max-h-96 w-72 translate-y-1 divide-y divide-slate-100 overflow-y-auto rounded-b-xl border border-slate-200/80 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:divide-zinc-900 dark:bg-zinc-950">
                  {serviceCategories.slice(4).map((cat) => (
                    <div key={cat.id} className="py-2 first:pt-0 last:pb-0">
                      <div className="px-4 py-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          {cat.name}
                        </span>
                      </div>
                      {cat.masterServices.map((svc: any) => (
                        <Link
                          key={svc.id}
                          href={`/search?service=${encodeURIComponent(svc.name)}`}
                          className="block px-6 py-1 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-teal dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                        >
                          {svc.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Services Shortcut */}
            <Link
              href="/search"
              className="ml-auto flex h-full shrink-0 items-center px-3 text-xs font-bold text-emerald-400 transition-all hover:bg-slate-800/40 hover:text-emerald-300"
            >
              All Services (A-Z) &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex w-full flex-1 flex-col bg-brand-bg/50 pb-16 md:pb-0">{children}</main>

      {/* Native Mobile Bottom Navigation Bar (Airbnb / Apple Health Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 select-none items-center justify-around border-t border-slate-200/80 bg-white/95 px-4 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden">
        <Link
          href="/"
          className="flex flex-col items-center justify-center space-y-1 text-slate-600 transition-colors hover:text-[#10B981] dark:text-zinc-400 dark:hover:text-white"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        <Link
          href="/search"
          className="flex flex-col items-center justify-center space-y-1 text-[#10B981] transition-colors hover:text-emerald-600"
        >
          <Search className="h-5 w-5 stroke-[2.5]" />
          <span className="text-[10px] font-bold">Search</span>
        </Link>

        <Link
          href={user ? dashboardHref : "/login"}
          className="flex flex-col items-center justify-center space-y-1 text-slate-600 transition-colors hover:text-[#10B981] dark:text-zinc-400 dark:hover:text-white"
        >
          {user ? (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-[9px] font-extrabold text-[#10B981]">
              {user.role === "super_admin" || user.role === "platform_admin" ? "AD" : initials}
            </div>
          ) : (
            <User className="h-5 w-5" />
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
                    href="/register-clinic"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Onboarding & Pricing</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register-clinic"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Practice Management SaaS</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register-clinic"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Roster & Calendar Planner</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register-clinic"
                    className="group flex items-center transition-all duration-200 hover:text-brand-teal"
                  >
                    <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal opacity-0 transition-opacity group-hover:opacity-100" />
                    <span>Booking Widget Generator</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register-clinic"
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
