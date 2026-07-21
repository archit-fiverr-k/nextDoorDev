"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  UserCheck,
  Filter,
  Coffee,
  Ban,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Search,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  isSameMonth,
} from "date-fns";

interface CalendarPageProps {
  params: {
    tenantId: string;
  };
}

export default function CalendarPage({ params }: CalendarPageProps) {
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly" | "timeline">("weekly");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [showEventDrawer, setShowEventDrawer] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Mock schedule appointments & blocked slots
  const mockEvents = [
    {
      id: "evt-1",
      title: "Travel Vaccination Advisory",
      patient: "Sarah Jenkins",
      time: "09:30 - 10:15",
      dayOffset: 1, // Tuesday
      hourStart: 9,
      duration: 45,
      staff: "Dr. Alex Rivera",
      staffAvatar: "AR",
      type: "APPOINTMENT",
      status: "CONFIRMED",
      color:
        "bg-emerald-50/80 border-emerald-200/90 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200",
      dotColor: "bg-emerald-500",
    },
    {
      id: "evt-2",
      title: "Ear Wax Microsuction",
      patient: "Robert Chen",
      time: "11:00 - 11:30",
      dayOffset: 1,
      hourStart: 11,
      duration: 30,
      staff: "Nurse Elena Vance",
      staffAvatar: "EV",
      type: "APPOINTMENT",
      status: "CONFIRMED",
      color:
        "bg-sky-50/80 border-sky-200/90 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800/60 dark:text-sky-200",
      dotColor: "bg-sky-500",
    },
    {
      id: "evt-3",
      title: "Team Clinical Break",
      patient: "",
      time: "13:00 - 14:00",
      dayOffset: 1,
      hourStart: 13,
      duration: 60,
      staff: "All Staff",
      staffAvatar: "ALL",
      type: "BREAK",
      status: "BLOCKED",
      color:
        "bg-amber-50/80 border-amber-200/90 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-200",
      dotColor: "bg-amber-500",
    },
    {
      id: "evt-4",
      title: "Lipid & Blood Pressure Check",
      patient: "David Miller",
      time: "14:30 - 15:00",
      dayOffset: 2, // Wednesday
      hourStart: 14,
      duration: 30,
      staff: "Pharm. Marcus Thorne",
      staffAvatar: "MT",
      type: "APPOINTMENT",
      status: "PENDING",
      color:
        "bg-indigo-50/80 border-indigo-200/90 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-200",
      dotColor: "bg-indigo-500",
    },
    {
      id: "evt-5",
      title: "NHS Holiday - Bank Holiday",
      patient: "",
      time: "All Day",
      dayOffset: 5, // Saturday
      hourStart: 8,
      duration: 540,
      staff: "All Staff",
      staffAvatar: "ALL",
      type: "HOLIDAY",
      status: "CLOSED",
      color:
        "bg-rose-50/80 border-rose-200/90 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-200",
      dotColor: "bg-rose-500",
    },
  ];

  // Calculate days for weekly grid
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Mini-calendar days calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const miniCalendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });

  const timeHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div className="mx-auto max-w-7xl select-none space-y-4">
      {/* Sleek Top Control Bar */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 md:flex-row md:items-center">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-200/60 bg-teal-50 font-bold text-teal-600 dark:border-teal-900/40 dark:bg-teal-950/40 dark:text-teal-400">
            <CalendarIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="flex items-center space-x-2 text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              <span>Clinic Schedule</span>
              <span className="py-0.2 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 font-mono text-[9px] font-extrabold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                LIVE
              </span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
              Real-time shift management, appointments & buffer controls
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented View Mode Switcher */}
          <div className="flex rounded-xl border border-slate-200/60 bg-slate-100 p-0.5 text-xs font-semibold text-slate-600 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-400">
            {(["daily", "weekly", "monthly", "timeline"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-lg px-2.5 py-1 text-[11px] capitalize transition-all ${
                  viewMode === mode
                    ? "bg-white font-bold text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-slate-100"
                    : "hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Compact Date Navigator */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-bold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <button
              onClick={() => setCurrentDate((prev) => subDays(prev, 7))}
              className="rounded-lg p-1 transition-colors hover:bg-white dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[110px] px-2 text-center font-mono">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </span>
            <button
              onClick={() => setCurrentDate((prev) => addDays(prev, 7))}
              className="rounded-lg p-1 transition-colors hover:bg-white dark:hover:bg-zinc-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add Slot Button */}
          <button
            onClick={() => setShowEventDrawer(true)}
            className="flex items-center space-x-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Block Time</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Compact Sidebar (Mini-Calendar + Staff Roster) + Modern Weekly Grid */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Left Mini-Sidebar (3 cols) */}
        <div className="space-y-4 lg:col-span-3">
          {/* Mini Monthly Calendar Card */}
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-zinc-200">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentDate((prev) => subDays(prev, 30))}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCurrentDate((prev) => addDays(prev, 30))}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Mini Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="py-0.5">
                  {d}
                </div>
              ))}
              {miniCalendarDays.slice(0, 35).map((day, idx) => {
                const isSelected = isSameDay(day, currentDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentDate(day)}
                    className={`rounded-md py-1 text-[10px] font-bold transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                        : isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          : "text-slate-300 dark:text-zinc-700"
                    }`}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Practitioner Roster Toggle List */}
          <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="block font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Practitioner Roster
            </span>

            <div className="space-y-1.5 text-xs font-medium">
              {[
                {
                  id: "all",
                  name: "All Practitioners",
                  role: "Full Roster View",
                  avatar: "ALL",
                  color: "bg-teal-500",
                },
                {
                  id: "dr-rivera",
                  name: "Dr. Alex Rivera",
                  role: "GP / Travel Lead",
                  avatar: "AR",
                  color: "bg-emerald-500",
                },
                {
                  id: "nurse-elena",
                  name: "Nurse Elena Vance",
                  role: "Vaccine Specialist",
                  avatar: "EV",
                  color: "bg-sky-500",
                },
                {
                  id: "pharm-marcus",
                  name: "Pharm. Marcus Thorne",
                  role: "Lead Pharmacist",
                  avatar: "MT",
                  color: "bg-indigo-500",
                },
              ].map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaff(staff.id)}
                  className={`flex w-full items-center justify-between rounded-xl p-2 text-left transition-all ${
                    selectedStaff === staff.id
                      ? "border border-slate-200/60 bg-slate-100 font-bold dark:border-zinc-800/80 dark:bg-zinc-900"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex min-w-0 items-center space-x-2">
                    <span className={`h-2 w-2 rounded-full ${staff.color} shrink-0`} />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] leading-tight text-slate-900 dark:text-slate-100">
                        {staff.name}
                      </p>
                      <span className="block truncate text-[9px] leading-none text-slate-400">
                        {staff.role}
                      </span>
                    </div>
                  </div>
                  {selectedStaff === staff.id && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Modern Weekly Grid (9 cols) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 lg:col-span-9">
          {/* Calendar Day Headers */}
          <div className="grid grid-cols-8 divide-x divide-slate-100 border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-700 dark:divide-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-300">
            <div className="p-2 text-center font-mono text-[9px] uppercase text-slate-400 dark:text-zinc-500">
              GMT
            </div>
            {daysInWeek.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={idx}
                  className={`p-2 text-center ${isToday ? "bg-teal-50/80 dark:bg-teal-950/30" : ""}`}
                >
                  <span className="block font-mono text-[9px] uppercase text-slate-400 dark:text-zinc-500">
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={`text-xs font-extrabold ${isToday ? "text-teal-700 dark:text-teal-400" : "text-slate-900 dark:text-slate-100"}`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time Slots Grid (Compact Height) */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-900">
            {timeHours.map((hour) => (
              <div
                key={hour}
                className="grid min-h-[44px] grid-cols-8 divide-x divide-slate-100 dark:divide-zinc-900"
              >
                {/* Hour Column */}
                <div className="flex items-center justify-center bg-slate-50/40 p-1.5 text-center font-mono text-[10px] font-semibold text-slate-400 dark:bg-zinc-950 dark:text-zinc-500">
                  {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                </div>

                {/* 7 Days Columns */}
                {daysInWeek.map((day, dayIdx) => {
                  // Find matching event
                  const matchingEvents = mockEvents.filter(
                    (evt) => evt.dayOffset === dayIdx && evt.hourStart === hour
                  );

                  return (
                    <div
                      key={dayIdx}
                      className="group relative cursor-pointer p-1 transition-colors hover:bg-slate-50/60 dark:hover:bg-zinc-900/30"
                    >
                      {matchingEvents.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`cursor-pointer space-y-0.5 rounded-lg border p-1.5 text-[10px] font-semibold shadow-sm transition-all hover:scale-[1.02] ${evt.color}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate text-[10px] font-extrabold text-slate-900 dark:text-slate-50">
                              {evt.title}
                            </span>
                            <span className="shrink-0 font-mono text-[8px] font-bold opacity-80">
                              {evt.time.split("-")[0]}
                            </span>
                          </div>
                          {evt.patient && (
                            <p className="truncate text-[9px] font-normal text-slate-700 opacity-90 dark:text-zinc-300">
                              {evt.patient}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-0.5 text-[8px] opacity-80">
                            <span className="truncate">{evt.staff}</span>
                            <span className="font-mono text-[8px] font-bold uppercase">
                              {evt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Block Time Drawer */}
      {showEventDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-md space-y-5 overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Block Time / Add Personal Leave
              </h3>
              <button
                onClick={() => setShowEventDrawer(false)}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 dark:bg-zinc-900"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium text-slate-700 dark:text-zinc-300">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Reason / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Staff Training / Personal Leave / Lunch Break"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Start Time
                  </label>
                  <input
                    type="time"
                    defaultValue="13:00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    End Time
                  </label>
                  <input
                    type="time"
                    defaultValue="14:00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Assign Practitioner
                </label>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900">
                  <option>All Staff</option>
                  <option>Dr. Alex Rivera</option>
                  <option>Nurse Elena Vance</option>
                  <option>Pharm. Marcus Thorne</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 dark:border-zinc-900">
              <button
                onClick={() => setShowEventDrawer(false)}
                className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-950"
              >
                Save Blocked Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
