"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Loader2,
  History,
  Sparkles,
  Navigation,
  X,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Tag,
} from "lucide-react";

export interface SearchBarProps {
  className?: string;
  initialLocation?: string;
  onSearch?: (location: string, service?: any, coordinates?: { lat: number; lng: number }) => void;
  showServiceInput?: boolean;
  initialService?: string;
}

const popularLocations = ["London", "Manchester", "Leeds", "Bristol", "Birmingham"];

// Medical Synonym & Alias Dictionary
const MEDICAL_SYNONYM_MAP: { [key: string]: { name: string; category: string } } = {
  erectile: { name: "Erectile Dysfunction Treatment (Private)", category: "Men's Health Services" },
  "erectile dysfunction": {
    name: "Erectile Dysfunction Treatment (Private)",
    category: "Men's Health Services",
  },
  ed: { name: "Erectile Dysfunction Treatment (Private)", category: "Men's Health Services" },
  viagra: { name: "Erectile Dysfunction Treatment (Private)", category: "Men's Health Services" },
  sildenafil: {
    name: "Erectile Dysfunction Treatment (Private)",
    category: "Men's Health Services",
  },
  tadalafil: {
    name: "Erectile Dysfunction Treatment (Private)",
    category: "Men's Health Services",
  },
  hair: { name: "Hair Loss Treatment (Private)", category: "Men's Health Services" },
  "hair loss": { name: "Hair Loss Treatment (Private)", category: "Men's Health Services" },
  finasteride: { name: "Hair Loss Treatment (Private)", category: "Men's Health Services" },
  covid: { name: "COVID Booster Vaccination", category: "Vaccinations" },
  "covid jab": { name: "COVID Booster Vaccination", category: "Vaccinations" },
  "covid vaccine": { name: "COVID Booster Vaccination", category: "Vaccinations" },
  "covid booster": { name: "COVID Booster Vaccination", category: "Vaccinations" },
  flu: { name: "Flu Vaccination", category: "Vaccinations" },
  "flu shot": { name: "Flu Vaccination", category: "Vaccinations" },
  "flu jab": { name: "Flu Vaccination", category: "Vaccinations" },
  "blood test": { name: "Blood Testing & Phlebotomy", category: "Blood Testing" },
  phlebotomy: { name: "Blood Testing & Phlebotomy", category: "Blood Testing" },
  "blood work": { name: "Blood Testing & Phlebotomy", category: "Blood Testing" },
  "ear wax": { name: "Ear Wax Removal", category: "Ear Care" },
  "ear cleaning": { name: "Ear Wax Removal", category: "Ear Care" },
  microsuction: { name: "Ear Wax Removal", category: "Ear Care" },
  travel: { name: "Travel Health Consultation", category: "Travel Health" },
  "travel jab": { name: "Travel Health Consultation", category: "Travel Health" },
  "yellow fever": { name: "Travel Health Consultation", category: "Travel Health" },
};

