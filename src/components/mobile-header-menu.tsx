"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  MoreVertical,
  X,
  Search,
  Store,
  User,
  ShieldCheck,
  ChevronDown,
  Home,
  HeartPulse,
  Phone,
  HelpCircle,
  Sparkles,
  Award,
  Stethoscope,
} from "lucide-react";

export interface MobileHeaderMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    pharmacyId?: string | null;
  } | null;
  pharmacyName?: string;
  dashboardHref: string;
  isPharmacyUser: boolean;
  triggerMode?: "header" | "bottom" | "icon";
  renderTrigger?: (openMenu: () => void) => React.ReactNode;
  serviceCategories?: {
    id: string;
    name: string;
    slug: string;
    masterServices: {
      id: string;
      name: string;
      slug: string;
    }[];
  }[];
}

const pharmacyFirstConditions = [
  { id: "pf-1", label: "Earache" },
  { id: "pf-2", label: "Impetigo" },
  { id: "pf-3", label: "Infected insect bites" },
  { id: "pf-4", label: "Shingles" },
  { id: "pf-5", label: "Sinusitis" },
  { id: "pf-6", label: "Sore throat" },
  { id: "pf-7", label: "Uncomplicated UTIs" },
];

export function MobileHeaderMenu({
  user,
  pharmacyName,
  dashboardHref,
  isPharmacyUser,
  triggerMode = "header",
  renderTrigger,
  serviceCategories,
}: MobileHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleCategory = (cat: string) => {
    setActiveCategory(activeCategory === cat ? null : cat);
  };

  const closeMenu = () => setIsOpen(false);

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((n: string) => n[0] || "")
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const drawerOverlay =
    isOpen && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[99999] flex flex-col bg-white text-slate-900 duration-200 animate-in fade-in dark:bg-zinc-950 dark:text-zinc-50 lg:hidden">
            {/* Drawer Top Header Bar */}
            <div className="dark:border-zinc-850 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-6 dark:bg-zinc-950">
              <Link href="/" onClick={closeMenu} className="flex items-center space-x-2">
                <img
                  src="/assets/header-logo.png"
                  alt="NextDoorClinic Logo"
                  className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
                />
              </Link>

              <button
                onClick={closeMenu}
                className="dark:bg-zinc-850 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* 1. Account / Dashboard Banner */}
              <div className="shadow-xs dark:border-zinc-850 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:bg-zinc-900">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-black text-white">
                        {user.role === "super_admin" || user.role === "platform_admin"
                          ? "AD"
                          : initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                          {user.name || "Logged In User"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      <Link
                        href={dashboardHref}
                        onClick={closeMenu}
                        className="shadow-xs flex w-full items-center justify-center space-x-2 rounded-xl bg-brand-navy py-2.5 text-xs font-extrabold text-white"
                      >
                        <Store className="h-4 w-4 text-emerald-400" />
                        <span>
                          {user.role === "super_admin" || user.role === "platform_admin"
                            ? "Admin Panel"
                            : isPharmacyUser
                              ? `Dashboard (${pharmacyName || "Pharmacy"})`
                              : "My Patient Dashboard"}
                        </span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Patient & Clinic Access
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-300">
                        Log in to manage appointment bookings or access your pharmacy clinic
                        dashboard.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/login"
                        onClick={closeMenu}
                        className="shadow-xs flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <User className="h-3.5 w-3.5 text-brand-teal" />
                        <span>Login</span>
                      </Link>
                      <Link
                        href="/register"
                        onClick={closeMenu}
                        className="shadow-xs flex items-center justify-center rounded-xl bg-brand-navy py-2.5 text-xs font-bold text-white"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Direct Search Shortcut */}
              <div>
                <Link
                  href="/search"
                  onClick={closeMenu}
                  className="shadow-xs dark:border-zinc-850 flex items-center justify-center space-x-2 rounded-xl bg-[#10B981] p-3.5 text-xs font-extrabold text-white transition-all hover:bg-emerald-600"
                >
                  <Search className="h-4 w-4 shrink-0 stroke-[2.5]" />
                  <span>Search Healthcare Marketplace</span>
                </Link>
              </div>

              {/* 3. Clinical Categories Accordion List */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Explore Clinical Categories
                </span>

                <div className="dark:divide-zinc-850 dark:border-zinc-850 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:bg-zinc-900">
                  {serviceCategories && serviceCategories.length > 0 ? (
                    serviceCategories.map((cat) => (
                      <div key={cat.id}>
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className="flex w-full items-center justify-between p-4 text-left text-xs font-extrabold text-slate-900 dark:text-white"
                        >
                          <span className="flex items-center gap-2">
                            {cat.name.toLowerCase().includes("nhs") && (
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            )}
                            {cat.name}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform ${
                              activeCategory === cat.id ? "rotate-180 text-emerald-600" : ""
                            }`}
                          />
                        </button>
                        {activeCategory === cat.id && (
                          <div className="space-y-2 bg-slate-50/60 p-4 pt-0 dark:bg-zinc-950/40">
                            {cat.masterServices.map((svc) => (
                              <Link
                                key={svc.id}
                                href={`/search?service=${encodeURIComponent(svc.name)}`}
                                onClick={closeMenu}
                                className="block text-xs font-medium text-slate-700 hover:text-emerald-600 dark:text-zinc-300"
                              >
                                • {svc.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Fallback Static Categories */}
                      <div>
                        <button
                          onClick={() => toggleCategory("pharmacy-first")}
                          className="flex w-full items-center justify-between p-4 text-left text-xs font-extrabold text-slate-900 dark:text-white"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            NHS Pharmacy First (Minor Ailments)
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform ${
                              activeCategory === "pharmacy-first"
                                ? "rotate-180 text-emerald-600"
                                : ""
                            }`}
                          />
                        </button>
                        {activeCategory === "pharmacy-first" && (
                          <div className="space-y-2 bg-slate-50/60 p-4 pt-0 dark:bg-zinc-950/40">
                            {pharmacyFirstConditions.map((c) => (
                              <Link
                                key={c.id}
                                href={`/services?query=${encodeURIComponent(c.label)}`}
                                onClick={closeMenu}
                                className="block text-xs font-medium text-slate-700 hover:text-emerald-600 dark:text-zinc-300"
                              >
                                • {c.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 4. Information & Standards Links */}
              <div className="dark:border-zinc-850 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:bg-zinc-900">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Governance & Help
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <Link
                    href="/cqc-compliance"
                    onClick={closeMenu}
                    className="hover:text-emerald-600"
                  >
                    CQC Standards
                  </Link>
                  <Link
                    href="/clinical-governance"
                    onClick={closeMenu}
                    className="hover:text-emerald-600"
                  >
                    Clinical Safety
                  </Link>
                  <Link href="/about" onClick={closeMenu} className="hover:text-emerald-600">
                    About Us
                  </Link>
                  <Link href="/contact" onClick={closeMenu} className="hover:text-emerald-600">
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setIsOpen(true))
      ) : triggerMode === "bottom" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center space-y-1 text-slate-600 transition-all hover:text-emerald-600 dark:text-zinc-400"
        >
          <MoreVertical className="h-5 w-5 text-emerald-600" />
          <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-200">Menu</span>
        </button>
      ) : (
        /* Default 3-Dot Mobile Menu Button */
        <button
          onClick={() => setIsOpen(true)}
          className="shadow-xs flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-800 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 lg:hidden"
          aria-label="Open Mobile Menu"
          title="Open Menu"
        >
          <MoreVertical className="h-5 w-5 text-emerald-600" />
        </button>
      )}

      {/* Render Drawer directly into document.body via Portal */}
      {drawerOverlay}
    </>
  );
}
