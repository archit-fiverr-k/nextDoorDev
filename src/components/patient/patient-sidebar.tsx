"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  LayoutDashboard,
  Calendar,
  Search,
  Building2,
  User,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  HeartPulse,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

const NAV_ITEMS = [
  { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/appointments", label: "My Appointments", icon: Calendar },
  { href: "/patient/book", label: "Book Appointment", icon: Search },
  { href: "/patient/providers", label: "Find Clinics", icon: Building2 },
  { href: "/patient/notifications", label: "Notifications", icon: Bell },
  { href: "/patient/profile", label: "Medical Profile", icon: User },
  { href: "/patient/settings", label: "Settings", icon: Settings },
];

interface PatientSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function PatientSidebar({ user }: PatientSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#0F172A] text-white">
      {/* Brand Header with Logo */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5">
        <Link href="/patient/dashboard" className="group flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/header-logo.png"
            alt="NextDoorClinic Logo"
            style={{ filter: "brightness(0) invert(1)" }}
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>
      </div>

      {/* Patient Profile Box */}
      <div className="mx-4 mt-5 space-y-3 rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10B981] text-xs font-black text-white shadow-md">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-grow">
            <div className="flex items-center gap-1">
              <p className="truncate text-xs font-bold text-white">{user.name || "Patient"}</p>
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
            </div>
            <p className="mt-0.5 truncate text-[10px] text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-700/50 pt-2 text-[10px] font-semibold text-slate-300">
          <span className="flex items-center gap-1 text-[#10B981]">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#10B981]" />
            Verified Patient
          </span>
          <span className="text-slate-400">NHS ID Connected</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Patient Suite
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-[#10B981] text-white shadow-lg shadow-[#10B981]/25"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-[#10B981]"}`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-white" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout Button */}
      <div className="border-t border-slate-800/80 p-4">
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-800 px-3.5 py-3 text-xs font-bold text-slate-300 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-4 w-4 text-slate-400 group-hover:text-rose-400" />
            <span>Sign Out Account</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 shadow-2xl lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Top Header Toggle */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-[#0F172A] px-5 py-3.5 text-white lg:hidden">
        <Link href="/patient/dashboard" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/header-logo.png"
            alt="NextDoorClinic Logo"
            style={{ filter: "brightness(0) invert(1)" }}
            className="h-7 w-auto object-contain"
          />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full w-72 max-w-[80vw] shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