export function SearchBar({
  className = "",
  initialLocation = "",
  showServiceInput = true,
  initialService = "",
  onSearch,
}: SearchBarProps) {
  const router = useRouter();

  const [location, setLocation] = useState(initialLocation);
  const [service, setService] = useState(initialService);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [serviceSuggestions, setServiceSuggestions] = useState<any[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [serviceIsOpen, setServiceIsOpen] = useState(false);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [serviceHighlightedIndex, setServiceHighlightedIndex] = useState(-1);

  const [loading, setLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceInputRef = useRef<HTMLInputElement>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const serviceDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setServiceIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Service Autocomplete Suggestions (Compact Dropdown, max 6–8)
  const fetchServiceSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 1) {
      setServiceSuggestions([]);
      setServiceLoading(false);
      return;
    }

    const clean = query.trim().toLowerCase();

    // Check alias match
    const aliasMatches: any[] = [];
    Object.keys(MEDICAL_SYNONYM_MAP).forEach((key) => {
      if (clean.length >= 2 && (key.includes(clean) || clean.includes(key))) {
        const mapped = MEDICAL_SYNONYM_MAP[key];
        if (!aliasMatches.some((m) => m.name === mapped.name)) {
          aliasMatches.push({
            name: mapped.name,
            category: mapped.category,
            isAlias: true,
          });
        }
      }
    });

    try {
      const res = await fetch(
        `/api/search/autocomplete?type=service&q=${encodeURIComponent(clean)}`
      );
      if (res.ok) {
        const data = await res.json();
        const apiItems = Array.isArray(data) ? data : [];

        // Merge alias matches + API suggestions (max 8)
        const combined = [...aliasMatches];
        apiItems.forEach((item: any) => {
          const itemName = typeof item === "string" ? item : item.name;
          if (!combined.some((c) => c.name.toLowerCase() === itemName.toLowerCase())) {
            combined.push({
              name: itemName,
              category:
                typeof item === "object" ? item.category || "Clinical Service" : "Clinical Service",
              count: typeof item === "object" ? item.count || 0 : 0,
              statusText: typeof item === "object" ? item.statusText || "" : "",
            });
          }
        });

        setServiceSuggestions(combined.slice(0, 8));
      } else {
        setServiceSuggestions(aliasMatches.slice(0, 8));
      }
    } catch (err) {
      setServiceSuggestions(aliasMatches.slice(0, 8));
    } finally {
      setServiceLoading(false);
    }
  }, []);

  // Fetch Location Autocomplete Suggestions from Live Database
  const fetchLocationSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/search/autocomplete?type=location&q=${encodeURIComponent(query.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
      }
    } catch (err) {
      console.error("Location suggestion error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocation(val);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.trim()) {
      setLoading(true);
      setIsOpen(true);
      debounceTimerRef.current = setTimeout(() => fetchLocationSuggestions(val), 100);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setService(val);
    setServiceHighlightedIndex(-1);

    // Instant local alias matching (0ms latency response)
    const clean = val.trim().toLowerCase();
    if (clean.length >= 1) {
      const aliasMatches: any[] = [];
      Object.keys(MEDICAL_SYNONYM_MAP).forEach((key) => {
        if (clean.length >= 2 && (key.includes(clean) || clean.includes(key))) {
          const mapped = MEDICAL_SYNONYM_MAP[key];
          if (!aliasMatches.some((m) => m.name === mapped.name)) {
            aliasMatches.push({
              name: mapped.name,
              category: mapped.category,
              isAlias: true,
            });
          }
        }
      });
      if (aliasMatches.length > 0) {
        setServiceSuggestions(aliasMatches);
        setServiceIsOpen(true);
      }
    }

    if (serviceDebounceTimerRef.current) clearTimeout(serviceDebounceTimerRef.current);
    if (val.trim()) {
      setServiceLoading(true);
      setServiceIsOpen(true);
      serviceDebounceTimerRef.current = setTimeout(() => fetchServiceSuggestions(val), 100);
    } else {
      setServiceSuggestions([]);
      setServiceIsOpen(false);
    }
  };

  const executeSearch = (locParam?: string, servParam?: string) => {
    const finalLoc = locParam !== undefined ? locParam : location;
    const finalServ = servParam !== undefined ? servParam : service;

    setIsOpen(false);
    setServiceIsOpen(false);

    if (onSearch) {
      onSearch(finalLoc, finalServ);
    } else {
      const params = new URLSearchParams();
      if (finalLoc.trim()) params.set("location", finalLoc.trim());
      if (finalServ.trim()) params.set("service", finalServ.trim());
      router.push(`/search?${params.toString()}`);
    }
  };

  // Browser Geolocation Trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.postcode ||
              "Current Location";
            setLocation(city);
            executeSearch(city, service);
          }
        } catch (e) {
          setLocation("Current Location");
          executeSearch("Current Location", service);
        } finally {
          setGeoLoading(false);
        }
      },
      () => setGeoLoading(false)
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-lg backdrop-blur-md transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950 md:flex-row md:rounded-full">
        {/* SERVICE INPUT FIELD */}
        {showServiceInput && (
          <div className="relative w-full flex-1">
            <div className="flex min-h-[48px] items-center space-x-3 px-3.5 py-2.5">
              <Stethoscope className="h-5 w-5 shrink-0 text-[#10B981]" />
              <input
                ref={serviceInputRef}
                type="text"
                value={service}
                onChange={handleServiceChange}
                onFocus={() => {
                  if (service.trim()) setServiceIsOpen(true);
                  // Mobile viewport scroll
                  serviceInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                placeholder="What service do you need? (e.g. COVID, Blood Test)"
                className="w-full text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-transparent dark:text-white sm:text-sm"
              />
              {service && (
                <button
                  onClick={() => {
                    setService("");
                    setServiceIsOpen(false);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* COMPACT SERVICE AUTOCOMPLETE DROPDOWN (Scrollable & Lightweight) */}
            {serviceIsOpen && serviceSuggestions.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-2 max-h-[300px] w-full min-w-[320px] overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:min-w-[400px]">
                <div className="sticky top-0 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:bg-zinc-900">
                  Services & Treatments
                </div>
                {serviceSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setService(item.name);
                      setServiceIsOpen(false);
                      executeSearch(location, item.name);
                    }}
                    className="group flex cursor-pointer items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <div className="flex min-w-0 items-center space-x-2.5">
                      <Stethoscope className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-[#10B981]" />
                      <span className="truncate text-xs font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                    </div>

                    <span className="ml-2 shrink-0 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                      {item.category || "Treatment"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DIVIDER ON DESKTOP */}
        {showServiceInput && (
          <div className="hidden h-8 w-px bg-slate-200 dark:bg-zinc-800 md:block" />
        )}

        {/* LOCATION INPUT FIELD */}
        <div className="relative w-full flex-1">
          <div className="flex min-h-[48px] items-center space-x-3 px-3.5 py-2.5">
            <MapPin className="h-5 w-5 shrink-0 text-[#10B981]" />
            <input
              ref={inputRef}
              type="text"
              value={location}
              onChange={handleLocationChange}
              onFocus={() => {
                setIsOpen(true);
                inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              placeholder="City or Postcode (e.g. London, LS1 6AZ)"
              className="w-full text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-transparent dark:text-white sm:text-sm"
            />
            {location && (
              <button
                onClick={() => {
                  setLocation("");
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* COMPACT LOCATION AUTOCOMPLETE DROPDOWN (Scrollable & Lightweight) */}
          {isOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 max-h-[300px] w-full min-w-[320px] overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:min-w-[400px]">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex w-full items-center space-x-2.5 px-3.5 py-2.5 text-xs font-bold text-[#10B981] hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40"
              >
                {geoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                <span>Use Current Location</span>
              </button>

              {suggestions.length > 0 && (
                <>
                  <div className="sticky top-0 bg-white px-3 py-1 pt-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900">
                    Matching Locations
                  </div>
                  {suggestions.map((sug, idx) => {
                    const locName = typeof sug === "string" ? sug : sug.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setLocation(locName);
                          setIsOpen(false);
                          executeSearch(locName, service);
                        }}
                        className="group flex cursor-pointer items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <div className="flex min-w-0 items-center space-x-2.5">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-[#10B981]" />
                          <span className="truncate text-xs font-medium text-slate-900 dark:text-white">
                            {locName}
                          </span>
                        </div>

                        {typeof sug === "object" && sug.statusText && (
                          <span className="ml-2 shrink-0 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                            {sug.statusText}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* SEARCH BUTTON */}
        <button
          onClick={() => executeSearch()}
          className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center space-x-2 rounded-xl bg-[#10B981] px-6 py-3 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600 md:w-auto md:rounded-full"
        >
          <Search className="h-4 w-4 stroke-[3]" />
          <span>Search Clinics</span>
        </button>
      </div>
    </div>
  );
}
