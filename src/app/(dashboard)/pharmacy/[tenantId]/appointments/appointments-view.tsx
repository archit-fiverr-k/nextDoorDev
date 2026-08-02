"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  isToday,
  isTomorrow,
  isFuture,
  isPast,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Filter,
  ArrowUpDown,
  Plus,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Monitor,
  LayoutList,
  CalendarDays,
  Zap,
  Phone,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatusAction } from "@/actions/appointments";
import { AppointmentDrawer } from "./appointment-drawer";
import { QuickWalkInDrawer } from "@/components/dashboard/quick-walk-in-drawer";

interface AppointmentsViewProps {
  pharmacyId: string;
  appointments: any[];
  services?: any[];
}

export function AppointmentsView({
  pharmacyId,
  appointments,
  services = [],
}: AppointmentsViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("CALENDAR");
  const [calendarViewType, setCalendarViewType] = useState<"MONTH" | "WEEK" | "DAY">("MONTH");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [activeTab, setActiveTab] = useState<"TODAY" | "TOMORROW" | "UPCOMING" | "PAST">("TODAY");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Quick Walk-in Drawer state
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInDate, setWalkInDate] = useState<Date | undefined>(undefined);

  // Filter appointments by Tab and Search Query for List View
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

  // Generate Days for Month Calendar Grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const handleStatusUpdate = async (
    id: string,
    status: "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED"
  ) => {
    setIsUpdating(id);
    try {
      await updateAppointmentStatusAction(id, status);
      router.refresh();
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setIsUpdating(null);
    }
  };

  const openWalkInWithDate = (date?: Date) => {
    const targetDate = date || walkInDate || new Date();
    setWalkInDate(targetDate);
    setIsWalkInOpen(true);
  };

  const getSourceBadge = (source?: string) => {
    const src = (source || "ONLINE").toUpperCase();
    if (src === "WALK_IN") {
      return {
        label: "Walk-in",
        color:
          "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300",
      };
    }
    if (src === "PHONE") {
      return {
        label: "Phone",
        color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300",
      };
    }
    if (src === "ADMIN") {
      return {
        label: "Admin",
        color:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300",
      };
    }
    return {
      label: "Online",
      color:
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300",
    };
  };

  return (
    <div className="select-text space-y-6 font-sans text-slate-900 antialiased dark:text-slate-100">
      {/* Quick Counter Walk-in Drawer */}
      <QuickWalkInDrawer
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        pharmacyId={pharmacyId}
        services={services}
        preselectedDate={walkInDate}
        onSuccess={() => router.refresh()}
      />

      {/* Detail Inspection Drawer */}
      {selectedAppointment && (
        <AppointmentDrawer
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdateStatus={handleStatusUpdate}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Appointment Schedule
            </h1>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#10B981] dark:bg-emerald-950/60">
              Live Real-Time
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
            Interactive calendar schedule, slot reservations, and counter walk-in booking POS.
          </p>
        </div>

        {/* Action Controls: View Switcher + Quick Walk-in Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher Toggle */}
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setViewMode("CALENDAR")}
              className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
                viewMode === "CALENDAR"
                  ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Calendar View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
                viewMode === "LIST"
                  ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              <span>List View</span>
            </button>
          </div>

          {/* Quick Walk-in Button */}
          <button
            type="button"
            onClick={() => openWalkInWithDate()}
            className="flex items-center space-x-2 rounded-2xl bg-[#10B981] px-4 py-2.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95"
          >
            <Zap className="h-4 w-4" />
            <span>+ Quick Walk-in Booking</span>
          </button>
        </div>
      </div>

      {/* CALENDAR VIEW: Compact Mini Calendar + Day Schedule Inspector */}
      {viewMode === "CALENDAR" ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_1fr]">
          {/* LEFT: Compact Mini Calendar */}
          <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {/* Month Nav Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today);
                    setWalkInDate(today);
                  }}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Row */}
            <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Compact Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const isSelected = walkInDate ? isSameDay(day, walkInDate) : isTodayDate;

                // Count appointments for this date
                const count = appointments.filter((a) =>
                  isSameDay(new Date(a.startTime), day)
                ).length;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWalkInDate(day)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-xl p-1 text-xs font-extrabold transition-all ${
                      !isCurrentMonth
                        ? "text-slate-300 dark:text-zinc-700"
                        : isSelected
                          ? "bg-[#10B981] text-white shadow-md ring-2 ring-[#10B981]"
                          : isTodayDate
                            ? "border border-emerald-200 bg-emerald-50 text-[#10B981] dark:border-emerald-800 dark:bg-emerald-950/60"
                            : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{format(day, "d")}</span>

                    {/* Booking Count Badge */}
                    {count > 0 && (
                      <span
                        className={`mt-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[8px] font-black ${
                          isSelected
                            ? "bg-white text-[#10B981]"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => openWalkInWithDate(walkInDate || new Date())}
                className="flex w-full items-center justify-center space-x-1.5 rounded-xl border border-slate-200/90 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:border-[#10B981] hover:bg-emerald-50 hover:text-[#10B981] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <Zap className="h-3.5 w-3.5 text-[#10B981]" />
                <span>+ Walk-in on {format(walkInDate || new Date(), "d MMM")}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Day Schedule Inspector */}
          <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {/* Inspector Header */}
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {format(walkInDate || new Date(), "EEEE, d MMMM yyyy")}
                  </h3>
                  {isToday(walkInDate || new Date()) && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-black uppercase text-[#10B981] dark:bg-emerald-950/60">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  {
                    appointments.filter((a) =>
                      isSameDay(new Date(a.startTime), walkInDate || new Date())
                    ).length
                  }{" "}
                  appointment(s) scheduled for this day
                </p>
              </div>

              <button
                type="button"
                onClick={() => openWalkInWithDate(walkInDate || new Date())}
                className="shadow-xs flex items-center space-x-1.5 rounded-xl bg-[#10B981] px-3.5 py-2 text-xs font-black text-white hover:bg-emerald-600"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Quick Walk-in</span>
              </button>
            </div>

            {/* List of Bookings for Selected Date */}
            {(() => {
              const targetDate = walkInDate || new Date();
              const dayAppts = appointments
                .filter((a) => isSameDay(new Date(a.startTime), targetDate))
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

              if (dayAppts.length === 0) {
                return (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
                    <Clock className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-zinc-600" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      No appointments booked for {format(targetDate, "EEE, d MMM")}
                    </h4>
                    <p className="mt-1 text-[11px] text-slate-400">
                      This date is open for online patient bookings or counter walk-ins.
                    </p>
                    <button
                      type="button"
                      onClick={() => openWalkInWithDate(targetDate)}
                      className="mt-4 inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Reserve Walk-in Slot</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {dayAppts.map((app) => {
                    const refCode = `NDC-${app.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
                    const patientName =
                      `${app.customer?.firstName || "Patient"} ${app.customer?.lastName || ""}`.trim();
                    const srcBadge = getSourceBadge(app.bookingSource);

                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppointment(app)}
                        className="group flex cursor-pointer flex-col justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:border-[#10B981]/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-800 dark:bg-zinc-800 dark:text-zinc-200">
                            <span className="text-xs">
                              {format(new Date(app.startTime), "HH:mm")}
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">
                              {format(new Date(app.endTime), "HH:mm")}
                            </span>
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <h4 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-[#10B981] dark:text-white">
                                {patientName}
                              </h4>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${srcBadge.color}`}
                              >
                                {srcBadge.label}
                              </span>
                            </div>
                            <p className="truncate text-xs font-medium text-slate-600 dark:text-zinc-300">
                              {app.service?.name} &bull; £
                              {Number(app.service?.price || 0).toFixed(2)} ({app.service?.duration}{" "}
                              mins)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-2 dark:border-zinc-800 sm:border-none sm:pt-0">
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
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(app);
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4">
          {/* Tab Controls & Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, service, or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs font-medium focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>

          {/* List Table / Card Stack */}
          {filteredAppointments.length > 0 ? (
            <div className="sm:shadow-xs space-y-3 sm:space-y-0 sm:divide-y sm:divide-slate-100 sm:rounded-2xl sm:border sm:border-slate-200/80 sm:bg-white dark:sm:border-zinc-800 dark:sm:bg-zinc-900">
              {filteredAppointments.map((app) => {
                const refCode = `NDC-${app.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
                const patientName =
                  `${app.customer?.firstName || "Patient"} ${app.customer?.lastName || ""}`.trim();
                const srcBadge = getSourceBadge(app.bookingSource);

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppointment(app)}
                    className="shadow-xs group flex cursor-pointer flex-col justify-between gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:rounded-none sm:border-none sm:shadow-none"
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
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${srcBadge.color}`}
                          >
                            {srcBadge.label}
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
            <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <Clock className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No appointments found for this view
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Try switching tabs or reserve a new walk-in appointment above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
