"use client";

import React from "react";
import { FileSpreadsheet, Store } from "lucide-react";

interface CsvExporterProps {
  data: any[];
  filename: string;
  title: string;
  subtitle: string;
  icon: "bookings" | "providers" | "patients";
}

export function CsvExporter({ data, filename, title, subtitle, icon }: CsvExporterProps) {
  const handleDownload = () => {
    if (!data || !data.length) {
      alert("No data available to export in this range.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const val =
              row[fieldName] === null || row[fieldName] === undefined ? "" : String(row[fieldName]);
            return '"' + val.replace(/"/g, '""') + '"';
          })
          .join(",")
      ),
    ];

    // Add UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      type="button"
      className="dark:hover:bg-zinc-850 group flex w-full select-none items-center space-x-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div
        className={`shrink-0 rounded-lg p-2.5 transition-transform group-hover:scale-105 ${
          icon === "bookings"
            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
            : icon === "providers"
              ? "bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400"
              : "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400"
        }`}
      >
        {icon === "providers" ? (
          <Store className="h-5 w-5" />
        ) : (
          <FileSpreadsheet className="h-5 w-5" />
        )}
      </div>
      <div>
        <span className="text-slate-850 block text-xs font-bold dark:text-slate-200">{title}</span>
        <span className="mt-0.5 block text-[10px] text-slate-400">{subtitle}</span>
      </div>
    </button>
  );
}
