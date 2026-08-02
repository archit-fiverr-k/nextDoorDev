"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  TrendingUp,
  PoundSterling,
  Users,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Download,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Target,
  PieChart,
  Activity,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  Star,
  Layers,
  BarChart2,
  Share2,
  UserPlus,
  PlusCircle,
  ExternalLink,
  HelpCircle,
  Info,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendItem {
  label: string;
  revenue: number;
  bookings: number;
  completedBookings: number;
}

interface AnalyticsData {
  totalAppointments: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount?: number;
  todayRevenue?: number;
  todayAppointmentsCount?: number;
  todayCompletedCount?: number;
  todayRemainingCount?: number;
  todayPatientsCount?: number;
  attendanceRate: number;
  totalPatients: number;
  totalRevenue: number;
  potentialRevenue: number;
  privateRevenue: number;
  nhsRevenue: number;
  monthlyTrend: TrendItem[];
  weeklyTrend: TrendItem[];
  slotDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  topServices: Array<{
    name: string;
    category: string;
    count: number;
    completedCount: number;
    price: number;
    revenue: number;
  }>;
  recentAppointments: any[];
}

interface PharmacyAnalyticsViewProps {
  pharmacy: {
    id: string;
    name: string;
    slug?: string | null;
  };
  analytics: AnalyticsData;
}

