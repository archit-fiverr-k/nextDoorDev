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
  AlertCircle,
  Mail,
  RotateCcw,
  Building2,
  ChevronRight,
  Filter,
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

    if (availableTodayFilter) {
      result = result.filter((p) => p.slotsToday > 0);
    }

    if (ratingFilter) {
      const minRating = parseFloat(ratingFilter);
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
    ratingFilter,
    maxPrice,
    sortBy,
  ]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setDistanceFilter("25");
    setServiceFilter("");
    setOpenTodayFilter(false);
    setAvailableTodayFilter(false);
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
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px; font-size: 11px;">
            <strong style="display: block; font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 2px;">${
              p.displayName || p.name
            }</strong>
            <span style="color: #64748b; display: block; margin-bottom: 4px;">${p.address}</span>
            <span style="font-weight: 600; font-size: 11px; color: ${
              p.slotsToday > 0 ? "#047857" : "#b91c1c"
            }">
              ${p.slotsToday > 0 ? `${p.slotsToday} slots available today` : "Fully Booked"}
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

  const hasActiveFilters =
    distanceFilter !== "25" ||
    serviceFilter !== "" ||
    openTodayFilter ||
    availableTodayFilter ||
    ratingFilter !== "" ||
    maxPrice !== "";

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* TOP UTILITY HEADER */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-bold text-slate-900 dark:text-white">Search Clinics</span>
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            Showing{" "}
            <strong className="text-slate-900 dark:text-white">{processedProviders.length}</strong>{" "}
            verified healthcare partners
          </div>
        </div>
      </div>

      {/* SEARCH HEADER BAR */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-[600px]">
              <SearchBar
                initialLocation={initialLocation}
                initialService={serviceFilter}
                onSearch={handleLocationSearch}
              />
            </div>

            {/* View Mode & Sort Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <option value="distance">Distance: Nearest</option>
                  <option value="rating">Rating: Highest</option>
                  <option value="earliest">Earliest Availability</option>
                  <option value="popular">Most Reviewed</option>
                </select>
              </div>

              <div className="flex items-center rounded-md border border-slate-300 bg-slate-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                    viewMode === "list"
                      ? "shadow-xs bg-white text-slate-900 dark:bg-zinc-900 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                    viewMode === "map"
                      ? "shadow-xs bg-white text-slate-900 dark:bg-zinc-900 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  <span>Map</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* SIDEBAR FILTERS */}
          <aside className="lg:col-span-3">
            <div className="shadow-xs rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-zinc-800">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <span>Filters</span>
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-4">
                {/* Radius */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Max Distance
                  </label>
                  <select
                    value={distanceFilter}
                    onChange={(e) => setDistanceFilter(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="5">Within 5 miles</option>
                    <option value="10">Within 10 miles</option>
                    <option value="25">Within 25 miles</option>
                    <option value="50">Within 50 miles</option>
                    <option value="anywhere">All Locations (UK)</option>
                  </select>
                </div>

                {/* Treatment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Clinical Treatment
                  </label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">All Treatments</option>
                    {allServiceNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minimum Rating */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Minimum Rating
                  </label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">Any Rating</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.8">4.8+ Stars</option>
                  </select>
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Max Price (£)
                  </label>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">Any Price</option>
                    <option value="20">Under £20</option>
                    <option value="50">Under £50</option>
                    <option value="100">Under £100</option>
                  </select>
                </div>

                {/* Checkbox Options */}
                <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-zinc-800">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={openTodayFilter}
                      onChange={(e) => setOpenTodayFilter(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Open Today
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={availableTodayFilter}
                      onChange={(e) => setAvailableTodayFilter(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Slots Available Today
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* RESULTS CONTENT */}
          <main className="space-y-4 lg:col-span-9">
            {processedProviders.length === 0 ? (
              /* EMPTY STATE */
              <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
                  <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    No matching clinics found
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Try broadening your distance radius or clearing active filters to see more
                    results.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset All Filters
                  </button>
                </div>

                {/* CALLBACK / WAITLIST FORMS */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h4 className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-zinc-800 dark:text-white">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      Request Clinic Callback
                    </h4>
                    {callbackSuccess ? (
                      <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                        Callback request submitted successfully.
                      </div>
                    ) : (
                      <form onSubmit={handleCallbackSubmit} className="mt-3 space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={callbackName}
                            onChange={(e) => setCallbackName(e.target.value)}
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-xs font-medium focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            required
                            value={callbackPhone}
                            onChange={(e) => setCallbackPhone(e.target.value)}
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-xs font-medium focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                            Notes
                          </label>
                          <textarea
                            rows={2}
                            value={callbackNotes}
                            onChange={(e) => setCallbackNotes(e.target.value)}
                            className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-xs font-medium focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={callbackLoading}
                          className="h-8 w-full rounded bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          {callbackLoading ? "Submitting..." : "Submit Request"}
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h4 className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-zinc-800 dark:text-white">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      Availability Alert Waitlist
                    </h4>
                    {waitlistSuccess ? (
                      <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                        Waitlist registration complete.
                      </div>
                    ) : (
                      <form onSubmit={handleWaitlistSubmit} className="mt-3 space-y-3">
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Receive email notifications as soon as new appointment slots become
                          available in this region.
                        </p>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={waitlistEmail}
                            onChange={(e) => setWaitlistEmail(e.target.value)}
                            className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-xs font-medium focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={waitlistLoading}
                          className="h-8 w-full rounded bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          {waitlistLoading ? "Submitting..." : "Subscribe to Alerts"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* MAP VIEW CONTAINER */}
                <div
                  ref={mapRef}
                  className={`h-96 w-full rounded-lg border border-slate-200 bg-white ${
                    viewMode === "map" ? "block" : "hidden"
                  }`}
                  style={{ minHeight: "450px" }}
                />

                {/* LIST VIEW ITEMS */}
                <div className={`space-y-3 ${viewMode === "list" ? "block" : "hidden"}`}>
                  {processedProviders.map((p) => {
                    const isHighlighted = p.id === highlightedId;

                    return (
                      <div
                        id={`pharmacy-card-${p.id}`}
                        key={p.id}
                        className={`rounded-lg border bg-white p-5 transition-all dark:bg-zinc-900 ${
                          isHighlighted
                            ? "border-amber-500 ring-1 ring-amber-500"
                            : "border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          {/* Main Info */}
                          <div className="flex min-w-0 items-start gap-4">
                            {p.logoUrl ? (
                              <img
                                src={p.logoUrl}
                                alt={p.name}
                                className="h-10 w-10 shrink-0 rounded border border-slate-200 bg-white object-contain p-0.5 dark:border-zinc-800"
                              />
                            ) : (
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-xs font-bold uppercase text-white"
                                style={{ backgroundColor: p.brandColor || "#000e35" }}
                              >
                                {p.name.substring(0, 2)}
                              </div>
                            )}

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {p.displayName || p.name}
                                </h3>

                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                                  <MapPin className="h-3 w-3 text-slate-400" />
                                  {p.distance !== 9999
                                    ? `${p.distance.toFixed(1)} miles`
                                    : getCity(p.address)}
                                </span>

                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                  NHS Partner
                                </span>
                              </div>

                              <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                                {p.address}
                              </p>

                              {/* Rating & Reviews */}
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                <div className="flex items-center text-amber-500">
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  <span className="ml-1 font-bold">{p.ratingScore.toFixed(1)}</span>
                                </div>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 dark:text-zinc-400">
                                  {p.ratingCount} reviews
                                </span>
                              </div>

                              {/* Treatment List */}
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {p.services.map((svc) => (
                                  <Link
                                    key={svc.id}
                                    href={`/${p.slug}/${slugify(svc.name)}`}
                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                                  >
                                    <span>{svc.name}</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                      £{svc.price.toFixed(2)}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Status & Action */}
                          <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-slate-100 pt-3 dark:border-zinc-800 md:flex-col md:items-end md:justify-start md:border-t-0 md:pt-0">
                            <div className="space-y-0.5 text-left md:text-right">
                              <div className="flex items-center gap-1.5 text-xs font-medium">
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    p.isOpenToday ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                  {p.isOpenToday ? "Open Today" : "Closed Today"}
                                </span>
                              </div>

                              <div className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                                {p.slotsToday > 0 ? (
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                    {p.slotsToday} slots available today
                                  </span>
                                ) : (
                                  <span className="text-slate-500">Fully booked today</span>
                                )}
                              </div>

                              {p.earliestAppointment && (
                                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                  Earliest:{" "}
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {p.earliestAppointment}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Link
                                href={`/provider/${p.slug}`}
                                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                              >
                                Profile
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
                                    className="rounded bg-[#000e35] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                                  >
                                    Book Appointment
                                  </Link>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
