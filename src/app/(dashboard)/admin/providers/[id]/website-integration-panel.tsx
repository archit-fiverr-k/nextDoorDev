"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Copy,
  ExternalLink,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

interface CategoryLink {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: Date;
  servicesCount: number;
}

interface WebsiteIntegrationPanelProps {
  pharmacySlug: string;
  pharmacyName: string;
  categories: CategoryLink[];
}

export function WebsiteIntegrationPanel({
  pharmacySlug,
  pharmacyName,
  categories,
}: WebsiteIntegrationPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const getBookingUrl = (catSlug: string) => {
    return `booking.nextdoorclinic.co.uk/book/${pharmacySlug}/${catSlug}`;
  };

  const getFullUrl = (catSlug: string) => {
    return `https://booking.nextdoorclinic.co.uk/book/${pharmacySlug}/${catSlug}`;
  };

  const getCtaText = (catName: string) => {
    return `Book ${catName} Appointment`;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ["Category", "Services", "Booking URL", "Suggested Button Text", "Status"];
    const rows = categories.map((cat) => [
      cat.name,
      `${cat.servicesCount} Services`,
      getFullUrl(cat.slug),
      getCtaText(cat.name),
      cat.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${pharmacySlug}-integration-links.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Exporter (xlsx package)
  const handleExportExcel = () => {
    const excelData = categories.map((cat) => ({
      Category: cat.name,
      Services: `${cat.servicesCount} Services`,
      "Booking URL": getFullUrl(cat.slug),
      "Suggested Button Text": getCtaText(cat.name),
      Status: cat.status,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Integration Links");

    XLSX.writeFile(wb, `${pharmacySlug}-integration-links.xlsx`);
  };

  // PDF Exporter with QR Codes (jsPDF + qrcode)
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF("p", "pt", "a4");

      // Document Title & Headers
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // Navy Brand Color
      doc.text("WordPress Website Integration Links", 40, 50);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Clinic Workspace: ${pharmacyName} (${pharmacySlug})`, 40, 70);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 40, 85);

      // Horizontal Line divider
      doc.setLineWidth(1);
      doc.setDrawColor(226, 232, 240);
      doc.line(40, 100, 555, 100);

      let yOffset = 130;

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const bookingUrl = getFullUrl(cat.slug);
        const displayUrl = getBookingUrl(cat.slug);
        const ctaText = getCtaText(cat.name);

        // Check page overflow (A4 height is 842 pt)
        if (yOffset > 720) {
          doc.addPage();
          yOffset = 50;
        }

        // Draw Category Section Box Border
        doc.setLineWidth(0.5);
        doc.setDrawColor(241, 245, 249);
        doc.setFillColor(248, 250, 252);
        doc.rect(40, yOffset - 15, 515, 100, "FD");

        // Generate QR Code base64 Data URL
        const qrCodeDataUrl = await QRCode.toDataURL(bookingUrl, {
          margin: 1,
          width: 150,
          color: {
            dark: "#0f172a", // Navy
            light: "#ffffff",
          },
        });

        // Draw QR Code Image
        doc.addImage(qrCodeDataUrl, "PNG", 450, yOffset - 10, 90, 90);

        // Text labels inside box
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(cat.name, 55, yOffset + 5);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Services count: ${cat.servicesCount} Active Services`, 55, yOffset + 20);

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(16, 185, 129); // Brand Teal
        doc.text("Booking Link:", 55, yOffset + 38);

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.text(displayUrl, 120, yOffset + 38);

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Suggested CTA:", 55, yOffset + 55);

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`"${ctaText}"`, 135, yOffset + 55);

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Status: ${cat.status}`, 55, yOffset + 70);

        yOffset += 115;
      }

      doc.save(`${pharmacySlug}-website-integration.pdf`);
    } catch (err) {
      console.error("❌ PDF Generation Error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Exporter header toolbar */}
      <div className="dark:border-zinc-850 flex flex-col gap-4 rounded border border-slate-200/80 bg-slate-50/50 p-4 dark:bg-zinc-900/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Website Integration Export Panel
          </h3>
          <p className="mt-0.5 text-slate-400">
            Export specific category booking landing page links for WordPress embedding.
          </p>
        </div>

        <div className="flex shrink-0 select-none items-center space-x-2">
          {/* CSV Download */}
          <button
            onClick={handleExportCSV}
            className="dark:border-zinc-850 inline-flex h-9 cursor-pointer items-center space-x-1 rounded border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 transition-all hover:bg-slate-50 dark:bg-zinc-950 dark:text-slate-200 dark:hover:bg-zinc-900"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Excel Download */}
          <button
            onClick={handleExportExcel}
            className="dark:border-zinc-850 inline-flex h-9 cursor-pointer items-center space-x-1 rounded border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 transition-all hover:bg-slate-50 dark:bg-zinc-950 dark:text-slate-200 dark:hover:bg-zinc-900"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* PDF Download with QR Code */}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="inline-flex h-9 cursor-pointer items-center space-x-1 rounded bg-slate-900 px-3 py-2 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{exporting ? "Generating PDF..." : "Export PDF (with QRs)"}</span>
          </button>
        </div>
      </div>

      {/* Categories Links directory */}
      <div className="dark:border-zinc-850 overflow-hidden rounded border border-slate-200/80">
        <table className="w-full border-collapse bg-white text-left dark:bg-zinc-950">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:border-zinc-900 dark:bg-zinc-900/60">
              <th className="p-3">Category</th>
              <th className="p-3">Services Count</th>
              <th className="p-3">Booking Landing URL</th>
              <th className="p-3">Suggested CTA</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Link Utilities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center italic text-slate-400">
                  No categories available to link.
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                const bookingUrl = getBookingUrl(cat.slug);
                const fullUrl = getFullUrl(cat.slug);
                const ctaText = getCtaText(cat.name);
                const isCopied = copiedId === cat.id;

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-900/10">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{cat.name}</td>
                    <td className="text-slate-550 p-3 pl-6 font-semibold dark:text-zinc-400">
                      {cat.servicesCount} Services
                    </td>
                    <td className="max-w-[200px] truncate p-3 font-mono text-[10px] text-slate-500">
                      {bookingUrl}
                    </td>
                    <td className="p-3 font-medium italic text-slate-600 dark:text-zinc-300">
                      &quot;{ctaText}&quot;
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                          cat.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                            : "text-slate-450 bg-slate-100 dark:bg-zinc-800"
                        }`}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Copy URL */}
                        <button
                          onClick={() => handleCopy(cat.id, fullUrl)}
                          className="dark:border-zinc-850 inline-flex cursor-pointer items-center space-x-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:bg-zinc-950 dark:text-slate-300"
                        >
                          {isCopied ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>

                        {/* Open URL */}
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-750 dark:border-zinc-850 dark:text-slate-350 inline-flex cursor-pointer items-center space-x-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold transition-colors hover:bg-slate-50 dark:bg-zinc-950"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open URL</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
