"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import {
  SlidersHorizontal,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  ArrowRight,
  Check,
  Tag,
  AlertCircle,
  Mail,
  RotateCcw,
  Building2,
  ChevronRight,
  Filter,
  Navigation,
  CalendarCheck,
  X,
  Stethoscope,
  Search,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "../search-bar";
import { getDistanceMiles, geocodeLocation } from "@/lib/geocoding";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  category?: string | null;
}

interface PharmacyData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  displayName: string | null;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  postcode: string | null;
  city: string | null;
  services: ServiceItem[];
  isOpenToday: boolean;
  slotsToday: number;
  earliestAppointment?: string;
  ratingScore: number;
  ratingCount: number;
}

interface SearchViewProps {
  initialLocation: string;
  initialLat: number | null;
  initialLng: number | null;
  initialService: string;
  initialProviders: PharmacyData[];
  categories?: { id: string; name: string }[];
  allServiceNames?: string[];
}

export function SearchView({
  initialLocation,
  initialLat,
  initialLng,
  initialService,
  initialProviders,
}: SearchViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. INDEPENDENT SEARCH FILTERS STATE
  const [searchLocation, setSearchLocation] = useState<string>(
    searchParams?.get("postcode") || searchParams?.get("location") || initialLocation || ""
  );
  const [searchService, setSearchService] = useState<string>(
    searchParams?.get("service") || initialService || ""
  );
  const [maxDistance, setMaxDistance] = useState<number>(
    parseInt(searchParams?.get("radius") || "10", 10)
  );
  const [sortBy, setSortBy] = useState<string>(searchParams?.get("sort") || "nearest");
  const [openTodayOnly, setOpenTodayOnly] = useState<boolean>(
    searchParams?.get("availability") === "open-now" || searchParams?.get("openNow") === "true"
  );
  const [nhsOnly, setNhsOnly] = useState<boolean>(searchParams?.get("nhs") === "true");
  const [privateOnly, setPrivateOnly] = useState<boolean>(searchParams?.get("private") === "true");

  // Dynamic Provider List & Loading States
  const [providers, setProviders] = useState<PharmacyData[]>(initialProviders);
  const [loading, setLoading] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Scroll Detection for Sticky Bar
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. BI-DIRECTIONAL URL SYNC
  const updateUrlParams = useCallback(
    (newLoc: string, newSvc: string, newRad: number, newSort: string) => {
      const params = new URLSearchParams();
      if (newSvc.trim()) params.set("service", slugify(newSvc.trim()));
      if (newLoc.trim()) params.set("postcode", newLoc.trim().toUpperCase());
      if (newRad) params.set("radius", newRad.toString());
      if (newSort && newSort !== "nearest") params.set("sort", newSort);
      if (openTodayOnly) params.set("openNow", "true");
      if (nhsOnly) params.set("nhs", "true");
      if (privateOnly) params.set("private", "true");

      const newUrl = `/search?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    },
    [openTodayOnly, nhsOnly, privateOnly]
  );

  // 3. FETCH REFRESH FROM API WHEN FILTERS CHANGE
  const executeApiSearch = useCallback(
    async (loc: string, svc: string, rad: number, sort: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (svc.trim()) params.set("service", svc.trim());
        if (loc.trim()) params.set("postcode", loc.trim());
        params.set("radius", rad.toString());
        params.set("sort", sort);
        if (openTodayOnly) params.set("openNow", "true");
        if (nhsOnly) params.set("nhs", "true");
        if (privateOnly) params.set("private", "true");

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.pharmacies)) {
            setProviders(data.pharmacies);
          }
        }
      } catch (err) {
        console.error("API search error:", err);
      } finally {
        setLoading(false);
      }
    },
    [openTodayOnly, nhsOnly, privateOnly]
  );

  // 4. HANDLERS FOR INDEPENDENT FILTER CHANGES
  const handleServiceChange = (newSvc: string) => {
    setSearchService(newSvc);
    updateUrlParams(searchLocation, newSvc, maxDistance, sortBy);
    executeApiSearch(searchLocation, newSvc, maxDistance, sortBy);
  };

  const handleLocationChange = (newLoc: string) => {
    setSearchLocation(newLoc);
    updateUrlParams(newLoc, searchService, maxDistance, sortBy);
    executeApiSearch(newLoc, searchService, maxDistance, sortBy);
  };

  const handleRadiusChange = (newRad: number) => {
    setMaxDistance(newRad);
    updateUrlParams(searchLocation, searchService, newRad, sortBy);
    executeApiSearch(searchLocation, searchService, newRad, sortBy);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    updateUrlParams(searchLocation, searchService, maxDistance, newSort);
    executeApiSearch(searchLocation, searchService, maxDistance, newSort);
  };

  // Combined Filtering Matrix
  const filteredProviders = useMemo(() => {
    let list = [...providers];

    let targetLat = initialLat;
    let targetLng = initialLng;

    if (searchLocation.trim() && (targetLat == null || targetLng == null)) {
      const geocoded = geocodeLocation(searchLocation);
      if (geocoded) {
        targetLat = geocoded.lat;
        targetLng = geocoded.lng;
      }
    }

    let listWithDistance = list.map((p) => {
      let distanceMiles = (p as any).distanceMiles ?? null;
      if (
        distanceMiles == null &&
        targetLat != null &&
        targetLng != null &&
        p.latitude != null &&
        p.longitude != null
      ) {
        distanceMiles = Number(
          getDistanceMiles(targetLat, targetLng, p.latitude, p.longitude).toFixed(1)
        );
      }

      return {
        ...p,
        distanceMiles: distanceMiles ?? 1.2,
      };
    });

    if (maxDistance > 0) {
      listWithDistance = listWithDistance.filter(
        (p) => p.distanceMiles === null || p.distanceMiles <= maxDistance
      );
    }

    if (openTodayOnly) {
      listWithDistance = listWithDistance.filter((p) => p.isOpenToday);
    }

    if (sortBy === "nearest") {
      listWithDistance.sort((a, b) => (a.distanceMiles || 0) - (b.distanceMiles || 0));
    } else if (sortBy === "price") {
      listWithDistance.sort((a, b) => {
        const priceA = a.services[0]?.price || 0;
        const priceB = b.services[0]?.price || 0;
        return priceA - priceB;
      });
    } else if (sortBy === "rating") {
      listWithDistance.sort((a, b) => b.ratingScore - a.ratingScore);
    }

    return listWithDistance;
  }, [providers, searchLocation, initialLat, initialLng, maxDistance, openTodayOnly, sortBy]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 1. STICKY COMPACT SEARCH HEADER ON SCROLL */}
      {/* ========================================================================= */}
      {isScrolled && (
        <div className="fixed left-0 right-0 top-0 z-40 border-b border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur-md transition-all dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <Link href="/" className="shrink-0">
              <img
                src="/assets/header-logo.png"
                alt="NextDoorClinic"
                className="h-7 w-auto dark:brightness-0 dark:invert"
              />
            </Link>

            <div className="hidden max-w-2xl flex-1 md:block">
              <SearchBar
                initialService={searchService}
                initialLocation={searchLocation}
                onSearch={(loc, svc) => {
                  if (loc) handleLocationChange(loc);
                  if (svc) handleServiceChange(typeof svc === "string" ? svc : svc.name);
                }}
              />
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="shadow-2xs flex items-center space-x-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 md:hidden"
            >
              <Search className="h-3.5 w-3.5 text-[#10B981]" />
              <span>Edit Search</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HERO SEARCH BAR CONTAINER (Dual Independent Filter Architecture) */}
      {/* ========================================================================= */}
      <section className="shadow-xs border-b border-slate-200/80 bg-white pb-8 pt-6 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#10B981]">
                Real-Time Healthcare Search
              </span>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {searchService ? (
                  <>
                    Showing pharmacies providing{" "}
                    <span className="text-[#10B981]">
                      &quot;
                      {searchService.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      &quot;
                    </span>
                  </>
                ) : (
                  "Find Verified Healthcare Clinics"
                )}
                {searchLocation && (
                  <>
                    {" "}
                    near{" "}
                    <span className="text-slate-700 dark:text-zinc-300">
                      &quot;{searchLocation}&quot;
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                {filteredProviders.length} verified pharmacy clinic
                {filteredProviders.length === 1 ? "" : "s"} found within {maxDistance} miles.
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex shrink-0 items-center space-x-2">
              <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3 text-[#10B981]" />
                <span>CQC & GPhC Regulated</span>
              </span>
            </div>
          </div>

          {/* Interactive Search Bar Component */}
          <div className="pt-2">
            <SearchBar
              initialService={searchService}
              initialLocation={searchLocation}
              onSearch={(loc, svc) => {
                if (loc) handleLocationChange(loc);
                if (svc) handleServiceChange(typeof svc === "string" ? svc : svc.name);
              }}
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN RESULTS WORKSPACE & FILTERS BAR */}
      {/* ========================================================================= */}
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* FILTER BAR ROW */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Radius Selector */}
            <div className="shadow-2xs flex items-center space-x-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <MapPin className="h-3.5 w-3.5 text-[#10B981]" />
              <span>Radius:</span>
              <select
                value={maxDistance}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
                className="cursor-pointer bg-transparent font-extrabold text-slate-900 outline-none dark:text-white"
              >
                <option value={5}>5 Miles</option>
                <option value={10}>10 Miles</option>
                <option value={15}>15 Miles</option>
                <option value={25}>25 Miles</option>
                <option value={50}>50 Miles</option>
              </select>
            </div>

            {/* Availability Filter Toggle */}
            <button
              onClick={() => {
                const nextVal = !openTodayOnly;
                setOpenTodayOnly(nextVal);
                updateUrlParams(searchLocation, searchService, maxDistance, sortBy);
                executeApiSearch(searchLocation, searchService, maxDistance, sortBy);
              }}
              className={`inline-flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                openTodayOnly
                  ? "border-[#10B981] bg-emerald-50 text-[#10B981] dark:bg-emerald-950/60"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Open Today</span>
            </button>

            {/* NHS Filter Toggle */}
            <button
              onClick={() => {
                const nextVal = !nhsOnly;
                setNhsOnly(nextVal);
                if (nextVal) setPrivateOnly(false);
                updateUrlParams(searchLocation, searchService, maxDistance, sortBy);
                executeApiSearch(searchLocation, searchService, maxDistance, sortBy);
              }}
              className={`inline-flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                nhsOnly
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              <span>NHS Partner</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2 text-xs font-bold">
            <span className="text-slate-500 dark:text-zinc-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="shadow-2xs cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-extrabold text-slate-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            >
              <option value="nearest">Nearest Pharmacy (Distance)</option>
              <option value="earliest">Earliest Appointment</option>
              <option value="rating">Highest Rating</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="space-y-3 py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#10B981]" />
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Searching verified clinics near {searchLocation || "your location"}...
            </p>
          </div>
        ) : filteredProviders.length === 0 ? (
          /* EMPTY STATE RECOVERY CARD */
          <div className="shadow-xs space-y-4 rounded-3xl border border-amber-200/80 bg-amber-50/40 p-8 text-center dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="mx-auto max-w-md space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                No pharmacies currently provide this service within {maxDistance} miles.
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Try expanding your search radius, selecting a nearby city, or searching another
                treatment name.
              </p>
            </div>

            {/* Recovery Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleRadiusChange(maxDistance + 15)}
                className="rounded-xl bg-[#10B981] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95"
              >
                Increase Search Radius (+15 Miles)
              </button>
              <button
                onClick={() => handleLocationChange("London")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Browse London
              </button>
              <button
                onClick={() => handleLocationChange("Manchester")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Browse Manchester
              </button>
            </div>
          </div>
        ) : (
          /* SEARCH RESULTS LIST (AIRBNB / GOOGLE MAPS CARDS) */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((pharmacy) => {
              const rawTokens = (searchService || "")
                .toLowerCase()
                .replace(/-/g, " ")
                .replace(/[^a-z0-9\s]/g, "")
                .split(/\s+/)
                .filter(
                  (t) =>
                    t.length >= 2 &&
                    !["service", "treatment", "private", "clinic", "check"].includes(t)
                );

              const matchedService =
                pharmacy.services?.find((s) => {
                  if (!rawTokens.length) return true;
                  const sName = s.name.toLowerCase();
                  return rawTokens.some((t) => sName.includes(t));
                }) ||
                pharmacy.services?.[0] ||
                null;

              const isNhs = matchedService?.category?.toLowerCase().includes("nhs") || false;
              const bookUrl = `/book/${pharmacy.slug || pharmacy.id}${
                searchService ? `?service=${slugify(searchService)}` : ""
              }`;
              const profileUrl = `/provider/${pharmacy.slug || pharmacy.id}`;

              return (
                <div
                  key={pharmacy.id}
                  className="shadow-xs group flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 transition-all hover:border-[#10B981]/50 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="space-y-3">
                    {/* Header Row: Logo, Name & Rating */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center space-x-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 font-extrabold text-slate-800 dark:border-zinc-800 dark:bg-zinc-800 dark:text-white">
                          {pharmacy.logoUrl ? (
                            <img
                              src={pharmacy.logoUrl}
                              alt={pharmacy.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            pharmacy.name[0] || "P"
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-[#10B981] dark:text-white">
                            {pharmacy.displayName || pharmacy.name}
                          </h3>
                          <p className="mt-0.5 flex items-center space-x-1 truncate text-[11px] text-slate-500 dark:text-zinc-400">
                            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                            <span>{pharmacy.city || pharmacy.address}</span>
                          </p>
                        </div>
                      </div>

                      {/* Distance Badge */}
                      {pharmacy.distanceMiles !== undefined && pharmacy.distanceMiles !== null && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {pharmacy.distanceMiles} mi
                        </span>
                      )}
                    </div>

                    {/* Service & Price Row */}
                    {matchedService ? (
                      <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {matchedService.name}
                          </span>
                          <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            £{Number(matchedService.price).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                          <span>{matchedService.duration} mins</span>
                          <span>&bull;</span>
                          <span>{isNhs ? "NHS Funded" : "Private Consultation"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                        {pharmacy.services?.length || 0} Clinical Services Available
                      </div>
                    )}

                    {/* Status & Availability Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <Clock className="h-3 w-3 text-[#10B981]" />
                        <span>{pharmacy.earliestAppointment || "Slots Available Today"}</span>
                      </span>

                      <span className="inline-flex items-center space-x-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>
                          {pharmacy.ratingScore} ({pharmacy.ratingCount || 12})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center space-x-2 border-t border-slate-100 pt-2 dark:border-zinc-800">
                    <Link
                      href={bookUrl}
                      className="shadow-xs inline-flex flex-1 items-center justify-center space-x-1 rounded-xl bg-[#10B981] px-3 py-2.5 text-xs font-extrabold text-white transition-all hover:bg-emerald-600 active:scale-95"
                    >
                      <span>Book Appointment</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={profileUrl}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      View Clinic
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
