"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Search,
  Building2,
  User,
  Settings,
  Bell,
  LogOut,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

const NAV_ITEMS = [
  { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/appointments", label: "My Appointments", icon: Calendar },
  { href: "/services", label: "Book Appointment", icon: Search },
  { href: "/services", label: "Find Clinics", icon: Building2 },
  { href: "/patient/profile", label: "Medical Profile", icon: User },
  { href: "/patient/settings", label: "Settings", icon: Settings },
];

interface PatientSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function PatientSidebar({
  user,
  mobileOpen = false,
  setMobileOpen,
}: PatientSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const closeMobile = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const SidebarBody = () => (
    <div className="flex h-full select-none flex-col border-r border-slate-200 bg-white text-slate-900">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <Link
          href="/patient/dashboard"
          onClick={closeMobile}
          className="flex items-center space-x-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white shadow-md">
            NC
          </div>
          <div>
            <span className="block text-sm font-black tracking-tight text-slate-900">
              NextDoorClinic
            </span>
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-emerald-600">
              Patient Suite
            </span>
          </div>
        </Link>

        {setMobileOpen && (
          <button
            onClick={closeMobile}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Patient Profile Card */}
      <div className="mx-4 mt-5 space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white shadow-md">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-xs font-bold text-slate-900">{user.name || "Patient"}</p>
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            </div>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] font-semibold text-slate-600">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
            Verified Patient
          </span>
          <span className="text-slate-500">NHS ID Connected</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Main Menu
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-extrabold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100 hover:text-emerald-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-transform ${isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-600"}`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-white" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-100 p-4">
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-4 w-4 text-slate-400 group-hover:text-rose-600" />
            <span>Sign Out</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Portal */}
      {mobileOpen && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[99999] flex md:hidden">
              <div className="backdrop-blur-xs fixed inset-0 bg-black/40" onClick={closeMobile} />
              <div className="relative z-10 h-full w-72 max-w-[82vw] shadow-2xl duration-200 animate-in slide-in-from-left">
                <SidebarBody />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
