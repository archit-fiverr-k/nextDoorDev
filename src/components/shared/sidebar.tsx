"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  CalendarRange,
  Calendar,
  ScrollText,
  LogOut,
  BriefcaseMedical,
  Clock,
  Palette,
  Users,
  QrCode,
  Settings,
  Mail,
  BarChart3,
  CreditCard,
  Layers,
  Grid,
  ShieldCheck,
  Star,
  Megaphone,
  Sliders,
  Zap,
  Bell,
  HelpCircle,
  Building2,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

interface SidebarItem {
  title: string;
  href: string;
  iconName:
    | "dashboard"
    | "pharmacies"
    | "bookings"
    | "appointments"
    | "calendar"
    | "audit-logs"
    | "services"
    | "categories"
    | "staff"
    | "availability"
    | "branding"
    | "profile"
    | "crm"
    | "patients"
    | "reviews"
    | "marketing"
    | "reports"
    | "booking-settings"
    | "subscription"
    | "billing"
    | "notifications"
    | "support"
    | "widgets"
    | "settings"
    | "mail"
    | "bar-chart"
    | "credit-card"
    | "layers";
}

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: "super_admin" | "platform_admin" | "pharmacy";
  };
  items: SidebarItem[];
  tenantName?: string;
}

const iconMap = {
  dashboard: LayoutDashboard,
  pharmacies: Store,
  bookings: CalendarRange,
  appointments: CalendarRange,
  calendar: Calendar,
  "audit-logs": ScrollText,
  services: BriefcaseMedical,
  categories: Grid,
  staff: ShieldCheck,
  availability: Clock,
  branding: Palette,
  profile: Building2,
  crm: Users,
  patients: Users,
  reviews: Star,
  marketing: Megaphone,
  reports: BarChart3,
  "booking-settings": Sliders,
  subscription: Zap,
  billing: CreditCard,
  notifications: Bell,
  support: HelpCircle,
  widgets: QrCode,
  settings: Settings,
  mail: Mail,
  "bar-chart": BarChart3,
  "credit-card": CreditCard,
  layers: Layers,
};

export function Sidebar({ user, items, tenantName }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-zinc-900/60">
        <Link href="/" className="flex items-center">
          <img
            src="/assets/header-logo.png"
            alt="NextDoorClinic Logo"
            className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
          />
        </Link>
      </div>

      {/* Tenant Indicator (if applicable) */}
      {tenantName && (
        <div className="border-b border-slate-50 px-6 py-4 dark:border-zinc-900/40">
          <div className="flex items-center space-x-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-zinc-800/40 dark:bg-zinc-900/40">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold leading-none text-slate-800 dark:text-slate-200">
                {tenantName}
              </p>
              <span className="text-[10px] font-medium capitalize text-slate-400 dark:text-zinc-500">
                {user.role.replace("_", " ")} Portal
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = iconMap[item.iconName];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex select-none items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-slate-100 font-semibold text-slate-900 dark:bg-zinc-900 dark:text-slate-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-slate-100"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-brand-teal"
                    : "text-slate-400 group-hover:text-slate-900 dark:text-zinc-500 dark:group-hover:text-slate-100"
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="space-y-3 border-t border-slate-100 p-4 dark:border-zinc-900/60">
        <div className="flex items-center space-x-3 px-2 py-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-teal/20 bg-brand-teal/10 text-sm font-bold text-brand-teal dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-brand-teal">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 truncate text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
              {user.name}
            </p>
            <span className="block truncate text-[10px] text-slate-400 dark:text-zinc-500">
              {user.email}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="group flex w-full select-none items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/10"
        >
          <LogOut className="text-rose-450 group-hover:text-rose-650 h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
