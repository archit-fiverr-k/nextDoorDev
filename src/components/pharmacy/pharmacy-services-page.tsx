"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookingWizard } from "@/app/(public)/book/[pharmacySlug]/booking-wizard";
import {
  ShieldCheck,
  ArrowRight,
  Phone,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  Stethoscope,
  Activity,
  Droplet,
  Ear,
  Syringe,
  HeartPulse,
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  color?: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  category?: string;
  imageUrl?: string | null;
}

interface PharmacyServicesPageProps {
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string | null;
    displayName: string | null;
    address: string;
    phone: string;
    description?: string | null;
    welcomeMessage?: string | null;
    availability?: { dayOfWeek: number; openTime: string; closeTime: string }[];
    blockedDates?: { date: string; reason?: string | null }[];
  };
  services: Service[];
  categories?: CategoryItem[];
  currentUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string | null;
  } | null;
  initialServiceId?: string;
  unofferedServiceQuery?: string;
}

export function PharmacyServicesPage({
  pharmacy,
  services,
  categories,
  currentUser,
  initialServiceId,
  unofferedServiceQuery,
}: PharmacyServicesPageProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    initialServiceId || null
  );
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(
    Boolean(initialServiceId || unofferedServiceQuery)
  );

  const pharmacyDisplayName = pharmacy.displayName || pharmacy.name;
  const heroImage =
    pharmacy.logoUrl ||
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80";

  // Identify featured service (service with imageUrl or first service)
  const featuredService = services.find((s) => s.imageUrl) || services[0];
  const standardServices = services.filter((s) => s.id !== featuredService?.id);

  // Helper to map service name/category to material symbol icon
  const getServiceIcon = (name: string, category?: string) => {
    const text = (name + " " + (category || "")).toLowerCase();
    if (text.includes("blood")) return "bloodtype";
    if (text.includes("ear") || text.includes("hearing")) return "hearing";
    if (text.includes("gp") || text.includes("doctor") || text.includes("consultation"))
      return "stethoscope";
    if (text.includes("health") || text.includes("heart") || text.includes("check"))
      return "monitor_heart";
    if (
      text.includes("vaccine") ||
      text.includes("travel") ||
      text.includes("flu") ||
      text.includes("booster")
    )
      return "vaccines";
    return "medical_services";
  };

  const handleOpenBooking = (serviceId?: string) => {
    if (serviceId) {
      setSelectedServiceId(serviceId);
    }
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-[#191c1e] antialiased selection:bg-[#0058be] selection:text-white">
      {/* Dynamic Material Symbols & Google Fonts */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .shadow-soft {
          box-shadow: 0 2px 4px rgba(10, 34, 89, 0.04), 0 8px 16px rgba(10, 34, 89, 0.06), 0 24px 48px rgba(10, 34, 89, 0.1);
        }
        .border-crisp {
          border: 0.5px solid rgba(10, 34, 89, 0.08);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `,
        }}
      />

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR */}
      {/* ========================================================================= */}
      <nav className="shadow-xs fixed left-0 right-0 top-0 z-40 mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between border-b border-[#c5c6d1]/30 bg-[#f7f9fb]/80 px-5 backdrop-blur-xl transition-all duration-300 md:px-16">
        <Link
          href={`/book/${pharmacy.slug}`}
          className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#000e35]"
        >
          {pharmacy.logoUrl && (
            <img
              src={pharmacy.logoUrl}
              alt={pharmacyDisplayName}
              className="h-9 w-9 rounded-lg object-contain"
            />
          )}
          <span>NextDoorClinic</span>
        </Link>

        <div className="hidden items-center gap-8 text-xs font-semibold md:flex">
          <a
            href="#services"
            className="border-b-2 border-[#0058be] pb-1 text-[#0058be] transition-colors hover:opacity-80"
          >
            Pharmacy Services
          </a>
          <a href="#about" className="text-[#444650] transition-colors hover:text-[#000e35]">
            Find Care
          </a>
          <a href="#trust" className="text-[#444650] transition-colors hover:text-[#000e35]">
            Accreditation
          </a>
          <a href="#contact" className="text-[#444650] transition-colors hover:text-[#000e35]">
            Contact
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenBooking()}
            className="shadow-soft border-crisp rounded-full bg-[#000e35] px-6 py-2.5 text-xs font-semibold text-white transition-all duration-200 ease-out hover:scale-95 hover:bg-[#000e35]/90 active:scale-95"
          >
            Book Appointment
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <main className="mx-auto max-w-[1280px] px-5 pb-28 pt-20 md:px-16">
        {/* HERO SECTION */}
        <section className="mt-12 grid min-h-[65vh] items-center gap-8 md:mt-24 md:grid-cols-12">
          <div className="z-10 flex flex-col gap-6 md:col-span-5">
            <div className="glass-panel border-crisp shadow-2xs inline-flex w-max items-center gap-2 rounded-full px-4 py-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#0058be]">verified</span>
              <span className="text-xs font-bold text-[#000e35]">Verified Pharmacy Partner</span>
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight text-[#000e35] md:text-6xl">
              {pharmacyDisplayName} <span className="text-[#0058be]">Services</span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-[#444650]">
              {pharmacy.description ||
                "Experience world-class clinical care with the convenience of a neighborhood pharmacy. Precision health services, expertly delivered."}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleOpenBooking()}
                className="shadow-soft border-crisp flex items-center gap-2 rounded-full bg-[#000e35] px-7 py-3.5 text-xs font-bold text-white transition-all duration-200 hover:scale-95"
              >
                <span>Book an Appointment</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              <a
                href="#services"
                className="border-crisp rounded-full bg-[#f2f4f6] px-7 py-3.5 text-xs font-bold text-[#000e35] transition-all duration-200 hover:scale-95 hover:bg-[#e0e3e5]"
              >
                View Services
              </a>
            </div>
          </div>

          <div className="relative mt-8 md:col-span-7 md:mt-0">
            <div className="absolute inset-0 translate-x-4 translate-y-4 transform rounded-[2rem] bg-[#0058be]/5 md:translate-x-6 md:translate-y-6"></div>
            <img
              alt={`${pharmacyDisplayName} Clinic`}
              className="shadow-soft border-crisp relative z-10 h-[400px] w-full rounded-[2rem] object-cover transition-transform duration-700 hover:scale-[1.01] md:h-[550px]"
              src={heroImage}
            />
          </div>
        </section>

        {/* TRUST BAR */}
        <section
          id="trust"
          className="mt-24 flex flex-col items-center justify-center gap-6 border-y border-[#c5c6d1]/20 py-10"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#757681]">
            Regulated &amp; Trusted By
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70 grayscale transition-all duration-500 hover:grayscale-0 md:gap-20">
            <div className="flex items-center space-x-2 text-xl font-black text-[#0058be]">
              <span>NHS Official Partner</span>
            </div>
            <div className="hidden h-8 w-px bg-[#c5c6d1]/30 md:block"></div>
            <div className="flex items-center space-x-2 text-xl font-black text-slate-800">
              <span>GPhC Regulated</span>
            </div>
            <div className="hidden h-8 w-px bg-[#c5c6d1]/30 md:block"></div>
            <div className="flex items-center gap-2 text-xl font-bold text-[#191c1e]">
              <span className="material-symbols-outlined text-[#0058be]">health_and_safety</span>
              <span>CQC Registered</span>
            </div>
          </div>
        </section>

        {/* SERVICES GRID */}
        <section id="services" className="mt-24">
          <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
            <div className="max-w-2xl">
              <h2 className="mb-3 text-3xl font-extrabold text-[#000e35] md:text-4xl">
                Precision Clinical Services
              </h2>
              <p className="text-sm text-[#444650]">
                Expert care delivered with high-fidelity accuracy for {pharmacyDisplayName}. Select
                a service to book instantly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {/* Featured Card */}
            {featuredService && (
              <div className="shadow-xs hover:shadow-soft border-crisp group relative transform overflow-hidden rounded-[1.5rem] bg-white transition-all duration-300 hover:-translate-y-1 md:col-span-2">
                <div className="absolute inset-0 z-0">
                  <img
                    alt={featuredService.name}
                    className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                    src={
                      featuredService.imageUrl ||
                      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80"
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000e35]/95 via-[#000e35]/50 to-transparent mix-blend-multiply"></div>
                </div>
                <div className="relative z-10 flex h-[380px] flex-col justify-end p-8 text-white md:h-[420px]">
                  <div className="mb-auto inline-flex w-max rounded-full border border-white/10 bg-white/20 px-4 py-1 backdrop-blur-md">
                    <span className="text-xs font-bold">Featured Service</span>
                  </div>
                  <h3 className="mb-2 text-2xl font-extrabold md:text-3xl">
                    {featuredService.name}
                  </h3>
                  <p className="mb-6 line-clamp-2 max-w-md text-xs text-white/80 md:text-sm">
                    {featuredService.description ||
                      "Comprehensive clinical consultation with registered healthcare professionals."}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#000e35]">
                      From £{Number(featuredService.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleOpenBooking(featuredService.id)}
                      className="shadow-soft flex h-12 w-12 transform items-center justify-center rounded-full bg-white text-[#000e35] transition-transform duration-300 group-hover:scale-110"
                    >
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Service Cards */}
            {standardServices.map((service) => {
              const iconName = getServiceIcon(service.name, service.category);
              return (
                <div
                  key={service.id}
                  className="shadow-xs hover:shadow-soft border-crisp group flex h-[380px] transform flex-col rounded-[1.5rem] bg-white p-8 transition-all duration-300 hover:-translate-y-1 md:h-[420px]"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0058be]/10 text-[#0058be] transition-colors duration-300 group-hover:bg-[#0058be] group-hover:text-white">
                    <span className="material-symbols-outlined text-[28px]">{iconName}</span>
                  </div>
                  <h3 className="mb-2 text-xl font-extrabold text-[#000e35]">{service.name}</h3>
                  <p className="line-clamp-3 flex-grow text-xs leading-relaxed text-[#444650]">
                    {service.description ||
                      "Professional consultation with experienced clinical staff."}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-[#c5c6d1]/20 pt-6">
                    <span className="text-xs font-bold text-[#444650]">
                      From £{Number(service.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleOpenBooking(service.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f4f6] text-[#0058be] transition-all group-hover:bg-[#0058be] group-hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* INTERACTIVE CONTACT PHARMACIST BANNER */}
        <section
          id="contact"
          className="border-crisp shadow-soft relative mt-24 overflow-hidden rounded-[2rem]"
        >
          <div className="absolute inset-0 z-0 bg-[#0a2259]"></div>
          <div className="absolute -right-[10%] -top-[50%] z-0 h-[700px] w-[700px] rounded-full bg-[#0058be]/20 blur-[100px]"></div>
          <div className="glass-panel relative z-10 flex flex-col items-center justify-between gap-8 bg-white/5 p-10 md:flex-row md:p-16">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                <span className="material-symbols-outlined">forum</span>
              </div>
              <h2 className="mb-3 text-2xl font-extrabold text-white md:text-3xl">
                Not sure what you need?
              </h2>
              <p className="text-xs leading-relaxed text-white/80 md:text-sm">
                Our clinical team at {pharmacyDisplayName} is available to guide you to the right
                service. Connect directly with a pharmacist.
              </p>
            </div>
            <a
              href={`tel:${pharmacy.phone}`}
              className="shadow-soft flex items-center gap-3 whitespace-nowrap rounded-full bg-white px-8 py-4 text-xs font-bold text-[#0a2259] transition-all duration-200 hover:scale-95"
            >
              <span>Contact Pharmacist ({pharmacy.phone})</span>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0058be] opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#0058be]"></span>
              </span>
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mx-auto w-full max-w-[1280px] border-t border-[#c5c6d1]/20 bg-white px-5 py-16 md:px-16">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link
              href={`/book/${pharmacy.slug}`}
              className="mb-4 block text-xl font-bold text-[#000e35]"
            >
              NextDoorClinic • {pharmacyDisplayName}
            </Link>
            <p className="mb-6 max-w-sm text-xs leading-relaxed text-[#444650]">
              {pharmacy.address}. Regulated healthcare services powered by NextDoorClinic.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#000e35]">
              Services
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-[#444650]">
              <li>
                <a href="#services" className="hover:text-[#0058be]">
                  Clinical Consultations
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-[#0058be]">
                  Vaccinations &amp; Travel
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#000e35]">
              Legal &amp; Trust
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-[#444650]">
              <li>
                <span className="hover:text-[#0058be]">CQC Registered</span>
              </li>
              <li>
                <span className="hover:text-[#0058be]">GPhC Compliant</span>
              </li>
              <li>
                <span className="hover:text-[#0058be]">NHS Approved Partner</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#c5c6d1]/20 pt-8 text-xs text-[#444650] md:flex-row">
          <p>
            © 2026 NextDoorClinic. Regulated by CQC, GPhC, and NHS compliant. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* BOOKING WIZARD MODAL POPUP */}
      {/* ========================================================================= */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative my-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase text-[#0058be]">
                  NextDoorClinic Booking
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-700">{pharmacyDisplayName}</span>
              </div>
              <button
                onClick={() => setIsBookingOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <BookingWizard
                pharmacy={pharmacy}
                services={services}
                categories={categories}
                currentUser={currentUser}
                initialServiceId={selectedServiceId || undefined}
                unofferedServiceQuery={unofferedServiceQuery}
                onClose={() => setIsBookingOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
