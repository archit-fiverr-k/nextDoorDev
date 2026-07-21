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
} from "lucide-react";

interface Suggestion {
  type: "city" | "postcode" | "outcode" | "service";
  name: string;
  count: number;
  status: "green" | "yellow" | "red" | "grey";
  statusText: string;
  earliestAppointment?: string;
}

export interface SearchBarProps {
  className?: string;
  initialLocation?: string;
  onSearch?: (location: string, service?: any, coordinates?: { lat: number; lng: number }) => void;
  showServiceInput?: boolean;
  initialService?: string;
}

const popularLocations = ["London", "Manchester", "Leeds", "Bristol", "Birmingham"];

const highlightMatch = (text: string, query: string) => {
  if (!query || !query.trim()) return <span>{text}</span>;
  const cleanQuery = query.trim();
  const escapedQuery = cleanQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === cleanQuery.toLowerCase() ? (
          <strong key={i} className="font-extrabold text-slate-900 dark:text-white">
            {part}
          </strong>
        ) : (
          <span key={i} className="font-normal text-slate-500 dark:text-slate-400">
            {part}
          </span>
        )
      )}
    </span>
  );
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [serviceSuggestions, setServiceSuggestions] = useState<any[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [serviceIsOpen, setServiceIsOpen] = useState(false);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [serviceHighlightedIndex, setServiceHighlightedIndex] = useState(-1);

  const [loading, setLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);

  // Geolocation loading state
  const [geoLoading, setGeoLoading] = useState(false);

  // Recent & Popular searches states
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentServiceSearches, setRecentServiceSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceInputRef = useRef<HTMLInputElement>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const serviceDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("ndc_recent_searches");
        if (stored) {
          setRecentSearches(JSON.parse(stored).slice(0, 5));
        }
        const storedServices = localStorage.getItem("ndc_recent_services");
        if (storedServices) {
          setRecentServiceSearches(JSON.parse(storedServices).slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to load recent searches:", e);
      }
    }
  }, []);

  // Fetch popular searches from DB analytics on focus
  const loadPopularSearches = useCallback(async () => {
    try {
      const res = await fetch("/api/search/autocomplete?q=");
      if (res.ok) {
        const data = await res.json();
        if (data.popularSearches) {
          setPopularSearches(data.popularSearches);
        }
      }
    } catch (e) {
      console.error("Failed to load popular searches:", e);
    }
  }, []);

  useEffect(() => {
    loadPopularSearches();
  }, [loadPopularSearches]);

  // Sync initial values
  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  useEffect(() => {
    setService(initialService);
  }, [initialService]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setServiceIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save location query to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query || query.trim().length < 2) return;
    const clean = query.trim();
    const updated = [
      clean,
      ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("ndc_recent_searches", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save recent search:", e);
    }
  };

  // Save service query to recent searches
  const saveRecentServiceSearch = (query: string) => {
    if (!query || query.trim().length < 2) return;
    const clean = query.trim();
    const updated = [
      clean,
      ...recentServiceSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, 5);
    setRecentServiceSearches(updated);
    try {
      localStorage.setItem("ndc_recent_services", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save recent service search:", e);
    }
  };

  // Fetch suggestions with debounce for location
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(query)}&type=location`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Autocomplete fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch suggestions with debounce for service
  const fetchServiceSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setServiceSuggestions([]);
      setServiceLoading(false);
      return;
    }

    setServiceLoading(true);
    try {
      const res = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(query)}&type=service`
      );
      if (res.ok) {
        const data = await res.json();
        setServiceSuggestions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Service autocomplete fetch error:", e);
    } finally {
      setServiceLoading(false);
    }
  }, []);

  // Handle location field inputs
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    setIsOpen(true);
    setServiceIsOpen(false);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle service field inputs
  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setService(value);
    setServiceIsOpen(true);
    setIsOpen(false);
    setServiceHighlightedIndex(-1);

    if (serviceDebounceTimerRef.current) {
      clearTimeout(serviceDebounceTimerRef.current);
    }

    serviceDebounceTimerRef.current = setTimeout(() => {
      fetchServiceSuggestions(value);
    }, 300);
  };

  // Browser Geolocation Permission Trigger
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGeoLoading(true);
    setIsOpen(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeoLoading(false);
        setLocation("Current Location");
        saveRecentSearch("Current Location");

        if (onSearch) {
          onSearch("Current Location", service, { lat: latitude, lng: longitude });
        } else {
          router.push(
            `/search?location=Current%20Location&service=${encodeURIComponent(service)}&lat=${latitude}&lng=${longitude}`
          );
        }
      },
      (error) => {
        setGeoLoading(false);
        console.error("Geolocation error:", error);
        alert("Failed to access your current location. Please verify browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Keyboard navigation inside location autocomplete list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const listLength = suggestions.length + 1; // +1 for "Use current location" row
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % listLength);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + listLength) % listLength);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex === 0) {
        handleUseCurrentLocation();
      } else if (highlightedIndex > 0 && highlightedIndex <= suggestions.length) {
        selectSuggestion(suggestions[highlightedIndex - 1]);
      } else {
        handleSubmit(e);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Keyboard navigation inside service autocomplete list
  const handleServiceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const listLength = serviceSuggestions.length;
    if (!serviceIsOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setServiceHighlightedIndex((prev) => (prev + 1) % listLength);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setServiceHighlightedIndex((prev) => (prev - 1 + listLength) % listLength);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (serviceHighlightedIndex >= 0 && serviceHighlightedIndex < serviceSuggestions.length) {
        selectServiceSuggestion(serviceSuggestions[serviceHighlightedIndex].name);
      } else {
        handleSubmit(e);
      }
    } else if (e.key === "Escape") {
      setServiceIsOpen(false);
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    setLocation(s.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    saveRecentSearch(s.name);

    if (onSearch) {
      onSearch(s.name, service);
    } else {
      router.push(
        `/search?location=${encodeURIComponent(s.name)}&service=${encodeURIComponent(service)}`
      );
    }
  };

  const selectServiceSuggestion = (svcName: string) => {
    setService(svcName);
    setServiceIsOpen(false);
    setServiceHighlightedIndex(-1);
    saveRecentServiceSearch(svcName);

    if (onSearch) {
      onSearch(location, svcName);
    } else {
      router.push(
        `/search?location=${encodeURIComponent(location)}&service=${encodeURIComponent(svcName)}`
      );
    }
  };

  const selectTextQuery = (query: string) => {
    setLocation(query);
    setIsOpen(false);
    setHighlightedIndex(-1);
    saveRecentSearch(query);

    if (onSearch) {
      onSearch(query, service);
    } else {
      router.push(
        `/search?location=${encodeURIComponent(query)}&service=${encodeURIComponent(service)}`
      );
    }
  };

  const selectServiceTextQuery = (query: string) => {
    setService(query);
    setServiceIsOpen(false);
    setServiceHighlightedIndex(-1);
    saveRecentServiceSearch(query);

    if (onSearch) {
      onSearch(location, query);
    } else {
      router.push(
        `/search?location=${encodeURIComponent(location)}&service=${encodeURIComponent(query)}`
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    setServiceIsOpen(false);

    saveRecentSearch(location);
    if (service) {
      saveRecentServiceSearch(service);
    }

    if (onSearch) {
      onSearch(location, service);
    } else {
      router.push(
        `/search?location=${encodeURIComponent(location)}&service=${encodeURIComponent(service)}`
      );
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-emerald-500";
      case "yellow":
        return "bg-amber-500";
      case "red":
        return "bg-rose-500";
      case "grey":
      default:
        return "bg-slate-350";
    }
  };

  const clearInput = () => {
    setLocation("");
    setSuggestions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearServiceInput = () => {
    setService("");
    setServiceSuggestions([]);
    if (serviceInputRef.current) {
      serviceInputRef.current.focus();
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.closest("ul") ||
      target.closest("li")
    ) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (showServiceInput) {
      if (clickX < width / 2) {
        if (serviceInputRef.current) {
          serviceInputRef.current.focus();
        }
      } else {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } else {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const isSuggestionsDropdownOpen = isOpen || (showServiceInput && serviceIsOpen);

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`shadow-soft relative w-full cursor-text select-none rounded-[12px] border border-slate-200/80 bg-white p-1.5 transition-all focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/10 dark:border-zinc-800/80 dark:bg-zinc-900 ${
        isSuggestionsDropdownOpen ? "z-50" : "z-10"
      } ${className}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 md:flex-row md:items-center">
        {showServiceInput && (
          <>
            {/* Service Input */}
            <div className="relative flex min-w-0 flex-1 items-center gap-3 px-3">
              <Stethoscope className="size-4 shrink-0 text-slate-400" />
              <input
                ref={serviceInputRef}
                type="text"
                value={service}
                onChange={handleServiceChange}
                onKeyDown={handleServiceKeyDown}
                onFocus={() => {
                  setServiceIsOpen(true);
                  setIsOpen(false);
                }}
                placeholder="Service (e.g. Covid vaccination)"
                className="w-full border-none bg-transparent py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-slate-100 sm:text-sm"
              />
              {service && (
                <button
                  type="button"
                  onClick={clearServiceInput}
                  className="hover:text-slate-650 shrink-0 rounded-full p-1 text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="hidden h-8 w-px shrink-0 self-center bg-slate-200 dark:bg-zinc-800 md:block" />
          </>
        )}

        {/* Location Input */}
        <div className="relative flex min-w-0 flex-1 items-center gap-3 px-3">
          {geoLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" />
          ) : (
            <MapPin className="size-4 shrink-0 text-slate-400" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={location}
            onChange={handleLocationChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsOpen(true);
              setServiceIsOpen(false);
            }}
            placeholder="Search by postcode or city"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className="w-full border-none bg-transparent py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-slate-100 sm:text-sm"
          />
          {location && (
            <button
              type="button"
              onClick={clearInput}
              className="hover:text-slate-650 shrink-0 rounded-full p-1 text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {(loading || serviceLoading) && (
          <Loader2 className="mr-1 size-4 shrink-0 animate-spin text-slate-400" />
        )}

        <button
          type="submit"
          className="h-9 shrink-0 rounded-[10px] bg-slate-900 px-5 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Search
        </button>
      </form>

      {/* Service Autocomplete Dropdown List Overlay */}
      {showServiceInput && serviceIsOpen && (
        <div className="shadow-elevated absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-hidden overflow-y-auto rounded-[12px] border border-slate-200/85 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-900">
          {serviceSuggestions.length > 0 ? (
            <ul role="listbox" className="dark:divide-zinc-850/50 divide-y divide-slate-50">
              {serviceSuggestions.map((s, idx) => {
                const isHighlighted = idx === serviceHighlightedIndex;
                return (
                  <li
                    key={s.name}
                    role="option"
                    aria-selected={isHighlighted}
                    onClick={() => selectServiceSuggestion(s.name)}
                    onMouseEnter={() => setServiceHighlightedIndex(idx)}
                    className={`flex cursor-pointer flex-col gap-1 p-3.5 transition-colors ${
                      isHighlighted ? "dark:bg-zinc-850/60 bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="shrink-0 text-slate-400">💉</span>
                        <span className="text-slate-850 truncate font-bold dark:text-slate-100">
                          {highlightMatch(s.name, service)}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`size-2 rounded-full ${getStatusDotColor(s.status)}`} />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {s.statusText}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="dark:border-zinc-850/50 space-y-4 border-t border-slate-50 bg-slate-50/20 p-4 dark:bg-zinc-950/10">
              {service.trim().length >= 2 ? (
                <div className="py-4 text-center text-slate-400 dark:text-zinc-500">
                  <p className="font-bold">No matching services found</p>
                  <p className="mt-0.5 text-[10px]">
                    Try searching by keyword like &quot;vaccination&quot;, &quot;flu&quot;, or
                    &quot;blood&quot;.
                  </p>
                </div>
              ) : (
                <>
                  {/* Recent service searches */}
                  {recentServiceSearches.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <History className="size-3" />
                        <span>Recent Services</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {recentServiceSearches.map((term, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectServiceTextQuery(term)}
                            className="text-slate-650 rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold transition-colors hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular services */}
                  {popularSearches.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <Sparkles className="size-3 text-amber-500" />
                        <span>Popular Services</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {popularSearches.map((term, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectServiceTextQuery(term)}
                            className="hover:border-slate-350 dark:hover:border-zinc-750 rounded border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Location Autocomplete Dropdown List Overlay */}
      {isOpen && (
        <div className="shadow-elevated absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-hidden overflow-y-auto rounded-xl border border-slate-200/85 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-900">
          {suggestions.length > 0 ? (
            <ul role="listbox" className="dark:divide-zinc-850/50 divide-y divide-slate-50">
              {/* 1. Location Geolocation Permission Trigger */}
              <li
                role="option"
                aria-selected={highlightedIndex === 0}
                onClick={handleUseCurrentLocation}
                onMouseEnter={() => setHighlightedIndex(0)}
                className={`flex cursor-pointer items-center justify-between p-3.5 font-semibold transition-colors ${
                  highlightedIndex === 0 ? "dark:bg-zinc-850/60 bg-slate-50" : ""
                }`}
              >
                <div className="text-slate-850 flex items-center gap-3 dark:text-slate-200">
                  <Navigation className="size-3.5 shrink-0 text-blue-500" />
                  <span>Use my current location</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400">Requires GPS</span>
              </li>

              {/* 2. Fetched suggestions */}
              {suggestions.map((s, idx) => {
                const listIdx = idx + 1; // offset by geolocation row
                const isHighlighted = listIdx === highlightedIndex;

                return (
                  <li
                    key={`${s.type}-${s.name}`}
                    role="option"
                    aria-selected={isHighlighted}
                    onClick={() => selectSuggestion(s)}
                    onMouseEnter={() => setHighlightedIndex(listIdx)}
                    className={`flex cursor-pointer flex-col gap-1 p-3.5 transition-colors ${
                      isHighlighted ? "dark:bg-zinc-850/60 bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="shrink-0 text-slate-400">📍</span>
                        <span className="text-slate-850 truncate font-bold capitalize dark:text-slate-100">
                          {highlightMatch(s.name, location)}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`size-2 rounded-full ${getStatusDotColor(s.status)}`} />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {s.statusText}
                        </span>
                      </div>
                    </div>

                    {s.earliestAppointment && (
                      <div className="flex items-center gap-1 pl-6 text-[10px] font-bold text-emerald-600 dark:text-emerald-500">
                        <span>Earliest appointment:</span>
                        <span>{s.earliestAppointment}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="dark:border-zinc-850/50 space-y-4 border-t border-slate-50 bg-slate-50/20 p-4 dark:bg-zinc-950/10">
              {location.trim().length >= 2 ? (
                <div className="py-4 text-center text-slate-400 dark:text-zinc-500">
                  <p className="font-bold">No matching locations found</p>
                  <p className="mt-0.5 text-[10px]">
                    Try searching by postcode outcode (e.g. SW1A) or major city (e.g. London).
                  </p>
                </div>
              ) : (
                <>
                  {/* Geolocation shortcut */}
                  <div
                    onClick={handleUseCurrentLocation}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60"
                  >
                    <div className="text-slate-850 flex items-center gap-3 text-[11px] font-semibold dark:text-slate-200">
                      <Navigation className="size-3.5 shrink-0 text-blue-500" />
                      <span>Use my current location</span>
                    </div>
                    <span className="text-[9px] font-normal text-slate-400">Requires GPS</span>
                  </div>

                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <History className="size-3" />
                        <span>Recent Searches</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectTextQuery(term)}
                            className="text-slate-650 rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold transition-colors hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Cities */}
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <Sparkles className="size-3 text-amber-500" />
                      <span>Popular Cities</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {popularLocations.map((term, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectTextQuery(term)}
                          className="hover:border-slate-350 dark:hover:border-zinc-750 rounded border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
