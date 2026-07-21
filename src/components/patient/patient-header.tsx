"use client";

import Link from "next/link";
import { Bell, Search, ChevronRight, Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getRecentPatientNotificationsAction } from "@/actions/patient-notifications";

interface PatientHeaderProps {
  user: { name?: string | null; email?: string | null };
}

export default function PatientHeader({ user }: PatientHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getRecentPatientNotificationsAction(1).then((res) => {
      if (res.success) setUnreadCount(res.unreadCount);
    });
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/80 bg-[#0F172A] px-5 py-3.5 text-white shadow-md sm:px-8">
      {/* Header Left: Mobile Logo & Desktop Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile-Only Logo (Hidden on Desktop because sidebar already has the brand logo) */}
        <Link
          href="/patient/dashboard"
          className="group flex shrink-0 items-center gap-2 lg:hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/header-logo.png"
            alt="NextDoorClinic Logo"
            style={{ filter: "brightness(0) invert(1)" }}
            className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Desktop Breadcrumbs Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/" className="transition-colors hover:text-[#10B981]">
            NextDoorClinic
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className="flex items-center gap-1.5 font-extrabold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#10B981]" />
            Patient Portal
          </span>
        </div>
      </div>

      {/* Header Right: Actions & Patient Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Search Launcher Button */}
        <Link
          href="/patient/book"
          className="shadow-2xs hidden items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-white transition-all hover:border-[#10B981]/50 hover:bg-slate-800 sm:flex"
        >
          <Search className="h-3.5 w-3.5 text-[#10B981]" />
          <span>Book Appointment</span>
        </Link>

        {/* Notifications Bell Button */}
        <Link
          href="/patient/notifications"
          className="shadow-2xs relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 transition-all hover:border-[#10B981]/50 hover:bg-slate-800"
          title="Notifications"
        >
          <Bell className="h-4 w-4 text-slate-300" />
          {unreadCount > 0 && (
            <span className="shadow-xs absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981] ring-2 ring-[#0F172A]">
              <span className="text-[9px] font-black text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </Link>

        {/* Patient Profile Pill */}
        <Link
          href="/patient/profile"
          className="flex items-center gap-2.5 border-l border-slate-800 pl-2 transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10B981] text-xs font-black text-white shadow-sm">
            {getInitials(user.name)}
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-xs font-bold leading-none text-white">{user.name || "Patient"}</p>
            <p className="mt-0.5 text-[9px] font-semibold text-[#10B981]">Verified Profile</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
