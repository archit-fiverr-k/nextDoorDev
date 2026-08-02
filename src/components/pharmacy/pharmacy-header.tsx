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
    { title: "Settings", href: `/pharmacy/${tenantId}/settings`, icon: Settings },
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
      {/* ========================================================================= */}
      {/* 1. FIXED LEFT SIDEBAR DASHBOARD NAVIGATION (DESKTOP) */}
      {/* ========================================================================= */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col justify-between border-r border-slate-200/90 bg-white font-sans text-slate-900 antialiased dark:border-zinc-800 dark:bg-zinc-950 lg:flex">
        {/* Brand & Clinic Branch Badge */}
        <div className="flex flex-col space-y-3 border-b border-slate-100 p-5 dark:border-zinc-900">
          <Link href={`/pharmacy/${tenantId}`} className="flex items-center space-x-2">
            <img
              src="/assets/header-logo.png"
              alt="NextDoorClinic"
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          <div className="inline-flex items-center space-x-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#10B981]" />
            <span className="truncate">{pharmacyName}</span>
          </div>
        </div>

        {/* Vertical Navigation Items List */}
        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Core Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== `/pharmacy/${tenantId}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all",
                  isActive
                    ? "bg-[#10B981] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-white" : "text-slate-400 dark:text-zinc-500"
                  )}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer — Profile & Practice Settings Menu */}
        <div className="space-y-1 border-t border-slate-100 p-3 dark:border-zinc-900">
          <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Practice Account
          </div>

          <Link
            href={`/pharmacy/${tenantId}/settings`}
            className={cn(
              "flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
              pathname.includes("/settings") && "bg-slate-100 text-slate-900 dark:bg-zinc-900"
            )}
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Settings</span>
          </Link>

          <Link
            href={`/pharmacy/${tenantId}/subscription`}
            className={cn(
              "flex items-center justify-between rounded-xl bg-emerald-50/90 px-3 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300",
              pathname.includes("/subscription") && "ring-2 ring-[#10B981]"
            )}
          >
            <div className="flex items-center space-x-2.5">
              <Zap className="h-4 w-4 text-[#10B981]" />
              <span>Subscription ($49)</span>
            </div>
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
              PRO
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. TOP DASHBOARD APPS BAR (STICKY) */}
      {/* ========================================================================= */}
      <header className="lg:pl-68 sticky top-0 z-30 flex h-14 w-full shrink-0 select-none items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 font-sans text-slate-900 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 sm:px-6">
        <div className="flex items-center space-x-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <span className="text-xs font-extrabold text-slate-900 dark:text-white lg:hidden">
            {pharmacyName}
          </span>
        </div>

        {/* Right Topbar CTA Controls */}
        <div className="flex items-center space-x-3">
          <a
            href={publicBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shadow-2xs hidden items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 sm:inline-flex"
          >
            <span>View Public Booking Website</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#10B981] ring-2 ring-white dark:ring-zinc-950" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:w-96">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-[#10B981]" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Live Booking Dispatches
                    </h3>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#10B981] dark:bg-emerald-950">
                    Live
                  </span>
                </div>

                <div className="py-3 text-xs text-slate-600 dark:text-zinc-400">
                  Real-time patient bookings and walk-in updates will trigger instant alerts here.
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white p-1 pr-2 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10B981] text-xs font-black text-white">
                {userInitials}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 z-50 mt-2 w-64 space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-slate-100 p-2.5 dark:border-zinc-800">
                  <p className="truncate text-xs font-black text-slate-900 dark:text-white">
                    {pharmacyName}
                  </p>
                  <p className="truncate text-[10px] font-medium text-slate-400">{user.email}</p>
                </div>

                <div className="space-y-0.5 py-1 text-xs">
                  <Link
                    href={`/pharmacy/${tenantId}/subscription`}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center space-x-2 rounded-xl bg-emerald-50 px-3 py-2 font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                  >
                    <Zap className="h-4 w-4 text-[#10B981]" />
                    <span>Subscription & Payments ($49/mo)</span>
                  </Link>

                  <Link
                    href={`/pharmacy/${tenantId}/settings`}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center space-x-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1 dark:border-zinc-800">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="backdrop-blur-xs fixed inset-0 bg-slate-900/60"
            onClick={() => setShowMobileDrawer(false)}
          />
          <div className="relative flex h-full w-4/5 max-w-xs flex-col bg-white p-5 shadow-2xl dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-900">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {pharmacyName}
              </span>
              <button onClick={() => setShowMobileDrawer(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center space-x-3 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
