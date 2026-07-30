"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import {
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  Building,
  ArrowRight,
  SlidersHorizontal,
  Star,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
  Phone,
  Filter,
  X,
  ChevronDown,
  Navigation,
  Scale,
  Eye,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
  BadgeCheck,
  HeartPulse,
} from "lucide-react";
import { getServiceEditorialImage } from "../[tenantId]/[serviceSlug]/service-page-view";
import {
  createCallbackRequestAction,
  createWaitlistNotificationAction,
} from "@/actions/search-analytics";

export interface ServiceItemData {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string | null;
  prepNotes: string | null;
  instructions: string | null;
  imageUrl: string | null;
  serviceSlug?: string | null;
  pharmacy: {
    name: string;
    slug: string;
    address: string;
    city: string | null;
    brandColor: string | null;
  };
}

export interface ServiceDirectoryViewProps {
  services: ServiceItemData[];
  categories: { id: string; name: string }[];
  initialQuery?: string;
  initialLocation?: string;
}

const quickFilterChips = [
  { id: "all", label: "All Services" },
  { id: "today", label: "Available Today" },
  { id: "nhs", label: "NHS Pharmacy First" },
  { id: "ear", label: "Ear Wax Removal" },
  { id: "travel", label: "Travel Vaccines" },
  { id: "blood", label: "Blood Tests" },
  { id: "flu", label: "Flu & Covid" },
  { id: "bp", label: "BP Screening" },
  { id: "under50", label: "Under £50" },
];

