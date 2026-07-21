"use client";

import { useState, useTransition } from "react";
import {
  updateWeeklyAvailabilityAction,
  addBlockedDateAction,
  removeBlockedDateAction,
  updateBookingRulesAction,
} from "@/actions/availability";
import { Button } from "@/components/ui/button";
import {
  CalendarRange,
  Clock,
  Ban,
  Trash2,
  ShieldAlert,
  CheckCircle,
  Plus,
  Settings,
  Calendar,
  Globe,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AvailabilityItem {
  id?: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

interface BlockedDateItem {
  id: string;
  date: Date;
  reason: string | null;
}

interface PharmacyDetails {
  id: string;
  bufferTime: number;
  maxBookingsPerSlot: number;
  maxAdvanceDays: number;
  minNoticeHours: number;
}

interface AvailabilityViewProps {
  pharmacyId: string;
  initialAvailability: AvailabilityItem[];
  initialBlockedDates: BlockedDateItem[];
  pharmacy: PharmacyDetails;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const daysOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday

// UK Bank Holidays 2026/2027
const UK_BANK_HOLIDAYS = [
  { date: "2026-01-01", reason: "New Year's Day" },
  { date: "2026-04-03", reason: "Good Friday" },
  { date: "2026-04-06", reason: "Easter Monday" },
  { date: "2026-05-04", reason: "Early May Bank Holiday" },
  { date: "2026-05-25", reason: "Spring Bank Holiday" },
  { date: "2026-08-31", reason: "Summer Bank Holiday" },
  { date: "2026-12-25", reason: "Christmas Day" },
  { date: "2026-12-28", reason: "Boxing Day (substitute day)" },
];

const timeOptions = Array.from({ length: 48 }).map((_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const labelH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";
  const padH = String(h).padStart(2, "0");
  return {
    value: `${padH}:${m}`,
    label: `${labelH}:${m} ${ampm}`,
  };
});

export function AvailabilityView({
  pharmacyId,
  initialAvailability,
  initialBlockedDates,
  pharmacy,
}: AvailabilityViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 1. Weekly Schedule States
  const [schedule, setSchedule] = useState(() => {
    return daysOrder.map((day) => {
      const existing = initialAvailability.find((a) => a.dayOfWeek === day);
      return {
        dayOfWeek: day,
        isOpen: !!existing,
        openTime: existing?.openTime || "09:00",
        closeTime: existing?.closeTime || "17:00",
      };
    });
  });

  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // 2. Booking Rules Form State
  const [rules, setRules] = useState({
    bufferTime: String(pharmacy.bufferTime),
    maxBookingsPerSlot: String(pharmacy.maxBookingsPerSlot),
    maxAdvanceDays: String(pharmacy.maxAdvanceDays),
    minNoticeHours: String(pharmacy.minNoticeHours),
  });
  const [rulesSuccess, setRulesSuccess] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  // 3. Blocked Dates / Holiday Calendar States
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockSuccess, setBlockSuccess] = useState(false);

  // 4. Interactive Roster calendar month-grid state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleToggleDay = (index: number) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isOpen: !next[index].isOpen };
      return next;
    });
  };

  const handleTimeChange = (index: number, field: "openTime" | "closeTime", value: string) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveSchedule = () => {
    setScheduleError(null);
    setScheduleSuccess(false);

    for (const item of schedule) {
      if (item.isOpen) {
        const [openH, openM] = item.openTime.split(":").map(Number);
        const [closeH, closeM] = item.closeTime.split(":").map(Number);
        if (openH * 60 + openM >= closeH * 60 + closeM) {
          setScheduleError(
            `Invalid times for ${dayNames[item.dayOfWeek]}: Open time must be earlier than close time.`
          );
          return;
        }
      }
    }

    startTransition(async () => {
      const res = await updateWeeklyAvailabilityAction(pharmacyId, schedule);
      if (!res.success) {
        setScheduleError(res.error || "Failed to save weekly schedule");
      } else {
        setScheduleSuccess(true);
        router.refresh();
      }
    });
  };

  const handleSaveRules = () => {
    setRulesError(null);
    setRulesSuccess(false);

    startTransition(async () => {
      const res = await updateBookingRulesAction(pharmacyId, {
        bufferTime: Number(rules.bufferTime),
        maxBookingsPerSlot: Number(rules.maxBookingsPerSlot),
        maxAdvanceDays: Number(rules.maxAdvanceDays),
        minNoticeHours: Number(rules.minNoticeHours),
      });

      if (!res.success) {
        setRulesError(res.error || "Failed to save booking constraints");
      } else {
        setRulesSuccess(true);
        router.refresh();
      }
    });
  };

  const handleAddBlockedDate = (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError(null);
    setBlockSuccess(false);

    if (!blockDate) {
      setBlockError("Please select a date to block.");
      return;
    }
    if (!blockReason.trim()) {
      setBlockError("Please enter a holiday reason.");
      return;
    }

    const selectedDate = new Date(blockDate);
    const today = startOfDay(new Date());
    if (isBefore(selectedDate, today)) {
      setBlockError("Cannot block past dates.");
      return;
    }

    startTransition(async () => {
      const res = await addBlockedDateAction(pharmacyId, {
        date: blockDate,
        reason: blockReason,
      });
      if (!res.success) {
        setBlockError(res.error || "Failed to block date");
      } else {
        setBlockSuccess(true);
        setBlockDate("");
        setBlockReason("");
        router.refresh();
      }
    });
  };

  const handleAutoBlockUKHolidays = () => {
    setBlockError(null);
    setBlockSuccess(false);

    startTransition(async () => {
      let count = 0;
      for (const hol of UK_BANK_HOLIDAYS) {
        const dateStr = hol.date;
        const exists = initialBlockedDates.some(
          (b) => format(new Date(b.date), "yyyy-MM-dd") === dateStr
        );

        if (!exists) {
          const res = await addBlockedDateAction(pharmacyId, {
            date: dateStr,
            reason: hol.reason,
          });
          if (res.success) count++;
        }
      }

      setBlockSuccess(true);
      setBlockError(`Auto-blocked ${count} upcoming UK Bank Holidays.`);
      router.refresh();
    });
  };

  const handleRemoveBlockedDate = (id: string) => {
    if (!confirm("Are you sure you want to unblock this date?")) return;
    startTransition(async () => {
      const res = await removeBlockedDateAction(id);
      if (!res.success) {
        alert(res.error || "Failed to remove blocked date");
      } else {
        router.refresh();
      }
    });
  };

  // 5. Calendar Render Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOffset = getDay(monthStart); // 0 = Sun, 1 = Mon...
  const calendarOffsetDays = startDayOffset === 0 ? 6 : startDayOffset - 1; // Align Mon-Sun

  return (
    <div className="grid gap-8 text-slate-800 lg:grid-cols-12">
      {/* Left Column: Operating Hours & Limits (7 cols) */}
      <div className="space-y-6 lg:col-span-7">
        {/* Weekly schedule */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex select-none items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center space-x-2">
              <Clock className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Weekly Operating Hours</h3>
            </div>
            <span className="border-slate-150 text-slate-455 rounded border bg-slate-50 px-2 py-0.5 text-[10px] font-bold">
              Recurring Schedule
            </span>
          </div>

          <div className="space-y-4 p-5">
            {scheduleError && (
              <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{scheduleError}</span>
              </div>
            )}

            {scheduleSuccess && (
              <div className="border-emerald-250 flex items-center space-x-2 rounded-xl border bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Weekly operating schedule saved successfully.</span>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {schedule.map((item, idx) => (
                <div
                  key={item.dayOfWeek}
                  className="flex flex-col gap-4 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-[130px] select-none items-center space-x-4">
                    <input
                      type="checkbox"
                      id={`day-${item.dayOfWeek}`}
                      checked={item.isOpen}
                      onChange={() => handleToggleDay(idx)}
                      disabled={isPending}
                      className="border-slate-350 text-blue-650 h-4 w-4 rounded"
                    />
                    <label
                      htmlFor={`day-${item.dayOfWeek}`}
                      className="cursor-pointer text-xs font-extrabold text-slate-900"
                    >
                      {dayNames[item.dayOfWeek]}
                    </label>
                  </div>

                  {item.isOpen ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={item.openTime}
                        onChange={(e) => handleTimeChange(idx, "openTime", e.target.value)}
                        disabled={isPending}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        {timeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="select-none text-xs text-slate-400">to</span>
                      <select
                        value={item.closeTime}
                        onChange={(e) => handleTimeChange(idx, "closeTime", e.target.value)}
                        disabled={isPending}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        {timeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="select-none rounded-lg border border-slate-100/60 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400">
                      Closed (Off-duty)
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="border-slate-150 flex select-none justify-end border-t pt-4">
              <Button onClick={handleSaveSchedule} disabled={isPending}>
                Save Operating Hours
              </Button>
            </div>
          </div>
        </div>

        {/* Booking limits / constraints */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex select-none items-center space-x-2 border-b border-slate-100 p-5">
            <Settings className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Booking Limits & Buffer Times</h3>
          </div>

          <div className="space-y-4 p-5">
            {rulesError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-600">
                {rulesError}
              </p>
            )}
            {rulesSuccess && (
              <p className="border-emerald-250 rounded-xl border bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800">
                Booking constraints saved successfully.
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Buffer Time between slots
                </label>
                <select
                  value={rules.bufferTime}
                  onChange={(e) => setRules({ ...rules, bufferTime: e.target.value })}
                  disabled={isPending}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="0">No Buffer (0 mins)</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Max Booking limit Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={rules.maxBookingsPerSlot}
                  onChange={(e) => setRules({ ...rules, maxBookingsPerSlot: e.target.value })}
                  disabled={isPending}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold focus:outline-none"
                  placeholder="e.g. 1 patient per slot"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Max Advance Booking Window
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={rules.maxAdvanceDays}
                    onChange={(e) => setRules({ ...rules, maxAdvanceDays: e.target.value })}
                    disabled={isPending}
                    className="h-10 w-full rounded-xl border border-slate-200 pl-3 pr-12 font-mono text-xs font-bold focus:outline-none"
                  />
                  <span className="absolute right-3 top-3 select-none text-[10px] font-bold text-slate-400">
                    days
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Minimum Notice Lead Period
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    required
                    value={rules.minNoticeHours}
                    onChange={(e) => setRules({ ...rules, minNoticeHours: e.target.value })}
                    disabled={isPending}
                    className="h-10 w-full rounded-xl border border-slate-200 pl-3 pr-12 font-mono text-xs font-bold focus:outline-none"
                  />
                  <span className="absolute right-3 top-3 select-none text-[10px] font-bold text-slate-400">
                    hours
                  </span>
                </div>
              </div>
            </div>

            {/* Timezone banner */}
            <div className="border-slate-150/60 flex select-none items-center space-x-2.5 rounded-xl border bg-slate-50 p-3 text-[10px] font-semibold text-slate-500">
              <Globe className="h-4.5 w-4.5 shrink-0 text-slate-400" />
              <span>
                All bookings are computed in Europe/London timezone. Time slots automatically adjust
                to daylight savings.
              </span>
            </div>

            <div className="border-slate-150 flex select-none justify-end border-t pt-2">
              <Button onClick={handleSaveRules} disabled={isPending}>
                Save Booking Limits
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Blocked Dates / Holiday Calendar (5 cols) */}
      <div className="space-y-6 lg:col-span-5">
        {/* Interactive professional calendar */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex select-none items-center justify-between border-b border-slate-100 p-4">
            <span className="text-xs font-extrabold text-slate-900">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            <div className="mb-2 grid select-none grid-cols-7 gap-1 text-center text-[9px] font-extrabold uppercase text-slate-400">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Offset days */}
              {Array.from({ length: calendarOffsetDays }).map((_, i) => (
                <div key={`offset-${i}`} className="h-9" />
              ))}

              {/* Month days */}
              {monthDays.map((day) => {
                const dayIndex = day.getDay(); // 0 = Sun
                const scheduleDay = schedule.find((s) => s.dayOfWeek === dayIndex);
                const isClosed = !scheduleDay || !scheduleDay.isOpen;

                const blocked = initialBlockedDates.find((b) => isSameDay(new Date(b.date), day));

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "relative flex h-9 flex-col items-center justify-center rounded-lg border text-[10px] font-bold",
                      blocked
                        ? "border-rose-250 bg-rose-50 text-rose-800"
                        : isClosed
                          ? "border-slate-100 bg-slate-50 text-slate-400"
                          : "border-emerald-100/60 bg-emerald-50/40 text-emerald-800 hover:bg-emerald-50/70"
                    )}
                    title={
                      blocked
                        ? `Blocked: ${blocked.reason}`
                        : isClosed
                          ? "Closed (Off-day)"
                          : "Available"
                    }
                  >
                    <span>{format(day, "d")}</span>
                    {blocked && (
                      <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Block Off Dates forms */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex select-none items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center space-x-2">
              <Ban className="h-4.5 w-4.5 text-blue-650" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Holiday Closures & Blocked Dates
              </h3>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {blockError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-600">
                {blockError}
              </p>
            )}
            {blockSuccess && (
              <p className="border-emerald-250 rounded-xl border bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800">
                Holiday blocked date added successfully.
              </p>
            )}

            <form onSubmit={handleAddBlockedDate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Select Close Date
                  </label>
                  <input
                    type="date"
                    required
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    disabled={isPending}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Holiday Reason
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Easter Holiday"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    disabled={isPending}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex select-none justify-end gap-2 pt-1">
                {/* Auto block UK bank holidays */}
                <button
                  type="button"
                  onClick={handleAutoBlockUKHolidays}
                  disabled={isPending}
                  className="text-slate-655 inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 px-3.5 text-xs font-bold hover:bg-slate-50"
                  title="Auto-blocks all 2026/2027 UK bank holidays"
                >
                  Block UK Bank Holidays
                </button>

                <Button type="submit" disabled={isPending}>
                  Block Date
                </Button>
              </div>
            </form>

            {/* List blocked dates */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <span className="block select-none text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Blocked Dates & Bank Holidays
              </span>

              <div className="max-h-[200px] space-y-2 overflow-y-auto pr-1">
                {initialBlockedDates.length === 0 ? (
                  <p className="select-none py-4 text-center text-xs font-medium italic text-slate-400">
                    No custom dates blocked.
                  </p>
                ) : (
                  initialBlockedDates.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-xl border bg-slate-50 p-3 text-xs font-bold text-slate-700"
                    >
                      <div>
                        <span>{format(new Date(b.date), "EEEE, MMMM d, yyyy")}</span>
                        <span className="text-rose-650 mt-0.5 block text-[10px]">
                          Reason: {b.reason || "Staff Off-duty"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveBlockedDate(b.id)}
                        disabled={isPending}
                        className="cursor-pointer rounded p-1 text-rose-600 hover:bg-slate-100"
                        title="Unblock date"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
