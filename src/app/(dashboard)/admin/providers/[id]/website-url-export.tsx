"use client";

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Code,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  Check,
  FolderArchive,
  Building,
} from "lucide-react";
import JSZip from "jszip";
import { PharmacyExportData, getBulkPharmacyUrlExportData } from "@/actions/url-export";

export interface WebsiteUrlExportProps {
  initialData: PharmacyExportData;
}

export function WebsiteUrlExport({ initialData }: WebsiteUrlExportProps) {
  const [includeMainPages, setIncludeMainPages] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeServices, setIncludeServices] = useState(true);
  const [includeReviewsUrl, setIncludeReviewsUrl] = useState(true);
  const [includeContactUrl, setIncludeContactUrl] = useState(true);
  const [includeBookingUrl, setIncludeBookingUrl] = useState(true);
  const [includeSeoData, setIncludeSeoData] = useState(false);
  const [wordpressMode, setWordpressMode] = useState(false);
  const [format, setFormat] = useState<"TXT" | "CSV" | "JSON">("TXT");

  const [copied, setCopied] = useState(false);
  const [bulkExporting, setBulkExporting] = useState(false);

  const { pharmacy, totals, validationWarnings } = initialData;

  // Dynamically filter pages based on checkboxes
  const filteredMainPages = initialData.mainPages.filter((p) => {
    if (!includeMainPages) return p.path === "/";
    if (!includeReviewsUrl && p.path === "/reviews") return false;
    if (!includeContactUrl && p.path === "/contact") return false;
    if (!includeBookingUrl && p.path === "/book") return false;
    return true;
  });

  const filteredCategories = includeCategories ? initialData.categories : [];
  const filteredServices = includeServices ? initialData.services : [];

  // Compute live output string based on user settings
  const generateLiveOutput = (): string => {
    if (wordpressMode) {
      return initialData.wordpressTree;
    }

    if (format === "JSON") {
      const jsonPayload = {
        pharmacy,
        totals: {
          categoriesCount: filteredCategories.length,
          servicesCount: filteredServices.length,
          publicPagesCount: filteredMainPages.length,
          totalUrlsCount:
            filteredMainPages.length + filteredCategories.length + filteredServices.length,
        },
        mainPages: filteredMainPages.map((p) =>
          includeSeoData ? p : { title: p.title, path: p.path, url: p.url }
        ),
        categories: filteredCategories.map((c) =>
          includeSeoData
            ? c
            : { name: c.name, slug: c.slug, url: c.url, servicesCount: c.servicesCount }
        ),
        services: filteredServices.map((s) =>
          includeSeoData
            ? s
            : {
                name: s.name,
                slug: s.slug,
                categoryName: s.categoryName,
                url: s.url,
                price: s.price,
              }
        ),
        generatedAt: new Date().toISOString().split("T")[0],
      };
      return JSON.stringify(jsonPayload, null, 2);
    }

    if (format === "CSV") {
      const headers = includeSeoData
        ? ["Page Type", "Title", "URL", "Category", "Price", "Meta Title", "Meta Description"]
        : ["Page Type", "Title", "URL", "Category", "Price"];

      const rows: string[][] = [
        headers,
        ...filteredMainPages.map((p) =>
          includeSeoData
            ? ["Main Page", p.title, p.url, "-", "-", p.seoTitle, p.seoDesc]
            : ["Main Page", p.title, p.url, "-", "-"]
        ),
        ...filteredCategories.map((c) =>
          includeSeoData
            ? ["Category", c.name, c.url, c.name, "-", c.seoTitle, c.seoDesc]
            : ["Category", c.name, c.url, c.name, "-"]
        ),
        ...filteredServices.map((s) =>
          includeSeoData
            ? [
                "Service",
                s.name,
                s.url,
                s.categoryName,
                `£${s.price.toFixed(2)}`,
                s.seoTitle,
                s.seoDesc,
              ]
            : ["Service", s.name, s.url, s.categoryName, `£${s.price.toFixed(2)}`]
        ),
      ];

      return rows
        .map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    }

    // Default TXT Format
    const dateStr = new Date().toISOString().split("T")[0];
    let txt = `--------------------------------------------------\n`;
    txt += `${pharmacy.name}\n`;
    txt += `Slug\n${pharmacy.slug}\n`;
    txt += `Booking Base URL\n${pharmacy.baseUrl}\n`;
    txt += `==================================================\n`;

    if (includeMainPages) {
      txt += `MAIN PAGES\n`;
      filteredMainPages.forEach((p) => {
        txt += `${p.title}\n${p.path}\n`;
        if (includeSeoData) {
          txt += `  [SEO Title]: ${p.seoTitle}\n  [Meta Desc]: ${p.seoDesc}\n`;
        }
      });
      txt += `==================================================\n`;
    }

    if (includeCategories) {
      txt += `CATEGORIES\n`;
      filteredCategories.forEach((c) => {
        txt += `${c.name}\n${c.url}\n`;
        if (includeSeoData) {
          txt += `  [SEO Title]: ${c.seoTitle}\n  [Meta Desc]: ${c.seoDesc}\n`;
        }
      });
      txt += `==================================================\n`;
    }

    if (includeServices) {
      txt += `SERVICES\n`;
      filteredServices.forEach((s) => {
        txt += `${s.name}\n${s.url}\n`;
        if (includeSeoData) {
          txt += `  [SEO Title]: ${s.seoTitle}\n  [Meta Desc]: ${s.seoDesc}\n`;
        }
      });
      txt += `==================================================\n`;
    }

    txt += `TOTALS\n`;
    txt += `Categories\n${filteredCategories.length}\n`;
    txt += `Services\n${filteredServices.length}\n`;
    txt += `Public Pages\n${filteredMainPages.length}\n`;
    txt += `Total URLs\n${filteredMainPages.length + filteredCategories.length + filteredServices.length}\n`;
    txt += `==================================================\n`;
    txt += `Generated\n${dateStr}\n`;
    txt += `--------------------------------------------------\n`;

    return txt;
  };

  const liveOutput = generateLiveOutput();

  const handleCopy = () => {
    navigator.clipboard.writeText(liveOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSingle = () => {
    const ext = wordpressMode ? "txt" : format.toLowerCase();
    const filename = wordpressMode
      ? `${pharmacy.slug}-wordpress-structure.txt`
      : `${pharmacy.slug}-website-urls.${ext}`;

    const blob = new Blob([liveOutput], {
      type: format === "JSON" ? "application/json" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkExportZip = async () => {
    setBulkExporting(true);
    try {
      const allExportData = await getBulkPharmacyUrlExportData();
      const zip = new JSZip();
      const rootFolder = zip.folder("Website Exports");

      allExportData.forEach((pData) => {
        const pFolder = rootFolder?.folder(pData.pharmacy.name);
        pFolder?.file("website-structure.txt", pData.wordpressTree);
        pFolder?.file("website-urls.txt", pData.txtOutput);
        pFolder?.file("services.csv", pData.csvOutput);
        pFolder?.file("seo.json", JSON.stringify(pData.jsonOutput, null, 2));
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `NextDoorClinic-Website-Exports-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Bulk export error:", err);
      alert("Failed to generate bulk ZIP export.");
    } finally {
      setBulkExporting(false);
    }
  };

  return (
    <div className="select-text space-y-8">
      {/* 1. Header Summary Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              WordPress Website Blueprint & Link Exporter
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
              Website URL Export
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Generated for{" "}
              <strong className="text-slate-900 dark:text-white">{pharmacy.name}</strong> • Slug:{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
                {pharmacy.slug}
              </code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleBulkExportZip}
              disabled={bulkExporting}
              className="shadow-xs flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <FolderArchive className="h-4 w-4 text-emerald-600" />
              <span>{bulkExporting ? "Packaging ZIP..." : "Export All Pharmacies (ZIP)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Pre-Export URL Validation Panel */}
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            {validationWarnings.length === 0 ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Pre-Export URL Validation Check
            </h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
              validationWarnings.length === 0
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {validationWarnings.length === 0
              ? "0 Warnings - All Links Valid"
              : `${validationWarnings.length} Warnings Detected`}
          </span>
        </div>

        {validationWarnings.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs font-semibold text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
            ✓ Perfect URL Structure! No duplicate slugs, uncategorized services, or broken links
            detected.
          </div>
        ) : (
          <div className="space-y-2">
            {validationWarnings.map((w, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="space-y-0.5">
                  <strong className="block font-bold">
                    {w.type}: {w.message}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Export Controls & Live Preview (2 Columns) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Export Options Checkboxes (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Export Configurations
            </h3>

            {/* Checkbox Options */}
            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeMainPages}
                  onChange={(e) => setIncludeMainPages(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>✓ Main Pages ({totals.publicPagesCount})</span>
              </label>

              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeCategories}
                  onChange={(e) => setIncludeCategories(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>✓ Categories ({totals.categoriesCount})</span>
              </label>

              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeServices}
                  onChange={(e) => setIncludeServices(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>✓ Services ({totals.servicesCount})</span>
              </label>

              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeReviewsUrl}
                  onChange={(e) => setIncludeReviewsUrl(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>✓ Reviews URL</span>
              </label>

              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeContactUrl}
                  onChange={(e) => setIncludeContactUrl(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>✓ Contact URL</span>
              </label>

              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeBookingUrl}
                  onChange={(e) => setIncludeBookingUrl(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>✓ Booking URL</span>
              </label>

              <div className="border-t border-slate-100 pt-2 dark:border-zinc-800">
                <label className="flex cursor-pointer items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeSeoData}
                    onChange={(e) => setIncludeSeoData(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-900 dark:text-white">
                    ✓ Include SEO Metadata (Title, Meta Desc, Canonical)
                  </span>
                </label>
              </div>
            </div>

            {/* WordPress Mode Switch */}
            <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-zinc-800">
              <label className="flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  checked={wordpressMode}
                  onChange={(e) => setWordpressMode(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-extrabold text-indigo-700 dark:text-indigo-400">
                  Generate WordPress Website Structure (Tree Hierarchy)
                </span>
              </label>
            </div>

            {/* Format Selection */}
            {!wordpressMode && (
              <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-zinc-800">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Export Format:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {(["TXT", "CSV", "JSON"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`rounded-xl border py-2 transition-all ${
                        format === fmt
                          ? "shadow-xs border-emerald-500 bg-emerald-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Output Code Window & Action Bar (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="font-mono text-xs font-bold text-emerald-400">
                {wordpressMode
                  ? "wordpress-structure.txt"
                  : `export-output.${format.toLowerCase()}`}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  onClick={handleDownloadSingle}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <pre className="mt-4 max-h-[500px] select-text overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">
              {liveOutput}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
