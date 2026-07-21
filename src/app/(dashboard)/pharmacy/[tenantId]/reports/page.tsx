"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  Filter,
} from "lucide-react";

interface ReportsPageProps {
  params: {
    tenantId: string;
  };
}

export default function ReportsPage({ params }: ReportsPageProps) {
  const [timeRange, setTimeRange] = useState("month");

  const exportData = (formatType: "CSV" | "Excel" | "PDF") => {
    const filename = `Pharmacy_Financial_Performance_Report_${timeRange}.${formatType.toLowerCase()}`;
    const dummyContent =
      "Date,Service,Patient,Revenue,Status\n2026-07-20,Travel Vaccination,Sarah Jenkins,£85.00,Completed\n2026-07-20,Ear Wax Removal,Robert Chen,£60.00,Completed";
    const blob = new Blob([dummyContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="select-text space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Reports & Business Intelligence
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Financial revenue analytics, appointment fulfillment ratios, practitioner performance,
            and CSV/PDF export.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Timeframe Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Month to Date (July 2026)</option>
            <option value="year">Year to Date (2026)</option>
          </select>

          {/* Export Dropdown buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => exportData("CSV")}
              className="flex items-center space-x-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => exportData("Excel")}
              className="flex items-center space-x-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={() => exportData("PDF")}
              className="flex items-center space-x-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Summary Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">
            Total Gross Revenue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
              £14,850.00
            </span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/30">
              +14.2% YoY
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Based on 184 paid appointment sessions</p>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">
            Completed Bookings
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">172</span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/30">
              93.4% Rate
            </span>
          </div>
          <p className="text-[10px] text-slate-400">12 cancellations recorded</p>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">
            No-Show & Cancellation
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">6.5%</span>
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/30">
              Low Risk
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Industry benchmark: 11%</p>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">
            Repeat Patient Retention
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">42.8%</span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/30">
              78 Returning
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Patients with &gt;1 clinic visit</p>
        </div>
      </div>

      {/* Staff Performance & Popular Services Split Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Popular Services Breakdown */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Top Revenue Generating Services
          </h3>

          <div className="space-y-3 text-xs">
            {[
              {
                name: "Yellow Fever & Travel Advisory",
                count: 64,
                revenue: "£5,440.00",
                percentage: "36%",
              },
              {
                name: "Ear Wax Removal (Microsuction)",
                count: 48,
                revenue: "£2,880.00",
                percentage: "24%",
              },
              {
                name: "Blood Glucose & Lipid Panel",
                count: 32,
                revenue: "£1,920.00",
                percentage: "18%",
              },
              {
                name: "HPV & Hepatitis B Vaccination",
                count: 28,
                revenue: "£2,520.00",
                percentage: "14%",
              },
            ].map((srv, idx) => (
              <div key={idx} className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>{srv.name}</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400">{srv.revenue}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{srv.count} consultations</span>
                  <span>{srv.percentage} of monthly total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Practitioner Performance Benchmarks */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Practitioner Performance Benchmarks
          </h3>

          <div className="space-y-3 text-xs">
            {[
              {
                name: "Dr. Alex Rivera",
                role: "GP / Travel Lead",
                bookings: 78,
                rating: "4.9 ★",
                revenue: "£6,630.00",
              },
              {
                name: "Nurse Elena Vance",
                role: "Nurse Specialist",
                bookings: 62,
                rating: "5.0 ★",
                revenue: "£4,340.00",
              },
              {
                name: "Pharm. Marcus Thorne",
                role: "Lead Pharmacist",
                bookings: 44,
                rating: "4.8 ★",
                revenue: "£3,880.00",
              },
            ].map((staff, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-200/60 p-3 dark:border-zinc-800/60"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{staff.name}</h4>
                  <span className="text-[10px] text-slate-400">
                    {staff.role} • {staff.bookings} slots
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="block font-bold text-slate-900 dark:text-slate-100">
                    {staff.revenue}
                  </span>
                  <span className="text-[10px] font-bold text-amber-500">{staff.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
