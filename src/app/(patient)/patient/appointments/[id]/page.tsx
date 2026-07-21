import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  Phone,
  Mail,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { getPatientAppointmentDetailAction } from "@/actions/patient-appointments";
import { AppointmentStatusBadge } from "@/components/patient/appointment-status-badge";
import { AppointmentActions } from "./appointment-actions";

interface Props {
  params: { id: string };
}

export default async function PatientAppointmentDetailPage({ params }: Props) {
  const res = await getPatientAppointmentDetailAction(params.id);

  if (!res.success || !res.data) {
    notFound();
  }

  const { appointment, auditLogs } = res.data;

  // Format helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const bookingRef = `NDC-${appointment.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Navigation / Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/patient/appointments"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-800">
              Appointment Details
              <AppointmentStatusBadge status={appointment.status} />
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">Reference: {bookingRef}</p>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.6fr_1fr]">
        {/* Left Side: Summary, Provider, Details */}
        <div className="space-y-6">
          {/* Card: Details block */}
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: appointment.service.color || "#1D9E75" }}
              />
              <h2 className="text-sm font-black text-slate-700">{appointment.service.name}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Date
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-700">
                    {formatDate(appointment.startTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Time & Duration
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-700">
                    {formatTime(appointment.startTime)} ({appointment.service.duration} minutes)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Total Price
                  </p>
                  <p className="mt-0.5 text-xs font-black text-slate-800">
                    £{Number(appointment.service.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {appointment.notes && (
              <div className="mt-2 border-t border-slate-100 pt-3.5">
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <FileText className="h-3.5 w-3.5" /> Notes / Instructions
                </p>
                <div className="rounded-xl bg-slate-50 p-3 text-xs font-medium leading-relaxed text-slate-600">
                  {appointment.notes}
                </div>
              </div>
            )}
          </div>

          {/* Card: Provider Details */}
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="border-b border-slate-100 pb-3 text-xs font-black uppercase tracking-wider text-slate-800">
              Clinic Information
            </h2>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-black text-emerald-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black leading-tight text-slate-800">
                  {appointment.pharmacy.name}
                </h3>
                <div className="mt-2 flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-xs font-semibold leading-normal text-slate-600">
                    {appointment.pharmacy.address}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-50 pt-4 sm:flex-row">
                  <a
                    href={`tel:${appointment.pharmacy.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 transition-colors hover:text-emerald-600"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call Clinic
                  </a>
                  <a
                    href={`mailto:${appointment.pharmacy.email}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 transition-colors hover:text-emerald-600"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email Clinic
                  </a>
                  {appointment.pharmacy.googleMapsUrl && (
                    <a
                      href={appointment.pharmacy.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                    >
                      Get Directions <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Timeline & Actions */}
        <div className="space-y-6">
          {/* Action buttons client wrapper */}
          <AppointmentActions appointment={appointment} />

          {/* Timeline Tracking */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 border-b border-slate-100 pb-3 text-xs font-black uppercase tracking-wider text-slate-800">
              Status History
            </h2>
            {auditLogs.length > 0 ? (
              <div className="relative ml-2 space-y-5 border-l-2 border-slate-100 py-1 pl-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-6 top-1.5 h-2 w-2 rounded-full bg-slate-300 ring-4 ring-white" />
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      {new Date(log.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slate-700">
                      {log.action === "CREATE" ? "Appointment Created" : "Status Changed"}
                    </p>
                    {log.changes && (log.changes as any).status && (
                      <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                        Changed to{" "}
                        <span className="text-slate-655 font-bold uppercase">
                          {(log.changes as any).status.to || (log.changes as any).status}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400">
                No tracking timeline available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
