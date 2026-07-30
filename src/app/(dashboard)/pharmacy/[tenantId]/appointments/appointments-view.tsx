"use client";

import React, { useState, useMemo } from "react";
import { format, isToday, isTomorrow, isFuture, isPast } from "date-fns";
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Filter,
  ArrowUpDown,
  Plus,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { updateAppointmentStatusAction } from "@/actions/appointments";
import { AppointmentDrawer } from "./appointment-drawer";

interface AppointmentsViewProps {
  pharmacyId: string;
  appointments: any[];
}

export function AppointmentsView({ pharmacyId, appointments }: AppointmentsViewProps) {
  const [activeTab, setActiveTab] = useState<"TODAY" | "TOMORROW" | "UPCOMING" | "PAST">("TODAY");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Filter appointments by Tab and Search Query
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const startTime = new Date(app.startTime);
      const matchesSearch =
        searchQuery === "" ||
        `${app.customer?.firstName} ${app.customer?.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        app.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "TODAY") {
        return isToday(startTime);
      }
      if (activeTab === "TOMORROW") {
        return isTomorrow(startTime);
      }
      if (activeTab === "UPCOMING") {
        return isFuture(startTime) && !isToday(startTime) && !isTomorrow(startTime);
      }
      if (activeTab === "PAST") {
        return isPast(startTime) && !isToday(startTime);
      }

      return true;
    });
  }, [appointments, activeTab, searchQuery]);

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
    <div className="select-text space-y-6 font-sans text-slate-900 antialiased dark:text-slate-100">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Appointments
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Manage your patient schedule, approve bookings, and update appointment statuses in real
            time.
          </p>
        </div>

        {/* Tab Controls (Touch friendly minimum 44px height for buttons on mobile) */}
        <div className="flex items-center overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {(["TODAY", "TOMORROW", "UPCOMING", "PAST"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`min-h-[38px] whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === tab
                  ? "shadow-xs bg-white text-slate-900 dark:bg-zinc-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab === "TODAY"
                ? "Today"
                : tab === "TOMORROW"
                  ? "Tomorrow"
                  : tab === "UPCOMING"
                    ? "Upcoming"
                    : "Past"}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by patient name, treatment or ref..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs font-medium focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      {/* Appointments View: Desktop/Tablet Table-List & Mobile Stacked Cards */}
      {filteredAppointments.length > 0 ? (
        <div className="sm:shadow-xs dark:sm:divide-zinc-850 space-y-3 sm:space-y-0 sm:divide-y sm:divide-slate-100 sm:rounded-2xl sm:border sm:border-slate-200/80 sm:bg-white dark:sm:border-zinc-800 dark:sm:bg-zinc-900">
          {filteredAppointments.map((app) => {
            const refCode = `NDC-${app.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
            const patientName =
              `${app.customer?.firstName || "Patient"} ${app.customer?.lastName || ""}`.trim();

            return (
              <div
                key={app.id}
                onClick={() => setSelectedAppointment(app)}
                className="shadow-xs dark:hover:bg-zinc-850 group flex cursor-pointer flex-col justify-between gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:rounded-none sm:border-none sm:shadow-none"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-800 dark:bg-zinc-800 dark:text-zinc-200">
                    <span className="text-xs">{format(new Date(app.startTime), "HH:mm")}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      {format(new Date(app.endTime), "HH:mm")}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-[#10B981] dark:text-white">
                        {patientName}
                      </h3>
                      <span className="shrink-0 font-mono text-[10px] font-bold text-slate-400">
                        {refCode}
                      </span>
                    </div>
                    <p className="truncate text-xs font-medium text-slate-600 dark:text-zinc-300">
                      {app.service?.name} &bull; £{Number(app.service?.price || 0).toFixed(2)} (
                      {app.service?.duration} mins)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-3 border-t border-slate-100 pt-2 dark:border-zinc-800 sm:justify-end sm:border-none sm:pt-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                      app.status === "CONFIRMED"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : app.status === "PENDING"
                          ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : app.status === "COMPLETED"
                            ? "border border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    {app.status}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppointment(app);
                    }}
                    className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    View & Actions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Friendly Empty State */
        <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#10B981] dark:bg-emerald-950/60">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No appointments found for {activeTab.toLowerCase()}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400">
            There are no appointments matching this tab filter. New patient bookings will appear
            here automatically.
          </p>
        </div>
      )}

      {/* Slide-over Drawer */}
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