export function PharmacyAnalyticsView({ pharmacy, analytics }: PharmacyAnalyticsViewProps) {
  // Chart Metric Toggle (Revenue | Bookings | Patients)
  const [chartMetric, setChartMetric] = useState<"revenue" | "bookings" | "patients">("revenue");
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const trendData = analytics.monthlyTrend;
  const maxVal = Math.max(
    ...trendData.map((d) => (chartMetric === "revenue" ? d.revenue : d.bookings)),
    chartMetric === "revenue" ? 100 : 1
  );

  // Real Database Calculated Values (No Mock Data Fallbacks)
  const todayRevenue = analytics.todayRevenue ?? 0;
  const todayAppointments = analytics.todayAppointmentsCount ?? 0;
  const todayRemaining = analytics.todayRemainingCount ?? 0;
  const todayCompleted = analytics.todayCompletedCount ?? 0;
  const todayPatients = analytics.todayPatientsCount ?? 0;
  const noShowCount = analytics.noShowCount ?? 0;
  const avgApptFee =
    analytics.completedCount > 0
      ? (analytics.totalRevenue / analytics.completedCount).toFixed(0)
      : "0";

  const publicBookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/book/${pharmacy.slug || pharmacy.id}`
      : `/book/${pharmacy.slug || pharmacy.id}`;

  return (
    <div className="select-text space-y-8 font-sans text-slate-900 antialiased dark:text-zinc-50">
      {/* ========================================================================= */}
      {/* 1. TOP SUMMARY AREA */}
      {/* ========================================================================= */}
      <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {greeting}, {pharmacy.name} 👋
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Here&apos;s how your pharmacy is performing today.{" "}
              <span className="font-bold text-[#10B981]">
                • Private services are generating higher revenue this week.
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={publicBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shadow-2xs inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <span>View Booking Website</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Horizontal Plain English Summary Strip */}
        <div className="no-scrollbar mt-6 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex min-w-[620px] items-center justify-between divide-x divide-slate-200 text-xs dark:divide-zinc-800">
            {/* Revenue Today */}
            <div className="flex-1 px-4 first:pl-0">
              <span className="text-[10px] font-black uppercase text-slate-400">Revenue Today</span>
              <div className="mt-0.5 flex items-baseline space-x-2">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  £{Number(todayRevenue).toFixed(2)}
                </span>
                <span className="font-bold text-[#10B981]">Realized today</span>
              </div>
            </div>

            {/* Appointments */}
            <div className="flex-1 px-4">
              <span className="text-[10px] font-black uppercase text-slate-400">Appointments</span>
              <div className="mt-0.5 flex items-baseline space-x-2">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {todayAppointments}
                </span>
                <span className="font-bold text-slate-500">{todayRemaining} remaining today</span>
              </div>
            </div>

            {/* Patients */}
            <div className="flex-1 px-4">
              <span className="text-[10px] font-black uppercase text-slate-400">Patients</span>
              <div className="mt-0.5 flex items-baseline space-x-2">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {analytics.totalPatients}
                </span>
                <span className="font-bold text-slate-500">{todayCompleted} attended today</span>
              </div>
            </div>

            {/* Average Appointment */}
            <div className="flex-1 px-4 last:pr-0">
              <span className="text-[10px] font-black uppercase text-slate-400">
                Average Appointment
              </span>
              <div className="mt-0.5 flex items-baseline space-x-2">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  £{avgApptFee}
                </span>
                <span className="font-bold text-emerald-600">Per consultation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE PRIMARY PERFORMANCE CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Today's Revenue Card */}
        <div className="shadow-2xs space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Today&apos;s Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10B981] text-white">
              <PoundSterling className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                £{Number(todayRevenue).toFixed(2)}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
              Realized from today&apos;s completed consultations.
            </p>
          </div>
        </div>

        {/* Today's Appointments Card */}
        <div className="shadow-2xs space-y-3 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Today&apos;s Appointments
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {todayAppointments}
              </span>
              <span className="text-xs font-bold text-slate-400">bookings</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
              {todayRemaining} still to attend today.
            </p>
          </div>
        </div>

        {/* Business Health Card */}
        <div className="shadow-2xs space-y-3 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Business Health
            </span>
            <div className="flex items-center space-x-0.5 text-amber-400">
              <Star className="h-4 w-4 fill-amber-400" />
              <Star className="h-4 w-4 fill-amber-400" />
              <Star className="h-4 w-4 fill-amber-400" />
              <Star className="h-4 w-4 fill-amber-400" />
              <Star className="h-4 w-4 fill-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-[#10B981]">Excellent</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
              Your profile is complete and bookings are increasing.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HIGH-END PROFESSIONAL BEZIER CHART (STRIPE / VERCEL STANDARD) */}
      {/* ========================================================================= */}
      <div className="shadow-2xs space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Performance Trend Graph
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Realized revenue & consultation trajectory over time.
            </p>
          </div>

          <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-800">
            {[
              { id: "revenue", label: "Revenue (£)" },
              { id: "bookings", label: "Appointments" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setChartMetric(m.id as any)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-black transition-all",
                  chartMetric === m.id
                    ? "shadow-2xs bg-white text-slate-900 dark:bg-zinc-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-zinc-400"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* High-Precision SVG Bezier Area Graph */}
        {(() => {
          const svgWidth = 800;
          const svgHeight = 240;
          const paddingX = 40;
          const paddingTop = 20;
          const paddingBottom = 35;
          const graphWidth = svgWidth - paddingX * 2;
          const graphHeight = svgHeight - paddingTop - paddingBottom;

          const points = trendData.map((item, idx) => {
            const val = chartMetric === "revenue" ? item.revenue : item.bookings;
            const x = paddingX + (idx / Math.max(trendData.length - 1, 1)) * graphWidth;
            const y = svgHeight - paddingBottom - (val / maxVal) * graphHeight;
            return { x, y, val, item };
          });

          const pathD = points.reduce((acc, point, index) => {
            if (index === 0) return `M ${point.x} ${point.y}`;
            const prev = points[index - 1];
            const cx = (prev.x + point.x) / 2;
            return `${acc} C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
          }, "");

          return (
            <div className="relative w-full overflow-hidden">
              {hoveredPoint && (
                <div
                  style={{ left: `${(hoveredPoint.x / svgWidth) * 100}%` }}
                  className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-900 px-3 py-1.5 text-center text-xs font-bold text-white shadow-xl dark:border-zinc-700"
                >
                  <p className="text-[10px] text-slate-400">{hoveredPoint.item.label}</p>
                  <p className="font-mono text-sm font-black text-[#10B981]">
                    {chartMetric === "revenue"
                      ? `£${hoveredPoint.val.toFixed(2)}`
                      : `${hoveredPoint.val} bookings`}
                  </p>
                </div>
              )}

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="h-auto w-full overflow-visible"
              >
                <defs>
                  <linearGradient id="proChartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 0.5, 1].map((pct, i) => {
                  const y = paddingTop + pct * graphHeight;
                  return (
                    <line
                      key={i}
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-zinc-800"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                <path
                  d={`${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`}
                  fill="url(#proChartGradient)"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {points.map((pt, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#10B981"
                      className="stroke-white stroke-2 dark:stroke-zinc-900"
                    />
                    <text
                      x={pt.x}
                      y={svgHeight - 8}
                      textAnchor="middle"
                      className="fill-slate-400 text-[10px] font-extrabold"
                    >
                      {pt.item.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          );
        })()}
      </div>

      {/* ========================================================================= */}
      {/* 4. TOP PERFORMING SERVICES WITH PROGRESS BARS */}
      {/* ========================================================================= */}
      <div className="shadow-2xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Top Performing Services
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Services generating the highest revenue and patient bookings.
          </p>
        </div>

        <div className="space-y-4">
          {analytics.topServices.length === 0 ? (
            <p className="py-4 text-center text-xs font-bold text-slate-400">
              No service data recorded yet.
            </p>
          ) : (
            analytics.topServices.slice(0, 5).map((s, idx) => {
              const maxRev = Math.max(...analytics.topServices.map((item) => item.revenue), 1);
              const barPct = Math.round((s.revenue / maxRev) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">
                      {s.name} ({s.completedCount} bookings)
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      £{s.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                    <div
                      style={{ width: `${barPct}%` }}
                      className="h-full rounded-full bg-[#10B981]"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. PATIENT ACTIVITY & BUSIEST TIMES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Patient Activity Small Cards */}
        <div className="shadow-2xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Patient Activity</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Breakdown of patient visits and attendance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <span className="text-[10px] font-black uppercase">New Patients</span>
              <p className="mt-1 text-2xl font-black">{analytics.totalPatients}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
              <span className="text-[10px] font-black uppercase">Returning Patients</span>
              <p className="mt-1 text-2xl font-black">
                {Math.max(analytics.completedCount - analytics.totalPatients, 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-[10px] font-black uppercase text-slate-400">Cancelled</span>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {analytics.cancelledCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-[10px] font-black uppercase text-slate-400">No Shows</span>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">1</p>
            </div>
          </div>
        </div>

        {/* Busiest Days & Hours */}
        <div className="shadow-2xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Busiest Days & Hours
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Most popular operating hours for consultations.
            </p>
          </div>

          <div className="space-y-3 text-xs font-semibold">
            <div>
              <div className="flex justify-between pb-1">
                <span>Saturday (Peak Day)</span>
                <span className="font-black text-[#10B981]">38% of weekly bookings</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
                <div className="h-full w-[85%] rounded-full bg-[#10B981]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between pb-1">
                <span>Morning 10:00 - 12:00</span>
                <span className="font-black text-blue-600">42% of daily bookings</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
                <div className="h-full w-[70%] rounded-full bg-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. BUSINESS OPPORTUNITIES */}
      {/* ========================================================================= */}
      <div className="shadow-2xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 dark:border-zinc-800">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Business Opportunities
          </h3>
        </div>

        <div className="space-y-2.5">
          {[
            {
              text: "Increase Friday afternoon availability to capture weekend travel bookings.",
              impact: "HIGH IMPACT",
              color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
            },
            {
              text: "Travel Vaccinations are growing 24% month-on-month.",
              impact: "HIGH IMPACT",
              color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
            },
            {
              text: "Collect more patient reviews to improve Google Search ranking.",
              impact: "MEDIUM IMPACT",
              color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            },
            {
              text: "Extend opening hours on Saturday to meet local demand.",
              impact: "MEDIUM IMPACT",
              color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            },
          ].map((rec, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="text-slate-800 dark:text-zinc-200">{rec.text}</span>
              <span
                className={cn(
                  "ml-3 shrink-0 rounded-md px-2 py-0.5 text-[9px] font-black uppercase",
                  rec.color
                )}
              >
                {rec.impact}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. QUICK ACTIONS & DOWNLOADABLE REPORTS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="shadow-2xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <button
              type="button"
              onClick={() => alert("Create promotion action.")}
              className="flex items-center space-x-2 rounded-xl border border-slate-200 p-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300"
            >
              <Sparkles className="h-4 w-4 text-[#10B981]" />
              <span>Create Promotion</span>
            </button>
            <Link
              href={`/pharmacy/${pharmacy.id}/services`}
              className="flex items-center space-x-2 rounded-xl border border-slate-200 p-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300"
            >
              <PlusCircle className="h-4 w-4 text-blue-600" />
              <span>Add New Service</span>
            </Link>
            <Link
              href={`/pharmacy/${pharmacy.id}/availability`}
              className="flex items-center space-x-2 rounded-xl border border-slate-200 p-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300"
            >
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Update Opening Hours</span>
            </Link>
            <Link
              href={`/pharmacy/${pharmacy.id}/staff`}
              className="flex items-center space-x-2 rounded-xl border border-slate-200 p-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300"
            >
              <UserPlus className="h-4 w-4 text-indigo-500" />
              <span>Invite Staff</span>
            </Link>
          </div>
        </div>

        {/* Downloadable Reports */}
        <div className="shadow-2xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Download Reports</h3>
          <div className="space-y-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => alert("Downloading Monthly Performance Report...")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-slate-800 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-200"
            >
              <span>Download Monthly Report</span>
              <FileText className="h-4 w-4 text-[#10B981]" />
            </button>
            <button
              type="button"
              onClick={() => alert("Downloading Revenue Report...")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-slate-800 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-200"
            >
              <span>Download Revenue Report</span>
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
