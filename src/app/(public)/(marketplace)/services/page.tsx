import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Search,
  MapPin,
  HeartPulse,
  Clock,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Store,
} from "lucide-react";
import { db } from "@/lib/db";

export const revalidate = 0; // Dynamic database listings

export const metadata: Metadata = {
  title: "Compare Clinical Services & Prices | NextDoorClinic",
  description:
    "Discover local health checkups, flu vaccinations, and travel clinic consultations. Compare prices and durations across verified providers near you.",
};

interface ServicesPageProps {
  searchParams: {
    query?: string;
    location?: string;
    maxPrice?: string;
    page?: string;
  };
}

export default async function ServicesSearchPage({ searchParams }: ServicesPageProps) {
  const query = searchParams.query || "";
  const location = searchParams.location || "";
  const maxPrice = searchParams.maxPrice || "";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const pageSize = 6;

  // Build the dynamic filtering parameters
  const whereClause = {
    isActive: true,
    pharmacy: {
      status: "APPROVED" as const,
      address: location
        ? {
            contains: location,
            mode: "insensitive" as const,
          }
        : undefined,
    },
    AND: [
      query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { description: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {},
      maxPrice
        ? {
            price: {
              lte: parseFloat(maxPrice),
            },
          }
        : {},
    ],
  };

  // Fetch count and paginated items concurrently
  const [totalResults, paginatedServices] = await Promise.all([
    db.service.count({ where: whereClause }),
    db.service.findMany({
      where: whereClause,
      include: {
        pharmacy: {
          select: {
            name: true,
            slug: true,
            address: true,
            brandColor: true,
          },
        },
      },
      orderBy: {
        price: "asc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="mx-auto w-full max-w-7xl select-text space-y-8 px-6 py-10">
      {/* Editorial Title Block */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold leading-none tracking-tight text-slate-900">
          Compare Healthcare Services
        </h2>
        <p className="text-xs font-normal text-slate-500">
          Search local vaccinations, screenings, and clinical consultations. Compare durations,
          check upfront pricing, and book slots directly.
        </p>
      </div>

      {/* Grid Layout: Search Panel & List Results */}
      <div className="grid items-start gap-8 lg:grid-cols-4">
        {/* Left Side: URL-based Search Filters (No Client JavaScript Overhead) */}
        <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Filter Services
            </span>
            {Boolean(query || location || maxPrice) && (
              <Link href="/services" className="text-[9px] font-bold text-blue-600 hover:underline">
                Clear Filters
              </Link>
            )}
          </div>

          <form method="GET" action="/services" className="space-y-4 text-xs font-semibold">
            {/* Service Search Input */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400">
                Service / Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="query"
                  defaultValue={query}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="e.g. Flu, Vaccine, Roster"
                />
                <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400">
                Pharmacy Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  defaultValue={location}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="e.g. Leeds or M4"
                />
                <MapPin className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Price Limit Input */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400">
                Maximum Price (£)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={maxPrice}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="e.g. 50"
                  min="0"
                />
                <DollarSign className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="submit"
              className="h-10 w-full cursor-pointer rounded-xl bg-blue-600 text-xs font-extrabold text-white transition-all hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </form>
        </div>

        {/* Right Side: Results Grid */}
        <div className="space-y-8 lg:col-span-3">
          {paginatedServices.length === 0 ? (
            /* Empty State */
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-slate-50 text-slate-400">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Services Found</h3>
              <p className="text-slate-450 mx-auto max-w-sm text-xs leading-relaxed">
                We couldn&apos;t find any active clinical services matching your search criteria.
                Try modifying your price limits or search keywords.
              </p>
              <Link
                href="/services"
                className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
              >
                Reset Search
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {paginatedServices.map((service) => (
                /* Service Card component */
                <div
                  key={service.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top Identity Block */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="inline-flex items-center text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                          <HeartPulse className="mr-1 h-3 w-3 shrink-0 text-slate-400" />
                          Clinical Service
                        </span>
                        <h3 className="mt-1 truncate text-sm font-bold text-slate-900">
                          {service.name}
                        </h3>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-md font-extrabold text-slate-900">
                          £{Number(service.price).toFixed(2)}
                        </span>
                        <span className="mt-1 block text-[10px] font-bold leading-none text-slate-400">
                          {service.duration} mins
                        </span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <p className="line-clamp-3 text-xs font-normal leading-relaxed text-slate-500">
                      {service.description ||
                        "No service details or requirements provided by branch."}
                    </p>

                    {/* Provider details */}
                    <div className="flex items-center space-x-2.5 border-t border-slate-100 pt-3.5">
                      <div
                        style={{
                          backgroundColor: service.pharmacy.brandColor || "#1D9E75",
                        }}
                        className="flex h-6 w-6 select-none items-center justify-center rounded-lg text-[10px] font-extrabold text-white shadow-sm"
                      >
                        {service.pharmacy.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 leading-none">
                        <Link
                          href={`/provider/${service.pharmacy.slug}`}
                          className="block max-w-[180px] truncate text-[11px] font-bold text-slate-900 transition-colors hover:text-blue-600"
                        >
                          {service.pharmacy.name}
                        </Link>
                        <span className="text-slate-450 mt-1 block max-w-[180px] truncate text-[9px]">
                          {service.pharmacy.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Badges & Action */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="text-slate-455 flex space-x-2 text-[9px] font-bold">
                      <span className="flex items-center space-x-1">
                        <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-500" />
                        <span>Verified secure</span>
                      </span>
                    </div>

                    <Link
                      href={`/service/${service.id}`}
                      className="hover:bg-slate-850 group inline-flex h-8 select-none items-center justify-center rounded-lg bg-slate-900 px-3.5 text-[10px] font-extrabold text-white transition-all"
                    >
                      <span>Compare Info</span>
                      <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="text-slate-550 flex select-none items-center justify-between border-t border-slate-200/60 pt-4 text-xs font-semibold">
              <span>
                Page {currentPage} of {totalPages} ({totalResults} services found)
              </span>
              <div className="flex space-x-2">
                {currentPage > 1 ? (
                  <Link
                    href={`/services?query=${query}&location=${location}&maxPrice=${maxPrice}&page=${
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
                    href={`/services?query=${query}&location=${location}&maxPrice=${maxPrice}&page=${
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
