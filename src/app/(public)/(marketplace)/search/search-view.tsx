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
  Navigation,
  CalendarCheck,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchBar } from "../search-bar";
import { getDistanceMiles, geocodeLocation } from "@/lib/geocoding";
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

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const SYNONYMS_MAP: Record<string, string[]> = {
  vaccine: [
    "vacine",
    "vaccin",
    "vacination",
    "vaccination",
    "vax",
    "shot",
    "jab",
    "booster",
    "immunisation",
    "immunization",
  ],
  flu: ["fluu", "flue", "influenza", "winter", "booster"],
  blood: [
    "blod",
    "bld",
    "phlebotomy",
    "biomarker",
    "screening",
    "screen",
    "lab",
    "cholesterol",
    "lipid",
    "thyroid",
  ],
  ear: ["earwax", "earcare", "microsuction", "syringing", "hearing", "wax", "clearance"],
  travel: ["travle", "traveller", "abroad", "yellow", "fever", "malaria", "typhoid", "rabies"],
  pressure: ["bp", "cardio", "hypertension", "heart", "cardiovascular"],
  weight: ["weght", "management", "loss", "slimming", "ozempic", "mounjaro", "saxenda", "wegovy"],
  london: ["londn", "lond", "central london", "westminster", "camden"],
  manchester: ["manchster", "manc", "salford"],
  leeds: ["leed", "briggate", "west yorkshire"],
  birmingham: ["birminghm", "bullring", "midlands"],
  bristol: ["bristl", "clifton"],
};

