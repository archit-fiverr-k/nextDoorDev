import Link from "next/link";
import {
  Calendar,
  Search,
  User,
  Bell,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Clock,
  Sparkles,
  MapPin,
  Building2,
  CalendarDays,
  FileText,
  CheckCircle2,
  ExternalLink,
  Plus,
  Stethoscope,
  Phone,
} from "lucide-react";
import { getPatientDashboardStatsAction } from "@/actions/patient-appointments";
import { getRecentPatientNotificationsAction } from "@/actions/patient-notifications";
import { getPatientProfileAction } from "@/actions/patient";
import { StatsCard } from "@/components/patient/stats-card";
import { NextAppointmentCard } from "@/components/patient/next-appointment-card";

export default async function PatientDashboardPage() {
  const [statsRes, notificationsRes, profileRes] = await Promise.all([
    getPatientDashboardStatsAction(),
    getRecentPatientNotificationsAction(4),
    getPatientProfileAction(),
  ]);

  const stats =
    statsRes.success && statsRes.data
      ? statsRes.data
      : {
          upcoming: 0,
          completed: 0,
          cancelled: 0,
          pending: 0,
          rescheduleRequested: 0,
          nextAppointment: null,
        };
  const notifications = notificationsRes.success ? notificationsRes.data : [];
  const profile =
    profileRes.success && profileRes.data
      ? profileRes.data
      : { firstName: "Patient", lastName: "" };

  const nextApp = stats.nextAppointment;

  return (
    <div className="space-y-8 duration-300 animate-in fade-in">
      {/* 1. Executive Welcome Hero Banner (Primary #10B981 + Secondary #0F172A) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0F172A] p-6 text-white shadow-xl sm:p-8">
        {/* Glow Accent Mesh */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#10B981]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#38bdf8]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#10B981]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>NHS Compliant Patient Portal</span>
            </div>

            <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Welcome back, {profile.firstName}!
            </h1>

            <p className="text-xs font-medium leading-relaxed text-slate-300 sm:text-sm">
              Your personal healthcare suite. Easily track upcoming appointments, search verified UK
              pharmacies, and access clinical records.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 sm:flex-nowrap">
            <Link
              href="/patient/book"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#10B981] px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#10B981]/25 transition-all hover:bg-[#059669]"
            >
              <Plus className="h-4 w-4" />
              <span>Book Appointment</span>
            </Link>

            <Link
              href="/patient/providers"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-xs font-bold text-white transition-all hover:bg-slate-700"
            >
              <Building2 className="h-4 w-4 text-[#10B981]" />
              <span>Find Clinics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Executive Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        <StatsCard
          label="Upcoming"
          value={stats.upcoming}
          icon={Calendar}
          color="bg-[#10B981]/10 text-[#10B981]"
          description="Confirmed appointments"
          trend="Active"
        />
        <StatsCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-500/10 text-amber-600"
          description="Awaiting clinic review"
        />
        <StatsCard
          label="Completed"
          value={stats.completed}
          icon={ShieldCheck}
          color="bg-slate-100 text-slate-700"
          description="Past consultations"
        />
        <StatsCard
          label="Reschedules"
          value={stats.rescheduleRequested}
          icon={CalendarDays}
          color="bg-purple-500/10 text-purple-600"
          description="Requested updates"
        />
      </div>

      {/* 3. Main Bento Grid: Next Appointment & Recent Notifications */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Next Appointment Spotlight Card (lg:col-span-7) */}
        <div className="lg:col-span-7">
          <NextAppointmentCard nextApp={nextApp} />
        </div>

        {/* Right Bento Box: Health Updates & Quick Launchpad (lg:col-span-5) */}
        <div className="space-y-8 lg:col-span-5">
          {/* Notifications & Health Feed */}
          <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#10B981]" />
                <h2 className="text-base font-extrabold text-[#0F172A]">Recent Activity</h2>
              </div>
              <Link
                href="/patient/notifications"
                className="text-xs font-bold text-[#10B981] hover:underline"
              >
                View All
              </Link>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((n: any) => (
                  <Link
                    key={n.id}
                    href={n.link || "/patient/notifications"}
                    className="group block space-y-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A] transition-colors group-hover:text-[#10B981]">
                        {n.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString("en-GB", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">
                      {n.message}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-bold text-slate-400">
                No recent notifications.
              </div>
            )}
          </div>

          {/* Healthcare Quick Launchpad (Secondary #0F172A) */}
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-[#0F172A] p-6 text-white shadow-xl sm:p-8">
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white">
              <Sparkles className="h-4 w-4 text-[#10B981]" /> Healthcare Quick Tools
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/patient/appointments"
                className="group space-y-1 rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3.5 text-left transition-all hover:bg-slate-800"
              >
                <FileText className="h-4 w-4 text-[#10B981] transition-transform group-hover:scale-110" />
                <p className="text-xs font-bold text-white">All Bookings</p>
                <p className="text-[10px] text-slate-400">View history</p>
              </Link>

              <Link
                href="/patient/providers"
                className="group space-y-1 rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3.5 text-left transition-all hover:bg-slate-800"
              >
                <Building2 className="h-4 w-4 text-[#10B981] transition-transform group-hover:scale-110" />
                <p className="text-xs font-bold text-white">UK Clinics</p>
                <p className="text-[10px] text-slate-400">Find locations</p>
              </Link>

              <Link
                href="/patient/profile"
                className="group space-y-1 rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3.5 text-left transition-all hover:bg-slate-800"
              >
                <User className="h-4 w-4 text-[#10B981] transition-transform group-hover:scale-110" />
                <p className="text-xs font-bold text-white">My Profile</p>
                <p className="text-[10px] text-slate-400">NHS & Contact</p>
              </Link>

              <Link
                href="/patient/settings"
                className="group space-y-1 rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3.5 text-left transition-all hover:bg-slate-800"
              >
                <ShieldCheck className="h-4 w-4 text-[#10B981] transition-transform group-hover:scale-110" />
                <p className="text-xs font-bold text-white">Security</p>
                <p className="text-[10px] text-slate-400">Password & Prefs</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
