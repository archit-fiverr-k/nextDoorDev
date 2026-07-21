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
  Layers,
  Map as MapIcon,
  List as ListIcon,
  Tag,
  AlertTriangle,
  Mail,
  Loader2,
  CalendarCheck,
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
      // Calculate real distance if coordinates exist
      let distance = 9999;
      if (centerCoords && p.latitude && p.longitude) {
        distance = getDistanceMiles(centerCoords.lat, centerCoords.lng, p.latitude, p.longitude);
      }
      return { ...p, distance };
    });

    // Apply distance filter
    if (distanceFilter !== "anywhere" && centerCoords) {
      const radius = parseFloat(distanceFilter);
      result = result.filter((p) => p.distance <= radius);
    }

    // Apply category filter (future/relation based or service category match)
    if (categoryFilter) {
      result = result.filter(
        (p) => p.services.some((s) => s.isActive) // can be extended to check category relations
      );
    }

    // Apply service filter
    if (serviceFilter) {
      const queryWords = serviceFilter.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter((p) =>
        p.services.some((s) => {
          const serviceNameLower = s.name.toLowerCase();
          return queryWords.every((word) => serviceNameLower.includes(word));
        })
      );
    }

    // Apply open today filter
    if (openTodayFilter) {
      result = result.filter((p) => p.isOpenToday);
    }

    // Apply available today filter
    if (availableTodayFilter) {
      result = result.filter((p) => p.slotsToday > 0);
    }

    // Apply rating filter
    if (ratingFilter) {
      const minRating = parseFloat(ratingFilter);
      result = result.filter((p) => p.ratingScore >= minRating);
    }

    // Apply price filter
    if (maxPrice) {
      const limit = parseFloat(maxPrice);
      result = result.filter((p) => p.services.some((s) => s.price <= limit));
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "distance") {
        return a.distance - b.distance;
      }
      if (sortBy === "rating") {
        return b.ratingScore - a.ratingScore;
      }
      if (sortBy === "earliest") {
        if (!a.earliestAppointmentDate) return 1;
        if (!b.earliestAppointmentDate) return -1;
        return a.earliestAppointmentDate.getTime() - b.earliestAppointmentDate.getTime();
      }
      if (sortBy === "popular") {
        return b.ratingCount - a.ratingCount; // review counts proxy for popularity
      }
      return 0;
    });

    return result;
  }, [
    initialProviders,
    centerCoords,
    distanceFilter,
    categoryFilter,
    serviceFilter,
    openTodayFilter,
    availableTodayFilter,
    ratingFilter,
    maxPrice,
    sortBy,
  ]);

  // 2. Log search queries to analytics DB
  useEffect(() => {
    const sessionToken = sessionStorage.getItem("ndc_search_session") || crypto.randomUUID();
    sessionStorage.setItem("ndc_search_session", sessionToken);

    const startTime = Date.now();

    // Log search after short delay
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

  // 3. Geolocation loading trigger
  const handleLocationSearch = (
    locName: string,
    svcName?: string,
    coords?: { lat: number; lng: number }
  ) => {
    if (coords) {
      setCenterCoords(coords);
    } else if (locName && locName.toLowerCase() !== initialLocation.toLowerCase()) {
      // If location changed but no coordinates yet, redirect to let the server geocode it
      const params = new URLSearchParams(window.location.search);
      params.set("location", locName);
      if (svcName) {
        params.set("service", svcName);
      } else {
        params.delete("service");
      }
      params.delete("lat");
      params.delete("lng");
      window.location.href = `/search?${params.toString()}`;
      return;
    }

    if (svcName !== undefined) {
      setServiceFilter(svcName);
    }
  };

  // 4. Fallback callback request submit handler
  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackLoading(true);
    const serviceId = initialService ? "service-matching" : null;
    const res = await createCallbackRequestAction(
      callbackName,
      callbackPhone,
      callbackEmail || null,
      initialLocation,
      null,
      callbackNotes || "Search Fallback Request"
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

  // 5. Fallback waitlist request submit handler
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);
    const res = await createWaitlistNotificationAction(
      waitlistEmail,
      initialLocation,
      parseInt(distanceFilter) || 10,
      null
    );
    setWaitlistLoading(false);
    if (res.success) {
      setWaitlistSuccess(true);
      setWaitlistEmail("");
    }
  };

  // 6. Google Maps scripts injection loader
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

  // 7. Google Maps markers update loop
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || typeof window === "undefined") return;
    const google = (window as any).google;
    if (!google) return;

    const mapCenter = centerCoords || { lat: 51.5074, lng: -0.1278 }; // London default fallback

    // Instantiate map if not already done
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

    // Clear old markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add search center marker
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

    // Add pharmacy markers
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
          <div style="font-family: sans-serif; padding: 4px; font-size: 11px;">
            <strong style="display: block; font-size: 12px; margin-bottom: 2px;">${p.displayName || p.name}</strong>
            <span style="color: #64748b; display: block; margin-bottom: 4px;">${p.address}</span>
            <span style="font-weight: bold; color: ${p.slotsToday > 0 ? "#10b981" : "#f43f5e"}">
              ${p.slotsToday > 0 ? `${p.slotsToday} slots available` : "Fully Booked"}
            </span>
          </div>
        `,
      });

      marker.addListener("click", () => {
        // Highlight card in list view
        setHighlightedId(p.id);

        // Scroll list card into view
        const element = document.getElementById(`pharmacy-card-${p.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        // Open InfoWindow
        infoWindow.open(googleMapInstance.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [mapsLoaded, processedProviders, centerCoords, highlightedId]);

  return (
    <div className="select-none space-y-6 font-sans text-xs text-slate-800 dark:text-slate-100">
      {/* Search Header Bar (Sticky container) */}
      <div className="dark:border-zinc-850 sticky top-0 z-40 border-y border-slate-200/80 bg-white py-4 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-8">
          <div className="w-full md:w-[480px]">
            <SearchBar
              initialLocation={initialLocation}
              initialService={serviceFilter}
              onSearch={handleLocationSearch}
            />
          </div>

          {/* Location details */}
          <div className="flex shrink-0 items-center space-x-6 font-semibold text-slate-500 dark:text-zinc-400">
            <div>
              <span>Found: </span>
              <strong className="text-slate-900 dark:text-white">
                {processedProviders.length} clinics
              </strong>
            </div>
            <div>
              <span>Bookable Today: </span>
              <strong className="font-black text-emerald-600 dark:text-emerald-500">
                {processedProviders.filter((p) => p.slotsToday > 0).length} open
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-4">
        {/* Left Side: Filter Options Toolbar */}
        <div className="dark:border-zinc-850 h-fit space-y-6 rounded-lg border border-slate-200/80 bg-white p-5 dark:bg-zinc-950 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-900">
            <h3 className="flex items-center space-x-1.5 text-sm font-extrabold text-slate-900 dark:text-slate-200">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filter Results</span>
            </h3>
            <button
              onClick={() => {
                setDistanceFilter("25");
                setCategoryFilter("");
                setServiceFilter("");
                setOpenTodayFilter(false);
                setAvailableTodayFilter(false);
                setRatingFilter("");
                setMaxPrice("");
              }}
              className="text-[10px] text-blue-500 hover:underline"
            >
              Reset All
            </button>
          </div>

          <div className="space-y-4">
            {/* Distance filter */}
            <div className="space-y-1">
              <label className="text-slate-450 block text-[9px] font-black uppercase tracking-wider dark:text-zinc-500">
                Distance Radius
              </label>
              <select
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value)}
                className="h-8 w-full rounded border border-slate-200 px-2 text-[11px] font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
                <option value="anywhere">Anywhere (National)</option>
              </select>
            </div>

            {/* Service filter */}
            <div className="space-y-1">
              <label className="text-slate-450 block text-[9px] font-black uppercase tracking-wider dark:text-zinc-500">
                Clinical Treatment
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="h-8 w-full rounded border border-slate-200 px-2 text-[11px] font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
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
            <div className="space-y-1">
              <label className="text-slate-450 block text-[9px] font-black uppercase tracking-wider dark:text-zinc-500">
                Minimum Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="h-8 w-full rounded border border-slate-200 px-2 text-[11px] font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="">All Ratings</option>
                <option value="4.0">⭐ 4.0+ Stars</option>
                <option value="4.5">⭐ 4.5+ Stars</option>
                <option value="4.8">⭐ 4.8+ Stars</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="space-y-1">
              <label className="text-slate-450 block text-[9px] font-black uppercase tracking-wider dark:text-zinc-500">
                Max Price (£)
              </label>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-8 w-full rounded border border-slate-200 px-2 text-[11px] font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="">Any price</option>
                <option value="20">Under £20</option>
                <option value="50">Under £50</option>
                <option value="100">Under £100</option>
              </select>
            </div>

            {/* Active Toggles */}
            <div className="space-y-3 border-t border-slate-50 pt-3 dark:border-zinc-900">
              <label className="flex cursor-pointer items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={openTodayFilter}
                  onChange={(e) => setOpenTodayFilter(e.target.checked)}
                  className="size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Open Today</span>
              </label>

              <label className="flex cursor-pointer items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={availableTodayFilter}
                  onChange={(e) => setAvailableTodayFilter(e.target.checked)}
                  className="size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Bookable Today
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: List Directory & Map Panels */}
        <div className="space-y-4 lg:col-span-3">
          {/* Controls Bar (Sort & View Toggles) */}
          <div className="dark:border-zinc-850 flex flex-col items-center justify-between gap-4 rounded-lg border border-slate-200/80 bg-white p-4 dark:bg-zinc-950 sm:flex-row">
            {/* Sorting */}
            <div className="flex w-full items-center space-x-2 sm:w-auto">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 flex-1 rounded border border-slate-200 px-2 text-[11px] font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 sm:w-48"
              >
                <option value="distance">Nearest Distance</option>
                <option value="rating">Highest Rated</option>
                <option value="earliest">Earliest Appointment</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* View Mode Toggle buttons */}
            <div className="dark:border-zinc-850 flex shrink-0 items-center space-x-1 rounded-lg border border-slate-200 p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-slate-900 text-white dark:bg-zinc-800"
                    : "text-slate-450 hover:bg-slate-50 dark:hover:bg-zinc-900"
                }`}
              >
                <ListIcon className="h-3.5 w-3.5" />
                <span>List Directory</span>
              </button>

              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 font-bold transition-all ${
                  viewMode === "map"
                    ? "bg-slate-900 text-white dark:bg-zinc-800"
                    : "text-slate-450 hover:bg-slate-50 dark:hover:bg-zinc-900"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span>Map Directory</span>
              </button>
            </div>
          </div>

          {/* Main content display */}
          <div className="grid gap-6">
            {processedProviders.length === 0 ? (
              /* Geolocation fallbacks empty states */
              <div className="space-y-6">
                <div className="dark:border-zinc-850 space-y-4 rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center dark:bg-zinc-950">
                  <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
                  <div>
                    <h3 className="dark:text-slate-250 text-sm font-extrabold text-slate-800">
                      No clinics matching your filter criteria
                    </h3>
                    <p className="mt-1 text-slate-400">
                      Try broadening your search radius or selecting a different clinical treatment
                      category.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Form 1: Request Callback Form */}
                  <div className="dark:border-zinc-850 space-y-4 rounded-lg border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
                    <h4 className="flex items-center gap-1 border-b pb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <Phone className="size-4 shrink-0 text-emerald-500" />
                      <span>Request a Callback</span>
                    </h4>
                    {callbackSuccess ? (
                      <div className="border-emerald-250 flex items-center space-x-2 rounded border bg-emerald-50 p-4 text-emerald-800">
                        <Check className="size-4 shrink-0 text-emerald-600" />
                        <span className="font-bold">
                          Callback request registered! We will reach out shortly.
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleCallbackSubmit} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-400">
                              Your Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={callbackName}
                              onChange={(e) => setCallbackName(e.target.value)}
                              className="h-8 w-full rounded border border-slate-200 px-2 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-400">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              value={callbackPhone}
                              onChange={(e) => setCallbackPhone(e.target.value)}
                              className="h-8 w-full rounded border border-slate-200 px-2 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-slate-400">
                            Email Address (Optional)
                          </label>
                          <input
                            type="email"
                            value={callbackEmail}
                            onChange={(e) => setCallbackEmail(e.target.value)}
                            className="h-8 w-full rounded border border-slate-200 px-2 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-slate-400">
                            Notes / Desired Service
                          </label>
                          <textarea
                            rows={2}
                            value={callbackNotes}
                            onChange={(e) => setCallbackNotes(e.target.value)}
                            placeholder="Tell us what appointment you need..."
                            className="w-full rounded border border-slate-200 p-2 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={callbackLoading}
                          className="h-9 w-full rounded bg-slate-900 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          {callbackLoading ? "Submitting..." : "Submit Callback Request"}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Form 2: Notify Me Waitlist */}
                  <div className="dark:border-zinc-850 space-y-4 rounded-lg border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
                    <h4 className="flex items-center gap-1 border-b pb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <Mail className="size-4 shrink-0 text-blue-500" />
                      <span>Notify Me (Availability Waitlist)</span>
                    </h4>
                    {waitlistSuccess ? (
                      <div className="border-emerald-250 flex items-center space-x-2 rounded border bg-emerald-50 p-4 text-emerald-800">
                        <Check className="size-4 shrink-0 text-emerald-600" />
                        <span className="font-bold">
                          Waitlist registered! You&apos;ll receive alert updates.
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleWaitlistSubmit} className="space-y-3.5">
                        <p className="leading-normal text-slate-400">
                          Get notified automatically as soon as slots or pharmacy partnerships open
                          in the **{initialLocation || "searched"}** area.
                        </p>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-slate-400">
                            Your Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={waitlistEmail}
                            onChange={(e) => setWaitlistEmail(e.target.value)}
                            placeholder="e.g. you@example.com"
                            className="h-8 w-full rounded border border-slate-200 px-2 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={waitlistLoading}
                          className="h-9 w-full rounded bg-slate-900 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          {waitlistLoading ? "Submitting..." : "Subscribe to Notification Alerts"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {/* 1. Map View (rendered conditionally on toggle) */}
                <div
                  ref={mapRef}
                  className={`dark:border-zinc-850 h-96 w-full overflow-hidden rounded-lg border border-slate-200/80 ${
                    viewMode === "map" ? "block" : "hidden"
                  }`}
                  style={{ minHeight: "380px" }}
                />

                {/* 2. List View Directory Cards */}
                <div className={`grid gap-4 ${viewMode === "list" ? "block" : "hidden"}`}>
                  {processedProviders.map((p) => {
                    const isHighlighted = p.id === highlightedId;

                    return (
                      <div
                        id={`pharmacy-card-${p.id}`}
                        key={p.id}
                        className={`flex flex-col items-start justify-between gap-5 rounded-lg border bg-white p-5 transition-all dark:bg-zinc-950 md:flex-row md:items-center ${
                          isHighlighted
                            ? "border-amber-400 ring-2 ring-amber-400/20"
                            : "dark:border-zinc-850 hover:border-slate-350 border-slate-200/80 dark:hover:border-zinc-800"
                        }`}
                      >
                        {/* Left Info block */}
                        <div className="flex min-w-0 items-start space-x-4">
                          {p.logoUrl ? (
                            <img
                              src={p.logoUrl}
                              alt={p.name}
                              className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 bg-white object-contain dark:border-zinc-900"
                            />
                          ) : (
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black uppercase text-white"
                              style={{ backgroundColor: p.brandColor || "#10B981" }}
                            >
                              {p.name.substring(0, 2)}
                            </div>
                          )}

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-y-1 space-x-2">
                              <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {p.displayName || p.name}
                              </h4>
                              {p.distance !== 9999 && (
                                <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-[9px] font-black text-blue-600 dark:bg-blue-950/20">
                                  {p.distance.toFixed(1)} miles away
                                </span>
                              )}
                            </div>

                            <div className="text-slate-450 flex items-center space-x-2 text-[10px] dark:text-zinc-500">
                              <span>{getCity(p.address)}</span>
                              <span>•</span>
                              <span>{p.address}</span>
                            </div>

                            {/* Ratings */}
                            <div className="flex items-center space-x-1 text-[10.5px] font-bold text-amber-500">
                              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-500" />
                              <span>{p.ratingScore.toFixed(1)}</span>
                              <span className="font-normal text-slate-400">
                                ({p.ratingCount} reviews)
                              </span>
                            </div>

                            {/* Service Badges */}
                            <div className="flex select-none flex-wrap gap-1.5 pt-2">
                              {p.services.map((svc) => (
                                <Link
                                  key={svc.id}
                                  href={`/${p.slug}/${slugify(svc.name)}`}
                                  className="dark:text-zinc-350 inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                                >
                                  <Tag className="mr-1 h-2.5 w-2.5" />
                                  <span>{svc.name}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Actions / Availability block */}
                        <div className="flex w-full shrink-0 flex-row items-center justify-between gap-4 border-t border-slate-50 pt-3 dark:border-zinc-900 md:w-auto md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
                          <div className="space-y-1 text-left md:text-right">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-black ${
                                p.isOpenToday
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/20"
                              }`}
                            >
                              {p.isOpenToday ? "🟢 Open Today" : "🔴 Closed Today"}
                            </span>

                            <div className="text-[10px] font-semibold text-slate-500">
                              {p.slotsToday > 0 ? (
                                <span className="font-bold text-emerald-600 dark:text-emerald-500">
                                  {p.slotsToday} slots available today
                                </span>
                              ) : (
                                <span className="font-semibold text-rose-500 dark:text-rose-400">
                                  Fully Booked today
                                </span>
                              )}
                            </div>

                            {p.earliestAppointment && (
                              <div className="text-[10px] font-black text-slate-800 dark:text-slate-200">
                                <span>Earliest slot: </span>
                                <span style={{ color: p.brandColor || "#10B981" }}>
                                  {p.earliestAppointment}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex shrink-0 select-none items-center space-x-2">
                            <Link
                              href={`/provider/${p.slug}`}
                              className="dark:border-zinc-850 dark:text-slate-350 rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 transition-colors hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                            >
                              View Profile
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
                                  className="rounded px-3.5 py-2 text-xs font-black text-white transition-opacity"
                                  style={{ backgroundColor: p.brandColor || "#10B981" }}
                                >
                                  Book Service
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
        </div>
      </div>
    </div>
  );
}
