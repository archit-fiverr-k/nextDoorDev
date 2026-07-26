"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Search,
  User,
  Bell,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Clock,
  Sparkles,
  MapPin,
  Building2,
  CalendarDays,
  FileText,
  CheckCircle2,
  ExternalLink,
  Plus,
  Stethoscope,
  Phone,
  Navigation,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Bookmark,
  Star,
  Activity,
  Syringe,
  Pill,
  Droplet,
  ChevronDown,
  X,
  Share2,
} from "lucide-react";

export interface PatientCompanionViewProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  nextAppointment?: {
    id: string;
    serviceName: string;
    pharmacyName: string;
    pharmacyAddress: string;
    pharmacyPhone: string;
    date: string;
    time: string;
    status: string;
  } | null;
  upcomingAppointments: {
    id: string;
    serviceName: string;
    pharmacyName: string;
    pharmacyAddress: string;
    date: string;
    time: string;
    status: string;
  }[];
  recentActivity: {
    id: string;
    title: string;
    timestamp: string;
    type: "approved" | "completed" | "review" | "vaccination";
  }[];
  notifications: {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }[];
}

export function PatientCompanionView({
  user,
  nextAppointment,
  upcomingAppointments,
  recentActivity,
  notifications,
}: PatientCompanionViewProps) {
  const [activeHealthRecordTab, setActiveHealthRecordTab] = useState<string>("records");
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formattedToday = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const initials = `${user.firstName[0] || "P"}${user.lastName[0] || ""}`.toUpperCase();

  // Recommended seasonal services
  const recommendedServices = [
    {
      title: "Annual Flu Vaccination",
      category: "Seasonal Care",
      desc: "Protect yourself and your family with NHS & private winter flu immunisation.",
      img: "/assets/flu_vaccine_hero.png",
      href: "/services?query=flu",
    },
    {
      title: "Travel Health Consultation",
      category: "Travel Medicine",
      desc: "Yellow fever, typhoid, and anti-malarial guidance before traveling abroad.",
      img: "/assets/travel_vaccine_hero.png",
      href: "/services?query=travel",
    },
    {
      title: "Full Biomarker Blood Screen",
      category: "Diagnostics",
      desc: "Comprehensive cholesterol, thyroid, and vitamin D blood panel.",
      img: "/assets/blood_test_hero.png",
      href: "/services?query=blood",
    },
    {
      title: "Microsuction Ear Wax Removal",
      category: "Ear Care",
      desc: "Gentle, ENT-recommended microsuction clearance for restored hearing.",
      img: "/assets/ear_wax_hero.png",
      href: "/services?query=ear",
    },
  ];

  // Recently visited / favourite clinics
  const favouriteClinics = [
    {
      name: "Briggate Pharmacy",
      address: "85 Briggate, Leeds, LS1 6AZ",
      rating: 4.9,
      img: "/assets/demo-pharmacy-1.jpg",
      slug: "briggate-pharmacy",
    },
    {
      name: "Bullring Pharmacy",
      address: "High Street, Birmingham, B5 4BU",
      rating: 4.8,
      img: "/assets/pharmacy_consultation.png",
      slug: "bullring-pharmacy",
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="select-text space-y-8 pb-20 font-sans text-slate-900 antialiased dark:text-zinc-50">
      {/* ========================================================================= */}
      {/* 1. CALM HEALTHCARE COMPANION HEADER */}
      {/* ========================================================================= */}
      <div className="dark:border-zinc-850 flex items-center justify-between border-b border-slate-200/80 pb-5">
        <div className="flex items-center space-x-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-black text-white shadow-md ring-4 ring-emerald-50 dark:ring-zinc-900">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {getGreeting()}, {user.firstName}!
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              {formattedToday} •{" "}
              {nextAppointment
                ? `You have 1 appointment scheduled for ${nextAppointment.date}.`
                : "No appointments scheduled today."}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Center Popup Drawer */}
      {showNotificationCenter && (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Health Notification Center ({notifications.length})
            </h3>
            <button
              onClick={() => setShowNotificationCenter(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Close
            </button>
          </div>
          <div className="dark:divide-zinc-850 space-y-2 divide-y divide-slate-100">
            {notifications.map((n) => (
              <div key={n.id} className="pt-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{n.title}</span>
                  <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-zinc-400">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TODAY'S HEALTHCARE HERO CARD */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Primary Healthcare Companion
        </span>

        {nextAppointment ? (
          /* ACTIVE UPCOMING APPOINTMENT HERO CARD */
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 p-6 text-white shadow-xl sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-md">
                    ● Appointment Confirmed
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-100 backdrop-blur-md">
                    <Clock className="h-3.5 w-3.5 text-emerald-200" /> {nextAppointment.date} at{" "}
                    {nextAppointment.time}
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {nextAppointment.serviceName}
                </h2>

                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-100">
                  <Building2 className="h-4 w-4 shrink-0 text-emerald-200" />
                  <span>{nextAppointment.pharmacyName}</span>
                  <span>•</span>
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-200" />
                  <span>{nextAppointment.pharmacyAddress}</span>
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${nextAppointment.pharmacyName} ${nextAppointment.pharmacyAddress}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-xs font-extrabold text-emerald-700 shadow-md transition hover:bg-emerald-50 active:scale-95"
                >
                  <Navigation className="h-4 w-4 text-emerald-600" /> Get Directions
                </a>
                <a
                  href={`tel:${nextAppointment.pharmacyPhone}`}
                  className="flex items-center gap-1.5 rounded-2xl bg-white/15 px-4 py-3 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95"
                >
                  <Phone className="h-4 w-4" /> Call Clinic
                </a>
                <Link
                  href={`/patient/appointments/${nextAppointment.id}`}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  Manage Slot
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* NO APPOINTMENT - FRIENDLY ILLUSTATION HERO */
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm">
            <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
              <div className="space-y-3 sm:col-span-8">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> NHS & Private Health
                  Services
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  No Appointments Scheduled Today
                </h2>
                <p className="max-w-lg text-xs leading-relaxed text-slate-500">
                  Need a travel vaccination, flu booster, blood test, or ear wax clearance? Book a
                  same-day appointment at a verified local pharmacy.
                </p>
                <div className="pt-2">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black text-white shadow-md transition hover:bg-emerald-500 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Book Healthcare Service</span>
                  </Link>
                </div>
              </div>

              <div className="flex justify-center sm:col-span-4">
                <img
                  src="/assets/pharmacy_consultation.png"
                  alt="Healthcare Companion"
                  className="h-36 w-full rounded-2xl object-cover shadow-sm"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. QUICK ACTIONS (Large Touch Targets) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
          Quick Actions
        </span>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              label: "Book Appointment",
              icon: Plus,
              href: "/services",
              color: "bg-emerald-600 text-white",
            },
            {
              label: "Find Clinics",
              icon: Building2,
              href: "/services",
              color: "bg-teal-600 text-white",
            },
            {
              label: "My Appointments",
              icon: Calendar,
              href: "/patient/appointments",
              color: "bg-blue-600 text-white",
            },
            {
              label: "Medical Records",
              icon: FileText,
              href: "/patient/profile",
              color: "bg-amber-600 text-white",
            },
            {
              label: "Manage Profile",
              icon: User,
              href: "/patient/profile",
              color: "bg-indigo-600 text-white",
            },
          ].map((act, idx) => {
            const Icon = act.icon;
            return (
              <Link
                key={idx}
                href={act.href}
                className="shadow-xs dark:border-zinc-850 flex flex-col items-center justify-center space-y-2.5 rounded-3xl border border-slate-200/90 bg-white p-5 text-center transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 dark:bg-zinc-900"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${act.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-black leading-tight text-slate-900 dark:text-white">
                  {act.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HEALTH REMINDERS & PRIORITY ALERTS */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Personal Health Priority Alerts
        </span>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="shadow-xs flex items-start space-x-4 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <Syringe className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-amber-900 dark:text-amber-300">
                  Winter Flu Booster Recommended
                </span>
                <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Due
                </span>
              </div>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                Protect yourself against seasonal strains. Same-day appointments available at
                nearest clinics.
              </p>
              <Link
                href="/services?query=flu"
                className="inline-block pt-1 text-xs font-extrabold text-amber-900 hover:underline dark:text-amber-300"
              >
                Book Immunisation →
              </Link>
            </div>
          </div>

          <div className="shadow-xs flex items-start space-x-4 rounded-3xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-blue-900 dark:text-blue-300">
                  Annual Cardiovascular Screening
                </span>
                <span className="rounded-md bg-blue-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Recommended
                </span>
              </div>
              <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-200">
                Free blood pressure and cholesterol check under NHS Pharmacy First guidelines.
              </p>
              <Link
                href="/services?query=pressure"
                className="inline-block pt-1 text-xs font-extrabold text-blue-900 hover:underline dark:text-blue-300"
              >
                Check Availability →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. UPCOMING APPOINTMENTS TIMELINE */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="dark:border-zinc-850 flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Appointments Timeline
          </span>
          <Link
            href="/patient/appointments"
            className="text-xs font-extrabold text-emerald-600 hover:underline"
          >
            View All ({upcomingAppointments.length})
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="dark:border-zinc-850 space-y-2 rounded-3xl border border-slate-200/90 bg-white p-6 text-center dark:bg-zinc-900">
            <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
              No upcoming appointments found.
            </p>
            <Link
              href="/services"
              className="inline-block text-xs font-black text-emerald-600 hover:underline"
            >
              Find & Book a Service →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((app) => (
              <div
                key={app.id}
                className="shadow-xs dark:border-zinc-850 flex items-center justify-between rounded-3xl border border-slate-200/90 bg-white p-5 dark:bg-zinc-900"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xs font-black text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {app.serviceName}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {app.pharmacyName} • {app.date} at {app.time}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/patient/appointments/${app.id}`}
                  className="dark:bg-zinc-850 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. RECOMMENDED SERVICES HORIZONTAL CAROUSEL */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="dark:border-zinc-850 border-b border-slate-200 pb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Recommended Care Services
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommendedServices.map((svc, idx) => (
            <Link
              key={idx}
              href={svc.href}
              className="shadow-xs dark:border-zinc-850 group relative flex flex-col justify-between space-y-3 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-500/40 hover:shadow-md dark:bg-zinc-900"
            >
              <div className="space-y-2">
                <div className="h-32 w-full overflow-hidden rounded-2xl bg-slate-900">
                  <img
                    src={svc.img}
                    alt={svc.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-600">
                  {svc.category}
                </span>
                <h4 className="text-xs font-black leading-snug text-slate-900 dark:text-white">
                  {svc.title}
                </h4>
                <p className="line-clamp-2 text-[11px] text-slate-500 dark:text-zinc-400">
                  {svc.desc}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold dark:border-zinc-800">
                <span className="text-emerald-600">Book Online →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FAVOURITE / RECENTLY VISITED CLINICS */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="dark:border-zinc-850 border-b border-slate-200 pb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Recently Visited Clinics
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {favouriteClinics.map((c, idx) => (
            <div
              key={idx}
              className="shadow-xs dark:border-zinc-850 flex items-center justify-between rounded-3xl border border-slate-200/90 bg-white p-5 dark:bg-zinc-900"
            >
              <div className="flex items-center space-x-3.5">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-900">
                  <img src={c.img} alt={c.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{c.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">{c.address}</p>
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400" /> {c.rating} Verified Rating
                  </span>
                </div>
              </div>

              <Link
                href={`/provider/${c.slug}`}
                className="flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 dark:bg-white dark:text-slate-900"
              >
                <span>Book</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. HEALTH RECORDS & DOCUMENTS */}
      {/* ========================================================================= */}
      <section className="dark:border-zinc-850 space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:bg-zinc-900">
        <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Personal Health Vault
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Medical Records & Documentation
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Consultation History", icon: FileText, count: "3 Visits" },
            { label: "Vaccination Records", icon: Syringe, count: "4 Immunisations" },
            { label: "Lab & Blood Results", icon: Droplet, count: "2 Reports" },
            { label: "Clinical PDF Documents", icon: FileSpreadsheet, count: "5 Docs" },
          ].map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <div
                key={idx}
                className="dark:bg-zinc-850 flex cursor-pointer flex-col items-center justify-center space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center hover:bg-slate-100 dark:border-zinc-800"
              >
                <div className="shadow-xs flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {rec.label}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{rec.count}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
