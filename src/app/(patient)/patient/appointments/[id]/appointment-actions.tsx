"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
import { CancelModal } from "@/components/patient/cancel-modal";
import { RescheduleModal } from "@/components/patient/reschedule-modal";

type Appointment = {
  id: string;
  status: string;
  service: { name: string };
  pharmacy: { name: string };
};

export function AppointmentActions({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  const isEditable = ["PENDING", "CONFIRMED"].includes(appointment.status);

  if (!isEditable) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-2 border-b border-slate-100 pb-3 text-xs font-black uppercase tracking-wider text-slate-800">
        Manage Booking
      </h2>

      <button
        onClick={() => setShowReschedule(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.99]"
      >
        <Edit className="h-4 w-4 text-slate-500" /> Request Reschedule
      </button>

      <button
        onClick={() => setShowCancel(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-[0.99]"
      >
        <Trash2 className="h-4 w-4 text-rose-500" /> Cancel Appointment
      </button>

      {showCancel && (
        <CancelModal
          appointmentId={appointment.id}
          serviceName={appointment.service.name}
          providerName={appointment.pharmacy.name}
          onClose={() => setShowCancel(false)}
          onSuccess={() => {
            setShowCancel(false);
            router.refresh();
          }}
        />
      )}

      {showReschedule && (
        <RescheduleModal
          appointmentId={appointment.id}
          serviceName={appointment.service.name}
          providerName={appointment.pharmacy.name}
          onClose={() => setShowReschedule(false)}
          onSuccess={() => {
            setShowReschedule(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
