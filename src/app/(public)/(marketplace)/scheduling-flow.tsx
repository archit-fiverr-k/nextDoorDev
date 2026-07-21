"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck,
  Mail,
  Bell,
  ChevronRight,
  Star,
  Check,
  Building,
} from "lucide-react";

interface Step {
  id: string;
  number: string;
  title: string;
  desc: string;
  tagline: string;
  badge: string;
}

const STEPS: Step[] = [
  {
    id: "clinic",
    number: "01",
    title: "Select nearby clinic",
    desc: "Enter your postcode to view GPhC regulated providers.",
    tagline: "Instant Postcode Matching",
    badge: "GPhC Regulated",
  },
  {
    id: "slot",
    number: "02",
    title: "Choose clinical slot",
    desc: "Pick from verified available times. Instant scheduling.",
    tagline: "Real-Time Slot Engine",
    badge: "Instant Lock",
  },
  {
    id: "confirm",
    number: "03",
    title: "Confirm booking",
    desc: "Provide basic patient metadata. No account forced.",
    tagline: "Zero Account Friction",
    badge: "Guest Checkout",
  },
  {
    id: "attend",
    number: "04",
    title: "Attend appointment",
    desc: "Receive automated email and text confirmation logs.",
    tagline: "Instant Pass & Logs",
    badge: "SMS & Email Sync",
  },
];

