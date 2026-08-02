"use client";

import React, { useState, useEffect, useTransition } from "react";
import { format, addDays, isSameDay } from "date-fns";
import {
  X,
  UserCheck,
  Search,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  ShieldCheck,
  Send,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { searchPatientsQuickAction } from "@/actions/patient-search";
import { createWalkInBookingAction } from "@/actions/walk-in-booking";
import { getAvailableSlotsAction } from "@/actions/booking";

interface QuickWalkInDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacyId: string;
  services: any[];
  preselectedDate?: Date;
  preselectedTime?: string;
  onSuccess?: () => void;
}

function safeFormatDate(dateVal: any, formatStr: string, fallback: string = ""): string {
  try {
    if (!dateVal) return fallback;
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return format(d, formatStr);
  } catch {
    return fallback;
  }
}

export function QuickWalkInDrawer({
  isOpen,
  onClose,
  pharmacyId,
  services,
  preselectedDate,
  preselectedTime,
  onSuccess,
}: QuickWalkInDrawerProps) {
  const [bookingSource, setBookingSource] = useState<"WALK_IN" | "PHONE" | "ADMIN">("WALK_IN");

  // Selection states
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(
    preselectedDate && !isNaN(new Date(preselectedDate).getTime()) ? preselectedDate : new Date()
  );
  const [selectedTime, setSelectedTime] = useState<string>(preselectedTime || "");

  // Available slots state
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Patient inputs
  const [phone, setPhone] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Notifications toggles
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(true);

  // Patient auto-lookup state
  const [existingPatients, setExistingPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // UI state
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [serviceSearch, setServiceSearch] = useState<string>("");

  // Pre-select first active service
  useEffect(() => {
    if (services && services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Sync preselectedDate state when preselectedDate prop changes or drawer opens
  useEffect(() => {
    if (preselectedDate && !isNaN(new Date(preselectedDate).getTime())) {
      setSelectedDate(preselectedDate);
    }
  }, [preselectedDate, isOpen]);

  // Fetch available slots when service or date changes
  useEffect(() => {
    if (!selectedServiceId || !pharmacyId) return;

    const validDate =
      selectedDate && !isNaN(new Date(selectedDate).getTime()) ? selectedDate : new Date();
    const dateStr = safeFormatDate(validDate, "yyyy-MM-dd", format(new Date(), "yyyy-MM-dd"));
    let isCancelled = false;
    setLoadingSlots(true);

    getAvailableSlotsAction(pharmacyId, selectedServiceId, dateStr, "Europe/London")
      .then((res) => {
        if (isCancelled) return;
        if (res.success && Array.isArray(res.slots)) {
          const mapped = res.slots.map((s: any) => {
            let dateObj = s.startTime ? new Date(s.startTime) : new Date();
            if (isNaN(dateObj.getTime())) dateObj = new Date();

            const timeStr = s.formattedTime || s.time || safeFormatDate(dateObj, "HH:mm", "09:00");
            const formattedLabel = safeFormatDate(dateObj, "hh:mm a", timeStr);
            return {
              time: timeStr,
              label: formattedLabel,
              isAvailable: s.isAvailable !== false,
            };
          });
          setAvailableSlots(mapped);

          const firstAvail = mapped.find((m: any) => m.isAvailable);
          if (
            firstAvail &&
            (!selectedTime || !mapped.some((m: any) => m.time === selectedTime && m.isAvailable))
          ) {
            setSelectedTime(firstAvail.time);
          }
        } else {
          setAvailableSlots([]);
        }
      })
      .catch(() => {
        if (!isCancelled) setAvailableSlots([]);
      })
      .finally(() => {
        if (!isCancelled) setLoadingSlots(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [pharmacyId, selectedServiceId, selectedDate]);

  // Auto-search patients on phone/name typing
  useEffect(() => {
    const query = phone.length >= 3 ? phone : `${firstName} ${lastName}`.trim();
    if (query.length < 3) {
      setExistingPatients([]);
      return;
    }

    const timer = setTimeout(() => {
      searchPatientsQuickAction(query, pharmacyId).then((res) => {
        if (res.success && res.patients.length > 0) {
          setExistingPatients(res.patients);
        } else {
          setExistingPatients([]);
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [phone, firstName, lastName, pharmacyId]);

  if (!isOpen) return null;

  const filteredServices = services.filter(
    (s) =>
      s.isActive &&
      (serviceSearch === "" || s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
  );

  const selectExistingPatient = (patient: any) => {
    setFirstName(patient.firstName || "");
    setLastName(patient.lastName || "");
    setPhone(patient.phone || "");
    setEmail(patient.email || "");
    if (patient.dateOfBirth) {
      const parsed = safeFormatDate(patient.dateOfBirth, "yyyy-MM-dd");
      if (parsed) setDob(parsed);
    }
    setSelectedPatientId(patient.id);
    setExistingPatients([]);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedServiceId) {
      setErrorMsg("Please select a clinical service.");
      return;
    }
    if (!selectedTime) {
      setErrorMsg("Please select an available time slot.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Patient first name and last name are required.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Patient mobile number is required.");
      return;
    }

    const validSelectedDate =
      selectedDate && !isNaN(new Date(selectedDate).getTime()) ? selectedDate : new Date();

    startTransition(async () => {
      const res = await createWalkInBookingAction({
        pharmacyId,
        serviceId: selectedServiceId,
        dateStr: safeFormatDate(validSelectedDate, "yyyy-MM-dd", format(new Date(), "yyyy-MM-dd")),
        timeStr: selectedTime,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        dob: dob || undefined,
        notes: notes.trim() || undefined,
        bookingSource,
        sendSmsNotification: sendSms,
        sendEmailNotification: sendEmail,
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to create walk-in appointment.");
      }
    });
  };

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex justify-end bg-slate-900/60 transition-opacity duration-200 animate-in fade-in">
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-zinc-950 dark:text-zinc-100 sm:rounded-l-3xl">
        {/* Header */}
        <div className="dark:border-zinc-850 flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="shadow-xs flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981] text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Quick Counter Booking
              </h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                Reserve slot & book patient in &lt; 30 seconds
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmitBooking}
          className="flex flex-1 flex-col space-y-6 overflow-y-auto p-6"
        >
          {errorMsg && (
            <div className="flex items-center space-x-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Booking Source Tabs */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Booking Source
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {(["WALK_IN", "PHONE", "ADMIN"] as const).map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setBookingSource(src)}
                  className={`rounded-xl py-2 text-xs font-extrabold transition-all ${
                    bookingSource === src
                      ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {src === "WALK_IN" ? "🚶 Walk-in" : src === "PHONE" ? "📞 Phone" : "⚙️ Admin"}
                </button>
              ))}
            </div>
          </div>

          {/* Step 1: Select Service */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              1. Select Clinical Service
            </label>

            {services.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter service..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            )}

            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {filteredServices.map((s) => {
                const isSel = selectedServiceId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                      isSel
                        ? "shadow-xs border-[#10B981] bg-emerald-50/70 dark:border-[#10B981] dark:bg-emerald-950/40"
                        : "border-slate-200/90 bg-white hover:border-[#10B981]/50 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                        {s.name}
                      </h4>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                        {s.duration} mins • £{Number(s.price || 0).toFixed(2)}
                      </p>
                    </div>
                    {isSel && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Date & Available Time Slot */}
          <div className="dark:border-zinc-850 space-y-3 border-t border-slate-200/80 pt-4">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              2. Select Date & Slot
            </label>

            {/* Date Strip */}
            <div className="scrollbar-none flex items-center space-x-2 overflow-x-auto pb-1">
              {Array.from({ length: 7 }).map((_, idx) => {
                const d = addDays(new Date(), idx);
                const isSel = isSameDay(selectedDate, d);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`flex min-w-[72px] flex-col items-center justify-center rounded-xl px-3 py-2 transition-all ${
                      isSel
                        ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "border border-slate-200/80 bg-white text-slate-700 hover:border-[#10B981] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    }`}
                  >
                    <span className="text-[11px] font-extrabold">
                      {idx === 0
                        ? "Today"
                        : idx === 1
                          ? "Tomorrow"
                          : safeFormatDate(d, "EEE", "Day")}
                    </span>
                    <span className="text-[9px] font-medium opacity-80">
                      {safeFormatDate(d, "d MMM", "")}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Slot Grid */}
            {loadingSlots ? (
              <div className="flex items-center justify-center space-x-2 py-4 text-xs font-medium text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#10B981]" />
                <span>Checking available slots...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs font-bold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                No open slots available on {safeFormatDate(selectedDate, "EEE, d MMM", "this date")}
                .
              </div>
            ) : (
              <div className="grid max-h-36 grid-cols-3 gap-2 overflow-y-auto pr-1">
                {availableSlots.map((slot) => {
                  const isSel = selectedTime === slot.time && slot.isAvailable;
                  const isDis = !slot.isAvailable;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={isDis}
                      onClick={() => !isDis && setSelectedTime(slot.time)}
                      className={`rounded-xl px-2 py-2.5 text-center text-xs font-extrabold transition-all ${
                        isDis
                          ? "cursor-not-allowed border border-slate-200/60 bg-slate-100 text-slate-400 line-through dark:border-zinc-800 dark:bg-zinc-900/40"
                          : isSel
                            ? "shadow-xs border-2 border-[#10B981] bg-emerald-50/80 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100"
                            : "border border-slate-200/90 bg-white text-slate-800 hover:border-[#10B981]/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Patient Information & Auto-Lookup */}
          <div className="dark:border-zinc-850 space-y-3 border-t border-slate-200/80 pt-4">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              3. Patient Details
            </label>

            {/* Existing Patient Match Banner */}
            {existingPatients.length > 0 && !selectedPatientId && (
              <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                <div className="flex items-center space-x-1.5 text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                  <UserCheck className="h-4 w-4 text-[#10B981]" />
                  <span>Existing Patient Found ({existingPatients.length})</span>
                </div>
                <div className="space-y-1">
                  {existingPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectExistingPatient(p)}
                      className="shadow-2xs flex w-full items-center justify-between rounded-xl bg-white p-2 text-left text-xs font-bold text-slate-900 hover:bg-emerald-100/50 dark:bg-zinc-900 dark:text-white"
                    >
                      <span>
                        {p.firstName} {p.lastName} • {p.phone}
                      </span>
                      <span className="text-[10px] uppercase text-[#10B981]">Select</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  placeholder="e.g. +44 7700 900123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                Staff Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Walk-in notes, specific clinical request..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              />
            </div>
          </div>

          {/* Notifications Toggles */}
          <div className="dark:border-zinc-850 space-y-2 border-t border-slate-200/80 pt-4">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Dispatch Confirmation
            </label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#10B981] focus:ring-[#10B981]"
                />
                <span>Send SMS Confirmation</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#10B981] focus:ring-[#10B981]"
                />
                <span>Send Email</span>
              </label>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={
                isPending ||
                !selectedServiceId ||
                !selectedTime ||
                !firstName ||
                !lastName ||
                !phone
              }
              className="flex min-h-[52px] w-full items-center justify-center space-x-2 rounded-2xl bg-[#10B981] py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Confirm & Reserve Slot (&lt;30s)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
