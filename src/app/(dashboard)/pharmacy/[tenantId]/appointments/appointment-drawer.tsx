"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  AlertCircle,
  MapPin,
  Send,
  Lock,
} from "lucide-react";
import { rescheduleAppointmentAction } from "@/actions/appointments";

interface AppointmentDrawerProps {
  appointment: any;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED"
  ) => void;
}

export function AppointmentDrawer({
  appointment,
  onClose,
  onUpdateStatus,
}: AppointmentDrawerProps) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  const refCode = `NDC-${appointment.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
  const patientName =
    `${appointment.customer?.firstName || "Patient"} ${appointment.customer?.lastName || ""}`.trim();

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      setRescheduleError("Please select both a new date and start time.");
      return;
    }

    setIsSubmitting(true);
    setRescheduleError("");
    try {
      const durationMins = appointment.service?.duration || 15;
      const startObj = new Date(`${newDate}T${newTime}`);
      const endObj = new Date(startObj.getTime() + durationMins * 60 * 1000);

      const res = await rescheduleAppointmentAction(
        appointment.id,
        startObj.toISOString(),
        endObj.toISOString()
      );

      if (res.success) {
        window.location.reload();
      } else {
        setRescheduleError(res.error || "Failed to reschedule appointment.");
      }
    } catch (err: any) {
      setRescheduleError(err.message || "Failed to reschedule appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 overflow-hidden bg-slate-900/40 duration-200 animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex w-screen max-w-md select-text flex-col justify-between border-l border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-zinc-800">
            <div>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {refCode}
              </span>
              <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                Appointment Workspace
              </h2>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* Status Badge & Primary Action Bar */}
            <div className="dark:bg-zinc-850 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Status
                </span>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider ${
                    appointment.status === "CONFIRMED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : appointment.status === "PENDING"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : appointment.status === "COMPLETED"
                          ? "bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}
                >
                  {appointment.status}
                </span>
              </div>

              {/* Status Actions */}
              <div className="flex items-center space-x-2">
                {appointment.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(appointment.id, "CONFIRMED")}
                      className="shadow-xs rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onUpdateStatus(appointment.id, "REJECTED")}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 transition-all hover:bg-rose-50 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      Decline
                    </button>
                  </>
                )}

                {appointment.status === "CONFIRMED" &&
                  (() => {
                    const canComplete = new Date() >= new Date(appointment.startTime);
                    return (
                      <button
                        onClick={() => {
                          if (canComplete) onUpdateStatus(appointment.id, "COMPLETED");
                        }}
                        disabled={!canComplete}
                        title={
                          canComplete
                            ? "Mark appointment completed"
                            : `Available after appointment start time (${format(new Date(appointment.startTime), "d MMM, HH:mm")})`
                        }
                        className={`shadow-xs flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          canComplete
                            ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
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
                            ? "Mark Complete"
                            : `Starts ${format(new Date(appointment.startTime), "HH:mm")}`}
                        </span>
                      </button>
                    );
                  })()}
              </div>
            </div>

            {/* Patient Details Card */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Patient Contact Information
              </h3>
              <div className="space-y-2.5 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">
                    <User className="h-4 w-4 text-[#10B981]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {patientName}
                    </h4>
                    <span className="text-[11px] text-slate-400">Registered Patient</span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-300">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <a
                      href={`tel:${appointment.customer?.phone}`}
                      className="font-medium hover:underline"
                    >
                      {appointment.customer?.phone || "No phone provided"}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <a
                      href={`mailto:${appointment.customer?.email}`}
                      className="font-medium hover:underline"
                    >
                      {appointment.customer?.email || "No email provided"}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment & Time Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Treatment & Service Details
              </h3>
              <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {appointment.service?.name}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      Duration: {appointment.service?.duration} mins
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-[#10B981]">
                    £{Number(appointment.service?.price || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-semibold dark:border-zinc-800">
                  <span className="text-slate-500">Scheduled Date & Time</span>
                  <span className="text-slate-900 dark:text-white">
                    {format(new Date(appointment.startTime), "EEE, d MMM yyyy 'at' HH:mm")}
                  </span>
                </div>
              </div>
            </div>

            {/* Reschedule Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Reschedule Appointment
                </h3>
                <button
                  onClick={() => setIsRescheduling(!isRescheduling)}
                  className="text-xs font-bold text-[#10B981] hover:underline"
                >
                  {isRescheduling ? "Cancel Reschedule" : "Change Date/Time"}
                </button>
              </div>

              {isRescheduling && (
                <form
                  onSubmit={handleRescheduleSubmit}
                  className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Select New Date
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-900"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Select New Start Time
                    </label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-900"
                      required
                    />
                  </div>

                  {rescheduleError && (
                    <p className="text-xs font-bold text-rose-600">{rescheduleError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-[#10B981] py-2 text-xs font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {isSubmitting ? "Updating..." : "Save Rescheduled Time & Notify Patient"}
                  </button>
                </form>
              )}
            </div>

            {/* Notes Section */}
            {appointment.notes && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Patient Booking Notes
                </h3>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  &ldquo;{appointment.notes}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <span className="text-[11px] font-medium text-slate-400">
              Created: {format(new Date(appointment.createdAt), "d MMM yyyy, HH:mm")}
            </span>

            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
