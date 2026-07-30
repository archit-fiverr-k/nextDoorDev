"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  Bell,
  ChevronDown,
  User,
  Settings,
  Zap,
  HelpCircle,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Clock,
  Building2,
  LayoutDashboard,
  Calendar,
  Layers,
  Users,
  UserCheck,
  Palette,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

interface PharmacyHeaderProps {
  tenantId: string;
  pharmacyName: string;
  publicBookingUrl: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function PharmacyHeader({
  tenantId,
  pharmacyName,
  publicBookingUrl,
  user,
}: PharmacyHeaderProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { title: "Overview", href: `/pharmacy/${tenantId}`, icon: LayoutDashboard },
    { title: "Appointments", href: `/pharmacy/${tenantId}/appointments`, icon: Calendar },
    { title: "Analytics", href: `/pharmacy/${tenantId}/analytics`, icon: TrendingUp },
    { title: "Availability", href: `/pharmacy/${tenantId}/availability`, icon: Clock },
    { title: "Services & Pricing", href: `/pharmacy/${tenantId}/services`, icon: Layers },
    { title: "Patients (CRM)", href: `/pharmacy/${tenantId}/patients`, icon: Users },
    { title: "Staff Roster", href: `/pharmacy/${tenantId}/staff`, icon: UserCheck },
    { title: "Clinic Profile", href: `/pharmacy/${tenantId}/profile`, icon: Building2 },
    { title: "Branding", href: `/pharmacy/${tenantId}/branding`, icon: Palette },
  ];

  const handleLogout = async () => {
    await logoutAction();
  };

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PH";

  return (
    <>
      {/* ENTERPRISE DUAL-BAR HEADER */}
      <header className="sticky top-0 z-40 w-full shrink-0 select-none border-b border-slate-200 bg-white font-sans text-slate-900 antialiased dark:border-zinc-800 dark:bg-zinc-950">
        {/* TOP BRAND & PROFILE BAR */}
        <div className="border-b border-slate-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
          <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Brand Logo + Clinic Branch Badge */}
            <div className="flex items-center space-x-3.5">
              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setShowMobileDrawer(true)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* NextDoorClinic Brand Logo */}
              <Link href={`/pharmacy/${tenantId}`} className="flex items-center space-x-2">
                <img
                  src="/assets/header-logo.png"
                  alt="NextDoorClinic"
                  className="h-7 w-auto object-contain dark:brightness-0 dark:invert sm:h-8"
                />
              </Link>

              {/* Divider & Pharmacy Name Badge */}
              <div className="hidden items-center space-x-2 border-l border-slate-200 pl-2 dark:border-zinc-800 sm:flex">
                <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                  {pharmacyName}
                </span>
              </div>
            </div>

            {/* Right: Public Booking Link + Notifications + Profile Avatar */}
            <div className="flex items-center space-x-3">
              {/* Public Booking Link CTA */}
              <a
                href={publicBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shadow-2xs hidden items-center space-x-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:inline-flex"
              >
                <span>View Booking Page</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className="relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-zinc-950" />
                </button>

                {/* Floating Notification Panel */}
                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-2 w-80 rounded-md border border-slate-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:w-96">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          Booking Notifications
                        </h3>
                      </div>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950">
                        Live
                      </span>
                    </div>

                    <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto py-1 text-xs dark:divide-zinc-800">
                      <div className="space-y-1 py-3">
                        <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                          <span className="flex items-center space-x-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>New Appointment Booked</span>
                          </span>
                          <span className="text-[10px] text-slate-400">10m ago</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Patient booked Travel Vaccinations appointment for tomorrow.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 text-center dark:border-zinc-800">
                      <Link
                        href={`/pharmacy/${tenantId}/appointments`}
                        onClick={() => setShowNotifications(false)}
                        className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        Manage Appointments &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center space-x-2 rounded-md border border-slate-200 bg-white p-1 pr-2 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-700 text-xs font-bold text-white">
                    {userInitials}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {/* Profile Menu Dropdown Card */}
                {showProfileMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-60 space-y-1 rounded-md border border-slate-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-slate-100 p-2 dark:border-zinc-800">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {pharmacyName}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">{user.email}</p>
                    </div>

                    <div className="space-y-0.5 py-1 text-xs">
                      <Link
                        href={`/pharmacy/${tenantId}/profile`}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2 rounded px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span>Pharmacy Profile</span>
                      </Link>

                      <Link
                        href={`/pharmacy/${tenantId}/branding`}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2 rounded px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Palette className="h-4 w-4 text-slate-400" />
                        <span>Custom Branding</span>
                      </Link>

                      <Link
                        href={`/pharmacy/${tenantId}/settings`}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2 rounded px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Settings className="h-4 w-4 text-slate-400" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1 dark:border-zinc-800">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-2 rounded px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SUB-HEADER MODULE TAB BAR */}
        <div className="hidden border-t border-slate-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 lg:block">
          <div className="no-scrollbar mx-auto flex h-11 w-full max-w-[1400px] items-center space-x-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === `/pharmacy/${tenantId}`
                  ? pathname === `/pharmacy/${tenantId}`
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center space-x-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors",
                    isActive
                      ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
                      : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER MENU */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div
            className="backdrop-blur-xs fixed inset-0 bg-slate-900/50"
            onClick={() => setShowMobileDrawer(false)}
          />

          <div className="fixed inset-y-0 left-0 flex max-w-full">
            <div className="flex w-screen max-w-xs select-text flex-col justify-between bg-white p-5 shadow-2xl dark:bg-zinc-950">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
                  <img
                    src="/assets/header-logo.png"
                    alt="NextDoorClinic"
                    className="h-7 w-auto object-contain dark:brightness-0 dark:invert"
                  />
                  <button
                    onClick={() => setShowMobileDrawer(false)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {pharmacyName}
                  </p>
                  <a
                    href={publicBookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="space-y-1">
                  <span className="mb-1 block px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Pharmacy Navigation
                  </span>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === `/pharmacy/${tenantId}`
                        ? pathname === `/pharmacy/${tenantId}`
                        : pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMobileDrawer(false)}
                        className={cn(
                          "flex items-center space-x-2.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                          isActive
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-emerald-700" : "text-slate-400"
                          )}
                        />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-zinc-800">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center space-x-2 rounded-md bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
