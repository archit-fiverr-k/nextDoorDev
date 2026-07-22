"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  ArrowRight,
  Check,
  Map as MapIcon,
  List as ListIcon,
  Tag,
  AlertTriangle,
  Mail,
  CalendarCheck,
  Sparkles,
  Zap,
  ChevronRight,
  RotateCcw,
  Stethoscope,
  Building2,
  Navigation,
} from "lucide-react";
import { SearchBar } from "../search-bar";
import { getDistanceMiles } from "@/lib/geocoding";
import { slugify } from "@/lib/slug";
import {
  logSearchQueryAction,
  createCallbackRequestAction,
  createWaitlistNotificationAction,
} from "@/actions/search-analytics";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
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
  earliestAppointmentDate?: Date | null;
  ratingScore: number;
  ratingCount: number;
}

interface SearchViewProps {
  initialLocation: string;
  initialLat: number | null;
  initialLng: number | null;
  initialService: string;
  initialProviders: PharmacyData[];
  categories: { id: string; name: string }[];
  allServiceNames: string[];
}

export function SearchView({
  initialLocation,
  initialLat,
  initialLng,
  initialService,
  initialProviders,
  categories,
  allServiceNames,
}: SearchViewProps) {
  // Coordinates of search center
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  // View state: list vs map
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Highlighted provider from map marker click
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Filter states
  const [distanceFilter, setDistanceFilter] = useState<string>("25");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [serviceFilter, setServiceFilter] = useState<string>(initialService);
  const [openTodayFilter, setOpenTodayFilter] = useState<boolean>(false);
  const [availableTodayFilter, setAvailableTodayFilter] = useState<boolean>(false);
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Quick Filter Chips
  const [quickAvailableToday, setQuickAvailableToday] = useState(false);
  const [quickTopRated, setQuickTopRated] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<string>("distance");

  // Geocoding maps loader state
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Fallback states
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackEmail, setCallbackEmail] = useState("");
  const [callbackNotes, setCallbackNotes] = useState("");
  const [callbackSuccess, setCallbackSuccess] = useState(false);
  const [callbackLoading, setCallbackLoading] = useState(false);

  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  // Parse address parts client-side for dynamic display
  const getCity = (address: string) => {
    const parts = address.split(",");
    return parts.length > 1 ? parts[parts.length - 2].trim() : "UK";
  };

  // 1. Process client-side filtering and sorting
  const processedProviders = React.useMemo(() => {
    let result = initialProviders.map((p) => {
      let distance = 9999;
      if (centerCoords && p.latitude && p.longitude) {
        distance = getDistanceMiles(centerCoords.lat, centerCoords.lng, p.latitude, p.longitude);
      }
      return { ...p, distance };
    });

    if (distanceFilter !== "anywhere" && centerCoords) {
      const radius = parseFloat(distanceFilter);
      result = result.filter((p) => p.distance <= radius);
    }

    if (serviceFilter) {
      const queryWords = serviceFilter.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter((p) =>
        p.services.some((s) => {
          const serviceNameLower = s.name.toLowerCase();
          return queryWords.every((word) => serviceNameLower.includes(word));
        })
      );
    }

    if (openTodayFilter) {
      result = result.filter((p) => p.isOpenToday);
    }

    if (availableTodayFilter || quickAvailableToday) {
      result = result.filter((p) => p.slotsToday > 0);
    }

    if (ratingFilter || quickTopRated) {
      const minRating = quickTopRated ? 4.8 : parseFloat(ratingFilter);
      result = result.filter((p) => p.ratingScore >= minRating);
    }

    if (maxPrice) {
      const limit = parseFloat(maxPrice);
      result = result.filter((p) => p.services.some((s) => s.price <= limit));
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "rating") return b.ratingScore - a.ratingScore;
      if (sortBy === "earliest") {
        if (!a.earliestAppointmentDate) return 1;
        if (!b.earliestAppointmentDate) return -1;
        return a.earliestAppointmentDate.getTime() - b.earliestAppointmentDate.getTime();
      }
      if (sortBy === "popular") return b.ratingCount - a.ratingCount;
      return 0;
    });

    return result;
  }, [
    initialProviders,
    centerCoords,
    distanceFilter,
    serviceFilter,
    openTodayFilter,
    availableTodayFilter,
    quickAvailableToday,
    ratingFilter,
    quickTopRated,
    maxPrice,
    sortBy,
  ]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setDistanceFilter("25");
    setCategoryFilter("");
    setServiceFilter("");
    setOpenTodayFilter(false);
    setAvailableTodayFilter(false);
    setQuickAvailableToday(false);
    setQuickTopRated(false);
    setRatingFilter("");
    setMaxPrice("");
    setSortBy("distance");
  };

  // Log search queries to analytics DB
  useEffect(() => {
    const sessionToken = sessionStorage.getItem("ndc_search_session") || crypto.randomUUID();
    sessionStorage.setItem("ndc_search_session", sessionToken);

    const startTime = Date.now();
    const timer = setTimeout(() => {
      const duration = Date.now() - startTime;
      const detectedType = centerCoords ? "GEOLOCATED" : "TEXT";
      logSearchQueryAction(
        initialLocation || "General Search",
        detectedType,
        processedProviders.length,
        duration,
        sessionToken
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [initialLocation, centerCoords, processedProviders.length]);

  const handleLocationSearch = (
    locName: string,
    svcName?: string,
    coords?: { lat: number; lng: number }
  ) => {
    if (coords) {
      setCenterCoords(coords);
    } else if (locName && locName.toLowerCase() !== initialLocation.toLowerCase()) {
      window.location.href = `/search?location=${encodeURIComponent(locName)}${
        svcName ? `&service=${encodeURIComponent(svcName)}` : ""
      }`;
    }
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackLoading(true);
    const res = await createCallbackRequestAction(
      callbackName,
      callbackPhone,
      callbackEmail,
      initialLocation || "London",
      null,
      callbackNotes
    );
    setCallbackLoading(false);
    if (res.success) {
      setCallbackSuccess(true);
      setCallbackName("");
      setCallbackPhone("");
      setCallbackEmail("");
      setCallbackNotes("");
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);
    const res = await createWaitlistNotificationAction(
      waitlistEmail,
      initialLocation || "London",
      parseInt(distanceFilter) || 10,
      null
    );
    setWaitlistLoading(false);
    if (res.success) {
      setWaitlistSuccess(true);
      setWaitlistEmail("");
    }
  };

  // Google Maps scripts injection loader
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadMapScript = () => {
      if ((window as any).google && (window as any).google.maps) {
        setMapsLoaded(true);
        return;
      }

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) return;

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      document.head.appendChild(script);
    };

    loadMapScript();
  }, []);

  // Google Maps markers update loop
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || typeof window === "undefined") return;
    const google = (window as any).google;
    if (!google) return;

    const mapCenter = centerCoords || { lat: 51.5074, lng: -0.1278 };

    if (!googleMapInstance.current) {
      googleMapInstance.current = new google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 12,
        mapId: "NDC_SEARCH_MAP",
        disableDefaultUI: false,
        zoomControl: true,
      });
    } else {
      googleMapInstance.current.setCenter(mapCenter);
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (centerCoords) {
      new google.maps.Marker({
        position: centerCoords,
        map: googleMapInstance.current,
        title: "Your Search Location",
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        },
      });
    }

    processedProviders.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const marker = new google.maps.Marker({
        position: { lat: p.latitude, lng: p.longitude },
        map: googleMapInstance.current,
        title: p.displayName || p.name,
        icon: {
          url:
            p.id === highlightedId
              ? "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
              : "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 6px; font-size: 11px;">
            <strong style="display: block; font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 2px;">${
              p.displayName || p.name
            }</strong>
            <span style="color: #64748b; display: block; margin-bottom: 6px;">${p.address}</span>
            <span style="font-weight: 800; padding: 3px 8px; border-radius: 999px; font-size: 10px; background-color: ${
              p.slotsToday > 0 ? "#ecfdf5" : "#fef2f2"
            }; color: ${p.slotsToday > 0 ? "#059669" : "#dc2626"}">
              ${p.slotsToday > 0 ? `🟢 ${p.slotsToday} slots today` : "🔴 Fully Booked"}
            </span>
          </div>
        `,
      });

      marker.addListener("click", () => {
        setHighlightedId(p.id);
        const element = document.getElementById(`pharmacy-card-${p.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        infoWindow.open(googleMapInstance.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [mapsLoaded, processedProviders, centerCoords, highlightedId]);

  return (
    <div className="min-h-screen select-none bg-slate-50/50 pb-20 font-sans text-xs text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* 1. HERO SEARCH & FILTER BAR */}
      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-md dark:border-zinc-900 dark:bg-zinc-950/95 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          {/* Search Bar Input */}
          <div className="w-full md:w-[540px]">
            <SearchBar
              initialLocation={initialLocation}
              initialService={serviceFilter}
              onSearch={handleLocationSearch}
            />
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 font-semibold text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/70 px-3 py-1 text-[11px] font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <Building2 className="h-3.5 w-3.5 text-brand-teal" />
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {processedProviders.length}
                </strong>{" "}
                Clinics Found
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                <strong>{processedProviders.filter((p) => p.slotsToday > 0).length}</strong>{" "}
                Bookable Today
              </span>
            </div>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="no-scrollbar mx-auto mt-3 flex max-w-7xl items-center gap-2 overflow-x-auto pt-1">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Quick Filters:
          </span>

          <button
            onClick={() => setQuickAvailableToday(!quickAvailableToday)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
              quickAvailableToday
                ? "bg-emerald-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Available Today</span>
          </button>

          <button
            onClick={() => setQuickTopRated(!quickTopRated)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
              quickTopRated
                ? "bg-amber-500 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            <Star className="h-3 w-3 fill-current" />
            <span>Top Rated (4.8+)</span>
          </button>

          {(distanceFilter !== "25" ||
            serviceFilter ||
            openTodayFilter ||
            availableTodayFilter ||
            ratingFilter ||
            maxPrice ||
            quickAvailableToday ||
            quickTopRated) && (
            <button
              onClick={handleResetFilters}
              className="flex shrink-0 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-600 transition-all hover:bg-rose-100"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="mx-auto mt-6 grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-12">
        {/* LEFT SIDEBAR: FILTERS */}
        <aside className="dark:border-zinc-850 h-fit space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:bg-zinc-950 lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-900">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
              <SlidersHorizontal className="h-4 w-4 text-brand-teal" />
              <span>Refine Directory</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-brand-teal hover:underline"
            >
              Reset
            </button>
          </div>

          <div className="space-y-5">
            {/* Distance Radius */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Distance Radius
              </label>
              <select
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800 transition-all focus:border-brand-teal focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
                <option value="anywhere">Anywhere (National UK)</option>
              </select>
            </div>

            {/* Clinical Treatment */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Clinical Treatment
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800 transition-all focus:border-brand-teal focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="">All Services</option>
                {allServiceNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Minimum Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800 transition-all focus:border-brand-teal focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="">All Patient Ratings</option>
                <option value="4.0">⭐ 4.0+ Stars</option>
                <option value="4.5">⭐ 4.5+ Stars</option>
                <option value="4.8">⭐ 4.8+ Stars</option>
              </select>
            </div>

            {/* Max Price */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Max Price (£)
              </label>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800 transition-all focus:border-brand-teal focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="">Any Consultation Fee</option>
                <option value="20">Under £20</option>
                <option value="50">Under £50</option>
                <option value="100">Under £100</option>
              </select>
            </div>

            {/* Active Toggles */}
            <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-zinc-900">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={openTodayFilter}
                  onChange={(e) => setOpenTodayFilter(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-teal focus:ring-0"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">Open Today</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={availableTodayFilter}
                  onChange={(e) => setAvailableTodayFilter(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-teal focus:ring-0"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">Bookable Today</span>
              </label>
            </div>
          </div>
        </aside>

        {/* RIGHT SIDE: RESULTS LIST & MAP */}
        <main className="space-y-5 lg:col-span-9">
          {/* Controls Bar (Sort & View Toggles) */}
          <div className="dark:border-zinc-850 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:bg-zinc-950 sm:flex-row">
            {/* Sorting Select */}
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold text-slate-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 sm:w-52"
              >
                <option value="distance">Nearest Distance</option>
                <option value="rating">Highest Rated</option>
                <option value="earliest">Earliest Appointment</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* View Mode Toggle buttons */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ListIcon className="h-4 w-4" />
                <span>List Directory</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-bold transition-all ${
                  viewMode === "map"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MapIcon className="h-4 w-4" />
                <span>Interactive Map</span>
              </button>
            </div>
          </div>

          {/* Main content display */}
          <div className="space-y-6">
            {processedProviders.length === 0 ? (
              /* Empty state with callback forms */
              <div className="space-y-6">
                <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <AlertTriangle className="mx-auto h-12 w-12 animate-bounce text-amber-500" />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      No clinics matching your filter criteria
                    </h3>
                    <p className="mt-1.5 text-xs font-normal text-slate-500">
                      Try broadening your search radius or clearing specific filters.
                    </p>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-navy px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset All Filters</span>
                  </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Form 1: Request Callback Form */}
                  <div className="dark:border-zinc-850 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:bg-zinc-950">
                    <h4 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold text-slate-900 dark:border-zinc-900 dark:text-slate-100">
                      <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>Request a Callback</span>
                    </h4>
                    {callbackSuccess ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="font-bold">
                          Callback request registered! We will reach out shortly.
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleCallbackSubmit} className="space-y-3.5">
                        <p className="text-slate-500">
                          Looking for urgent or custom clinical consultations? Leave your phone
                          number and we will connect you to a nearby partner pharmacy.
                        </p>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={callbackName}
                            onChange={(e) => setCallbackName(e.target.value)}
                            placeholder="e.g. Sarah Jenkins"
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={callbackPhone}
                            onChange={(e) => setCallbackPhone(e.target.value)}
                            placeholder="e.g. 07123456789"
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Appointment Request Notes
                          </label>
                          <textarea
                            rows={2}
                            value={callbackNotes}
                            onChange={(e) => setCallbackNotes(e.target.value)}
                            placeholder="Tell us what treatment you need..."
                            className="w-full rounded-xl border border-slate-200 p-3 font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={callbackLoading}
                          className="h-10 w-full rounded-xl bg-brand-navy text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          {callbackLoading ? "Submitting..." : "Submit Callback Request"}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Form 2: Notify Me Waitlist */}
                  <div className="dark:border-zinc-850 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:bg-zinc-950">
                    <h4 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold text-slate-900 dark:border-zinc-900 dark:text-slate-100">
                      <Mail className="h-4 w-4 shrink-0 text-blue-500" />
                      <span>Notify Me (Availability Waitlist)</span>
                    </h4>
                    {waitlistSuccess ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="font-bold">
                          Waitlist registered! You&apos;ll receive alert updates.
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleWaitlistSubmit} className="space-y-3.5">
                        <p className="text-slate-500">
                          Get notified automatically as soon as new appointment slots or pharmacy
                          partnerships open in the <strong>{initialLocation || "searched"}</strong>{" "}
                          area.
                        </p>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Your Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={waitlistEmail}
                            onChange={(e) => setWaitlistEmail(e.target.value)}
                            placeholder="e.g. you@example.com"
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={waitlistLoading}
                          className="h-10 w-full rounded-xl bg-brand-navy text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          {waitlistLoading ? "Submitting..." : "Subscribe to Notification Alerts"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Map View (rendered conditionally on toggle) */}
                <div
                  ref={mapRef}
                  className={`dark:border-zinc-850 h-96 w-full overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm ${
                    viewMode === "map" ? "block" : "hidden"
                  }`}
                  style={{ minHeight: "420px" }}
                />

                {/* 2. List View Directory Cards */}
                <div className={`space-y-4 ${viewMode === "list" ? "block" : "hidden"}`}>
                  {processedProviders.map((p) => {
                    const isHighlighted = p.id === highlightedId;

                    return (
                      <div
                        id={`pharmacy-card-${p.id}`}
                        key={p.id}
                        className={`group relative flex flex-col justify-between gap-6 rounded-2xl border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-950 md:flex-row md:items-center ${
                          isHighlighted
                            ? "border-amber-400 ring-2 ring-amber-400/20"
                            : "dark:border-zinc-850 border-slate-200/80 shadow-sm hover:border-slate-300 dark:hover:border-zinc-800"
                        }`}
                      >
                        {/* Left Info block */}
                        <div className="flex min-w-0 items-start gap-4">
                          {p.logoUrl ? (
                            <img
                              src={p.logoUrl}
                              alt={p.name}
                              className="shadow-xs h-12 w-12 shrink-0 rounded-2xl border border-slate-100 bg-white object-contain p-1 dark:border-zinc-900"
                            />
                          ) : (
                            <div
                              className="shadow-xs flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black uppercase text-white"
                              style={{ backgroundColor: p.brandColor || "#10B981" }}
                            >
                              {p.name.substring(0, 2)}
                            </div>
                          )}

                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                                {p.displayName || p.name}
                              </h4>
                              {p.distance !== 9999 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                  <MapPin className="h-3 w-3" />
                                  {p.distance.toFixed(1)} miles
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                                <ShieldCheck className="h-3 w-3 text-brand-teal" />
                                NHS Verified
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                              <span>{getCity(p.address)}</span>
                              <span>•</span>
                              <span className="truncate">{p.address}</span>
                            </div>

                            {/* Ratings */}
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>{p.ratingScore.toFixed(1)}</span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                ({p.ratingCount} verified patient reviews)
                              </span>
                            </div>

                            {/* Treatment Badges */}
                            <div className="flex select-none flex-wrap gap-1.5 pt-2">
                              {p.services.map((svc) => (
                                <Link
                                  key={svc.id}
                                  href={`/${p.slug}/${slugify(svc.name)}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                                >
                                  <Tag className="h-3 w-3 text-slate-400" />
                                  <span>{svc.name}</span>
                                  <span className="font-extrabold text-emerald-600">
                                    • £{svc.price.toFixed(2)}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Actions & Availability block */}
                        <div className="flex w-full shrink-0 flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-zinc-900 md:w-auto md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
                          <div className="space-y-1 text-left md:text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                p.isOpenToday
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                              }`}
                            >
                              {p.isOpenToday ? "🟢 Open Today" : "🔴 Closed Today"}
                            </span>

                            <div className="text-[11px] font-bold">
                              {p.slotsToday > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  ⚡ {p.slotsToday} slots available today
                                </span>
                              ) : (
                                <span className="text-rose-500 dark:text-rose-400">
                                  Fully Booked today
                                </span>
                              )}
                            </div>

                            {p.earliestAppointment && (
                              <div className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                <span>Earliest slot: </span>
                                <span style={{ color: p.brandColor || "#10B981" }}>
                                  {p.earliestAppointment}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <Link
                              href={`/provider/${p.slug}`}
                              className="shadow-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              View Clinic
                            </Link>

                            {(() => {
                              const matchedService = serviceFilter
                                ? p.services.find((s) =>
                                    s.name.toLowerCase().includes(serviceFilter.toLowerCase())
                                  ) || p.services[0]
                                : p.services[0];
                              const targetUrl = matchedService
                                ? `/${p.slug}/${slugify(matchedService.name)}`
                                : `/provider/${p.slug}`;
                              return (
                                <Link
                                  href={targetUrl}
                                  className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all hover:opacity-90"
                                  style={{ backgroundColor: p.brandColor || "#10B981" }}
                                >
                                  <span>Book Now</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
