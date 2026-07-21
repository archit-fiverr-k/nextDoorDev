"use client";

import { useState, useTransition } from "react";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";
import { cancelPatientAppointmentAction } from "@/actions/patient-appointments";

interface CancelModalProps {
  appointmentId: string;
  serviceName: string;
  providerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  "Change of plans",
  "Found another provider",
  "Feeling better — no longer needed",
  "Personal / family emergency",
  "Financial reasons",
  "Appointment time no longer suitable",
  "Other",
];

export function CancelModal({
  appointmentId,
  serviceName,
  providerName,
  onClose,
  onSuccess,
}: CancelModalProps) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const finalReason = reason === "Other" ? customReason : reason;

  const handleCancel = () => {
    setError(null);
    if (!finalReason.trim()) {
      setError("Please select or enter a cancellation reason.");
      return;
    }

    startTransition(async () => {
      const res = await cancelPatientAppointmentAction({ appointmentId, reason: finalReason });
      if (!res.success) {
        setError(res.error || "Failed to cancel appointment.");
      } else {
        onSuccess();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800">Cancel Appointment</h2>
              <p className="text-[10px] text-slate-500">
                {serviceName} · {providerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 transition-colors hover:bg-slate-200"
          >
            <XCircle className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[11px] font-semibold leading-relaxed text-amber-700">
              This action cannot be undone. The provider will be notified of your cancellation.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              Reason for Cancellation
            </label>
            <div className="space-y-1.5">
              {CANCEL_REASONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === "Other" && (
            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                Please describe
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 p-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Keep Appointment
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isPending ? "Cancelling..." : "Cancel Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}
