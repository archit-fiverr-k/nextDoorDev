"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CalendarDays,
  ArrowRight,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { AppointmentStatusBadge } from "@/components/patient/appointment-status-badge";

interface NextAppointmentCardProps {
  nextApp: {
    id: string;
    startTime: Date;
    status: string;
    service: {
      name: string;
      duration: number;
    };
    pharmacy: {
      name: string;
      address: string;
    };
  } | null;
}

export function NextAppointmentCard({ nextApp }: NextAppointmentCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "long",
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

  const handleAddToCalendar = () => {
    if (!nextApp) return;
    const title = `Appointment: ${nextApp.service.name} at ${nextApp.pharmacy.name}`;
    const location = nextApp.pharmacy.address;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&location=${encodeURIComponent(location)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981]">
            <Calendar className="h-4 w-4" />
          </div>
          <h2 className="text-base font-extrabold text-[#0F172A]">Next Scheduled Appointment</h2>
        </div>

        {nextApp ? (
          <AppointmentStatusBadge status={nextApp.status} />
        ) : (
          <span className="text-xs font-bold text-slate-400">No Slots Scheduled</span>
        )}
      </div>

      {nextApp ? (
        <div className="space-y-6">
          {/* Service & Clinic Header */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-gradient-to-r from-slate-50 to-[#10B981]/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                Clinical Treatment
              </span>
              <h3 className="text-lg font-black text-[#0F172A]">{nextApp.service.name}</h3>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{nextApp.pharmacy.name}</span>
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <span className="block text-xs font-extrabold text-slate-500">Duration</span>
              <span className="text-sm font-black text-[#0F172A]">
                {nextApp.service.duration} mins
              </span>
            </div>
          </div>

          {/* Date & Location Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Clock className="h-3 w-3 text-[#10B981]" /> Date & Time
              </span>
              <p className="text-xs font-bold text-slate-900">{formatDate(nextApp.startTime)}</p>
              <p className="text-xs font-semibold text-[#10B981]">
                {formatTime(nextApp.startTime)}
              </p>
            </div>

            <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <MapPin className="h-3 w-3 text-[#10B981]" /> Clinic Location
              </span>
              <p className="truncate text-xs font-bold text-slate-900">{nextApp.pharmacy.name}</p>
              <p className="truncate text-[11px] font-medium text-slate-500">
                {nextApp.pharmacy.address}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/patient/appointments/${nextApp.id}`}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[#059669]"
            >
              <span>View Full Appointment</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={handleAddToCalendar}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
            >
              <CalendarDays className="h-4 w-4 text-[#10B981]" />
              <span>Add to Calendar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
            <Stethoscope className="h-8 w-8" />
          </div>
          <div className="mx-auto max-w-sm space-y-1">
            <h3 className="text-sm font-bold text-[#0F172A]">No Upcoming Appointments</h3>
            <p className="text-xs font-medium text-slate-500">
              Schedule your next health consultation or vaccination with one of our verified UK
              partner clinics.
            </p>
          </div>
          <Link
            href="/patient/book"
            className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#059669]"
          >
            <span>Book Service Now</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