export function ServiceDirectoryView({
  services,
  categories,
  initialQuery = "",
  initialLocation = "",
}: ServiceDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [locationQuery, setLocationQuery] = useState(initialLocation);
  const [activeChip, setActiveChip] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Compare Mode State
  const [comparedServiceIds, setComparedServiceIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Preview Drawer State
  const [previewService, setPreviewService] = useState<ServiceItemData | null>(null);

  // Mobile Filter Drawer
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fallback Form States
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackSuccess, setCallbackSuccess] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Filter & Sort Logic
  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        // Search Query match
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchDesc = (s.description || "").toLowerCase().includes(q);
          const matchCat = (s.category || "").toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        // Location match
        if (locationQuery) {
          const loc = locationQuery.toLowerCase();
          const matchAddr = s.pharmacy.address.toLowerCase().includes(loc);
          const matchCity = (s.pharmacy.city || "").toLowerCase().includes(loc);
          if (!matchAddr && !matchCity) return false;
        }

        // Category filter
        if (selectedCategory && s.category !== selectedCategory) {
          return false;
        }

        // Price filter
        if (maxPrice) {
          const limit = parseFloat(maxPrice);
          if (!isNaN(limit) && Number(s.price) > limit) return false;
        }

        // Quick Chip filters
        if (activeChip === "under50" && Number(s.price) > 50) return false;
        if (
          activeChip === "nhs" &&
          !(s.name.toLowerCase().includes("nhs") || Number(s.price) === 0)
        )
          return false;
        if (activeChip === "ear" && !s.name.toLowerCase().includes("ear")) return false;
        if (activeChip === "travel" && !s.name.toLowerCase().includes("travel")) return false;
        if (activeChip === "blood" && !s.name.toLowerCase().includes("blood")) return false;
        if (activeChip === "flu" && !s.name.toLowerCase().includes("flu")) return false;
        if (
          activeChip === "bp" &&
          !(s.name.toLowerCase().includes("bp") || s.name.toLowerCase().includes("pressure"))
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
        if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
        if (sortBy === "duration_asc") return a.duration - b.duration;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0; // Default popular order
      });
  }, [services, searchQuery, locationQuery, selectedCategory, maxPrice, activeChip, sortBy]);

  const displayedServices = filteredServices.slice(0, visibleCount);
  const hasMore = visibleCount < filteredServices.length;

  const toggleCompare = (id: string) => {
    if (comparedServiceIds.includes(id)) {
      setComparedServiceIds(comparedServiceIds.filter((item) => item !== id));
    } else {
      if (comparedServiceIds.length >= 3) {
        alert("You can compare up to 3 services at a time.");
        return;
      }
      setComparedServiceIds([...comparedServiceIds, id]);
    }
  };

  const comparedServicesList = useMemo(() => {
    return services.filter((s) => comparedServiceIds.includes(s.id));
  }, [services, comparedServiceIds]);

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackPhone) return;
    try {
      await createCallbackRequestAction(
        callbackName || "Patient",
        callbackPhone,
        null,
        locationQuery || "LS1",
        null,
        searchQuery || "General Healthcare Request"
      );
      setCallbackSuccess(true);
    } catch (err) {
      console.error("Callback submission error:", err);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    try {
      await createWaitlistNotificationAction(waitlistEmail, locationQuery || "LS1", 10, null);
      setWaitlistSuccess(true);
    } catch (err) {
      console.error("Waitlist error:", err);
    }
  };

  const popularCategories = [
    { name: "Ear Wax Removal", img: "/assets/ear_wax_hero.png", query: "Ear Wax" },
    { name: "Travel Vaccinations", img: "/assets/travel_vaccine_hero.png", query: "Travel" },
    { name: "Blood Testing Suite", img: "/assets/blood_test_hero.png", query: "Blood" },
    { name: "Flu & Covid Boosters", img: "/assets/flu_vaccine_hero.png", query: "Flu" },
    { name: "Blood Pressure Checks", img: "/assets/blood_pressure_hero.png", query: "Pressure" },
    { name: "NHS Pharmacy First", img: "/assets/pharmacy_consultation.png", query: "NHS" },
  ];

  return (
    <div className="min-h-screen select-text bg-slate-50/50 pb-24 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Search Focus) */}
      {/* ========================================================================= */}
      <section className="dark:border-zinc-850 relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-slate-900 via-slate-900 to-[#000e35] px-6 py-12 text-white shadow-lg lg:py-16">
        <div className="mx-auto max-w-5xl space-y-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-emerald-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Healthcare Discovery Portal
          </span>

          <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            What healthcare service do you need today?
          </h1>

          <p className="mx-auto max-w-2xl text-xs font-medium text-slate-300 sm:text-sm">
            Discover GPhC-regulated treatments, compare upfront prices, check duration, and book
            appointment slots in under 30 seconds.
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
                  placeholder="e.g. Ear wax removal, Flu vaccine, Blood test"
                  className="h-11 w-full rounded-2xl bg-white pl-11 pr-4 text-xs font-bold text-slate-900 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div className="relative sm:col-span-4">
                <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Postcode or City (e.g. Leeds)"
                  className="h-11 w-full rounded-2xl bg-white pl-11 pr-4 text-xs font-bold text-slate-900 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <button
                onClick={() => setVisibleCount(8)}
                className="flex h-11 items-center justify-center space-x-1.5 rounded-2xl bg-emerald-500 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-400 active:scale-95 sm:col-span-2"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-bold">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              Popular Searches:
            </span>
            {["Ear Wax", "Travel Vaccine", "Blood Test", "Flu", "BP Check", "NHS"].map((item) => (
              <button
                key={item}
                onClick={() => setSearchQuery(item)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-slate-200 transition-colors hover:bg-white/20 hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 2. POPULAR CATEGORIES HORIZONTAL CAROUSEL */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="dark:border-zinc-850 flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Explore Clinical Categories
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Frequently Booked Services
              </h2>
            </div>
          </div>

          <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {popularCategories.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => setSearchQuery(cat.query)}
                className="shadow-xs group relative w-48 shrink-0 cursor-pointer snap-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 transition-transform hover:scale-105 dark:border-zinc-800"
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="h-32 w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3 text-white">
                  <span className="text-xs font-black">{cat.name}</span>
                  <span className="text-[9px] font-bold text-emerald-400">Book Online →</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. QUICK CHIPS BAR & FILTERS */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          {/* Quick Filter Chips Slider */}
          <div className="scrollbar-none flex items-center space-x-2 overflow-x-auto pb-2">
            {quickFilterChips.map((chip) => {
              const active = activeChip === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setActiveChip(chip.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition-all ${
                    active
                      ? "bg-emerald-600 text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Results Bar: Total count, Sorting, and Mobile Filter Drawer Trigger */}
          <div className="shadow-xs dark:border-zinc-850 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 dark:bg-zinc-900">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {filteredServices.length} Services Found
              </span>
              {(searchQuery ||
                locationQuery ||
                activeChip !== "all" ||
                selectedCategory ||
                maxPrice) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setLocationQuery("");
                    setActiveChip("all");
                    setSelectedCategory("");
                    setMaxPrice("");
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
                  <option value="popular">Most Popular</option>
                  <option value="price_asc">Lowest Price</option>
                  <option value="price_desc">Highest Price</option>
                  <option value="duration_asc">Shortest Duration</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="dark:bg-zinc-850 flex items-center space-x-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-zinc-800 dark:text-zinc-200 lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. MAIN RESULTS GRID WITH DESKTOP SIDEBAR */}
        {/* ========================================================================= */}
        <div className="grid items-start gap-8 lg:grid-cols-4">
          {/* Desktop Left Sidebar Filters */}
          <div className="shadow-xs dark:border-zinc-850 hidden space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 dark:bg-zinc-900 lg:sticky lg:top-24 lg:block">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Filter Search
              </span>
              <Filter className="h-4 w-4 text-emerald-600" />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="dark:bg-zinc-850 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none dark:border-zinc-800 dark:text-zinc-200"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Maximum Price Filter */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Maximum Price (£)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 60"
                min="0"
                className="dark:bg-zinc-850 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none dark:border-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-6 lg:col-span-3">
            {displayedServices.length === 0 ? (
              /* NO RESULTS FALLBACK */
              <div className="dark:border-zinc-850 space-y-6 rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-sm dark:bg-zinc-900 sm:p-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <HeartPulse className="h-8 w-8" />
                </div>

                <div className="mx-auto max-w-md space-y-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    No Services Found Matching Filters
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                    We couldn&apos;t find exact service matches for your query. Try broadening your
                    location or expanding search criteria.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setLocationQuery("");
                      setActiveChip("all");
                      setMaxPrice("");
                    }}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md active:scale-95"
                  >
                    Clear All Filters
                  </button>
                </div>

                {/* Callback & Waitlist Request Box */}
                <div className="mt-8 grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 text-left dark:border-zinc-800 sm:grid-cols-2">
                  {/* Request Callback */}
                  <div className="dark:bg-zinc-850 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      Request Phone Callback
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Our patient care team will help you locate the nearest clinical slot.
                    </p>
                    {callbackSuccess ? (
                      <p className="text-xs font-bold text-emerald-600">
                        ✓ Callback request received!
                      </p>
                    ) : (
                      <form onSubmit={handleCallbackSubmit} className="space-y-2">
                        <input
                          type="tel"
                          value={callbackPhone}
                          onChange={(e) => setCallbackPhone(e.target.value)}
                          placeholder="Your phone number"
                          required
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold dark:border-zinc-700 dark:bg-zinc-900"
                        />
                        <button
                          type="submit"
                          className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900"
                        >
                          Request Callback
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Join Waitlist */}
                  <div className="dark:bg-zinc-850 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      Join Slot Waitlist
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Get notified when new appointment slots open in your area.
                    </p>
                    {waitlistSuccess ? (
                      <p className="text-xs font-bold text-emerald-600">
                        ✓ Subscribed to waitlist alerts!
                      </p>
                    ) : (
                      <form onSubmit={handleWaitlistSubmit} className="space-y-2">
                        <input
                          type="email"
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          placeholder="Your email address"
                          required
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold dark:border-zinc-700 dark:bg-zinc-900"
                        />
                        <button
                          type="submit"
                          className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white"
                        >
                          Notify Me
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* REDESIGNED SERVICE CARDS GRID */
              <div className="grid gap-6 sm:grid-cols-2">
                {displayedServices.map((service) => {
                  const editorialImg = getServiceEditorialImage(
                    service.name,
                    service.category,
                    service.imageUrl
                  );
                  const isCompared = comparedServiceIds.includes(service.id);

                  return (
                    <div
                      key={service.id}
                      className="dark:border-zinc-850 group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md dark:bg-zinc-900"
                    >
                      <div className="space-y-3">
                        {/* Image Header Banner */}
                        <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                          <img
                            src={editorialImg}
                            alt={service.name}
                            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                          <span className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                            {service.category || "Clinical Service"}
                          </span>

                          <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                            ● Available Today
                          </span>

                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                            <div>
                              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-300">
                                Starting Price
                              </span>
                              <span className="text-base font-black text-white">
                                £{Number(service.price).toFixed(2)}
                              </span>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-slate-200">
                              <Clock className="h-3.5 w-3.5 text-emerald-400" />
                              {service.duration} mins
                            </span>
                          </div>
                        </div>

                        {/* Card Content Body */}
                        <div className="space-y-3 p-5">
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-extrabold leading-snug text-slate-900 dark:text-white">
                              {service.name}
                            </h3>
                          </div>

                          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                            {service.description ||
                              "GPhC-regulated clinical assessment provided by registered prescribers."}
                          </p>

                          {/* Pharmacy Info */}
                          <div className="flex items-center space-x-2.5 border-t border-slate-100 pt-3 dark:border-zinc-800">
                            <div
                              style={{ backgroundColor: service.pharmacy.brandColor || "#000e35" }}
                              className="shadow-xs flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
                            >
                              {service.pharmacy.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/provider/${service.pharmacy.slug}`}
                                className="block truncate text-xs font-extrabold text-slate-900 hover:text-emerald-600 dark:text-white"
                              >
                                {service.pharmacy.name}
                              </Link>
                              <span className="block truncate text-[10px] text-slate-400">
                                {service.pharmacy.address}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="dark:border-zinc-850 mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 p-5 pt-0">
                        <button
                          onClick={() => setPreviewService(service)}
                          className="dark:bg-zinc-850 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300"
                          title="Quick Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>

                        <button
                          onClick={() => toggleCompare(service.id)}
                          className={`flex items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                            isCompared
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "dark:bg-zinc-850 border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          <Scale className="h-3.5 w-3.5" />
                          <span>{isCompared ? "Added" : "Compare"}</span>
                        </button>

                        <Link
                          href={`/book/${service.pharmacy.slug}?service=${slugify(service.name)}`}
                          className="shadow-xs flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white hover:bg-emerald-500 active:scale-95"
                        >
                          <CalendarCheck className="h-3.5 w-3.5" />
                          <span>Book</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-6 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 8)}
                  className="inline-flex items-center justify-center space-x-2 rounded-2xl bg-slate-900 px-8 py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95 dark:bg-white dark:text-slate-900"
                >
                  <span>
                    Load More Services ({filteredServices.length - visibleCount} remaining)
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. STICKY BOTTOM COMPARE DRAWER */}
      {/* ========================================================================= */}
      {comparedServiceIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white/95 px-6 py-3 shadow-[0_-8px_30px_rgb(0,0,0,0.15)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="flex items-center space-x-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
              {comparedServiceIds.length}
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Services Selected for Comparison
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setComparedServiceIds([])}
              className="text-xs font-bold text-slate-500 hover:text-rose-600"
            >
              Clear
            </button>
            <button
              onClick={() => setShowCompareModal(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-500"
            >
              <Scale className="h-4 w-4" />
              <span>Compare Now</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. COMPARE MODAL OVERLAY */}
      {/* ========================================================================= */}
      {showCompareModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-4xl space-y-6 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                <Scale className="h-5 w-5 text-emerald-600" /> Compare Healthcare Services
              </h3>
              <button
                onClick={() => setShowCompareModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {comparedServicesList.map((svc) => (
                <div
                  key={svc.id}
                  className="dark:bg-zinc-850 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800"
                >
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{svc.name}</h4>
                  <div className="space-y-1 text-xs">
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      £{Number(svc.price).toFixed(2)}
                    </p>
                    <p className="text-slate-500 dark:text-zinc-400">
                      {svc.duration} mins duration
                    </p>
                    <p className="font-bold text-slate-700 dark:text-zinc-300">
                      {svc.pharmacy.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{svc.pharmacy.address}</p>
                  </div>
                  <Link
                    href={`/book/${svc.pharmacy.slug}?service=${slugify(svc.name)}`}
                    className="block w-full rounded-xl bg-emerald-600 py-2 text-center text-xs font-black text-white"
                  >
                    Book This Service
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. QUICK PREVIEW DRAWER */}
      {/* ========================================================================= */}
      {previewService && (
        <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex justify-end bg-black/60">
          <div className="h-full w-full max-w-md space-y-6 overflow-y-auto bg-white p-6 shadow-2xl duration-200 animate-in slide-in-from-right dark:bg-zinc-950">
            <div className="dark:border-zinc-850 flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                Service Details
              </span>
              <button
                onClick={() => setPreviewService(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-900">
              <img
                src={getServiceEditorialImage(
                  previewService.name,
                  previewService.category,
                  previewService.imageUrl
                )}
                alt={previewService.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {previewService.name}
              </h3>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Starting at £{Number(previewService.price).toFixed(2)} • {previewService.duration}{" "}
                mins
              </p>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
              {previewService.description || "GPhC-regulated clinical consultation and procedure."}
            </p>

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="block text-[10px] font-black uppercase text-slate-400">
                Provided by
              </span>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                {previewService.pharmacy.name}
              </p>
              <p className="text-[11px] text-slate-500">{previewService.pharmacy.address}</p>
            </div>

            <div className="dark:border-zinc-850 border-t border-slate-100 pt-4">
              <Link
                href={`/book/${previewService.pharmacy.slug}?service=${slugify(previewService.name)}`}
                className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-500"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Book Now</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MOBILE FILTER DRAWER SHEET */}
      {/* ========================================================================= */}
      {showMobileFilters && (
        <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex flex-col justify-end bg-black/60 lg:hidden">
          <div className="max-h-[85vh] space-y-6 overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl duration-200 animate-in slide-in-from-bottom dark:bg-zinc-950">
            <div className="dark:border-zinc-850 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Filter Services</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Max Price (£)
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="e.g. 50"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
