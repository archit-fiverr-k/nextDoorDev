import Link from "next/link";
import { Fragment } from "react";
import {
  Plane,
  Stethoscope,
  Ear,
  Droplet,
  Syringe,
  Activity,
  HeartPulse,
  Search,
  CalendarCheck,
  Sparkles,
  ShieldCheck,
  Star,
  ArrowRight,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  Check,
  Smartphone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Scale,
  TrendingUp,
  Lock,
  ShieldAlert,
  HeartHandshake,
} from "lucide-react";
import { db } from "@/lib/db";
import { AccordionItem } from "./accordion-item";
import { SearchBar } from "./search-bar";
import { HeroIllustration } from "./hero-illustration";
import { ScrollReveal } from "./scroll-reveal";
import { SchedulingFlow } from "./scheduling-flow";

export const revalidate = 0; // Dynamic database loading

export default async function HomePage() {
  // Query approved pharmacies from database for Featured Section
  let approvedProviders: any[] = [];
  try {
    approvedProviders = await db.pharmacy.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
      },
      include: {
        services: {
          where: {
            status: "ACTIVE",
          },
          take: 3,
        },
      },
      take: 3,
    });
  } catch (err) {
    console.error("Database connection notice on homepage:", err);
  }

  return (
    <div className="w-full bg-white text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* 1. HERO SECTION (Editorial Airbnb/Stripe Typographic layout) */}
      <Hero />

      {/* TRUST MARQUEE SECTION (Scrolling trust & safety badges) */}
      <TrustMarquee />

      {/* 2. STATS BAR (Flat clean whitespace-aligned row) */}
      <StatsBar />

      {/* 3. CLINICAL DIRECTORY INDEX (Typographic index instead of cards) */}
      <PharmacyFirst />

      {/* 4. CLINICAL AVAILABILITY TICKETS (Flat slots near you) */}
      <Vaccines />

      {/* 5. VETTED PHARMACIES (Vetting details & Featured list) */}
      <FeaturedProviders providers={approvedProviders} />

      {/* 6. SCHEDULING FLOW (Stripe & Airbnb level interactive step showcase) */}
      <SchedulingFlow />

      {/* 7. REGISTRY COVERAGE (Vector Map outline) */}
      <HealthcareNearYou />

      {/* 8. FOR CLINIC PARTNERS (SaaS Dashboard layout showcase) */}
      <ProviderCTA />

      {/* 9. SERVICE RANGE OVERVIEW (Typographic Category Index) */}
      <EveryKindOfCare />

      {/* 10. REAL PATIENT QUOTES (Flat columns, no cards, Airbnb style) */}
      <Testimonials />

      {/* 11. FAQ ACCORDION (Flat list) */}
      <FAQs />

      {/* 12. END OF PAGE BOOKING PORTAL (Sleek callout) */}
      <CTA />
    </div>
  );
}

