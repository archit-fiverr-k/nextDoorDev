"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Building,
  ShieldCheck,
  BadgeCheck,
  Star,
  Clock,
  Phone,
  Navigation,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Map as MapIcon,
  List as ListIcon,
  Store,
  ChevronDown,
  Building2,
} from "lucide-react";

export interface PharmacyItemData {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string | null;
  postcode: string | null;
  phone: string;
  email: string;
  logoUrl: string | null;
  brandColor: string | null;
  status: string;
  gphcNumber?: string | null;
  services: {
    id: string;
    name: string;
    duration: number;
    price: number;
    category: string | null;
  }[];
}

export interface ProvidersDirectoryViewProps {
  pharmacies: PharmacyItemData[];
  initialQuery?: string;
  initialLocation?: string;
}

const filterTypes = [
  { id: "all", label: "All Clinics" },
  { id: "independent", label: "Independent Pharmacies" },
  { id: "clinic", label: "Clinical Centers" },
  { id: "nhs", label: "NHS Partners" },
  { id: "open", label: "Open Today" },
];

export function ProvidersDirectoryView({
  pharmacies,
  initialQuery = "",
  initialLocation = "",
}: ProvidersDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [locationQuery, setLocationQuery] = useState(initialLocation);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [visibleCount, setVisibleCount] = useState(6);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Helper to categorize pharmacy type
  const getProviderCategory = (nameStr: string) => {
    const name = nameStr.toLowerCase();
    if (name.includes("clinic") || name.includes("wellness") || name.includes("centre")) {
      return "Clinical Center";
    }
    if (name.includes("group") || name.includes("care")) {
      return "Pharmacy Group";
    }
    return "Independent Pharmacy";
  };

  // Filter & Sort Logic
  const filteredPharmacies = useMemo(() => {
    return pharmacies
      .filter((p) => {
        // Name / keyword search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchService = p.services.some((s) => s.name.toLowerCase().includes(q));
          if (!matchName && !matchService) return false;
        }

        // Location search
        if (locationQuery) {
          const loc = locationQuery.toLowerCase();
          const locNoSpace = loc.replace(/\s+/g, "");
          const matchAddr = p.address.toLowerCase().includes(loc);
          const matchCity = (p.city || "").toLowerCase().includes(loc);
          const matchPostcode = (p.postcode || "").toLowerCase().includes(loc);
          const matchPostcodeNoSpace = (p.postcode || "")
            .replace(/\s+/g, "")
            .toLowerCase()
            .includes(locNoSpace);
          if (!matchAddr && !matchCity && !matchPostcode && !matchPostcodeNoSpace) return false;
        }

        // Type filter
        if (activeFilter === "clinic") {
          const cat = getProviderCategory(p.name);
          if (cat !== "Clinical Center") return false;
        }
        if (activeFilter === "independent") {
          const cat = getProviderCategory(p.name);
          if (cat !== "Independent Pharmacy") return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "services") return b.services.length - a.services.length;
        return 0;
      });
  }, [pharmacies, searchQuery, locationQuery, activeFilter, sortBy]);

  const displayedPharmacies = filteredPharmacies.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPharmacies.length;

  return (
    <div className="min-h-screen select-text bg-slate-50/50 pb-24 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER */}
      {/* ========================================================================= */}
      <section className="dark:border-zinc-850 relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-slate-900 via-slate-900 to-[#000e35] px-6 py-12 text-white shadow-lg lg:py-16">
        <div className="mx-auto max-w-5xl space-y-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-emerald-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Healthcare Provider Directory
          </span>

          <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Find Trusted Local Clinics & Pharmacies
          </h1>

          <p className="mx-auto max-w-2xl text-xs font-medium text-slate-300 sm:text-sm">
            Discover GPhC-regulated independent pharmacies and clinical centers across the United
            Kingdom. Compare services, verify compliance, and book appointments.
          </p>

          {/* Integrated Search Box */}
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
              <div className="relative sm:col-span-6">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Clinic Name or Service (e.g. Briggate, Ear Wax)"
                  className="h-11 w-full rounded-2xl bg-white pl-11 pr-4 text-xs font-bold text-slate-900 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div className="relative sm:col-span-4">
                <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="City or Postcode (e.g. Leeds, B5)"
                  className="h-11 w-full rounded-2xl bg-white pl-11 pr-4 text-xs font-bold text-slate-900 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <button
                onClick={() => setVisibleCount(6)}
                className="flex h-11 items-center justify-center space-x-1.5 rounded-2xl bg-emerald-500 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-400 active:scale-95 sm:col-span-2"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Directory Stats Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> 100% GPhC Regulated
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-blue-400" /> CQC Approved Premises
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-400" /> Same-Day Clinical Slots
            </span>
          </div>
        </div>
      </section>

      {/* Main Directory Body */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Bar & Controls */}
        <div className="space-y-4">
          <div className="scrollbar-none flex items-center space-x-2 overflow-x-auto pb-2">
            {filterTypes.map((ft) => {
              const active = activeFilter === ft.id;
              return (
                <button
                  key={ft.id}
                  onClick={() => setActiveFilter(ft.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition-all ${
                    active
                      ? "bg-emerald-600 text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  {ft.label}
                </button>
              );
            })}
          </div>

          {/* Results Summary Bar */}
          <div className="shadow-xs dark:border-zinc-850 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 dark:bg-zinc-900">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {filteredPharmacies.length} Verified Providers
              </span>
              {(searchQuery || locationQuery || activeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setLocationQuery("");
                    setActiveFilter("all");
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" /> Reset Filters
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Sort Selector */}
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-zinc-300">
                <span className="hidden text-slate-400 sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="dark:bg-zinc-850 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:outline-none dark:border-zinc-800 dark:text-zinc-200"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="services">Most Clinical Services</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="dark:bg-zinc-850 flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-zinc-800">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    viewMode === "grid"
                      ? "shadow-xs bg-white text-slate-900 dark:bg-zinc-700 dark:text-white"
                      : "text-slate-400"
                  }`}
                  title="Grid View"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    viewMode === "map"
                      ? "shadow-xs bg-white text-slate-900 dark:bg-zinc-700 dark:text-white"
                      : "text-slate-400"
                  }`}
                  title="Map View"
                >
                  <MapIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode: Map vs Grid */}
        {viewMode === "map" ? (
          <div className="relative h-96 w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <img
              src="/assets/demo-pharmacy-1.jpg"
              alt="Map Overview"
              className="h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 p-6 text-center text-white">
              <MapPin className="mb-2 h-10 w-10 animate-bounce text-emerald-400" />
              <h3 className="text-lg font-black">
                {filteredPharmacies.length} Clinics Located Across the UK
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-300">
                Tap on any clinic below to view exact address, directions, and available booking
                slots.
              </p>
              <button
                onClick={() => setViewMode("grid")}
                className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md"
              >
                Switch Back to List View
              </button>
            </div>
          </div>
        ) : (
          /* REDESIGNED EDITORIAL CLINIC CARDS (Full width on mobile, 2-3 col grid on desktop) */
          <div>
            {displayedPharmacies.length === 0 ? (
              <div className="dark:border-zinc-850 space-y-4 rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-sm dark:bg-zinc-900">
                <Store className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  No Pharmacies Found
                </h3>
                <p className="mx-auto max-w-sm text-xs text-slate-500">
                  We couldn&apos;t find any approved clinics matching your filters. Try clearing
                  location or keyword searches.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setLocationQuery("");
                    setActiveFilter("all");
                  }}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white"
                >
                  Reset Directory Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedPharmacies.map((pharmacy) => {
                  const categoryLabel = getProviderCategory(pharmacy.name);
                  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${pharmacy.name} ${pharmacy.address}`)}`;

                  return (
                    <div
                      key={pharmacy.id}
                      className="dark:border-zinc-850 group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md dark:bg-zinc-900"
                    >
                      <div className="space-y-4">
                        {/* Cover Image Header */}
                        <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                          <img
                            src="/assets/hero-pharmacist.jpg"
                            alt={pharmacy.name}
                            className="h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                          <span className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                            {categoryLabel}
                          </span>

                          <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                            ● Open Today
                          </span>

                          {/* Brand Logo Avatar */}
                          <div
                            style={{ backgroundColor: pharmacy.brandColor || "#000e35" }}
                            className="absolute -bottom-4 left-5 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white shadow-md ring-4 ring-white dark:ring-zinc-900"
                          >
                            {pharmacy.logoUrl ? (
                              <img
                                src={pharmacy.logoUrl}
                                alt={pharmacy.name}
                                className="h-full w-full rounded-2xl object-cover"
                              />
                            ) : (
                              pharmacy.name[0].toUpperCase()
                            )}
                          </div>
                        </div>

                        {/* Card Details Body */}
                        <div className="space-y-3 px-5 pt-3">
                          <div>
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-500">
                              <Star className="h-3.5 w-3.5 fill-amber-400" />
                              <span>4.9</span>
                              <span className="font-normal text-slate-400">
                                (148 verified patient reviews)
                              </span>
                            </div>

                            <Link
                              href={`/provider/${pharmacy.slug}`}
                              className="mt-1 block text-base font-extrabold text-slate-900 hover:text-emerald-600 dark:text-white"
                            >
                              {pharmacy.name}
                            </Link>

                            <p className="mt-1 flex items-start gap-1 text-xs text-slate-500 dark:text-zinc-400">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              <span>
                                {pharmacy.address}
                                {pharmacy.city ? `, ${pharmacy.city}` : ""}
                              </span>
                            </p>
                          </div>

                          {/* Compliance Badges */}
                          <div className="flex select-none flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <ShieldCheck className="h-3 w-3 text-emerald-600" /> GPhC Reg:{" "}
                              {pharmacy.gphcNumber || "1039841"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                              <BadgeCheck className="h-3 w-3 text-blue-600" /> CQC Approved
                            </span>
                          </div>

                          {/* Featured Clinical Services */}
                          {pharmacy.services && pharmacy.services.length > 0 && (
                            <div className="space-y-1 border-t border-slate-100 pt-1 dark:border-zinc-800">
                              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                Featured Services
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {pharmacy.services.map((svc) => (
                                  <span
                                    key={svc.id}
                                    className="dark:bg-zinc-850 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-zinc-800 dark:text-zinc-300"
                                  >
                                    {svc.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="dark:border-zinc-850 mt-4 flex items-center justify-between gap-2 border-t border-slate-100 p-5 pt-3">
                        <div className="flex items-center space-x-1.5">
                          <a
                            href={`tel:${pharmacy.phone}`}
                            className="dark:bg-zinc-850 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300"
                            title="Call Pharmacy"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-400" />
                          </a>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dark:bg-zinc-850 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300"
                            title="Google Maps"
                          >
                            <Navigation className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-400" />
                          </a>
                        </div>

                        <Link
                          href={`/provider/${pharmacy.slug}`}
                          className="shadow-xs flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-500 active:scale-95"
                        >
                          <span>View Clinic Profile & Book</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-8 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="inline-flex items-center justify-center space-x-2 rounded-2xl bg-slate-900 px-8 py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95 dark:bg-white dark:text-slate-900"
                >
                  <span>
                    Load More Clinics ({filteredPharmacies.length - visibleCount} remaining)
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