function isFuzzyMatch(targetText: string, queryText: string): boolean {
  if (!queryText || !queryText.trim()) return true;
  const target = targetText.toLowerCase().trim();
  const query = queryText.toLowerCase().trim();

  // 1. Direct substring check
  if (target.includes(query) || query.includes(target)) return true;

  // 2. Tokenized check
  const queryTokens = query.split(/\s+/).filter(Boolean);
  const targetTokens = target.split(/[\s,.\-\/]+/).filter(Boolean);

  return queryTokens.every((qToken) => {
    if (targetTokens.some((tToken) => tToken.includes(qToken) || qToken.includes(tToken))) {
      return true;
    }

    for (const [key, synonyms] of Object.entries(SYNONYMS_MAP)) {
      const isQueryKeyOrSyn = qToken === key || synonyms.includes(qToken);
      if (isQueryKeyOrSyn) {
        if (target.includes(key) || synonyms.some((syn) => target.includes(syn))) {
          return true;
        }
      }
    }

    return targetTokens.some((tToken) => {
      if (Math.abs(tToken.length - qToken.length) > 3) return false;
      const maxDist = qToken.length <= 4 ? 1 : qToken.length <= 7 ? 2 : 3;
      return levenshteinDistance(qToken, tToken) <= maxDist;
    });
  });
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
  const router = useRouter();

  // Active search query states
  const [locationFilter, setLocationFilter] = useState<string>(initialLocation || "");
  const [serviceFilter, setServiceFilter] = useState<string>(initialService || "");

  // Coordinates of search center
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  // View state: list vs map
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Highlighted provider from map marker click
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Mobile filter drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [distanceFilter, setDistanceFilter] = useState<string>("25");
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

  // 1. Process client-side filtering and sorting with fuzzy typo tolerance
  const processedProviders = React.useMemo(() => {
    let result = initialProviders.map((p) => {
      let distance = 9999;
      if (centerCoords && p.latitude && p.longitude) {
        distance = getDistanceMiles(centerCoords.lat, centerCoords.lng, p.latitude, p.longitude);
      }
      return { ...p, distance };
    });

    // Location text and distance radius filtering
    const locQuery = (locationFilter || "").trim();
    if (locQuery) {
      result = result.filter((p) => {
        if (centerCoords && p.distance !== 9999) {
          const radius = distanceFilter !== "anywhere" ? parseFloat(distanceFilter) : 100;
          if (p.distance <= radius) return true;
        }
        const fullLocationText = `${p.name} ${p.displayName || ""} ${p.address} ${p.city || ""} ${p.postcode || ""}`;
        return isFuzzyMatch(fullLocationText, locQuery);
      });
    } else if (distanceFilter !== "anywhere" && centerCoords) {
      const radius = parseFloat(distanceFilter);
      result = result.filter((p) => p.distance <= radius);
    }

    // Service query with fuzzy typo-tolerant matching
    if (serviceFilter && serviceFilter.trim()) {
      result = result.filter((p) =>
        p.services.some((s) => {
          const fullServiceText = `${s.name} ${s.description || ""}`;
          return isFuzzyMatch(fullServiceText, serviceFilter);
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
      if (sortBy === "distance") {
        if (a.distance !== 9999 && b.distance !== 9999) {
          return a.distance - b.distance;
        }
      }
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
    locationFilter,
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
    setLocationFilter("");
    setDistanceFilter("25");
    setServiceFilter("");
    setOpenTodayFilter(false);
    setAvailableTodayFilter(false);
    setRatingFilter("");
    setMaxPrice("");
    setSortBy("distance");
    router.push("/search", { scroll: false });
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
        locationFilter || "General Search",
        detectedType,
        processedProviders.length,
        duration,
        sessionToken
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [locationFilter, centerCoords, processedProviders.length]);

  const handleLocationSearch = (
    locName: string,
    svcName?: string,
    coords?: { lat: number; lng: number }
  ) => {
    const newLoc = locName || "";
    const newSvc = svcName !== undefined ? svcName : serviceFilter;

    setLocationFilter(newLoc);
    setServiceFilter(newSvc);

    if (coords) {
      setCenterCoords(coords);
    } else if (newLoc && newLoc.toLowerCase() !== "current location") {
      const geocoded = geocodeLocation(newLoc);
      if (geocoded) {
        setCenterCoords({ lat: geocoded.lat, lng: geocoded.lng });
      } else {
        setCenterCoords(null);
      }
    } else {
      setCenterCoords(null);
    }

    const queryParams = new URLSearchParams();
    if (newLoc) queryParams.set("location", newLoc);
    if (newSvc) queryParams.set("service", newSvc);
    if (coords) {
      queryParams.set("lat", coords.lat.toString());
      queryParams.set("lng", coords.lng.toString());
    }

    const newUrl = `/search${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
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

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
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

    markersRef.current.forEach((marker) => {
      if (marker.setMap) marker.setMap(null);
      else marker.map = null;
    });
    markersRef.current = [];

    const createMarker = (
      position: { lat: number; lng: number },
      title: string,
      iconUrl: string
    ) => {
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        const pinImg = document.createElement("img");
        pinImg.src = iconUrl;
        pinImg.style.width = "32px";
        pinImg.style.height = "32px";
        return new google.maps.marker.AdvancedMarkerElement({
          position,
          map: googleMapInstance.current,
          title,
          content: pinImg,
        });
      }
      return new google.maps.Marker({
        position,
        map: googleMapInstance.current,
        title,
        icon: { url: iconUrl },
      });
    };

    if (centerCoords) {
      const centerMarker = createMarker(
        centerCoords,
        "Your Search Location",
        "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      );
      markersRef.current.push(centerMarker);
    }

    processedProviders.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const iconUrl =
        p.id === highlightedId
          ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
          : "https://maps.google.com/mapfiles/ms/icons/green-dot.png";

      const marker = createMarker(
        { lat: p.latitude, lng: p.longitude },
        p.displayName || p.name,
        iconUrl
      );

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

      if (marker.addListener) {
        marker.addListener("click", () => {
          setHighlightedId(p.id);
          const element = document.getElementById(`pharmacy-card-${p.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          infoWindow.open(googleMapInstance.current, marker);
        });
      }

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
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 md:px-8">
        {/* MOBILE FILTER & SORT BAR (< lg) */}
        <div className="shadow-xs mb-4 flex items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="shadow-2xs flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-black text-slate-800 transition active:scale-95"
          >
            <Filter className="h-4 w-4 text-emerald-600" />
            <span>Filter Clinics</span>
            {hasActiveFilters && <span className="flex h-2 w-2 rounded-full bg-emerald-500" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800"
            >
              <option value="distance">Nearest</option>
              <option value="rating">Highest Rated</option>
              <option value="earliest">Earliest Date</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* MOBILE FILTER DRAWER OVERLAY (< lg) */}
        {mobileFiltersOpen && (
          <div className="backdrop-blur-xs fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 lg:hidden">
            <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl duration-200 animate-in slide-in-from-bottom dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
                <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                  <Filter className="h-4 w-4 text-emerald-600" /> Filter Healthcare Clinics
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                {/* Radius */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Max Distance
                  </label>
                  <select
                    value={distanceFilter}
                    onChange={(e) => setDistanceFilter(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Clinical Treatment
                  </label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Minimum Rating
                  </label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">Any Rating</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.8">4.8+ Stars</option>
                  </select>
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Max Price (£)
                  </label>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">Any Price</option>
                    <option value="20">Under £20</option>
                    <option value="50">Under £50</option>
                    <option value="100">Under £100</option>
                  </select>
                </div>

                {/* Checkbox Options */}
                <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-zinc-800">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={openTodayFilter}
                      onChange={(e) => setOpenTodayFilter(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
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
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Slots Available Today
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    handleResetFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="flex-1 rounded-xl border border-slate-300 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 active:scale-95"
                >
                  Show {processedProviders.length} Clinics
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* DESKTOP SIDEBAR FILTERS (hidden lg:block) */}
          <aside className="hidden lg:col-span-3 lg:block">
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
            {/* Search Context Banner */}
            {serviceFilter && (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 px-5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">You searched for:</span>
                  <span className="rounded-full border border-emerald-300 bg-emerald-200/60 px-2.5 py-1 font-extrabold text-emerald-950">
                    {serviceFilter}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setServiceFilter("")}
                  className="flex items-center gap-1 font-bold text-emerald-800 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear Context
                </button>
              </div>
            )}

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

                    // Resolve matched service from filter
                    const matchedService = serviceFilter
                      ? p.services.find((s) =>
                          s.name.toLowerCase().includes(serviceFilter.toLowerCase())
                        ) || p.services[0]
                      : p.services[0];

                    const matchedServicesList = serviceFilter
                      ? p.services.filter((s) =>
                          s.name.toLowerCase().includes(serviceFilter.toLowerCase())
                        )
                      : p.services;

                    return (
                      <div
                        id={`pharmacy-card-${p.id}`}
                        key={p.id}
                        className={`shadow-xs rounded-2xl border bg-white p-4 transition-all sm:p-5 ${
                          isHighlighted
                            ? "border-emerald-500 ring-2 ring-emerald-500/20"
                            : "border-slate-200/90 hover:border-emerald-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          {/* Main Info */}
                          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                            {p.logoUrl ? (
                              <img
                                src={p.logoUrl}
                                alt={p.name}
                                className="shadow-xs h-10 w-10 shrink-0 rounded-2xl border border-slate-200 bg-white object-contain p-1 sm:h-12 sm:w-12"
                              />
                            ) : (
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black uppercase text-white shadow-sm sm:h-12 sm:w-12"
                                style={{ backgroundColor: p.brandColor || "#10B981" }}
                              >
                                {p.name.substring(0, 2)}
                              </div>
                            )}

                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <h3 className="text-sm font-black leading-snug text-slate-900 sm:text-base">
                                  {p.displayName || p.name}
                                </h3>

                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                                  <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                                  GPhC Partner
                                </span>
                              </div>

                              <p className="truncate text-xs font-medium text-slate-500">
                                {p.address}
                              </p>

                              {/* Distance & Reviews Badges */}
                              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                  {p.distance !== 9999
                                    ? `${p.distance.toFixed(1)} mi away`
                                    : getCity(p.address)}
                                </span>

                                <div className="flex items-center rounded-md border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-amber-500">
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  <span className="ml-1 font-bold text-amber-900">
                                    {p.ratingScore.toFixed(1)}
                                  </span>
                                  <span className="ml-1 text-[10px] text-amber-700">
                                    ({p.ratingCount})
                                  </span>
                                </div>
                              </div>

                              {/* Matched Service Context Highlight */}
                              {matchedService && (
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs font-semibold text-emerald-950">
                                  <span className="flex min-w-0 items-center gap-1.5">
                                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                                    <span className="truncate">
                                      <strong>{matchedService.name}</strong>
                                    </span>
                                  </span>
                                  <span className="shrink-0 font-extrabold text-emerald-700">
                                    £{matchedService.price.toFixed(2)} ({matchedService.duration}m)
                                  </span>
                                </div>
                              )}

                              {/* Multiple Matched Services Chips */}
                              {matchedServicesList.length > 1 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  <span className="self-center text-[10px] font-bold uppercase text-slate-400">
                                    Options:
                                  </span>
                                  {matchedServicesList.map((svc) => (
                                    <Link
                                      key={svc.id}
                                      href={`/book/${p.slug}?serviceId=${svc.id}`}
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-800 transition hover:border-emerald-500 hover:bg-emerald-50"
                                    >
                                      <span>{svc.name}</span>
                                      <span className="font-extrabold text-emerald-700">
                                        £{svc.price.toFixed(2)}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status & Mobile Responsive Action Buttons */}
                          <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 pt-3 lg:items-end lg:justify-between lg:border-t-0 lg:pt-0">
                            <div className="flex items-center justify-between gap-1 lg:flex-col lg:items-end lg:justify-start">
                              <div className="flex items-center gap-1.5 text-xs font-semibold">
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    p.isOpenToday ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                                <span className="font-bold text-slate-800">
                                  {p.isOpenToday ? "Open Today" : "Closed Today"}
                                </span>
                              </div>

                              {p.earliestAppointment && (
                                <div className="text-[11px] font-semibold text-slate-500">
                                  Earliest:{" "}
                                  <span className="font-bold text-emerald-700">
                                    {p.earliestAppointment}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons: Book Now (Primary) vs View Service (Secondary) */}
                            {matchedService && (
                              <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto">
                                <Link
                                  href={`/book/${p.slug}?serviceId=${matchedService.id}`}
                                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-center text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 active:scale-95 sm:py-2.5"
                                >
                                  <span>Book Now</span>
                                  <ChevronRight className="h-4 w-4" />
                                </Link>

                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/${p.slug}/${slugify(matchedService.name)}`}
                                    className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:flex-none sm:py-2.5"
                                  >
                                    <span>View Service</span>
                                  </Link>

                                  <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(`${p.name} ${p.address}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:border-emerald-300 hover:text-emerald-600 sm:p-2.5"
                                    title="Get Directions"
                                  >
                                    <Navigation className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                            )}
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
