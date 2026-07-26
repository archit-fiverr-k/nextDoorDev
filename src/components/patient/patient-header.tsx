"use client";

import React, { useEffect, useState, useRef, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Search,
  ChevronRight,
  Menu,
  Plus,
  User,
  Settings,
  LogOut,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  MessageSquare,
  ShieldCheck,
  Check,
  ChevronDown,
  X,
  Building2,
  FileText,
} from "lucide-react";
import {
  getPatientNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/patient-notifications";
import { logoutAction } from "@/actions/auth";

interface PatientHeaderProps {
  user: { name?: string | null; email?: string | null };
  onOpenMobileSidebar?: () => void;
}

export default function PatientHeader({ user, onOpenMobileSidebar }: PatientHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsPopover, setShowNotificationsPopover] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();

  const popoverRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load Notifications
  const loadNotifications = async () => {
    const res = await getPatientNotificationsAction();
    if (res.success && res.data) {
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowNotificationsPopover(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationReadAction(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const desktopNavLinks = [
    { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
    { href: "/patient/appointments", label: "Appointments", icon: Calendar },
    { href: "/patient/appointments", label: "Medical Records", icon: FileText },
    { href: "/services", label: "Find Clinics", icon: Building2 },
  ];

  return (
    <header className="shadow-xs sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md transition-all dark:border-zinc-800 dark:bg-zinc-950/95">
      {/* Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================= */}
        {/* DEDICATED MOBILE HEADER (< 768px)                          */}
        {/* ========================================================= */}
        <div className="flex h-[64px] items-center justify-between md:hidden">
          {/* LEFT: ☰ Menu Button */}
          <div className="flex shrink-0 items-center">
            {onOpenMobileSidebar && (
              <button
                onClick={onOpenMobileSidebar}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100/80 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-95 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                aria-label="Open Mobile Navigation Menu"
              >
                <Menu className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </button>
            )}
          </div>

          {/* CENTER: Logo + Portal Label */}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 text-center">
            <Link
              href="/patient/dashboard"
              className="truncate text-sm font-extrabold tracking-tight text-slate-900 transition hover:text-emerald-600 dark:text-white"
            >
              NextDoorClinic
            </Link>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Patient Portal
            </span>
          </div>

          {/* RIGHT: Notifications + Book Button + Avatar */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Notification Bell (Triggers Floating Popover Panel) */}
            <button
              onClick={() => {
                setShowNotificationsPopover(!showNotificationsPopover);
                if (!showNotificationsPopover) loadNotifications();
              }}
              className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100/80 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-95 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
            >
              <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-zinc-950">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Compact Book Button */}
            <Link
              href="/services"
              className="shadow-xs flex min-h-[44px] items-center gap-1 whitespace-nowrap rounded-full bg-emerald-600 px-3.5 text-xs font-extrabold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Book</span>
            </Link>

            {/* Profile Avatar Dropdown Button */}
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-slate-100 p-0.5 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="shadow-xs flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white">
                {getInitials(user.name)}
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP FIVERR/AIRBNB-STYLE TOP NAVIGATION (>= 768px)     */}
        {/* ========================================================= */}
        <div className="hidden h-[70px] items-center justify-between md:flex">
          {/* LEFT: Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/patient/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-base font-black text-white shadow-md">
                NC
              </div>
              <div>
                <span className="block text-base font-black tracking-tight text-slate-900 dark:text-white">
                  NextDoorClinic
                </span>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Patient Companion
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER: Navigation Links */}
          <nav className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100/70 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/80">
            <Link
              href="/patient/dashboard"
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                pathname === "/patient/dashboard" || pathname === "/patient"
                  ? "shadow-xs bg-white text-emerald-600 dark:bg-zinc-800 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/patient/appointments"
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                pathname.startsWith("/patient/appointments")
                  ? "shadow-xs bg-white text-emerald-600 dark:bg-zinc-800 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Appointments
            </Link>
            <Link
              href="/patient/profile"
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                pathname.startsWith("/patient/profile")
                  ? "shadow-xs bg-white text-emerald-600 dark:bg-zinc-800 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Medical Records
            </Link>
            <Link
              href="/services"
              className="rounded-full px-4 py-2 text-xs font-bold text-slate-600 transition hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Find Clinics
            </Link>
          </nav>

          {/* RIGHT: Book CTA + Notifications + Profile Avatar Dropdown */}
          <div className="flex items-center gap-3">
            {/* Book Appointment CTA Pill Button */}
            <Link
              href="/services"
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Book Appointment</span>
            </Link>

            {/* Notification Bell Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationsPopover(!showNotificationsPopover);
                  if (!showNotificationsPopover) loadNotifications();
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-zinc-950">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Avatar Dropdown Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 p-1 pr-3 transition hover:bg-slate-200 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="shadow-xs flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                  {getInitials(user.name)}
                </div>
                <span className="max-w-[120px] truncate text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                  {user.name || "Patient"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="border-b border-slate-100 px-3 py-2 dark:border-zinc-800">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {user.name || "Patient"}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">{user.email}</p>
                  </div>

                  <div className="space-y-0.5 py-1">
                    <Link
                      href="/patient/profile"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <User className="h-4 w-4 text-emerald-600" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href="/patient/settings"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Settings className="h-4 w-4 text-slate-500" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1 dark:border-zinc-800">
                    <button
                      onClick={handleLogout}
                      disabled={isPending}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FLOATING NOTIFICATIONS POPOVER PANEL                        */}
      {/* ========================================================= */}
      {showNotificationsPopover && (
        <div
          ref={popoverRef}
          className="absolute right-4 top-16 z-50 w-80 space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 dark:border-zinc-800 dark:bg-zinc-900 sm:right-8 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ""}
              </h3>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No notifications found.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={`cursor-pointer rounded-2xl border p-3 text-xs transition ${
                    !n.isRead
                      ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                      : "dark:bg-zinc-850 border-slate-100 bg-slate-50 opacity-80 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold leading-tight text-slate-900 dark:text-white">
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">
                    {n.message}
                  </p>

                  <span className="mt-2 block text-[9px] font-medium text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function LayoutDashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
