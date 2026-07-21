"use client";

import { useState, useTransition } from "react";
import { Calendar, Loader2, XCircle } from "lucide-react";
import { requestRescheduleAction } from "@/actions/patient-appointments";

interface RescheduleModalProps {
  appointmentId: string;
  serviceName: string;
  providerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleModal({
  appointmentId,
  serviceName,
  providerName,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [preferredDates, setPreferredDates] = useState<string[]>([""]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addDateField = () => {
    if (preferredDates.length < 3) setPreferredDates([...preferredDates, ""]);
  };

  const updateDate = (idx: number, val: string) => {
    const updated = [...preferredDates];
    updated[idx] = val;
    setPreferredDates(updated);
  };

  const removeDate = (idx: number) => {
    setPreferredDates(preferredDates.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    setError(null);
    const filledDates = preferredDates.filter((d) => d.trim() !== "");
    if (filledDates.length === 0) {
      setError("Please provide at least one preferred date.");
      return;
    }

    startTransition(async () => {
      const res = await requestRescheduleAction({
        appointmentId,
        preferredDates: filledDates,
        note: note.trim() || undefined,
      });
      if (!res.success) {
        setError(res.error || "Failed to submit reschedule request.");
      } else {
        onSuccess();
      }
    });
  };

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800">Request Reschedule</h2>
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
          <p className="text-xs font-medium leading-relaxed text-slate-600">
            Select up to 3 preferred dates. The provider will contact you to confirm a new time.
          </p>

          <div>
            <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              Preferred Dates
            </label>
            <div className="space-y-2">
              {preferredDates.map((date, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    min={minDate}
                    onChange={(e) => updateDate(idx, e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                  {preferredDates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDate(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {preferredDates.length < 3 && (
              <button
                type="button"
                onClick={addDateField}
                className="mt-2 text-[10px] font-bold text-emerald-600 hover:underline"
              >
                + Add another date
              </button>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              Additional Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any preferences or additional information..."
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

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
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isPending ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
