"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ShieldCheck,
  Clock,
  MapPin,
  Building2,
  Plus,
  Phone,
  Navigation,
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
  notifications,
}: PatientCompanionViewProps) {
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

  return (
    <div className="select-text space-y-6 pb-16 font-sans text-slate-900 antialiased dark:text-zinc-50 sm:space-y-8">
      {/* ========================================================================= */}
      {/* 1. CALM HEALTHCARE COMPANION HEADER */}
      {/* ========================================================================= */}
      <div className="dark:border-zinc-850 border-b border-slate-200/80 pb-4 sm:pb-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-md ring-2 ring-emerald-50 dark:ring-zinc-900 sm:h-14 sm:w-14 sm:text-lg sm:ring-4">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {getGreeting()}, {user.firstName}!
            </h1>
            <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
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
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl animate-in fade-in dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
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
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 p-5 text-white shadow-xl sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
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

                <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-emerald-100">
                  <Building2 className="h-4 w-4 shrink-0 text-emerald-200" />
                  <span>{nextAppointment.pharmacyName}</span>
                  <span className="hidden sm:inline">•</span>
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-200" />
                  <span className="truncate">{nextAppointment.pharmacyAddress}</span>
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${nextAppointment.pharmacyName} ${nextAppointment.pharmacyAddress}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2.5 text-xs font-extrabold text-emerald-700 shadow-md transition hover:bg-emerald-50 active:scale-95 sm:px-4 sm:py-3"
                >
                  <Navigation className="h-4 w-4 text-emerald-600" /> Get Directions
                </a>
                <a
                  href={`tel:${nextAppointment.pharmacyPhone}`}
                  className="flex items-center gap-1.5 rounded-2xl bg-white/15 px-3.5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95 sm:px-4 sm:py-3"
                >
                  <Phone className="h-4 w-4" /> Call Clinic
                </a>
                <Link
                  href={`/patient/appointments/${nextAppointment.id}`}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 sm:px-4 sm:py-3"
                >
                  Manage Slot
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* NO APPOINTMENT - FRIENDLY ILLUSTRATION HERO */
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
              <div className="space-y-3 sm:col-span-7 lg:col-span-8">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>NHS & Private Health Services</span>
                  </span>
                </div>

                <h2 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                  No Appointments Scheduled Today
                </h2>

                <p className="max-w-lg text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                  Need a travel vaccination, flu booster, blood test, or ear wax clearance? Book a
                  same-day appointment at a verified local pharmacy.
                </p>

                <div className="pt-2">
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-md transition hover:bg-emerald-500 active:scale-95 sm:px-6"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Book Healthcare Service</span>
                  </Link>
                </div>
              </div>

              <div className="flex justify-center sm:col-span-5 lg:col-span-4">
                <img
                  src="/assets/pharmacy_consultation.png"
                  alt="Healthcare Companion"
                  className="h-40 w-full max-w-sm rounded-2xl object-cover shadow-sm sm:h-36"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. UPCOMING APPOINTMENTS TIMELINE */}
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
              href="/search"
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
                className="shadow-xs dark:border-zinc-850 flex flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white p-4 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex items-center space-x-3.5 sm:space-x-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xs font-black text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 sm:h-12 sm:w-12">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-xs font-black text-slate-900 dark:text-white sm:text-sm">
                      {app.serviceName}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {app.pharmacyName} • {app.date} at {app.time}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/patient/appointments/${app.id}`}
                  className="dark:bg-zinc-850 self-start rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 sm:self-auto"
                >
                  Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
