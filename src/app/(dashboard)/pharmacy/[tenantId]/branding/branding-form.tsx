"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition, ChangeEvent } from "react";
import { updatePharmacyBrandingAction } from "@/actions/branding";
import { Button } from "@/components/ui/button";
import { Upload, Layout, Eye, Palette, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface BrandingFormProps {
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    displayName: string | null;
    brandColor: string | null;
    logoUrl: string | null;
  };
}

export function BrandingForm({ pharmacy }: BrandingFormProps) {
  const [displayName, setDisplayName] = useState(pharmacy.displayName || "");
  const [brandColor, setBrandColor] = useState(pharmacy.brandColor || "#2563eb");
  const [logoPreview, setLogoPreview] = useState<string | null>(pharmacy.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validations
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size cannot exceed 2MB");
      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setError("Supported formats: PNG, JPG, or SVG");
      return;
    }

    setError(null);
    setLogoFile(file);

    // Create a local object URL for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("pharmacyId", pharmacy.id);
    formData.append("displayName", displayName);
    formData.append("brandColor", brandColor);
    if (logoFile) {
      formData.append("logoFile", logoFile);
    }

    startTransition(async () => {
      const res = await updatePharmacyBrandingAction(formData);
      if (!res.success) {
        setError(res.error || "Failed to update branding settings");
      } else {
        setSuccess(true);
        if (res.logoUrl) {
          setLogoPreview(res.logoUrl);
        }
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left Column: Editor controls (7 cols) */}
      <div className="space-y-6 lg:col-span-7">
        <div className="shadow-premium overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="flex items-center space-x-2 border-b border-slate-100 p-6 dark:border-zinc-900/60">
            <Palette className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Brand Configuration
            </h3>
          </div>

          <div className="space-y-6 p-6">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Branding details updated successfully!</span>
              </div>
            )}

            {/* Display Name Input */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Display Brand Name
              </label>
              <input
                type="text"
                placeholder={pharmacy.name}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Overrides the default legal entity name on your scheduling page.
              </p>
            </div>

            {/* Brand Color Picker */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Accent / Theme Brand Color
              </label>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="dark:border-zinc-850 h-10 w-12 cursor-pointer overflow-hidden rounded border border-slate-200 bg-transparent p-0"
                  />
                </div>
                <input
                  type="text"
                  placeholder="#2563eb"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-32 rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Renders on buttons, links, and active schedule blocks.
              </p>
            </div>

            {/* Logo File Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Pharmacy Logo Image
              </label>
              <div className="flex items-center space-x-6">
                {/* Logo Frame */}
                <div className="dark:border-zinc-850 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 dark:bg-zinc-900">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Brand logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Layout className="text-slate-350 h-6 w-6" />
                  )}
                </div>
                {/* Upload Control */}
                <div className="flex-1">
                  <label className="dark:hover:bg-zinc-850 inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300">
                    <Upload className="mr-1.5 h-4 w-4" />
                    Upload Logo
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    Maximum file size: 2MB. Supported file extensions: PNG, JPG, or SVG.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-6 dark:border-zinc-900/60 dark:bg-zinc-900/10">
            <Button onClick={handleSave} isLoading={isPending}>
              Save Branding Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Live visual booking preview (5 cols) */}
      <div className="space-y-4 lg:col-span-5">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-zinc-300">
          <Eye className="h-4 w-4" />
          <h4 className="text-xs font-bold uppercase tracking-wider">Live Booking Page Preview</h4>
        </div>

        {/* Outer Frame Wrapper */}
        <div className="shadow-premium dark:border-zinc-850 overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:bg-zinc-950">
          {/* Mock Browser Header */}
          <div className="flex items-center space-x-2 border-b border-slate-200/50 bg-slate-50 px-4 py-2 dark:border-zinc-900 dark:bg-zinc-900/50">
            <div className="flex shrink-0 space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-zinc-700" />
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-zinc-700" />
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-zinc-700" />
            </div>
            <div className="dark:border-zinc-850 w-full max-w-[200px] truncate rounded border border-slate-200/50 bg-white px-2 py-0.5 font-mono text-[9px] text-slate-400 dark:bg-zinc-950">
              {pharmacy.slug}.nextdoorclinic.com
            </div>
          </div>

          {/* Page Contents */}
          <div className="space-y-6 p-6">
            {/* Header info */}
            <div className="flex flex-col items-center space-y-3 text-center">
              {/* Logo */}
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Layout className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-slate-50">
                  {displayName || pharmacy.name}
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Professional Pharmacy Services</p>
              </div>
            </div>

            {/* Mock Schedule Container */}
            <div className="border-slate-150 dark:border-zinc-850 space-y-3 rounded-xl border bg-slate-50/50 p-4 dark:bg-zinc-900/20">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Service
              </span>
              <div
                className="flex items-center justify-between rounded-xl border-2 bg-white p-3 dark:bg-zinc-950"
                style={{ borderColor: brandColor }}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Flu Vaccination
                  </h4>
                  <p className="text-slate-450 mt-0.5 text-[9px]">15 mins • $25.00</p>
                </div>
                <div
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-4"
                  style={{ borderColor: brandColor }}
                />
              </div>

              <div className="dark:border-zinc-850 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 opacity-60 dark:bg-zinc-950">
                <div>
                  <h4 className="dark:text-slate-250 text-xs font-bold text-slate-800">
                    Blood Pressure Check
                  </h4>
                  <p className="text-slate-450 mt-0.5 text-[9px]">10 mins • Free</p>
                </div>
                <div className="h-4 w-4 shrink-0 rounded-full border border-slate-300" />
              </div>
            </div>

            {/* Booking action button */}
            <button
              className="w-full cursor-not-allowed rounded-lg px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
              style={{ backgroundColor: brandColor }}
              disabled
            >
              Continue to Date Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
