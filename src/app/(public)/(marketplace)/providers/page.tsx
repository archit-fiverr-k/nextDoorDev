import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Search, MapPin, Store, ArrowRight, ShieldCheck, HeartPulse, Building } from "lucide-react";
import { db } from "@/lib/db";

export const revalidate = 0; // Dynamic database listings

export const metadata: Metadata = {
  title: "Find Trusted Local Pharmacies & Clinics | NextDoorClinic",
  description:
    "Compare and search verified independent pharmacies and clinical centers across the United Kingdom. Filter by services, check CQC compliance, and book online.",
};

interface ProvidersPageProps {
  searchParams: {
    query?: string;
    location?: string;
    type?: string;
    page?: string;
  };
}

export default async function ProvidersSearchPage({ searchParams }: ProvidersPageProps) {
  const query = searchParams.query || "";
  const location = searchParams.location || "";
  const type = searchParams.type || "all";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const pageSize = 6;

  // 1. Fetch all approved pharmacies matching name & location
  let allApprovedPharmacies: any[] = [];
  try {
    allApprovedPharmacies = await db.pharmacy.findMany({
      where: {
        status: "APPROVED",
        AND: [
          query
            ? {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              }
            : {},
          location
            ? {
                address: {
                  contains: location,
                  mode: "insensitive",
                },
              }
            : {},
        ],
      },
      include: {
        services: {
          where: { isActive: true },
          take: 3,
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (err) {
    console.error("Database connection notice on providers page:", err);
  }

  // 2. Perform virtual type filtering in JS
  let filtered = allApprovedPharmacies;
  if (type && type !== "all") {
    filtered = allApprovedPharmacies.filter((p) => {
      const name = p.name.toLowerCase();
      if (type === "clinic") {
        return name.includes("clinic") || name.includes("wellness") || name.includes("centre");
      }
      if (type === "group") {
        return name.includes("group") || name.includes("care") || name.includes("branches");
      }
      if (type === "independent") {
        return (
          !name.includes("clinic") &&
          !name.includes("wellness") &&
          !name.includes("centre") &&
          !name.includes("group") &&
          !name.includes("care")
        );
      }
      return true;
    });
  }

  // 3. Paginate the filtered list
  const totalResults = filtered.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPharmacies = filtered.slice(startIndex, startIndex + pageSize);

  // Helper to resolve virtual type string for display
  const getProviderTypeLabel = (nameStr: string) => {
    const name = nameStr.toLowerCase();
    if (name.includes("clinic") || name.includes("wellness") || name.includes("centre")) {
      return "Clinical Center";
    }
    if (name.includes("group") || name.includes("care")) {
      return "Pharmacy Group";
    }
    return "Independent Pharmacy";
  };

  return (
    <div className="mx-auto w-full max-w-7xl select-text space-y-8 px-6 py-10">
      {/* Editorial Title Block */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold leading-none tracking-tight text-slate-900">
          Find Local Healthcare Providers
        </h2>
        <p className="text-xs font-normal text-slate-500">
          Browse verified local pharmacies, compare clinic capabilities, check compliance
          registrations, and schedule appointments.
        </p>
      </div>

      {/* Grid: Search Filters Panel & Results Grid */}
      <div className="grid items-start gap-8 lg:grid-cols-4">
        {/* Left Side: URL-based Search Filters (No Client JavaScript Overhead) */}
        <div className="dark:border-zinc-850 space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:bg-zinc-950 lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-900">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Filter Directory
            </span>
            {Boolean(query || location || type !== "all") && (
              <Link
                href="/providers"
                className="text-[9px] font-bold text-brand-teal hover:underline"
              >
                Clear Filters
              </Link>
            )}
          </div>

          <form method="GET" action="/providers" className="space-y-4 text-xs font-semibold">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400">
                Search Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="query"
                  defaultValue={query}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 font-medium focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-slate-100"
                  placeholder="e.g. Northside Wellness"
                />
                <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400">
                Location / Postcode
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  defaultValue={location}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 font-medium focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-slate-100"
                  placeholder="e.g. London or M1"
                />
                <MapPin className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Provider Type Selection */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400">
                Provider Type
              </label>
              <select
                name="type"
                defaultValue={type}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 font-medium text-slate-700 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-slate-100"
              >
                <option value="all">All Provider Types</option>
                <option value="independent">Independent Pharmacies</option>
                <option value="clinic">Clinical Centers</option>
                <option value="group">Pharmacy Groups</option>
              </select>
            </div>

            {/* Apply Button */}
            <button
              type="submit"
              className="h-10 w-full cursor-pointer rounded-xl bg-brand-navy text-xs font-extrabold text-white transition-all hover:bg-brand-teal active:scale-[0.98]"
            >
              Apply Filters
            </button>
          </form>
        </div>

        {/* Right Side: Results Grid */}
        <div className="space-y-8 lg:col-span-3">
          {paginatedPharmacies.length === 0 ? (
            /* Empty State */
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-slate-50 text-slate-400">
                <Store className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Providers Found</h3>
              <p className="text-slate-450 mx-auto max-w-sm text-xs leading-relaxed">
                We couldn&apos;t find any approved pharmacies matching your search criteria. Try
                modifying your filters or location tags.
              </p>
              <Link
                href="/providers"
                className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
              >
                Reset Search
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
              {paginatedPharmacies.map((pharmacy) => {
                const typeLabel = getProviderTypeLabel(pharmacy.name);
                const pharmColor = pharmacy.brandColor || "#10B981";
                return (
                  /* Provider Card component */
                  <div
                    key={pharmacy.id}
                    className="dark:border-zinc-850 flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:bg-zinc-950 sm:p-5"
                  >
                    <div className="space-y-3 sm:space-y-4">
                      {/* Top identity & Brand color accent */}
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 items-center space-x-2 sm:space-x-3">
                          <div
                            style={{
                              backgroundColor: pharmColor,
                            }}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm sm:h-9 sm:w-9 sm:text-sm"
                          >
                            {pharmacy.name[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="rounded border border-brand-teal/20 bg-brand-teal/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-brand-teal sm:text-[9px]">
                              {typeLabel}
                            </span>
                            <h3 className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-slate-100 sm:mt-1 sm:text-sm">
                              {pharmacy.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Contact & Location details */}
                      <div className="space-y-2 text-[10px] font-normal leading-normal text-slate-500 dark:text-zinc-400 sm:text-[11px]">
                        <p className="flex items-start space-x-1.5">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="line-clamp-2">{pharmacy.address}</span>
                        </p>
                      </div>

                      {/* Services preview */}
                      {pharmacy.services.length > 0 && (
                        <div className="border-slate-150 space-y-1.5 border-t pt-2 dark:border-zinc-900 sm:space-y-2 sm:pt-3">
                          <span className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-400 sm:text-[9px]">
                            Popular Services
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {pharmacy.services.map((service: any) => (
                              <span
                                key={service.id}
                                className="text-slate-750 inline-flex items-center rounded-lg border border-slate-200/60 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 sm:text-[10px]"
                              >
                                <HeartPulse className="mr-0.5 h-2.5 w-2.5 shrink-0 text-brand-teal sm:mr-1 sm:h-3 sm:w-3" />
                                {service.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Badges & Actions */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-900 sm:mt-4 sm:pt-4">
                      <div className="text-slate-455 flex space-x-2 text-[8px] font-bold sm:text-[9px]">
                        <span className="flex items-center space-x-1">
                          <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-500" />
                          <span className="xs:inline hidden">CQC Partner</span>
                        </span>
                      </div>
                      <Link
                        href={`/provider/${pharmacy.slug}`}
                        className="group inline-flex h-7 select-none items-center justify-center rounded-lg bg-brand-navy px-2.5 text-[9px] font-extrabold text-white transition-all hover:bg-brand-teal sm:h-8 sm:px-3.5 sm:text-[10px]"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="text-slate-550 flex select-none items-center justify-between border-t border-slate-200/60 pt-4 text-xs font-semibold">
              <span>
                Page {currentPage} of {totalPages} ({totalResults} providers found)
              </span>
              <div className="flex space-x-2">
                {currentPage > 1 ? (
                  <Link
                    href={`/providers?query=${query}&location=${location}&type=${type}&page=${
                      currentPage - 1
                    }`}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 transition-all hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="text-slate-350 inline-flex h-9 cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-4">
                    Previous
                  </span>
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={`/providers?query=${query}&location=${location}&type=${type}&page=${
                      currentPage + 1
                    }`}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 transition-all hover:bg-slate-50"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="text-slate-350 inline-flex h-9 cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-4">
                    Next
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
