"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Search,
  Loader2,
  ArrowRight,
  MapPin,
  Clock,
  Trash2,
  Edit,
  Plus,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { getPatientAppointmentsAction } from "@/actions/patient-appointments";
import { AppointmentStatusBadge } from "@/components/patient/appointment-status-badge";
import { CancelModal } from "@/components/patient/cancel-modal";
import { RescheduleModal } from "@/components/patient/reschedule-modal";

type Appointment = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes?: string | null;
  pharmacy: { id: string; name: string; address: string; logoUrl?: string | null; slug: string };
  service: { id: string; name: string; duration: number; price: any; color?: string | null };
};

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  const loadAppointments = () => {
    setLoading(true);
    getPatientAppointmentsAction({ status: statusFilter, page }).then((res) => {
      if (res.success && res.data) {
        setAppointments(res.data as Appointment[]);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
        }
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter, page]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8 duration-300 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0b1c30]">My Appointments</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Manage and track your full schedule of clinical visits across UK partner pharmacies.
          </p>
        </div>
        <Link
          href="/patient/book"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#10B981] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#059669]"
        >
          <Plus className="h-4 w-4" /> Book Appointment
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="scrollbar-none flex gap-4 overflow-x-auto border-b border-slate-200 pb-1">
        {[
          { label: "All Bookings", value: "ALL" },
          { label: "Pending Approval", value: "PENDING" },
          { label: "Confirmed", value: "CONFIRMED" },
          { label: "Reschedule Requests", value: "RESCHEDULE_REQUESTED" },
          { label: "Completed History", value: "COMPLETED" },
          { label: "Cancelled", value: "CANCELLED" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setStatusFilter(t.value);
              setPage(1);
            }}
            className={`cursor-pointer whitespace-nowrap border-b-2 pb-2.5 text-xs font-bold transition-all ${
              statusFilter === t.value
                ? "border-[#10B981] text-[#10B981]"
                : "border-transparent text-slate-500 hover:text-[#0b1c30]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content list */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
          <span className="text-xs font-bold">Loading appointments...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
            <Calendar className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#0b1c30]">No Appointments Found</h3>
            <p className="text-xs font-medium leading-relaxed text-slate-500">
              No bookings match your selected filter criteria.
            </p>
          </div>
          <Link
            href="/patient/book"
            className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all"
          >
            <span>Book New Service</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="flex flex-col justify-between gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md md:flex-row md:items-center"
            >
              <div className="min-w-0 flex-grow space-y-3">
                <div className="flex items-center gap-3">
                  <AppointmentStatusBadge status={app.status} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Ref #{app.id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#0b1c30]">{app.service.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-[#10B981]" />
                    <span className="truncate">
                      {app.pharmacy.name} • {app.pharmacy.address}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1">
                    <Calendar className="h-3.5 w-3.5 text-[#10B981]" /> {formatDate(app.startTime)}
                  </span>
                  <span className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1">
                    <Clock className="h-3.5 w-3.5 text-[#10B981]" /> {formatTime(app.startTime)} (
                    {app.service.duration}m)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-4 md:border-t-0 md:pt-0">
                {["PENDING", "CONFIRMED"].includes(app.status) && (
                  <>
                    <button
                      onClick={() => setRescheduleTarget(app)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                    >
                      <Edit className="h-3.5 w-3.5 text-purple-600" />
                      <span>Reschedule</span>
                    </button>
                    <button
                      onClick={() => setCancelTarget(app)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}

                <Link
                  href={`/patient/appointments/${app.id}`}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0b1c30] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800"
                >
                  <span>Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {cancelTarget && (
        <CancelModal
          appointmentId={cancelTarget.id}
          serviceName={cancelTarget.service.name}
          providerName={cancelTarget.pharmacy.name}
          onClose={() => setCancelTarget(null)}
          onSuccess={() => {
            setCancelTarget(null);
            loadAppointments();
          }}
        />
      )}

      {rescheduleTarget && (
        <RescheduleModal
          appointmentId={rescheduleTarget.id}
          serviceName={rescheduleTarget.service.name}
          providerName={rescheduleTarget.pharmacy.name}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => {
            setRescheduleTarget(null);
            loadAppointments();
          }}
        />
      )}
    </div>
  );
}