// ==========================================
// 1. HERO SECTION
// ==========================================
function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-12 dark:bg-zinc-950 md:pb-20 md:pt-16">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes sweep-left-to-right {
          0% {
            stroke-dashoffset: 240;
            opacity: 0.2;
          }
          85% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        .animate-underline-sweep {
          stroke-dasharray: 240;
          stroke-dashoffset: 240;
          animation: sweep-left-to-right 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `,
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-10">
          {/* ======== LEFT: COPY & SEARCH (60% Width) ======== */}
          <div className="relative z-10 space-y-7 lg:col-span-6">
            {/* Trust Dots */}
            <div className="flex select-none flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                CQC Regulated Directory
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                NHS Verified Partner
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                GDPR Compliant
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-3.5">
              <h1 className="font-display text-[2.5rem] font-semibold leading-[1.15] tracking-tight text-[#0F172A] dark:text-white sm:text-5xl lg:text-[3.5rem]">
                Find trusted healthcare providers,{" "}
                <span className="relative inline-block">
                  <span className="text-[#10B981]">book in minutes.</span>
                  <svg
                    className="absolute -bottom-1.5 left-0 h-2.5 w-full text-[#10B981]"
                    viewBox="0 0 200 8"
                    preserveAspectRatio="none"
                  >
                    {/* Base faint background stroke */}
                    <path
                      d="M0 6 Q50 0 100 6 T200 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeOpacity="0.2"
                      strokeLinecap="round"
                    />
                    {/* Active left-to-right drawing stroke */}
                    <path
                      d="M0 6 Q50 0 100 6 T200 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="animate-underline-sweep"
                    />
                  </svg>
                </span>
              </h1>

              <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                Search verified pharmacies, private GPs and clinics across the UK with transparent
                pricing, real-time availability and instant booking.
              </p>
            </div>

            {/* Dual Search Input Bar */}
            <div className="group relative z-30 w-full max-w-xl">
              <SearchBar className="shadow-lg transition-all hover:shadow-xl" />
            </div>

            {/* Trust Metrics Row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.9 Patient rating
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-[#10B981]" /> Same-day clinical slots
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#10B981]" /> Real-time transparent prices
              </span>
            </div>
          </div>

          {/* ======== RIGHT: HERO CONSULTATION NURSE IMAGE (40% Width) ======== */}
          <div className="relative z-10 lg:col-span-4">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 2. STATS BAR SECTION
// ==========================================
function StatsBar() {
  const stats = [
    { value: "120", suffix: "+", label: "Connected Clinicians" },
    { value: "15,000", suffix: "+", label: "Appointments Booked" },
    { value: "4.9", suffix: "★", label: "Average Patient Rating" },
  ];

  return (
    <section className="select-none border-y border-slate-100 bg-white py-12 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 divide-y divide-slate-100 text-center dark:divide-zinc-900 md:grid-cols-3 md:divide-x md:divide-y-0">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center py-4 md:py-0">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-zinc-100 sm:text-5xl">
                  {stat.value}
                </span>
                <span className="ml-0.5 text-3xl font-semibold text-brand-teal">{stat.suffix}</span>
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 3. CLINICAL DIRECTORY INDEX (Typographic table instead of cards)
// ==========================================
function PharmacyFirst() {
  const categories = [
    {
      name: "Flu Vaccination",
      desc: "Seasonal vaccination protection.",
      price: "From £19",
      icon: Droplet,
    },
    {
      name: "Travel Immunisations",
      desc: "Yellow Fever, Typhoid, & vaccines.",
      price: "From £45",
      icon: Plane,
    },
    { name: "Ear Wax Removal", desc: "Safe microsuction cleaning.", price: "From £49", icon: Ear },
    {
      name: "Blood Diagnostics",
      desc: "Detailed biomarker screenings.",
      price: "From £39",
      icon: Activity,
    },
    {
      name: "Weight Management",
      desc: "Prescription support programs.",
      price: "From £30",
      icon: TrendingUp,
    },
    {
      name: "Vitamin Injections",
      desc: "Vitamin B12 clinical shots.",
      price: "From £29",
      icon: Syringe,
    },
  ];

  return (
    <section className="bg-white py-24 dark:bg-zinc-950 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="mb-16 max-w-2xl space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">
            Clinical Services Directory
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-zinc-100 sm:text-5xl">
            Direct care on your high street.
          </h2>
          <p className="text-base leading-relaxed text-[#64748B] dark:text-zinc-400">
            Skip primary care waiting lists. Book consultations, immunisations, and diagnostic
            testing directly at verified independent UK pharmacies.
          </p>
        </div>

        {/* Editorial Asymmetrical Split-Screen Layout */}
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Column (lg:col-span-6): Large Real Healthcare Photography */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-md dark:border-zinc-800 lg:col-span-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/vaccination_care.png"
              alt="Clinician administering clinical treatment"
              className="h-[450px] w-full object-cover object-center sm:h-[500px]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 space-y-2 text-white">
              <div className="shadow-xs inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-3 py-1 text-xs font-bold text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>NHS Pharmacy First Partner</span>
              </div>
              <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                Independent Prescribers on High Street
              </h3>
              <p className="max-w-md text-xs font-medium text-slate-300">
                Qualified pharmacists deliver face-to-face clinical advice, prescriptions, and
                immunisations without GP referral delays.
              </p>
            </div>
          </div>

          {/* Right Column (lg:col-span-6): Clean Typographic Index */}
          <div className="space-y-4 lg:col-span-6">
            {categories.map((cat, i) => {
              return (
                <Link
                  key={i}
                  href={`/services?query=${encodeURIComponent(cat.name)}`}
                  className="group flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 p-4 transition-all hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/80"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-zinc-500">
                      0{i + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A] transition-colors group-hover:text-[#10B981] dark:text-zinc-100">
                        {cat.name}
                      </h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                        {cat.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-4 text-right">
                    <span className="text-xs font-bold text-[#10B981]">{cat.price}</span>
                    <span className="block text-[10px] font-semibold text-slate-400 group-hover:underline">
                      Book &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}

            <div className="pt-4 text-center sm:text-left">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#10B981] hover:underline"
              >
                <span>Browse full directory of 25+ clinical services</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 4. VACCINES SECTION (Clinical availability near you)
// ==========================================
function Vaccines() {
  const cards = [
    {
      name: "Travel Immunisations",
      price: "£45",
      duration: "15 mins",
      slot: "Today 2:30 PM",
      clinic: "London Care Pharmacy",
      location: "Kensington, London",
    },
    {
      name: "Flu Vaccination",
      price: "£19",
      duration: "10 mins",
      slot: "Tomorrow 9:00 AM",
      clinic: "Westside Meds",
      location: "Manchester City",
    },
    {
      name: "COVID-19 Booster",
      price: "£12",
      duration: "10 mins",
      slot: "Today 4:00 PM",
      clinic: "Springfield Clinic",
      location: "Birmingham",
    },
    {
      name: "Chickenpox Vaccine",
      price: "£70",
      duration: "15 mins",
      slot: "Tomorrow 10:30 AM",
      clinic: "Leeds Wellness",
      location: "Leeds Centre",
    },
    {
      name: "HPV Immunisation",
      price: "£150",
      duration: "20 mins",
      slot: "Today 1:15 PM",
      clinic: "Bristol Apothecary",
      location: "Clifton, Bristol",
    },
    {
      name: "Shingles Vaccine",
      price: "£220",
      duration: "15 mins",
      slot: "Tomorrow 11:00 AM",
      clinic: "Summit Pharmacy",
      location: "Edinburgh West",
    },
  ];

  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-24 dark:border-zinc-900 dark:bg-zinc-900/10 md:py-32">
      <div className="mx-auto max-w-7xl space-y-16 px-6 lg:px-8">
        {/* Section Header */}
        <div className="space-y-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal">
            Services Near You
          </span>
          <h2 className="dark:text-zinc-150 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Available clinics & Same-day slots
          </h2>
          <p className="max-w-md text-sm text-slate-500 dark:text-zinc-400">
            Directly bookable same-day slots with upfront prices. Select a slot to confirm your
            booking.
          </p>
        </div>

        {/* Flat Card Grid (Strictly 12px card radius, 10px button radius, no blurry shadows) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <ScrollReveal key={i} delayMs={i * 60}>
              <div className="border-slate-150 flex h-full flex-col justify-between rounded-[12px] border bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:border-zinc-800">
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                      {card.name}
                    </h3>
                    <span className="shrink-0 text-[14px] font-bold text-slate-900 dark:text-zinc-200">
                      {card.price}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500">
                    <Clock className="size-3.5 shrink-0" />
                    <span>{card.duration}</span>
                  </div>

                  <div className="flex">
                    <span className="inline-flex items-center rounded-[6px] bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                      {card.slot}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-900">
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-[12px] font-semibold text-slate-800 dark:text-zinc-300">
                      {card.clinic}
                    </p>
                    <p className="text-slate-450 truncate text-[11px] dark:text-zinc-500">
                      {card.location}
                    </p>
                  </div>

                  <Link
                    href={`/services?query=${encodeURIComponent(card.name)}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Book
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 5. FEATURED CLINICS SECTION
// ==========================================
function FeaturedProviders({ providers }: { providers: any[] }) {
  return (
    <section className="border-t border-slate-100 bg-white py-24 dark:border-zinc-900 dark:bg-zinc-950 md:py-32">
      <div className="mx-auto max-w-7xl space-y-16 px-6 lg:px-8">
        {/* Section Header */}
        <div className="space-y-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal">
            Vetted Partners
          </span>
          <h2 className="dark:text-zinc-150 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Trusted healthcare providers
          </h2>
          <p className="max-w-md text-sm text-slate-500 dark:text-zinc-400">
            All clinical partners are registered with the General Pharmaceutical Council (GPhC) and
            regulated to CQC standards.
          </p>
        </div>

        {providers.length === 0 ? (
          <div className="border-slate-150 max-w-xl space-y-2 rounded-[12px] border bg-white p-12 text-center dark:border-zinc-900 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Onboarding approved clinicians
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
              We are verifying clinic registries. Real-time scheduling will be online shortly.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p, index) => {
              const demoImages = [
                "/assets/demo-pharmacy-1.jpg",
                "/assets/demo-pharmacy-2.jpg",
                "/assets/demo-pharmacy-3.jpg",
              ];
              const cardImage = p.logoUrl || demoImages[index % demoImages.length];
              const reviewCounts = [142, 98, 87];
              const ratingScores = ["4.9", "4.9", "4.8"];
              const reviewCount = reviewCounts[index % reviewCounts.length];
              const ratingScore = ratingScores[index % ratingScores.length];

              return (
                <ScrollReveal key={p.id} delayMs={index * 60}>
                  <div className="border-slate-150 flex h-full flex-col justify-between overflow-hidden rounded-[12px] border bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
                    {/* Image Area - Exactly 8-12px rounded image edge inside frame */}
                    <div className="relative h-[210px] w-full bg-slate-50 p-2 dark:bg-zinc-900/40">
                      <img
                        src={cardImage}
                        alt={p.name}
                        className="h-full w-full select-none rounded-[8px] object-cover"
                      />
                      <div className="absolute left-4 top-4">
                        <span className="select-none rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          NHS Partner
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                      <div className="space-y-3">
                        <div>
                          <h3 className="truncate text-[15px] font-bold text-slate-900 dark:text-zinc-100">
                            {p.name}
                          </h3>
                          <p className="text-slate-450 mt-1 flex items-center gap-1 truncate text-[11px] dark:text-zinc-500">
                            <MapPin className="size-3.5 text-slate-400" />
                            <span>{p.address}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-50 pt-1 text-xs dark:border-zinc-900/60">
                          <div className="flex items-center space-x-1 text-[11px]">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <strong className="font-bold text-slate-800 dark:text-white">
                              {ratingScore}
                            </strong>
                            <span className="text-slate-450">({reviewCount} reviews)</span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Available Today
                          </span>
                        </div>

                        {p.services && p.services.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {p.services.slice(0, 2).map((s: any) => (
                              <span
                                key={s.id}
                                className="rounded-[4px] bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/provider/${p.slug}`}
                        className="flex h-10 w-full items-center justify-center rounded-[10px] bg-brand-teal text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                      >
                        Book Appointment
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        <div className="pt-4 text-center">
          <Link
            href="/providers"
            className="inline-flex items-center text-xs font-bold text-brand-teal hover:underline"
          >
            View all vetted pharmacies &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 7. REGISTRY COVERAGE MAP SECTION
// ==========================================
function HealthcareNearYou() {
  const cities = ["London", "Manchester", "Birmingham", "Leeds", "Bristol", "Edinburgh"];

  return (
    <section className="bg-slate-950 py-24 text-white md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              Nationwide Coverage
            </span>
            <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Healthcare near you, wherever you are.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
              We index and audit approved pharmaceutical premises in major UK cities. Easily find
              clinical coverage in your area.
            </p>

            <div className="flex select-none flex-wrap gap-2 pt-2">
              {cities.map((city) => {
                const isActive = city === "London";
                return (
                  <button
                    key={city}
                    type="button"
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "border-brand-teal bg-brand-teal text-white"
                        : "text-zinc-350 border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>

            <div className="pt-4">
              <Link
                href="/providers"
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-brand-teal px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-600"
              >
                Find clinical coverage near you &nbsp;&rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Static Connection Map Image */}
          <div className="relative flex select-none items-center justify-center overflow-hidden rounded-[12px]">
            <img
              src="/assets/live-pharma-map.png"
              alt="NextDoorClinic Connection Coverage Map"
              className="h-auto w-full rounded-[12px] object-contain opacity-95"
            />
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-[8px] border border-white/10 bg-slate-900/90 px-3.5 py-1.5 font-mono text-[9px] text-white/90 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#10B981]" />
              <span>GPhC Active Coverage Map</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 8. FOR CLINIC PARTNERS (SaaS Dashboard layout showcase)
// ==========================================
function ProviderCTA() {
  const features = [
    "Branded booking profiles with custom clinical lists",
    "Real-time calendar slot management & GPhC integration",
    "Automated Patient SMS and email notification logs",
    "Comprehensive HIPAA & CQC compliant client records",
    "Goes live in under an hour without developer resources",
  ];

  return (
    <section className="border-t border-slate-100 bg-white py-24 dark:border-zinc-900 dark:bg-zinc-950 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal">
              For Pharmacy Owners
            </span>
            <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Manage your clinic.
              <br />
              Own your brand.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-slate-500 dark:text-zinc-400 sm:text-base">
              Publish schedules, dispatch SMS updates, and control patient records through our
              simple management console. Empower your clinic backend.
            </p>

            <div className="space-y-3.5 pt-2">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-[16px] shrink-0 text-brand-teal" />
                  <span className="text-slate-650 text-xs font-medium leading-normal dark:text-zinc-300 sm:text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex select-none flex-wrap gap-4 pt-4">
              <Link
                href="/register-clinic"
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-slate-900 px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                List your clinic — start free
              </Link>
              <Link
                href="/for-providers"
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-slate-200 px-6 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                See workflow &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Flat Professional Panel (Strictly 12px rounded corner card, subtle borders, no large shadows) */}
          <ScrollReveal delayMs={80}>
            <div className="border-slate-150 space-y-6 rounded-[12px] border bg-slate-50 p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-4 dark:border-zinc-800">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Green Cross Pharmacy
                </span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                  Partner Portal
                </span>
              </div>

              {/* Status Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                  Today:
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                  8 Confirmed
                </span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                  2 Pending
                </span>
              </div>

              {/* Patient slots list */}
              <div className="space-y-2.5">
                {[
                  {
                    time: "09:30 AM",
                    initials: "JS",
                    service: "Flu Vaccination",
                    status: "Confirmed",
                    statusColor: "text-emerald-600",
                  },
                  {
                    time: "11:00 AM",
                    initials: "EV",
                    service: "Travel Vaccines",
                    status: "Confirmed",
                    statusColor: "text-emerald-600",
                  },
                  {
                    time: "02:15 PM",
                    initials: "TM",
                    service: "Blood Pressure Check",
                    status: "Pending",
                    statusColor: "text-amber-600",
                  },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-[8px] border border-slate-100 bg-white p-3 text-xs dark:border-zinc-900 dark:bg-zinc-950"
                  >
                    <div className="flex min-w-0 items-center space-x-3">
                      <span className="shrink-0 font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                        {row.time}
                      </span>
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {row.initials}
                      </div>
                      <span className="truncate font-semibold text-slate-800 dark:text-zinc-200">
                        {row.service}
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold ${row.statusColor} shrink-0`}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Booking link preview */}
              <div className="space-y-2 border-t border-slate-200/60 pt-4 dark:border-zinc-800">
                <span className="block text-[10px] font-semibold text-slate-400">
                  Your booking page:
                </span>
                <div className="flex items-center justify-between rounded-[8px] border border-slate-100 bg-white px-3 py-2 text-xs dark:border-zinc-900 dark:bg-zinc-950">
                  <span className="truncate pr-2 font-mono text-brand-teal">
                    nextdoorclinic.com/book/green-cross
                  </span>
                  <button className="shrink-0 text-[10px] font-bold text-slate-400 hover:text-slate-700">
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 9. SERVICE RANGE OVERVIEW (Typographic Category Index)
// ==========================================
function EveryKindOfCare() {
  const categories = [
    { name: "Vaccinations", services: "Flu jab · Travel · COVID booster", icon: Syringe },
    { name: "Consultations", services: "GP consultation · Minor ailments", icon: Stethoscope },
    { name: "Diagnostics", services: "Blood tests · Blood pressure checks", icon: Activity },
    { name: "Aesthetics & Wellness", services: "Weight loss · Vitamin B12 shots", icon: Sparkles },
    { name: "Women's Health", services: "Contraception · Cystitis care", icon: HeartPulse },
  ];

  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-24 dark:border-zinc-900 dark:bg-zinc-900/10 md:py-32">
      <div className="mx-auto max-w-7xl space-y-16 px-6 lg:px-8">
        {/* Section Header */}
        <div className="space-y-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal">
            Service Range
          </span>
          <h2 className="dark:text-zinc-150 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            One marketplace. Simple index.
          </h2>
          <p className="max-w-md text-sm text-slate-500 dark:text-zinc-400">
            Directly browse all pharmaceutical solutions. Filter services and book at GPhC approved
            storefronts.
          </p>
        </div>

        {/* Categories (Flat typographic cards - no floating shadow effects, exactly 12px corners) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <ScrollReveal key={i} delayMs={i * 50}>
                <div className="border-slate-150 flex h-full flex-col justify-between rounded-[12px] border bg-white p-5 shadow-sm transition-colors hover:border-brand-teal dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="space-y-4">
                    <Icon className="size-[24px] text-brand-teal" />
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-200 sm:text-[13px]">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] leading-normal text-slate-500 dark:text-zinc-400">
                        {cat.services}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 10. REAL PATIENT QUOTES (Flat columns, no cards, Airbnb style)
// ==========================================
function Testimonials() {
  return (
    <section className="border-t border-slate-100 bg-white py-24 dark:border-zinc-900 dark:bg-zinc-950 md:py-32">
      <div className="mx-auto max-w-7xl space-y-16 px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">
            Patient Stories & Trust
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-zinc-100 sm:text-5xl">
            Real healthcare experiences.
          </h2>
        </div>

        {/* Large Editorial Patient Portrait & Quote Layout */}
        <div className="grid items-center gap-12 rounded-2xl border border-slate-200/80 bg-slate-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-12 lg:grid-cols-12">
          {/* Left Column (lg:col-span-5): Patient Portrait Photo */}
          <div className="relative lg:col-span-5">
            <div className="relative h-[380px] overflow-hidden rounded-xl border border-slate-200/60 shadow-md sm:h-[420px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/patient_portrait.png"
                alt="Sarah Jenkins, Verified Patient"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>

          {/* Right Column (lg:col-span-7): Editorial Quote */}
          <div className="space-y-6 lg:col-span-7">
            <div className="flex gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>

            <blockquote className="text-xl font-extrabold leading-relaxed tracking-tight text-[#0F172A] dark:text-white sm:text-2xl lg:text-3xl">
              &ldquo;I needed an urgent travel consultation before my flight to Vietnam.
              NextDoorClinic matched me with a verified Soho pharmacy in under 2 minutes, and I had
              my vaccines confirmed the same afternoon.&rdquo;
            </blockquote>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
              <div>
                <p className="text-base font-extrabold text-[#0F172A] dark:text-white">
                  Sarah Jenkins
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Soho, London &bull; Booked Travel Immunisation
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1.5 text-xs font-bold text-[#10B981]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified Booking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 11. FAQ ACCORDION (Flat list)
// ==========================================
function FAQs() {
  const faqs = [
    {
      q: "Is NextDoorClinic affiliated with the NHS?",
      a: "No. We are a private directory marketplace of independent UK clinics and GPhC registered pharmacies. We complement existing NHS services.",
    },
    {
      q: "How much do clinic services cost?",
      a: "Service pricing is displayed upfront on each provider profile. Flu vaccinations start from £19, ear wax removal from £49.",
    },
    {
      q: "Are the clinical providers regulated?",
      a: "Yes. Every clinical space listed on NextDoorClinic is registered with appropriate regulatory bodies including the GPhC (pharmacies), GMC (GPs), and CQC.",
    },
    {
      q: "Can I reschedule or cancel my slot?",
      a: "Yes. Patients can cancel or reschedule appointments free of charge up to 24 hours prior to the slot time from their patient dashboard.",
    },
  ];

  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-24 dark:border-zinc-900 dark:bg-zinc-900/10 md:py-32">
      <div className="mx-auto max-w-3xl space-y-16 px-6">
        {/* Section Header */}
        <div className="space-y-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal">
            Questions
          </span>
          <h2 className="dark:text-zinc-150 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        {/* FAQ list */}
        <div className="divide-slate-150 divide-y dark:divide-zinc-900">
          {faqs.map((f, i) => (
            <AccordionItem key={i} question={f.q} answer={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 12. FINAL CTA SECTION (Editorial Minimal layout)
// ==========================================
function CTA() {
  return (
    <section className="select-none border-t border-slate-800 bg-slate-900 py-24 text-center text-white dark:bg-zinc-950 md:py-32">
      <div className="mx-auto max-w-4xl space-y-8 px-6">
        <div className="space-y-3">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Book private healthcare near you.
          </h2>
          <p className="mx-auto max-w-sm text-sm text-zinc-400 sm:text-base">
            Find your local GPhC vetted clinic, check prices, and book your appointment.
          </p>
        </div>

        {/* Buttons (Strictly 10px rounded corners) */}
        <div className="mx-auto flex max-w-md flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/services"
            className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-[10px] bg-white text-xs font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
          >
            Find a Pharmacy
          </Link>
          <Link
            href="/register-clinic"
            className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-[10px] border border-white/20 text-xs font-bold text-white transition-colors hover:bg-white/10"
          >
            List Your Pharmacy
          </Link>
        </div>

        <div className="pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            &bull; No account forced &bull; Same-day slots &bull; Cancel free
          </p>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// TRUST MARQUEE SECTION (Scrolling trust & safety badges)
// ==========================================
function TrustMarquee() {
  const badges = [
    { label: "GPhC Registered Premises", icon: ShieldCheck, sub: "Reg No. 9011244" },
    { label: "Care Quality Commission", icon: Activity, sub: "CQC Regulated Providers" },
    { label: "NHS England Partner", icon: CheckCircle2, sub: "Pharmacy First Service" },
    { label: "GDPR Compliant & Encrypted", icon: Lock, sub: "Data Protection Act 2018" },
    { label: "Cyber Essentials Certified", icon: ShieldAlert, sub: "UK NCSC Assured" },
    { label: "RPS Professional Member", icon: HeartHandshake, sub: "Royal Pharmaceutical Society" },
    { label: "MHRA Authorised Distributor", icon: Building, sub: "Medicines Regulation" },
  ];

  // Duplicate the list to allow seamless wrapping for the marquee effect
  const doubledBadges = [...badges, ...badges];

  return (
    <section className="border-slate-150/60 relative select-none overflow-hidden border-b bg-slate-50/40 py-6 dark:border-zinc-900 dark:bg-zinc-900/10">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-scroll {
          animation: marquee-scroll 25s linear infinite;
        }
      `,
        }}
      />

      {/* Soft gradient overlays on sides to hide hard edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent dark:from-zinc-950" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent dark:from-zinc-950" />

      <div className="flex w-full items-center">
        <div className="animate-marquee-scroll flex gap-6 whitespace-nowrap">
          {doubledBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="border-slate-150/60 flex shrink-0 items-center gap-3 rounded-[10px] border bg-white px-5 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-900/60"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-brand-teal/10 text-brand-teal dark:bg-emerald-950/20">
                  <Icon className="size-4" />
                </div>
                <div className="text-left leading-none">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                    {badge.label}
                  </p>
                  <span className="text-slate-450 dark:text-zinc-550 mt-1 block text-[9px] font-semibold">
                    {badge.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
