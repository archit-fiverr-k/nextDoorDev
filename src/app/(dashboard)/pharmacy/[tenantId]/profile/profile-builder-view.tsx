"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Clock,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  Check,
  ShieldCheck,
  Search,
  Upload,
  Image as ImageIcon,
  Lock,
  RefreshCw,
  Star,
  Zap,
  Info,
  Car,
  Accessibility,
  Languages,
  Loader2,
} from "lucide-react";
import { updateClinicProfileAction } from "@/actions/profile";

interface ProfileBuilderViewProps {
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    displayName: string | null;
    brandColor: string | null;
    logoUrl: string | null;
    email: string;
    phone: string;
    address: string;
    website: string | null;
    facebookUrl: string | null;
    twitterUrl: string | null;
    instagramUrl: string | null;
    linkedinUrl: string | null;
    googleMapsUrl: string | null;
    description: string | null;
    welcomeMessage: string | null;
    gallery: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    availability?: Array<{
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
    }>;
    services?: Array<{
      id: string;
      name: string;
      price: any;
    }>;
  };
}

export function ProfileBuilderView({ pharmacy }: ProfileBuilderViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Editor Section Tab
  const [activeSection, setActiveSection] = useState<
    "business" | "location" | "branding" | "patient_info" | "social" | "seo" | "domain"
  >("business");

  // Viewport mode for right preview (Desktop, Tablet, Mobile)
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );

  // Save Status ('saved' | 'saving' | 'error')
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just now");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    displayName: pharmacy.displayName || pharmacy.name || "",
    brandColor: pharmacy.brandColor || "#10B981",
    email: pharmacy.email || "",
    phone: pharmacy.phone || "",
    address: pharmacy.address || "",
    website: pharmacy.website || "",
    facebookUrl: pharmacy.facebookUrl || "",
    twitterUrl: pharmacy.twitterUrl || "",
    instagramUrl: pharmacy.instagramUrl || "",
    linkedinUrl: pharmacy.linkedinUrl || "",
    googleMapsUrl: pharmacy.googleMapsUrl || "",
    description: pharmacy.description || "",
    welcomeMessage: pharmacy.welcomeMessage || "",
    seoTitle: pharmacy.seoTitle || `${pharmacy.name} — NHS & Private Clinical Services`,
    seoDescription:
      pharmacy.seoDescription ||
      `Book private healthcare appointments, travel vaccinations and NHS clinical services at ${pharmacy.name}. ${pharmacy.address}.`,
    parkingNotes: "Free customer parking available at rear of pharmacy.",
    accessibilityNotes: "Wheelchair accessible entrance, wide doors & step-free consultation room.",
    languagesSpoken: "English, Gujarati, Hindi, Punjabi",
  });

  // Media files & URLs
  const [logoPreview, setLogoPreview] = useState<string | null>(pharmacy.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(pharmacy.gallery || []);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [deleteGalleryUrls, setDeleteGalleryUrls] = useState<string[]>([]);

  // Public Booking Website URL
  const publicBookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/book/${pharmacy.slug || pharmacy.id}`
      : `/book/${pharmacy.slug || pharmacy.id}`;

  // Calculate Profile Completion Score
  const completionItems = [
    { label: "Clinic Display Name", done: !!formData.displayName },
    { label: "Contact Phone & Email", done: !!formData.phone && !!formData.email },
    { label: "Physical Address", done: !!formData.address },
    {
      label: "Clinic Description",
      done: !!formData.description && formData.description.length > 20,
    },
    { label: "Brand Logo Uploaded", done: !!logoPreview },
    { label: "Clinic Gallery Images", done: galleryUrls.length > 0 },
    {
      label: "Social Media Links",
      done: !!formData.facebookUrl || !!formData.instagramUrl || !!formData.website,
    },
    { label: "Google Search SEO", done: !!formData.seoTitle && !!formData.seoDescription },
  ];
  const completedCount = completionItems.filter((item) => item.done).length;
  const completionScore = Math.round((completedCount / completionItems.length) * 100);

  // Perform Server Action Auto-Save
  const executeAutoSave = useCallback(
    async (currentData: typeof formData, currentLogo: File | null) => {
      setSaveStatus("saving");
      try {
        const data = new FormData();
        data.append("pharmacyId", pharmacy.id);
        data.append("displayName", currentData.displayName);
        data.append("brandColor", currentData.brandColor);
        data.append("phone", currentData.phone);
        data.append("address", currentData.address);
        data.append("email", currentData.email);
        data.append("website", currentData.website);
        data.append("facebookUrl", currentData.facebookUrl);
        data.append("twitterUrl", currentData.twitterUrl);
        data.append("instagramUrl", currentData.instagramUrl);
        data.append("linkedinUrl", currentData.linkedinUrl);
        data.append("googleMapsUrl", currentData.googleMapsUrl);
        data.append("description", currentData.description);
        data.append("welcomeMessage", currentData.welcomeMessage);
        data.append("seoTitle", currentData.seoTitle);
        data.append("seoDescription", currentData.seoDescription);

        if (currentLogo) {
          data.append("logoFile", currentLogo);
        }

        galleryFiles.forEach((file) => data.append("galleryFiles", file));
        deleteGalleryUrls.forEach((url) => data.append("deleteGalleryUrls", url));

        const res = await updateClinicProfileAction(data);
        if (res.success) {
          setSaveStatus("saved");
          setLastSavedTime(
            new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
          );
          if (res.logoUrl) setLogoPreview(res.logoUrl);
          if (res.gallery) setGalleryUrls(res.gallery);
          setGalleryFiles([]);
          setDeleteGalleryUrls([]);
          router.refresh();
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("error");
      }
    },
    [pharmacy.id, galleryFiles, deleteGalleryUrls, router]
  );

  // Handle Field Changes with Debounced Auto-Save
  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setSaveStatus("saving");

    // Debounce save by 800ms
    const timer = setTimeout(() => {
      executeAutoSave(updated, logoFile);
    }, 800);
    return () => clearTimeout(timer);
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo file must be smaller than 2MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      executeAutoSave(formData, file);
    }
  };

  // Handle Manual Publish Trigger
  const handlePublishChanges = () => {
    startTransition(async () => {
      await executeAutoSave(formData, logoFile);
      setToastMsg("Website & Brand changes published live!");
      setTimeout(() => setToastMsg(null), 3000);
    });
  };

  return (
    <div className="select-text space-y-6 font-sans text-slate-900 antialiased dark:text-zinc-50">
      {/* Toast Feedback Notification */}
      {toastMsg && (
        <div className="fixed right-5 top-5 z-50 flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-900 px-4 py-3 text-xs font-black text-white shadow-2xl animate-in slide-in-from-top-4">
          <CheckCircle className="h-4 w-4 text-[#10B981]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SHOPIFY/VERCEL-STYLE TOP HEADER BAR */}
      {/* ========================================================================= */}
      <div className="shadow-2xs flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-3.5">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Clinic Logo"
              className="shadow-2xs h-11 w-11 rounded-xl border border-slate-200 object-cover dark:border-zinc-700"
            />
          ) : (
            <div className="shadow-2xs flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-emerald-50 text-base font-black text-[#10B981] dark:border-zinc-700 dark:bg-emerald-950">
              {formData.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {formData.displayName || pharmacy.name}
              </h1>
              <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-[#10B981] dark:border-emerald-800 dark:bg-emerald-950">
                PRO WEBSITE ACTIVE
              </span>
            </div>
            <div className="mt-0.5 flex items-center space-x-3 text-xs font-medium text-slate-500 dark:text-zinc-400">
              <span className="flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
                <strong className="font-extrabold text-slate-800 dark:text-zinc-200">
                  {completionScore}%
                </strong>{" "}
                Profile Score
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                    <span className="font-bold text-amber-600">Saving changes...</span>
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>Saved {lastSavedTime}</span>
                  </>
                ) : (
                  <span className="font-bold text-rose-600">Auto-save error</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2.5">
          <a
            href={publicBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shadow-2xs dark:hover:bg-zinc-750 inline-flex min-h-[38px] items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-extrabold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            <span>Preview Website</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>

          <button
            type="button"
            onClick={handlePublishChanges}
            disabled={isPending}
            className="inline-flex min-h-[38px] items-center space-x-1.5 rounded-xl bg-slate-900 px-5 text-xs font-black text-white shadow-md hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Zap className="h-3.5 w-3.5 text-[#10B981]" />
            <span>{isPending ? "Publishing..." : "Publish Live Changes"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE: LEFT EDITOR (60%) + RIGHT LIVE PREVIEW (40%) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: EDITOR SECTIONS (7 COLS ON DESKTOP) */}
        {/* ======================================================================= */}
        <div className="space-y-6 xl:col-span-7">
          {/* Section Navigation Tabs */}
          <div className="shadow-2xs no-scrollbar flex overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
            {[
              { id: "business", label: "Business Info", icon: Building2 },
              { id: "location", label: "Location & Hours", icon: MapPin },
              { id: "branding", label: "Brand Studio", icon: ImageIcon },
              { id: "patient_info", label: "Patient Notes", icon: Info },
              { id: "social", label: "Social", icon: Globe },
              { id: "seo", label: "Google SEO", icon: Search },
              { id: "domain", label: "Custom Domain", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id as any)}
                  className={cn(
                    "flex shrink-0 items-center space-x-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all",
                    active
                      ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  <Icon
                    className={cn("h-3.5 w-3.5", active ? "text-[#10B981]" : "text-slate-400")}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 1: BUSINESS INFORMATION */}
          {/* ------------------------------------------------------------------- */}
          {activeSection === "business" && (
            <div className="shadow-2xs space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 animate-in fade-in-50 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  1. Business & Contact Information
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Manage your pharmacy&apos;s public display name, email, phone and patient intro.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Public Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleFieldChange("displayName", e.target.value)}
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="e.g. West End Pharmacy & Travel Clinic"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="020 7946 0912"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Patient Inquiry Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="info@westendpharmacy.co.uk"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleFieldChange("website", e.target.value)}
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="https://westendpharmacy.co.uk"
                  />
                </div>
              </div>

              {/* Guided Description Field */}
              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Pharmacy Description & Specialties
                  </label>
                  <span className="text-[10px] text-slate-400">Auto-saves on edit</span>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 dark:border-emerald-950 dark:bg-emerald-950/20">
                  <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                    💡 <strong>Smart Guide:</strong> Tell patients about your pharmacy, clinical
                    specialties (e.g. Travel Health, Weight Management, Ear Wax Removal), GPhC
                    accreditation, and why they should choose you.
                  </p>
                </div>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Welcome to West End Pharmacy. We provide NHS Pharmacy First consultations, private travel vaccinations, blood pressure screening, and weight loss clinic services in central London..."
                />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 2: LOCATION & OPENING HOURS */}
          {/* ------------------------------------------------------------------- */}
          {activeSection === "location" && (
            <div className="shadow-2xs space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 animate-in fade-in-50 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  2. Location, Maps & Hours
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Provide accurate address and Google Maps directions for walk-in patients.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Physical Address *
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="124 Regent Street, West End, London, W1B 5SE"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Google Maps Location Link / Embed
                </label>
                <input
                  type="text"
                  value={formData.googleMapsUrl}
                  onChange={(e) => handleFieldChange("googleMapsUrl", e.target.value)}
                  className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="https://maps.google.com/?q=West+End+Pharmacy+London"
                />
              </div>

              {/* Opening Hours Summary Card */}
              <div className="space-y-2 pt-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Opening Hours Schedule
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800/60">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400">Mon - Fri</span>
                      <strong className="text-slate-900 dark:text-white">09:00 - 18:00</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400">Saturday</span>
                      <strong className="text-slate-900 dark:text-white">09:00 - 17:00</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400">Sunday</span>
                      <strong className="text-slate-900 dark:text-white">Closed</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400">
                        Bank Holidays
                      </span>
                      <strong className="text-[#10B981]">By Appointment</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 3: BRANDING & MEDIA STUDIO */}
          {/* ------------------------------------------------------------------- */}
          {activeSection === "branding" && (
            <div className="shadow-2xs space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 animate-in fade-in-50 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  3. Brand Assets & Media Studio
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Upload high-res pharmacy logo, storefront photo, gallery images and choose your
                  brand accent color.
                </p>
              </div>

              {/* Logo Uploader */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Pharmacy Brand Logo (Recommended 512x512px)
                </label>
                <div className="flex items-center space-x-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="shadow-2xs h-16 w-16 rounded-xl border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="shadow-xs inline-flex cursor-pointer items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{logoPreview ? "Replace Logo" : "Upload Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">PNG, JPG, SVG up to 2MB</p>
                  </div>
                </div>
              </div>

              {/* Brand Accent Color Picker */}
              <div className="space-y-2 pt-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Brand Accent Theme Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => handleFieldChange("brandColor", e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-xl border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.brandColor}
                    onChange={(e) => handleFieldChange("brandColor", e.target.value)}
                    className="h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold uppercase text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />

                  {/* Preset Swatches */}
                  <div className="flex items-center space-x-1.5">
                    {["#10B981", "#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626"].map(
                      (hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => handleFieldChange("brandColor", hex)}
                          style={{ backgroundColor: hex }}
                          className={cn(
                            "h-7 w-7 rounded-lg border-2 transition-all",
                            formData.brandColor.toLowerCase() === hex.toLowerCase()
                              ? "shadow-xs scale-110 border-slate-900 dark:border-white"
                              : "border-transparent"
                          )}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 4: PATIENT INFORMATION & NOTES */}
          {/* ------------------------------------------------------------------- */}
          {activeSection === "patient_info" && (
            <div className="shadow-2xs space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 animate-in fade-in-50 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  4. Patient Booking & Arrival Information
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Help patients prepare for their clinical consultation.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Arrival Instructions & What to Bring
                </label>
                <textarea
                  rows={3}
                  value={formData.welcomeMessage}
                  onChange={(e) => handleFieldChange("welcomeMessage", e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Please arrive 5 minutes before your appointment time. Bring NHS number, photo ID and list of current medications."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Parking Facilities
                  </label>
                  <input
                    type="text"
                    value={formData.parkingNotes}
                    onChange={(e) => handleFieldChange("parkingNotes", e.target.value)}
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Languages Spoken
                  </label>
                  <input
                    type="text"
                    value={formData.languagesSpoken}
                    onChange={(e) => handleFieldChange("languagesSpoken", e.target.value)}
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 5: SOCIAL PRESENCE ICON CARDS */}
          {/* ------------------------------------------------------------------- */}
          {activeSection === "social" && (
            <div className="shadow-2xs space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 animate-in fade-in-50 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  5. Social Media & Online Profiles
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Connect your official social media pages for patient trust and verification.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Facebook */}
                <div className="flex items-center space-x-3 rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
                  <Facebook className="h-5 w-5 shrink-0 text-blue-600" />
                  <input
                    type="url"
                    value={formData.facebookUrl}
                    onChange={(e) => handleFieldChange("facebookUrl", e.target.value)}
                    className="focus:outline-hidden h-8 w-full border-0 bg-transparent text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="facebook.com/westendpharmacy"
                  />
                </div>

                {/* Instagram */}
                <div className="flex items-center space-x-3 rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
                  <Instagram className="h-5 w-5 shrink-0 text-pink-600" />
                  <input
                    type="url"
                    value={formData.instagramUrl}
                    onChange={(e) => handleFieldChange("instagramUrl", e.target.value)}
                    className="focus:outline-hidden h-8 w-full border-0 bg-transparent text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="instagram.com/westendpharmacy"
                  />
                </div>

                {/* Twitter */}
                <div className="flex items-center space-x-3 rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
                  <Twitter className="h-5 w-5 shrink-0 text-sky-500" />
                  <input
                    type="url"
                    value={formData.twitterUrl}
                    onChange={(e) => handleFieldChange("twitterUrl", e.target.value)}
                    className="focus:outline-hidden h-8 w-full border-0 bg-transparent text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="x.com/westendpharmacy"
                  />
                </div>

                {/* LinkedIn */}
                <div className="flex items-center space-x-3 rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
                  <Linkedin className="h-5 w-5 shrink-0 text-blue-700" />
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => handleFieldChange("linkedinUrl", e.target.value)}
                    className="focus:outline-hidden h-8 w-full border-0 bg-transparent text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="linkedin.com/company/westendpharmacy"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 6: GOOGLE SEARCH & SEO PREVIEW */}
          {/* ------------------------------------------------------------------- */}
          {activeSection === "seo" && (
            <div className="shadow-2xs space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 animate-in fade-in-50 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    6. Google Search & SEO Preview
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#10B981] dark:bg-emerald-950">
                    SEO HEALTH: EXCELLENT
                  </span>
                </div>
              </div>

              {/* Live Google Snippet Preview */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Google Search Snippet Card
                </label>
                <div className="shadow-2xs rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-zinc-400">
                    <span className="font-semibold text-slate-800 dark:text-zinc-300">
                      https://nextdoorclinic.co.uk
                    </span>
                    <span>› book ›</span>
                    <span className="font-mono text-[#10B981]">{pharmacy.slug}</span>
                  </div>
                  <h4 className="mt-1 cursor-pointer text-base font-bold text-blue-600 hover:underline dark:text-blue-400">
                    {formData.seoTitle}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                    {formData.seoDescription}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => handleFieldChange("seoTitle", e.target.value)}
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    SEO Meta Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.seoDescription}
                    onChange={(e) => handleFieldChange("seoDescription", e.target.value)}
                    className="focus:outline-hidden w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 7: CUSTOM DOMAIN & SSL */}
          {/* ------------------------------------------------------------------- */}
          {activeSection === "domain" && (
            <div className="shadow-2xs space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 animate-in fade-in-50 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  7. Custom Domain & SSL Certificate
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Connect your existing custom domain (e.g. www.westendpharmacy.co.uk).
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981] text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {pharmacy.slug}.nextdoorclinic.co.uk
                      </p>
                      <div className="mt-0.5 flex items-center space-x-2 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        <span>✔ Status: Connected</span>
                        <span>•</span>
                        <span>✔ SSL Certificate Active</span>
                        <span>•</span>
                        <span>✔ DNS Verified</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert("Custom domain CNAME mapping guide will open.")}
                    className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
                  >
                    Manage CNAME
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: STICKY LIVE BROWSER PREVIEW (5 COLS ON DESKTOP) */}
        {/* ======================================================================= */}
        <div className="space-y-6 xl:col-span-5">
          <div className="sticky top-6 space-y-4">
            {/* Viewport controls bar */}
            <div className="shadow-2xs flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                Live Storefront Preview
              </span>

              <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setPreviewViewport("desktop")}
                  className={cn(
                    "flex items-center space-x-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all",
                    previewViewport === "desktop"
                      ? "shadow-2xs bg-white text-slate-900 dark:bg-zinc-900 dark:text-white"
                      : "text-slate-500"
                  )}
                >
                  <Laptop className="h-3.5 w-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport("tablet")}
                  className={cn(
                    "flex items-center space-x-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all",
                    previewViewport === "tablet"
                      ? "shadow-2xs bg-white text-slate-900 dark:bg-zinc-900 dark:text-white"
                      : "text-slate-500"
                  )}
                >
                  <Tablet className="h-3.5 w-3.5" />
                  <span>Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport("mobile")}
                  className={cn(
                    "flex items-center space-x-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all",
                    previewViewport === "mobile"
                      ? "shadow-2xs bg-white text-slate-900 dark:bg-zinc-900 dark:text-white"
                      : "text-slate-500"
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Framer/Webflow Style Browser Window */}
            <div
              className={cn(
                "mx-auto overflow-hidden rounded-2xl border border-slate-300/90 bg-slate-900 shadow-xl transition-all duration-300 dark:border-zinc-700",
                previewViewport === "desktop" && "w-full",
                previewViewport === "tablet" && "w-[85%]",
                previewViewport === "mobile" && "w-[360px]"
              )}
            >
              {/* Browser chrome header bar */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 py-2">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex items-center space-x-1.5 rounded-md bg-slate-900 px-3 py-1 font-mono text-[10px] text-slate-300">
                  <Lock className="h-3 w-3 text-[#10B981]" />
                  <span className="max-w-[200px] truncate">
                    nextdoorclinic.co.uk/book/{pharmacy.slug}
                  </span>
                </div>
                <RefreshCw className="h-3.5 w-3.5 cursor-pointer text-slate-500 hover:text-white" />
              </div>

              {/* Rendered Live Website Component Preview Container */}
              <div className="h-[480px] overflow-y-auto bg-slate-50 p-4 text-slate-900 dark:bg-zinc-950 dark:text-white">
                {/* Header preview */}
                <div className="shadow-2xs space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center space-x-3">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981] font-black text-white">
                        {formData.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-black">{formData.displayName}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {formData.address}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                    {formData.description || "Welcome to our clinic. Book appointments online."}
                  </p>

                  <div
                    style={{ backgroundColor: formData.brandColor }}
                    className="shadow-xs w-full rounded-xl py-2 text-center text-xs font-black text-white"
                  >
                    Book Clinical Appointment
                  </div>
                </div>

                {/* Services preview */}
                <div className="mt-3 space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Available Services
                  </span>
                  {(pharmacy.services || []).slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div>
                        <p className="font-bold">{s.name}</p>
                        <span className="text-[10px] text-slate-400">15 mins</span>
                      </div>
                      <span className="font-black text-[#10B981]">
                        £{Number(s.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Scorecard & Checklist */}
            <div className="shadow-2xs space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-zinc-800">
                <div className="flex items-center space-x-1 text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Score: {completionScore}/100
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {completionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] font-medium"
                  >
                    <span className="text-slate-600 dark:text-zinc-400">{item.label}</span>
                    {item.done ? (
                      <span className="font-bold text-[#10B981]">✔ Added</span>
                    ) : (
                      <span className="font-bold text-amber-600">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
