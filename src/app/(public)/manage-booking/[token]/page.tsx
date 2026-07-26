"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { getBookingByManageTokenAction, cancelAppointmentByTokenAction } from "@/actions/booking";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Navigation,
  ShieldCheck,
  Building2,
  User,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

interface BookingDetails {
  id: string;
  referenceCode: string;
  status: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  pharmacy: {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    googleMapsUrl?: string | null;
  };
  service: {
    id: string;
    name: string;
    description?: string | null;
    duration: number;
    price: number;
  };
  patient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function ManageBookingPage() {
  const params = useParams();
  const token = (params?.token as string) || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBooking() {
      if (!token) {
        setError("Invalid booking link.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await getBookingByManageTokenAction(token);
      if (!res.success || !res.data) {
        setError(res.error || "Failed to load booking details.");
      } else {
        setBooking(res.data);
      }
      setLoading(false);
    }

    loadBooking();
  }, [token]);

  const handleCancel = () => {
    setCancelError(null);
    startCancelTransition(async () => {
      const res = await cancelAppointmentByTokenAction(token, cancelReason);
      if (res.success) {
        setCancelSuccess(true);
        setShowCancelModal(false);
        setBooking((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
      } else {
        setCancelError(res.error || "Failed to cancel appointment.");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-400">Loading your booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800/80 p-8 text-center shadow-xl backdrop-blur-md">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-400" />
          <h1 className="mb-2 text-xl font-bold">Booking Link Invalid</h1>
          <p className="mb-6 text-sm text-slate-400">
            {error || "We couldn't find an appointment associated with this link."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to NextDoorClinic
          </Link>
        </div>
      </div>
    );
  }

  const startDate = parseISO(booking.startTime);
  const endDate = parseISO(booking.endTime);
  const isCancelled = booking.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 font-sans text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Guest Access
              </div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Manage Appointment</h1>
              <p className="mt-1 text-sm text-slate-400">
                Reference:{" "}
                <span className="font-mono font-bold text-emerald-400">
                  {booking.referenceCode}
                </span>
              </p>
            </div>

            <div className="self-start sm:self-auto">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                  isCancelled
                    ? "border border-rose-500/30 bg-rose-500/10 text-rose-400"
                    : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {isCancelled ? (
                  <>
                    <XCircle className="h-4 w-4" /> Cancelled
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Confirmed
                  </>
                )}
              </span>
            </div>
          </div>

          {cancelSuccess && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-900/40 p-4 text-sm text-emerald-300">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
              <span>Your appointment has been successfully cancelled.</span>
            </div>
          )}

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Service & Time */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Service & Schedule
              </h2>

              <div className="space-y-3 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{booking.service.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Duration: {booking.service.duration} mins • £
                      {booking.service.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-700/50 pt-3 text-sm">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium">{format(startDate, "EEEE, d MMMM yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span>
                      {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Clinic Info */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Clinic Location
              </h2>

              <div className="space-y-3 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{booking.pharmacy.name}</h3>
                    <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-400">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                      <span>{booking.pharmacy.address}</span>
                    </div>
                  </div>
                </div>

                {booking.pharmacy.phone && (
                  <div className="flex items-center gap-2 border-t border-slate-700/50 pt-3 text-xs text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{booking.pharmacy.phone}</span>
                  </div>
                )}

                {booking.pharmacy.googleMapsUrl && (
                  <a
                    href={booking.pharmacy.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700/60 px-3 py-2 text-xs font-medium text-emerald-400 transition hover:bg-slate-700"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Get Directions on Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="mt-6 border-t border-slate-800 pt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Patient Contact
            </h2>
            <div className="flex flex-wrap gap-6 rounded-2xl border border-slate-800 bg-slate-800/30 p-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                <span>
                  {booking.patient.firstName} {booking.patient.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                <span>{booking.patient.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>{booking.patient.phone}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Home
            </Link>

            {!isCancelled && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-400 transition hover:bg-rose-500/20 sm:w-auto"
              >
                Cancel Appointment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cancel Appointment</h3>
                <p className="text-xs text-slate-400">
                  Are you sure you want to cancel this booking?
                </p>
              </div>
            </div>

            {cancelError && (
              <p className="rounded-xl border border-rose-800 bg-rose-950/50 p-3 text-xs text-rose-400">
                {cancelError}
              </p>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="e.g. Schedule conflict, feeling better, wrong time..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-rose-500"
              >
                {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
