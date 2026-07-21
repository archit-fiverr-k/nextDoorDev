import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MapPin,
  Phone,
  Clock,
  HeartPulse,
  ShieldCheck,
  Building,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { db } from "@/lib/db";

export const revalidate = 0; // Dynamic data

interface ProviderPageProps {
  params: {
    slug: string;
  };
}

// 1. Dynamic SEO Metadata Architecture
export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const pharmacy = await db.pharmacy.findUnique({
    where: { slug: params.slug },
  });

  if (!pharmacy) {
    return {
      title: "Clinic Profile Not Found | NextDoorClinic",
    };
  }

  return {
    title: `${pharmacy.name} | Book Clinic Appointments | NextDoorClinic`,
    description: `Schedule clinical services and vaccinations online at ${pharmacy.name} in ${pharmacy.address}. Verified UK health provider.`,
  };
}

export default async function ProviderDetailsPage({ params }: ProviderPageProps) {
  // Fetch pharmacy details with active services and weekly availability schedule
  const pharmacy = await db.pharmacy.findUnique({
    where: { slug: params.slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      availability: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!pharmacy || pharmacy.status !== "APPROVED") {
    notFound();
  }

  // Days map helper to convert index 0 (Sunday)-6 (Saturday) to readable names
  const dayIndexToName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Sort availability to display UK standard order: Monday to Sunday (1, 2, 3, 4, 5, 6, 0)
  const sortedAvailability = [...pharmacy.availability].sort((a, b) => {
    const valA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const valB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return valA - valB;
  });

  // Helper to determine virtual provider type label
  const nameLower = pharmacy.name.toLowerCase();
  const providerType =
    nameLower.includes("clinic") || nameLower.includes("wellness") || nameLower.includes("centre")
      ? "Clinical Center"
      : nameLower.includes("group") || nameLower.includes("care")
        ? "Pharmacy Group"
        : "Independent Pharmacy";

  return (
    <div className="mx-auto w-full max-w-7xl select-text space-y-8 px-6 py-10">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          href="/providers"
          className="inline-flex items-center text-xs font-bold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          <span>Back to Provider Directory</span>
        </Link>
      </div>

      {/* Branded Cover Header */}
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:flex-row md:items-center md:p-8">
        {/* Soft corner brand banner */}
        <div
          style={{ backgroundColor: pharmacy.brandColor || "#1D9E75" }}
          className="absolute left-0 top-0 h-2 w-full"
        />

        <div className="flex items-center space-x-4">
          <div
            style={{ backgroundColor: pharmacy.brandColor || "#1D9E75" }}
            className="flex h-14 w-14 shrink-0 select-none items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md"
          >
            {pharmacy.name[0].toUpperCase()}
          </div>
          <div>
            <span className="block w-fit rounded border border-blue-100/50 bg-blue-50 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-blue-700 dark:bg-zinc-900">
              {providerType}
            </span>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900 md:text-2xl">
              {pharmacy.name}
            </h2>
            <p className="mt-1 flex items-center space-x-1.5 text-xs font-normal text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{pharmacy.address}</span>
            </p>
          </div>
        </div>

        {/* Contact info card block */}
        <div className="text-slate-655 flex flex-col gap-4 border-t border-slate-100 pt-4 text-xs font-semibold sm:flex-row md:border-t-0 md:pt-0">
          <div className="flex items-center space-x-2 rounded-xl border bg-slate-50 p-3 shadow-sm">
            <Phone className="h-4 w-4 text-slate-400" />
            <div>
              <span className="block text-[9px] leading-none text-slate-400">Telephone</span>
              <a
                href={`tel:${pharmacy.phone}`}
                className="font-bold text-slate-950 hover:underline"
              >
                {pharmacy.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Services list (2/3) vs Opening hours & trust cards (1/3) */}
      <div className="grid items-start gap-8 lg:grid-cols-3">
        {/* Left Column: List of Services */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
            <h3 className="text-slate-455 text-xs font-extrabold uppercase tracking-wider">
              Available Clinical Services
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              {pharmacy.services.length} active service{pharmacy.services.length !== 1 ? "s" : ""}
            </span>
          </div>

          {pharmacy.services.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-10 text-center">
              <HeartPulse className="text-slate-350 mx-auto h-8 w-8" />
              <h4 className="text-xs font-bold text-slate-800">No Services Registered</h4>
              <p className="text-slate-450 mx-auto max-w-sm text-[10px] font-normal leading-relaxed">
                This pharmacy hasn&apos;t published any active booking services yet. Please check
                back later.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pharmacy.services.map((service) => (
                /* Service Row Card component */
                <div
                  key={service.id}
                  className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center"
                >
                  <div className="max-w-md space-y-1">
                    <h4 className="flex items-center space-x-2 text-sm font-bold text-slate-950">
                      <span>{service.name}</span>
                    </h4>
                    <p className="line-clamp-2 text-xs font-normal leading-relaxed text-slate-500">
                      {service.description || "No service description provided by branch."}
                    </p>
                    <div className="text-slate-455 flex select-none space-x-3 pt-1.5 text-[10px] font-bold">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3 text-slate-400" />
                        {service.duration} mins
                      </span>
                    </div>
                  </div>

                  <div className="border-slate-105 flex w-full shrink-0 items-center justify-between gap-6 border-t pt-3 md:w-auto md:justify-end md:border-t-0 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="mb-1 block text-[9px] font-extrabold uppercase leading-none tracking-widest text-slate-400">
                        Service Price
                      </span>
                      <span className="text-md font-extrabold text-slate-900">
                        £{Number(service.price).toFixed(2)}
                      </span>
                    </div>

                    <Link
                      href={`/book/${pharmacy.slug}?serviceId=${service.id}`}
                      className="inline-flex h-9 select-none items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                      Book Slot
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Availability Hours & Trust Certificates */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Availability Card */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h4 className="border-b border-slate-100 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Weekly Operating Schedule
            </h4>

            {sortedAvailability.length === 0 ? (
              <p className="text-slate-450 text-xs font-normal leading-relaxed">
                Opening hours schedule not provided. Please call the branch directly.
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

          {/* Compliance & Verification Badge Box */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h4 className="text-slate-450 border-b border-slate-100 pb-2 text-[10px] font-extrabold uppercase tracking-widest">
              Compliance & Safety
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2.5 text-xs">
                <ShieldCheck className="h-4.5 w-4.5 mt-0.5 shrink-0 text-emerald-500" />
                <div>
                  <h5 className="font-bold leading-none text-slate-900">CQC Compliant</h5>
                  <p className="mt-1 text-[10px] font-normal leading-normal text-slate-500">
                    This pharmacy operations partner is monitored under the UK Care Quality
                    Commission standards.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2.5 text-xs">
                <ShieldCheck className="h-4.5 w-4.5 mt-0.5 shrink-0 text-emerald-500" />
                <div>
                  <h5 className="font-bold leading-none text-slate-900">ICO Data Privacy</h5>
                  <p className="mt-1 text-[10px] font-normal leading-normal text-slate-500">
                    Active data protection registrations maintained to secure electronic health
                    records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
