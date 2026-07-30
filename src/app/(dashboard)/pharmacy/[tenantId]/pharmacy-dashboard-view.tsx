"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Lock,
} from "lucide-react";
import { updateAppointmentStatusAction } from "@/actions/appointments";
import { AppointmentDrawer } from "./appointments/appointment-drawer";

interface PharmacyDashboardViewProps {
  pharmacy: {
    id: string;
    name: string;
    slug?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  todayAppointments: any[];
  pendingAppointments: any[];
  upcomingAppointments: any[];
  publicBookingUrl: string;
}

export function PharmacyDashboardView({
  pharmacy,
  todayAppointments,
  pendingAppointments,
  upcomingAppointments,
  publicBookingUrl,
}: PharmacyDashboardViewProps) {
  const [copied, setCopied] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const todayFormatted = format(new Date(), "EEEE, d MMMM yyyy");

  const copyBookingLink = () => {
    try {
      navigator.clipboard.writeText(publicBookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn("Failed to copy booking link:", e);
    }
  };

  const handleStatusUpdate = async (
    id: string,
    status: "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED"
  ) => {
    setIsUpdating(id);
    try {
      await updateAppointmentStatusAction(id, status);
      window.location.reload();
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="select-text space-y-8 font-sans text-slate-900 antialiased dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 1. FIRST SCREEN: GREETING, TODAY'S DATE & QUICK ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-6 border-b border-slate-200/80 pb-6 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#10B981]">
            {todayFormatted}
          </span>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {greeting}, {pharmacy.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Here is your daily workspace. Review today&apos;s appointments and incoming booking
            requests.
          </p>
        </div>

        {/* Quick Actions Header Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={copyBookingLink}
            className="shadow-xs dark:hover:bg-zinc-850 inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#10B981]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span>{copied ? "Copied!" : "Copy Booking Link"}</span>
          </button>

          <a
            href={publicBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shadow-xs dark:hover:bg-zinc-850 inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#10B981]" />
            <span>Public Booking Page</span>
          </a>

          <Link
            href={`/pharmacy/${pharmacy.id}/appointments?action=new`}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-[#10B981] px-4 py-2 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PENDING BOOKING REQUESTS (Awaiting Admin Approval / Cancellation) */}
      {/* ========================================================================= */}
      <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${pendingAppointments.length > 0 ? "animate-ping bg-amber-500" : "bg-emerald-500"}`}
            />
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-900 dark:text-amber-300">
              New Booking Requests Awaiting Approval ({pendingAppointments.length})
            </h2>
          </div>
          <Link
            href={`/pharmacy/${pharmacy.id}/appointments?status=PENDING`}
            className="text-xs font-bold text-amber-900 hover:underline dark:text-amber-400"
          >
            Manage All Requests &rarr;
          </Link>
        </div>

        {pendingAppointments.length === 0 ? (
          <div className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-white p-4 text-xs font-semibold text-slate-600 dark:border-amber-900/30 dark:bg-zinc-900 dark:text-zinc-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
              <span>
                All incoming booking requests processed! No pending approvals at this time.
              </span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ All Clear
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingAppointments.map((app) => {
              const refCode = `NDC-${app.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
              return (
                <div
                  key={app.id}
                  className="shadow-xs flex flex-col justify-between gap-3 rounded-xl border border-amber-200/80 bg-white p-4 dark:border-amber-900/40 dark:bg-zinc-900 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xs font-extrabold text-amber-900">
                      {app.customer?.firstName?.[0] || "P"}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          {app.customer?.firstName} {app.customer?.lastName}
                        </h3>
                        <span className="rounded-md bg-amber-100/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                          {refCode}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-300">
                        <strong className="text-slate-900 dark:text-white">
                          {app.service?.name}
                        </strong>{" "}
                        (£{Number(app.service?.price || 0).toFixed(2)}) &bull;{" "}
                        {format(new Date(app.startTime), "EEEE, d MMM 'at' HH:mm")}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        Patient: {app.customer?.phone || app.customer?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center space-x-2 pt-2 sm:pt-0">
                    <button
                      onClick={() => handleStatusUpdate(app.id, "CONFIRMED")}
                      disabled={isUpdating === app.id}
                      className="shadow-xs flex min-h-[38px] items-center space-x-1 rounded-xl bg-[#10B981] px-4 py-2 text-xs font-extrabold text-white transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app.id, "REJECTED")}
                      disabled={isUpdating === app.id}
                      className="flex min-h-[38px] items-center space-x-1 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-extrabold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:bg-zinc-900 dark:hover:bg-rose-950/40"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={() => setSelectedAppointment(app)}
                      className="min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. TODAY'S APPOINTMENTS WORKSPACE TIMELINE */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Today&apos;s Appointments
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {todayAppointments.length === 0
                ? "No appointments scheduled for today."
                : `${todayAppointments.length} appointment${todayAppointments.length > 1 ? "s" : ""} scheduled today.`}
            </p>
          </div>

          <Link
            href={`/pharmacy/${pharmacy.id}/appointments`}
            className="flex items-center space-x-1 text-xs font-bold text-[#10B981] hover:underline"
          >
            <span>Appointments Hub</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {todayAppointments.length > 0 ? (
          <div className="shadow-xs dark:divide-zinc-850 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {todayAppointments.map((app) => {
              const refCode = `NDC-${app.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppointment(app)}
                  className="dark:hover:bg-zinc-850 group flex cursor-pointer flex-col justify-between gap-4 p-4 transition-all hover:bg-slate-50/80 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-800 dark:bg-zinc-800 dark:text-zinc-200">
                      <span className="text-xs">{format(new Date(app.startTime), "HH:mm")}</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        {format(new Date(app.endTime), "HH:mm")}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-[#10B981] dark:text-white">
                          {app.customer?.firstName} {app.customer?.lastName}
                        </h3>
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {refCode}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                        {app.service?.name} &bull; £{Number(app.service?.price || 0).toFixed(2)} (
                        {app.service?.duration} mins)
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center space-x-2 self-end sm:self-center">
                    {app.status === "CONFIRMED" &&
                      (() => {
                        const canComplete = new Date() >= new Date(app.startTime);
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canComplete) handleStatusUpdate(app.id, "COMPLETED");
                            }}
                            disabled={isUpdating === app.id || !canComplete}
                            title={
                              canComplete
                                ? "Mark appointment completed"
                                : `Available after appointment start time (${format(new Date(app.startTime), "d MMM, HH:mm")})`
                            }
                            className={`shadow-xs flex min-h-[34px] items-center space-x-1 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all ${
                              canComplete
                                ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                                : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500"
                            }`}
                          >
                            {canComplete ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Lock className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {canComplete
                                ? "Mark Completed"
                                : `Starts ${format(new Date(app.startTime), "HH:mm")}`}
                            </span>
                          </button>
                        );
                      })()}

                    {app.status === "PENDING" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(app.id, "CONFIRMED");
                        }}
                        disabled={isUpdating === app.id}
                        className="shadow-xs flex min-h-[34px] items-center space-x-1 rounded-xl bg-[#10B981] px-3 py-1.5 text-xs font-extrabold text-white transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                        app.status === "CONFIRMED"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : app.status === "PENDING"
                            ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : app.status === "COMPLETED"
                              ? "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}
                    >
                      {app.status === "COMPLETED" ? "✓ Completed" : app.status}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(app);
                      }}
                      className="min-h-[34px] rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      Details &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Friendly Empty State Illustration */
          <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#10B981] dark:bg-emerald-950/60">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No appointments scheduled for today
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400">
              Enjoy your free day! Online patient bookings are open and active for your pharmacy
              location.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-3">
              <a
                href={publicBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#10B981] hover:underline"
              >
                <span>View Online Booking Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. UPCOMING APPOINTMENTS LIST */}
      {/* ========================================================================= */}
      {upcomingAppointments.length > 0 && (
        <div className="space-y-4 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Schedule (Next Days)
            </h2>
            <Link
              href={`/pharmacy/${pharmacy.id}/appointments`}
              className="text-xs font-bold text-[#10B981] hover:underline"
            >
              View Full Schedule &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingAppointments.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedAppointment(app)}
                className="shadow-xs group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-[#10B981]/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {format(new Date(app.startTime), "EEE, d MMM")}
                    </span>
                    <span className="font-semibold text-[#10B981]">
                      {format(new Date(app.startTime), "HH:mm")}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 transition-colors group-hover:text-[#10B981] dark:text-white">
                      {app.customer?.firstName} {app.customer?.lastName}
                    </h4>
                    <p className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
                      {app.service?.name}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] dark:border-zinc-800">
                  <span className="font-mono text-slate-400">
                    NDC-{app.id.replace(/-/g, "").substring(0, 6).toUpperCase()}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">View &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Viewing & Editing Appointments without leaving the page */}
      {selectedAppointment && (
        <AppointmentDrawer
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdateStatus={handleStatusUpdate}
        />
      )}
    </div>
  );
}
