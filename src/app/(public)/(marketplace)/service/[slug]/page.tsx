import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  HeartPulse,
  Clock,
  DollarSign,
  ShieldCheck,
  Building,
  MapPin,
  Phone,
  ArrowLeft,
  CalendarCheck,
  AlertCircle,
  Store,
  ExternalLink,
} from "lucide-react";
import { db } from "@/lib/db";

export const revalidate = 0; // Dynamic data

interface ServiceDetailsPageProps {
  params: {
    slug: string; // Resolves by Service ID
  };
}

// 1. Dynamic SEO Metadata Architecture
export async function generateMetadata({ params }: ServiceDetailsPageProps): Promise<Metadata> {
  const service = await db.service.findUnique({
    where: { id: params.slug },
    include: {
      pharmacy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!service) {
    return {
      title: "Clinical Service Details | NextDoorClinic",
    };
  }

  return {
    title: `${service.name} - ${service.pharmacy.name} | Compare & Book | NextDoorClinic`,
    description: `Compare prices and schedule slots for ${service.name} at ${service.pharmacy.name}. Upfront pricing: £${Number(service.price).toFixed(2)}. Duration: ${service.duration} mins.`,
  };
}

export default async function ServiceDetailsPage({ params }: ServiceDetailsPageProps) {
  // Fetch service details along with the offering pharmacy branch
  const service = await db.service.findUnique({
    where: { id: params.slug },
    include: {
      pharmacy: {
        include: {
          availability: {
            orderBy: { dayOfWeek: "asc" },
          },
        },
      },
    },
  });

  // Verify the service exists, is active, and is offered by an approved pharmacy
  if (!service || !service.isActive || service.pharmacy.status !== "APPROVED") {
    notFound();
  }

  // Days map helper to convert index 0-6 to names
  const dayIndexToName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Sort availability to display Monday to Sunday
  const sortedAvailability = [...service.pharmacy.availability].sort((a, b) => {
    const valA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const valB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return valA - valB;
  });

  return (
    <div className="mx-auto w-full max-w-7xl select-text space-y-8 px-6 py-10">
      {/* Back button */}
      <div>
        <Link
          href="/services"
          className="inline-flex items-center text-xs font-bold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          <span>Back to Services Listing</span>
        </Link>
      </div>

      {/* Main Grid: Details card & Provider profile */}
      <div className="grid items-start gap-8 lg:grid-cols-3">
        {/* Left Column (2/3): Service Details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="relative space-y-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
            {/* Top brand header strip */}
            <div
              style={{ backgroundColor: service.pharmacy.brandColor || "#1D9E75" }}
              className="absolute left-0 top-0 h-2 w-full"
            />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="rounded border border-blue-100/50 bg-blue-50 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-blue-700 dark:bg-zinc-900">
                  Clinical Service
                </span>
              </div>
              <h2 className="text-xl font-extrabold leading-none text-slate-900 md:text-2xl">
                {service.name}
              </h2>
              <p className="pt-2 text-xs font-normal leading-relaxed text-slate-500">
                {service.description ||
                  "No specific preparation details or requirements provided for this service."}
              </p>
            </div>

            {/* Quick specifications grid */}
            <div className="grid select-none grid-cols-2 gap-4 border-t border-slate-100 pt-6">
              <div className="flex items-center space-x-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                <Clock className="h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <span className="mb-1 block text-[9px] font-bold leading-none text-slate-400">
                    Duration
                  </span>
                  <span className="text-xs font-bold text-slate-950">
                    {service.duration} minutes
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                <DollarSign className="h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <span className="mb-1 block text-[9px] font-bold leading-none text-slate-400">
                    Upfront Price
                  </span>
                  <span className="text-xs font-bold text-slate-950">
                    £{Number(service.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Booking Flow CTA banner */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
              <div className="flex items-center space-x-2 text-xs font-normal text-slate-500">
                <ShieldCheck className="h-4.5 w-4.5 shrink-0 animate-pulse text-emerald-500" />
                <span>Verified CQC Partner Clinic Booking</span>
              </div>
              <Link
                href={`/book/${service.pharmacy.slug}?serviceId=${service.id}`}
                className="inline-flex h-11 w-full select-none items-center justify-center rounded-xl bg-blue-600 px-6 text-center text-xs font-extrabold text-white shadow-sm transition-all hover:scale-[1.01] hover:bg-blue-700 active:scale-[0.98] sm:w-auto"
              >
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Guidelines / Preparation details panel */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <h4 className="text-slate-455 border-b border-slate-100 pb-2 text-[10px] font-extrabold uppercase tracking-widest">
              Before Your Appointment Visit
            </h4>
            <div className="space-y-3.5 text-xs font-normal leading-relaxed text-slate-500">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                <p>
                  Please arrive 5-10 minutes prior to your selected slot time to complete any
                  checkin paperwork at the pharmacy counter.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                <p>
                  Bring a valid photo ID and any lists of current medications if requested by the
                  clinical pharmacist.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                <p>
                  Self-service cancellations and reschedules can be performed up to 24 hours prior
                  to the slot using the link dispatched to your email/SMS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Offering Pharmacy details */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Pharmacy Profile Card */}
          <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h4 className="border-b border-slate-100 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Offered by Pharmacy Partner
            </h4>

            <div className="flex items-start space-x-3">
              <div
                style={{ backgroundColor: service.pharmacy.brandColor || "#1D9E75" }}
                className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl text-base font-bold text-white shadow-sm"
              >
                {service.pharmacy.name[0].toUpperCase()}
              </div>
              <div>
                <h5 className="text-sm font-bold leading-tight text-slate-900">
                  {service.pharmacy.name}
                </h5>
                <p className="mt-1.5 flex items-start space-x-1 text-[10px] font-normal text-slate-500">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                  <span className="line-clamp-2">{service.pharmacy.address}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <Link
                href={`/provider/${service.pharmacy.slug}`}
                className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
              >
                <Store className="mr-1.5 h-3.5 w-3.5" />
                <span>View Full Pharmacy Profile</span>
              </Link>
            </div>
          </div>

          {/* Opening Schedule preview */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h4 className="border-b border-slate-100 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Branch Hours
            </h4>

            {sortedAvailability.length === 0 ? (
              <p className="text-slate-450 text-xs font-normal leading-relaxed">
                Opening hours schedule not provided.
              </p>
            ) : (
              <div className="text-slate-655 space-y-2 text-xs font-semibold">
                {sortedAvailability.map((avail) => (
                  <div
                    key={avail.id}
                    className="flex items-center justify-between border-b border-slate-50 py-1 last:border-b-0"
                  >
                    <span>{dayIndexToName[avail.dayOfWeek]}</span>
                    <span className="font-mono text-[10px] font-bold text-slate-950">
                      {avail.openTime} - {avail.closeTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
