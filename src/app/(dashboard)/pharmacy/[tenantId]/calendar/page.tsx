"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Loader2,
  AlertCircle,
  UserCheck,
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
import {
  getPharmacyStaffAction,
  createStaffMemberAction,
  submitLeaveRequestAction,
} from "@/actions/staff";

interface CalendarPageProps {
  params: {
    tenantId: string;
  };
}

export default function CalendarPage({ params }: CalendarPageProps) {
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [showEventDrawer, setShowEventDrawer] = useState<boolean>(false);
  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const [staffList, setStaffList] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: boolean;
    }>
  >([]);

  const [loading, setLoading] = useState(true);

  // Form inputs for new practitioner
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState("pharmacist");
  const [formError, setFormError] = useState<string | null>(null);

  // Form inputs for leave request / block time
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveStaffId, setLeaveStaffId] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [leaveEndDate, setLeaveEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const res = await getPharmacyStaffAction(params.tenantId);
      if (res.success && res.staff) {
        setStaffList(res.staff);
        if (res.staff.length > 0 && !leaveStaffId) {
          setLeaveStaffId(res.staff[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [params.tenantId]);

  const handleCreateStaff = () => {
    if (!staffName.trim() || !staffEmail.trim()) {
      setFormError("Name and email are required");
      return;
    }
    setFormError(null);

    startTransition(async () => {
      const res = await createStaffMemberAction({
        pharmacyId: params.tenantId,
        name: staffName,
        email: staffEmail,
        role: staffRole,
      });

      if (res.success) {
        setStaffName("");
        setStaffEmail("");
        setShowStaffModal(false);
        loadStaffData();
      } else {
        setFormError(res.error || "Failed to create practitioner");
      }
    });
  };

  const handleBlockTime = () => {
    if (!leaveStaffId) return;

    startTransition(async () => {
      const res = await submitLeaveRequestAction({
        staffId: leaveStaffId,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason || "Staff Leave / Blocked Time",
      });

      if (res.success) {
        setLeaveReason("");
        setShowEventDrawer(false);
        loadStaffData();
      }
    });
  };

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
      {/* Top Control Bar */}
      <div className="shadow-xs flex flex-col items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:flex-row md:items-center">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 font-bold text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CalendarIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="flex items-center space-x-2 text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              <span>Practitioner Schedule & Roster</span>
              <span className="py-0.2 rounded border border-emerald-200 bg-emerald-50 px-1.5 font-mono text-[9px] font-extrabold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                DATABASE PERSISTED
              </span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
              Real-time shift management & practitioner assignment
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {(["daily", "weekly", "monthly"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-2.5 py-1 text-[11px] capitalize transition-all ${
                  viewMode === mode
                    ? "shadow-xs bg-white font-bold text-slate-900 dark:bg-zinc-800 dark:text-slate-100"
                    : "hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Compact Date Navigator */}
          <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-bold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <button
              onClick={() => setCurrentDate((prev) => subDays(prev, 7))}
              className="rounded p-1 hover:bg-white dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[110px] px-2 text-center font-mono">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </span>
            <button
              onClick={() => setCurrentDate((prev) => addDays(prev, 7))}
              className="rounded p-1 hover:bg-white dark:hover:bg-zinc-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Buttons */}
          <button
            onClick={() => setShowStaffModal(true)}
            className="shadow-xs flex items-center space-x-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-900 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Add Practitioner</span>
          </button>

          <button
            onClick={() => setShowEventDrawer(true)}
            className="shadow-xs flex items-center space-x-1 rounded-md bg-[#000e35] px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Block Time / Leave</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Left Mini-Sidebar */}
        <div className="space-y-4 lg:col-span-3">
          {/* Mini Monthly Calendar */}
          <div className="shadow-xs space-y-3 rounded-lg border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-zinc-200">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentDate((prev) => subDays(prev, 30))}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCurrentDate((prev) => addDays(prev, 30))}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

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
                    className={`rounded py-1 text-[10px] font-bold transition-all ${
                      isSelected
                        ? "bg-[#000e35] text-white"
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

          {/* Practitioner Roster List */}
          <div className="shadow-xs space-y-2.5 rounded-lg border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
            <span className="block font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Practitioners ({staffList.length})
            </span>

            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-[#000e35]" />
              </div>
            ) : staffList.length === 0 ? (
              <p className="text-xs text-slate-400">No practitioners registered yet.</p>
            ) : (
              <div className="space-y-1.5 text-xs font-medium">
                <button
                  onClick={() => setSelectedStaff("all")}
                  className={`flex w-full items-center justify-between rounded-md p-2 text-left transition-all ${
                    selectedStaff === "all"
                      ? "border border-slate-200 bg-slate-100 font-bold dark:border-zinc-800 dark:bg-zinc-900"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                        All Practitioners
                      </p>
                      <span className="text-[9px] text-slate-400">Full Roster</span>
                    </div>
                  </div>
                  {selectedStaff === "all" && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                </button>

                {staffList.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff.id)}
                    className={`flex w-full items-center justify-between rounded-md p-2 text-left transition-all ${
                      selectedStaff === staff.id
                        ? "border border-slate-200 bg-slate-100 font-bold dark:border-zinc-800 dark:bg-zinc-900"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                          {staff.name}
                        </p>
                        <span className="text-[9px] uppercase text-slate-400">{staff.role}</span>
                      </div>
                    </div>
                    {selectedStaff === staff.id && (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Weekly Grid */}
        <div className="shadow-xs overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-9">
          {/* Day Headers */}
          <div className="grid grid-cols-8 divide-x divide-slate-100 border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 dark:divide-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <div className="p-2 text-center font-mono text-[9px] uppercase text-slate-400">GMT</div>
            {daysInWeek.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={idx}
                  className={`p-2 text-center ${isToday ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}
                >
                  <span className="block font-mono text-[9px] uppercase text-slate-400">
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={`text-xs font-extrabold ${isToday ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"}`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time Slots Grid */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-900">
            {timeHours.map((hour) => (
              <div
                key={hour}
                className="grid min-h-[44px] grid-cols-8 divide-x divide-slate-100 dark:divide-zinc-900"
              >
                <div className="flex items-center justify-center bg-slate-50/40 p-1.5 font-mono text-[10px] font-semibold text-slate-400 dark:bg-zinc-950">
                  {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                </div>
                {daysInWeek.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="p-1 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900/30"
                  >
                    {/* Schedule cell placeholder */}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Practitioner Modal */}
      {showStaffModal && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Add New Practitioner to Roster
              </h3>
              <button
                onClick={() => setShowStaffModal(false)}
                className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-700">
                <AlertCircle className="h-4 w-4" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-500">Full Name *</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Dr. Alex Rivera"
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#000e35]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-500">Email Address *</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="alex.rivera@clinic.co.uk"
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#000e35]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-500">Role / Speciality</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none"
                >
                  <option value="pharmacist">Independent Prescriber / Clinical Pharmacist</option>
                  <option value="reception">Clinic Receptionist</option>
                  <option value="manager">Pharmacy Manager</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={handleCreateStaff}
                disabled={isPending}
                className="flex w-full items-center justify-center space-x-2 rounded bg-[#000e35] py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Save Practitioner to Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Time Drawer */}
      {showEventDrawer && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex justify-end bg-slate-900/40">
          <div className="h-full w-full max-w-md space-y-5 overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Block Time / Add Practitioner Leave
              </h3>
              <button
                onClick={() => setShowEventDrawer(false)}
                className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium text-slate-700 dark:text-zinc-300">
              <div>
                <label className="mb-1 block font-bold text-slate-500">Select Practitioner</label>
                <select
                  value={leaveStaffId}
                  onChange={(e) => setLeaveStaffId(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-500">Reason / Note</label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Clinical Training / Annual Leave"
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#000e35]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 dark:border-zinc-900">
              <button
                onClick={handleBlockTime}
                disabled={isPending}
                className="flex w-full items-center justify-center space-x-2 rounded bg-[#000e35] py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Persist Blocked Slot to Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
