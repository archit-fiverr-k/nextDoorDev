"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  PoundSterling,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  PieChart,
  Activity,
  ShieldCheck,
} from "lucide-react";

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
  const [graphMode, setGraphMode] = useState<"monthly" | "weekly">("monthly");

  const trendData = graphMode === "monthly" ? analytics.monthlyTrend : analytics.weeklyTrend;

  // Calculate maximum values for relative graph scaling
  const maxRevenue = Math.max(...trendData.map((d) => d.revenue), 10);
  const maxBookings = Math.max(...trendData.map((d) => d.bookings), 1);

  return (
    <div className="select-text space-y-8 font-sans text-slate-900 antialiased dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 1. HEADER TITLE & GRAPH TOGGLE */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#10B981]">
              Financial & Clinical Intelligence
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ Strictly Realized Revenue
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Pharmacy Revenue & Booking Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Revenue is added to graphs and totals <strong>only after</strong> bookings are marked
            completed by pharmacy staff.
          </p>
        </div>

        {/* Graph Mode Selector */}
        <div className="shadow-2xs flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setGraphMode("monthly")}
            className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all ${
              graphMode === "monthly"
                ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Monthly Trend (6 Mo)
          </button>
          <button
            onClick={() => setGraphMode("weekly")}
            className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all ${
              graphMode === "weekly"
                ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Weekly Breakdown (4 Wks)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP METRIC CARDS (Realized vs Potential Pipeline) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Completed Realized Revenue */}
        <div className="shadow-xs space-y-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Completed Revenue
            </span>
            <div className="shadow-xs flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981] text-white">
              <PoundSterling className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              £{analytics.totalRevenue.toFixed(2)}
            </p>
            <div className="flex items-center space-x-2 pt-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                Realized on completion
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Potential Pipeline Revenue */}
        <div className="shadow-xs space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pipeline / Pending
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              £{analytics.potentialRevenue.toFixed(2)}
            </p>
            <p className="pt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              From {analytics.pendingCount + analytics.confirmedCount} pending/confirmed slots
            </p>
          </div>
        </div>

        {/* Card 3: Completed Appointments */}
        <div className="shadow-xs space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Completed Appointments
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {analytics.completedCount}
            </p>
            <p className="pt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Out of {analytics.totalAppointments} total booking requests
            </p>
          </div>
        </div>

        {/* Card 4: Attendance Rate */}
        <div className="shadow-xs space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Attendance Rate
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {analytics.attendanceRate}%
            </p>
            <p className="pt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Completed vs Cancelled ratio
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GRAPH-BASED REVENUE & BOOKINGS TREND LINE CHART */}
      {/* ========================================================================= */}
      <div className="shadow-xs space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 dark:border-zinc-800 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center space-x-2 text-base font-extrabold text-slate-900 dark:text-white">
              <Activity className="h-5 w-5 text-[#10B981]" />
              <span>
                {graphMode === "monthly"
                  ? "Monthly Realized Revenue Curve"
                  : "Weekly Realized Revenue Curve"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Interactive trend curve showing revenue (£) accumulated strictly from completed
              bookings.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-bold">
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-full bg-[#10B981] ring-4 ring-emerald-100 dark:ring-emerald-950" />
              <span className="text-slate-700 dark:text-zinc-300">Completed Revenue (£)</span>
            </div>
          </div>
        </div>

        {/* Professional SVG Line Graph */}
        {(() => {
          const svgWidth = 800;
          const svgHeight = 220;
          const paddingX = 40;
          const paddingTop = 20;
          const paddingBottom = 30;
          const graphWidth = svgWidth - paddingX * 2;
          const graphHeight = svgHeight - paddingTop - paddingBottom;

          const linePoints = trendData.map((item, index) => {
            const x = paddingX + (index / Math.max(trendData.length - 1, 1)) * graphWidth;
            const y = svgHeight - paddingBottom - (item.revenue / maxRevenue) * graphHeight;
            return { x, y, item };
          });

          const pathD = linePoints.reduce((acc, point, index) => {
            if (index === 0) return `M ${point.x} ${point.y}`;
            const prev = linePoints[index - 1];
            const cx = (prev.x + point.x) / 2;
            return `${acc} C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
          }, "");

          const areaD = `${pathD} L ${linePoints[linePoints.length - 1].x} ${svgHeight - paddingBottom} L ${linePoints[0].x} ${svgHeight - paddingBottom} Z`;

          return (
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="h-auto w-full overflow-visible"
              >
                <defs>
                  <linearGradient id="emeraldLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 0.33, 0.66, 1].map((pct, i) => {
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
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Gradient Area Fill */}
                <path d={areaD} fill="url(#emeraldLineGrad)" />

                {/* Main Smooth Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Data Points */}
                {linePoints.map((pt, idx) => (
                  <g key={idx} className="group/node cursor-pointer">
                    <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="6"
                      className="group-hover/node:r-8 fill-white stroke-[#10B981] transition-all dark:fill-zinc-900"
                      strokeWidth="3"
                    />
                    <circle cx={pt.x} cy={pt.y} r="2.5" className="fill-[#10B981]" />

                    {/* Node Hover Card */}
                    <foreignObject
                      x={pt.x - 60}
                      y={pt.y - 65}
                      width="120"
                      height="60"
                      className="pointer-events-none overflow-visible opacity-0 transition-opacity duration-200 group-hover/node:opacity-100"
                    >
                      <div className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-center text-white shadow-xl dark:bg-white dark:text-slate-900">
                        <span className="block text-[9px] font-medium opacity-80">
                          {pt.item.label}
                        </span>
                        <span className="block text-xs font-black text-emerald-400 dark:text-emerald-600">
                          £{pt.item.revenue.toFixed(2)}
                        </span>
                        <span className="block text-[8px] font-bold text-slate-300 dark:text-slate-600">
                          {pt.item.completedBookings} Completed
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                ))}
              </svg>

              {/* X-Axis Labels */}
              <div className="flex justify-between border-t border-slate-100 px-6 pt-3 text-xs font-bold text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
                {trendData.map((item, idx) => (
                  <div key={idx} className="text-center">
                    <span>{item.label}</span>
                    <span className="block text-[10px] font-extrabold text-[#10B981]">
                      £{item.revenue.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ========================================================================= */}
      {/* 4. SERVICE PERFORMANCE MATRIX TABLE */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Service Performance Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Services ranked by realized revenue from appointments marked COMPLETED by pharmacy
              admin.
            </p>
          </div>
        </div>

        <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {analytics.topServices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
              No service booking data available yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Service Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-center">Completed / Total</th>
                  <th className="px-5 py-3.5 text-right">Price / Dose</th>
                  <th className="px-5 py-3.5 text-right">Realized Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {analytics.topServices.map((svc, idx) => (
                  <tr
                    key={idx}
                    className="dark:hover:bg-zinc-850 transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {svc.name}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {svc.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-900 dark:text-white">
                      <span className="text-blue-600 dark:text-blue-400">
                        {svc.completedCount || 0}
                      </span>{" "}
                      / <span className="text-slate-500">{svc.count}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-600 dark:text-zinc-400">
                      £{svc.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                      £{svc.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