export function SchedulingFlow() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTime, setSelectedTime] = useState("09:30 AM");
  const [postcode, setPostcode] = useState("W1W 8HA");
  const [isSearching, setIsSearching] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Auto-advance progress timer (6 seconds per step)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="relative overflow-hidden border-t border-slate-100 bg-gradient-to-b from-white via-slate-50/50 to-white py-24 dark:border-zinc-900/80 dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950 md:py-36">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[140px] dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-[300px] w-[500px] rounded-full bg-teal-500/5 blur-[120px] dark:bg-teal-500/10" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* ================= HEADER SECTION ================= */}
        <div className="mb-16 max-w-3xl space-y-4">
          <div className="inline-flex select-none items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Scheduling Flow</span>
            <span className="text-emerald-300 dark:text-emerald-700">•</span>
            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
              GPhC Audit Verified
            </span>
          </div>

          <h2 className="text-3xl font-bold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-5xl">
            Simple. Direct.{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Patient-first.
            </span>
          </h2>

          <p className="max-w-2xl text-base font-normal leading-relaxed text-slate-600 dark:text-zinc-300 sm:text-lg">
            We bypassed long phone queues and tedious medical questionnaires. Find your clinic,
            choose your slot, and secure your booking.
          </p>

          <div className="flex select-none flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 30-Second Booking
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No Account Forced
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant SMS & Email Logs
            </span>
          </div>
        </div>

        {/* ================= MAIN DUAL COLUMN INTERACTIVE SHOWCASE ================= */}
        <div
          className="grid items-start gap-12 lg:grid-cols-12"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* ======== LEFT COLUMN: STEP NAVIGATION CONTROLLER ======== */}
          <div className="space-y-4 lg:col-span-5">
            {STEPS.map((step, index) => {
              const isActive = activeStepIndex === index;
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStepIndex(index)}
                  className={`group relative cursor-pointer rounded-2xl border p-6 transition-all duration-300 ${
                    isActive
                      ? "translate-x-1 border-emerald-500/40 bg-white shadow-xl shadow-emerald-500/5 dark:border-emerald-500/50 dark:bg-zinc-900 dark:shadow-emerald-950/20"
                      : "border-slate-200/80 bg-white/60 hover:border-slate-300 hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60"
                  }`}
                >
                  {/* Active Step Progress Timer Indicator (Stripe Style) */}
                  {isActive && (
                    <div className="absolute left-0 right-0 top-0 h-1 overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-zinc-800">
                      <div
                        key={`progress-${index}-${isPaused}`}
                        className={`h-full bg-gradient-to-r from-emerald-500 to-teal-500 ${
                          isPaused ? "w-full" : "animate-[progress_6s_linear]"
                        }`}
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Number Badge */}
                    <div
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold transition-all duration-300 ${
                        isActive
                          ? "scale-105 bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : "bg-slate-100 text-slate-500 group-hover:text-slate-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:group-hover:text-white"
                      }`}
                    >
                      {step.number}
                    </div>

                    {/* Step Text Content */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`text-base font-bold transition-colors ${
                            isActive
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-700 group-hover:text-slate-900 dark:text-zinc-300 dark:group-hover:text-white"
                          }`}
                        >
                          {step.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                            isActive
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-500 opacity-0 group-hover:opacity-100 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {step.badge}
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-relaxed transition-colors sm:text-sm ${
                          isActive
                            ? "text-slate-600 dark:text-zinc-300"
                            : "text-slate-500 dark:text-zinc-400"
                        }`}
                      >
                        {step.desc}
                      </p>

                      {/* Active hint */}
                      {isActive && (
                        <div className="flex items-center gap-1.5 pt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>{step.tagline}</span>
                          <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick helper note under steps */}
            <div className="flex select-none items-center justify-between px-2 pt-2 text-xs text-slate-400 dark:text-zinc-500">
              <span>Hover over steps to freeze preview</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" /> Direct GPhC Sync
              </span>
            </div>
          </div>

          {/* ======== RIGHT COLUMN: HIGH-FIDELITY DYNAMIC UI CANVAS (Airbnb / Stripe Grade) ======== */}
          <div className="relative lg:col-span-7">
            {/* Outer Stage Frame with Ambient Shadow */}
            <div className="relative flex min-h-[480px] flex-col justify-center overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900 p-2 shadow-2xl shadow-slate-950/40 ring-1 ring-white/10 sm:p-3">
              {/* Window Bar Header */}
              <div className="mb-1 flex select-none items-center justify-between rounded-t-2xl border-b border-slate-800/60 bg-slate-950/80 px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    <Lock className="h-3 w-3 text-emerald-400" /> nextdoorclinic.co.uk/book
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                    LIVE PREVIEW
                  </span>
                </div>
              </div>

              {/* Dynamic UI Content Area with smooth step switching */}
              <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-b-2xl bg-slate-950 p-4 text-slate-100 sm:p-6">
                {/* ---------------------------------------------------- */}
                {/* STEP 01: SELECT NEARBY CLINIC MOCKUP */}
                {/* ---------------------------------------------------- */}
                {activeStepIndex === 0 && (
                  <div className="space-y-5 duration-300 animate-in fade-in slide-in-from-right-4">
                    {/* Top Search bar mockup */}
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3 shadow-lg sm:flex-row">
                      <div className="relative w-full flex-1">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                        <input
                          type="text"
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                          placeholder="Enter UK postcode..."
                        />
                      </div>
                      <button
                        onClick={() => {
                          setIsSearching(true);
                          setTimeout(() => setIsSearching(false), 600);
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 sm:w-auto"
                      >
                        <Search className={`h-3.5 w-3.5 ${isSearching ? "animate-spin" : ""}`} />
                        Find Clinics
                      </button>
                    </div>

                    {/* Live Pharmacy Listing Mock Card & Photorealistic Image backdrop */}
                    <div className="relative grid items-center gap-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-12 sm:p-5">
                      {/* Image Thumbnail with GPhC Badge */}
                      <div className="relative h-36 overflow-hidden rounded-xl border border-slate-800 sm:col-span-5">
                        <img
                          src="/assets/demo-pharmacy-1.jpg"
                          alt="Regent Street Pharmacy"
                          className="h-full w-full select-none object-cover"
                        />
                        <div className="absolute left-2 top-2 flex items-center gap-1 rounded border border-emerald-500/30 bg-slate-950/90 px-2 py-0.5 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
                          <ShieldCheck className="h-3 w-3 text-emerald-400" /> GPhC #9012482
                        </div>
                      </div>

                      {/* Details Column */}
                      <div className="space-y-2.5 sm:col-span-7">
                        <div className="flex items-center justify-between">
                          <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            0.4 miles away
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                            <Star className="h-3.5 w-3.5 fill-amber-400" /> 4.9 (142 reviews)
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white">
                            Regent Street Pharmacy & Clinic
                          </h4>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="h-3 w-3 text-slate-500" /> 14 Regent St, London W1B
                            5RA
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                          <span className="flex items-center gap-1 text-xs font-medium text-slate-300">
                            <Clock className="h-3.5 w-3.5 text-emerald-400" /> 4 Slots Today
                          </span>
                          <button
                            onClick={() => setActiveStepIndex(1)}
                            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            View Availability <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Pharmacy List item */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 font-bold text-slate-300">
                          <Building className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">Mayfair Health Hub</p>
                          <p className="text-[11px] text-slate-400">
                            0.8 miles away • GPhC Accredited
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-400">
                        Available Tomorrow
                      </span>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 02: CHOOSE CLINICAL SLOT MOCKUP */}
                {/* ---------------------------------------------------- */}
                {activeStepIndex === 1 && (
                  <div className="space-y-5 duration-300 animate-in fade-in slide-in-from-right-4">
                    {/* Practitioner Header */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full border border-emerald-500/40">
                          <img
                            src="/assets/pharmacy_consultation.png"
                            alt="Lead Clinician"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Dr. Sarah Jenkins</p>
                          <p className="text-[11px] text-slate-400">
                            Lead Clinical Pharmacist • Prescriber
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                        ● Live Calendar
                      </span>
                    </div>

                    {/* Date Selector Pills */}
                    <div className="flex gap-2 text-xs">
                      <button className="flex-1 rounded-lg border border-emerald-500 bg-emerald-600 py-2 text-center font-semibold text-white shadow-md">
                        Today (Tue 21 Jul)
                      </button>
                      <button className="flex-1 rounded-lg border border-slate-800 bg-slate-900 py-2 text-center font-medium text-slate-400 hover:text-white">
                        Tomorrow (Wed 22 Jul)
                      </button>
                    </div>

                    {/* Real-time Time Slots Grid */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Available Clinical Slots:
                      </p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          "09:30 AM",
                          "10:15 AM",
                          "11:00 AM",
                          "02:30 PM",
                          "04:15 PM",
                          "05:00 PM",
                        ].map((slot) => {
                          const isSelected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              onClick={() => setSelectedTime(slot)}
                              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
                                isSelected
                                  ? "scale-105 border-emerald-400 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                                  : "hover:bg-slate-850 border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 opacity-80" /> {slot}
                              </span>
                              <span className="text-[9px] font-normal opacity-75">
                                Instant Lock
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Slot Confirmation Bar */}
                    <div className="flex items-center justify-between rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>
                          Slot <strong>{selectedTime}</strong> reserved for 05:00 min
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveStepIndex(2)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                      >
                        Proceed <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 03: CONFIRM BOOKING MOCKUP */}
                {/* ---------------------------------------------------- */}
                {activeStepIndex === 2 && (
                  <div className="space-y-4 duration-300 animate-in fade-in slide-in-from-right-4">
                    {/* Header Badge */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          Patient Metadata
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Zero account registration needed
                        </p>
                      </div>
                      <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                        🔒 SSL Encrypted
                      </span>
                    </div>

                    {/* Minimal Patient Form Mockup */}
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                          Full Patient Name
                        </label>
                        <div className="relative">
                          <UserCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            readOnly
                            value="Alex Morgan"
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs font-medium text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                            Phone (for SMS Ticket)
                          </label>
                          <div className="relative">
                            <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                              type="text"
                              readOnly
                              value="+44 7700 900077"
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs font-medium text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                              type="text"
                              readOnly
                              value="alex.m@example.com"
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs font-medium text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price & Service Ticket summary */}
                    <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span>Clinical Service:</span>
                        <span className="text-white">Travel Vaccination Consultation</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Clinic Fee:</span>
                        <span className="font-bold text-emerald-400">
                          £0 Deposit (Pay at Clinic)
                        </span>
                      </div>
                    </div>

                    {/* Submit Button Action */}
                    <button
                      onClick={() => {
                        setFormSubmitted(true);
                        setActiveStepIndex(3);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-400"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Confirm Booking & Generate Digital Pass
                    </button>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 04: ATTEND APPOINTMENT MOCKUP */}
                {/* ---------------------------------------------------- */}
                {activeStepIndex === 3 && (
                  <div className="space-y-4 duration-300 animate-in fade-in slide-in-from-right-4">
                    {/* Simulated Mobile Push Banner */}
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-slate-900/90 p-3 shadow-xl">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-400">
                        <Bell className="h-4 w-4 animate-bounce" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-emerald-400">MESSAGES • NOW</span>
                          <span>Just now</span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-bold text-white">
                          Next Door Clinic: Appointment Confirmed!
                        </p>
                        <p className="text-[10px] text-slate-300">
                          Your slot is locked for {selectedTime} today at Regent St Pharmacy.
                        </p>
                      </div>
                    </div>

                    {/* Digital Booking Pass Card */}
                    <div className="space-y-3 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-bold tracking-wide text-white">
                            DIGITAL APPOINTMENT PASS
                          </span>
                        </div>
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                          #NDC-88419
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">
                            Patient Name
                          </p>
                          <p className="font-bold text-slate-200">Alex Morgan</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">
                            Time & Location
                          </p>
                          <p className="font-bold text-emerald-400">
                            {selectedTime} Today • W1B 5RA
                          </p>
                        </div>
                      </div>

                      {/* Confirmation Logs Timeline */}
                      <div className="space-y-1.5 border-t border-slate-800/80 pt-2 text-[11px]">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Automated Audit Logs:
                        </p>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> SMS ticket sent to +44
                          7700 900077
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Email summary sent to
                          alex.m@example.com
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Calendar (.ics)
                          reminder attached
                        </div>
                      </div>
                    </div>

                    {/* Image Footer */}
                    <div className="relative flex h-20 items-center justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 px-4">
                      <img
                        src="/assets/vaccination_care.png"
                        alt="Appointment Care"
                        className="absolute inset-0 h-full w-full object-cover opacity-25"
                      />
                      <div className="relative z-10">
                        <p className="text-xs font-bold text-white">Ready for your visit?</p>
                        <p className="text-[11px] text-slate-300">
                          Present your digital pass or reference code upon arrival.
                        </p>
                      </div>
                      <span className="relative z-10 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                        Verified
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Floating Indicator Dots */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
              <span>Step {activeStepIndex + 1} of 4</span>
              <span>•</span>
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStepIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      activeStepIndex === i
                        ? "w-6 bg-emerald-500"
                        : "w-1.5 bg-slate-300 dark:bg-zinc-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
