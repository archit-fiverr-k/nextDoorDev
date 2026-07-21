"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, Mail, Phone, CalendarCheck, FileSpreadsheet, Download, Tags } from "lucide-react";

interface CustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string | null;
  dateOfBirth: Date | null;
  _count?: {
    appointments: number;
  };
}

interface CRMSidebarProps {
  tenantId: string;
  customers: CustomerListItem[];
}

export function CRMSidebar({ tenantId, customers }: CRMSidebarProps) {
  const params = useParams();
  const activeCustomerId = params.customerId as string | undefined;

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active">("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");

  // Collect all unique patient tags
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    customers.forEach((c) => {
      if (c.tags) {
        c.tags.split(",").forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) tagsSet.add(trimmed);
        });
      }
    });
    return Array.from(tagsSet);
  }, [customers]);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.tags && c.tags.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = filterType === "all" || (c._count && c._count.appointments > 0);

    const matchesTag =
      selectedTagFilter === "all" ||
      (c.tags &&
        c.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .includes(selectedTagFilter.toLowerCase()));

    return matchesSearch && matchesFilter && matchesTag;
  });

  // Client-side CSV/Excel compatible exporter
  const exportToCSV = (formatType: "csv" | "excel") => {
    const headers = [
      "Patient ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "DoB",
      "Tags",
      "Appointments Registered",
    ];
    const rows = filteredCustomers.map((c) => [
      c.id,
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString() : "",
      c.tags || "",
      c._count?.appointments || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Add UTF-8 BOM encoding for proper Excel formatting support
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `patient_list_${tenantId}_${new Date().toISOString().slice(0, 10)}.${formatType === "excel" ? "csv" : "csv"}`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full select-none flex-col border-r border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
      {/* Search Header */}
      <div className="space-y-3 border-b border-slate-100 p-4 dark:border-zinc-900/60">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:ring-blue-550 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-semibold focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus:bg-zinc-950"
          />
        </div>

        {/* Tag Filters Dropdown */}
        {allTags.length > 0 && (
          <div className="border-slate-150/60 flex items-center space-x-2 rounded-lg border bg-slate-50 p-2 text-[10px] font-bold text-slate-500">
            <Tags className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="w-full border-none bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Tags ({allTags.length})</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  Tag: {tag}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter buttons */}
        <div className="flex space-x-1.5">
          <button
            onClick={() => setFilterType("all")}
            className={`flex-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold transition-all ${
              filterType === "all"
                ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-slate-655 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            All Patients ({customers.length})
          </button>
          <button
            onClick={() => setFilterType("active")}
            className={`flex-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold transition-all ${
              filterType === "active"
                ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-slate-655 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            With Bookings
          </button>
        </div>

        {/* Exporters */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-1">
          <button
            onClick={() => exportToCSV("csv")}
            className="text-slate-655 inline-flex h-8 cursor-pointer items-center justify-center space-x-1 rounded-lg border border-slate-200 text-[10px] font-bold transition-all hover:bg-slate-50"
            title="Export patient records as CSV"
          >
            <Download className="h-3 w-3" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportToCSV("excel")}
            className="text-slate-655 inline-flex h-8 cursor-pointer items-center justify-center space-x-1 rounded-lg border border-slate-200 text-[10px] font-bold transition-all hover:bg-slate-50"
            title="Export patient records to Excel compatible CSV"
          >
            <FileSpreadsheet className="h-3 w-3" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Customer List Scroll Container */}
      <div className="flex-1 select-text divide-y divide-slate-100 overflow-y-auto dark:divide-zinc-900/60">
        {filteredCustomers.length === 0 ? (
          <div className="text-slate-450 p-8 text-center text-xs italic">
            No patients match criteria.
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const isActive = activeCustomerId === customer.id;
            return (
              <Link
                key={customer.id}
                href={`/pharmacy/${tenantId}/crm/${customer.id}`}
                className={`block p-4 transition-all hover:bg-slate-50/70 dark:hover:bg-zinc-900/20 ${
                  isActive
                    ? "border-l-4 border-blue-600 bg-blue-50/50 hover:bg-blue-50/60 dark:border-blue-500 dark:bg-zinc-900/45"
                    : ""
                }`}
              >
                <div className="space-y-1">
                  <h4 className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    <span>
                      {customer.firstName} {customer.lastName}
                    </span>
                    {customer._count && customer._count.appointments > 0 && (
                      <span className="flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500">
                        <CalendarCheck className="mr-0.5 h-2.5 w-2.5" />
                        Booked
                      </span>
                    )}
                  </h4>
                  <div className="space-y-0.5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                    <p className="flex items-center truncate">
                      <Mail className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {customer.email}
                    </p>
                    <p className="flex items-center">
                      <Phone className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {customer.phone}
                    </p>
                  </div>

                  {customer.tags && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {customer.tags.split(",").map((t) => (
                        <span
                          key={t}
                          className="text-slate-550 border-slate-150/40 rounded border bg-slate-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase"
                        >
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
