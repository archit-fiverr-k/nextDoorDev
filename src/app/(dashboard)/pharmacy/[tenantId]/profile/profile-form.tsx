"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Building,
  Upload,
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
  Save,
  CheckCircle,
  FileCheck2,
  Calendar,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { updateClinicProfileAction } from "@/actions/profile";

interface PharmacyProfileFormProps {
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

export function ProfileForm({ pharmacy }: PharmacyProfileFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "brand" | "seo" | "preview">("info");
  const [isPending, startTransition] = useTransition();

  // Success / Error status messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form Fields State
  const [formData, setFormData] = useState({
    displayName: pharmacy.displayName || "",
    brandColor: pharmacy.brandColor || "#10b981",
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
    seoTitle: pharmacy.seoTitle || "",
    seoDescription: pharmacy.seoDescription || "",
  });

  // Local state for Logo file & gallery
  const [logoPreview, setLogoPreview] = useState<string | null>(pharmacy.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Gallery lists
  const [galleryUrls, setGalleryUrls] = useState<string[]>(pharmacy.gallery || []);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [deletedGalleryUrls, setDeletedGalleryUrls] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Draft restored label indicator
  const [draftRestored, setDraftRestored] = useState(false);

  // 1. AutoSave: Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ndc_profile_draft_${pharmacy.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
        }));
        setDraftRestored(true);
        setTimeout(() => setDraftRestored(false), 3000);
      }
    } catch (e) {
      console.error("Failed to restore profile settings draft:", e);
    }
  }, [pharmacy.id]);

  // 2. AutoSave: Save draft on value change
  const saveDraft = (updated: typeof formData) => {
    try {
      localStorage.setItem(`ndc_profile_draft_${pharmacy.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    saveDraft(updated);
  };

  // Logo upload preview
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Gallery multi-upload simulation
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadingGallery(true);
      const newFilesArray: File[] = [];
      const newPreviews: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newFilesArray.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }

      setGalleryFiles((prev) => [...prev, ...newFilesArray]);
      setGalleryUrls((prev) => [...prev, ...newPreviews]);
      setUploadingGallery(false);
    }
  };

  // Delete gallery item
  const handleDeleteGalleryItem = (url: string, index: number) => {
    // If it's a previously uploaded database URL, mark it for server deletion
    if (pharmacy.gallery.includes(url)) {
      setDeletedGalleryUrls((prev) => [...prev, url]);
    }
    // Remove from local arrays
    const updatedUrls = [...galleryUrls];
    updatedUrls.splice(index, 1);
    setGalleryUrls(updatedUrls);

    // Also remove from local Files array if applicable
    // (A simple index offset check works, but simple slicing is clean for preview)
  };

  // Profile Form Submissions
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const envelope = new FormData();
    envelope.append("pharmacyId", pharmacy.id);
    envelope.append("displayName", formData.displayName);
    envelope.append("brandColor", formData.brandColor);
    envelope.append("phone", formData.phone);
    envelope.append("address", formData.address);
    envelope.append("email", formData.email);
    envelope.append("website", formData.website);
    envelope.append("facebookUrl", formData.facebookUrl);
    envelope.append("twitterUrl", formData.twitterUrl);
    envelope.append("instagramUrl", formData.instagramUrl);
    envelope.append("linkedinUrl", formData.linkedinUrl);
    envelope.append("googleMapsUrl", formData.googleMapsUrl);
    envelope.append("description", formData.description);
    envelope.append("welcomeMessage", formData.welcomeMessage);
    envelope.append("seoTitle", formData.seoTitle);
    envelope.append("seoDescription", formData.seoDescription);

    if (logoFile) {
      envelope.append("logoFile", logoFile);
    }

    galleryFiles.forEach((file) => {
      envelope.append("galleryFiles", file);
    });

    deletedGalleryUrls.forEach((url) => {
      envelope.append("deleteGalleryUrls", url);
    });

    startTransition(async () => {
      const res = await updateClinicProfileAction(envelope);
      if (res.success) {
        setSuccessMsg("Clinic profile settings saved successfully.");
        // Clear draft
        localStorage.removeItem(`ndc_profile_draft_${pharmacy.id}`);
        // Reset file buffers
        setLogoFile(null);
        setGalleryFiles([]);
        setDeletedGalleryUrls([]);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to save settings.");
      }
    });
  };

  const daysLabelMap = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="grid gap-8 text-slate-800 lg:grid-cols-5">
      {/* Form editing block (3 cols) */}
      <div className="space-y-6 lg:col-span-3">
        {/* Navigation tabs */}
        <div className="text-slate-550 flex select-none rounded-2xl border border-slate-200/80 bg-white p-1 text-xs font-bold shadow-sm">
          <button
            onClick={() => setActiveTab("info")}
            className={cn(
              "flex-1 rounded-xl py-2 transition-all",
              activeTab === "info"
                ? "bg-slate-900 text-white shadow-sm"
                : "hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            Business Info
          </button>
          <button
            onClick={() => setActiveTab("brand")}
            className={cn(
              "flex-1 rounded-xl py-2 transition-all",
              activeTab === "brand"
                ? "bg-slate-900 text-white shadow-sm"
                : "hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            Branding & Gallery
          </button>
          <button
            onClick={() => setActiveTab("seo")}
            className={cn(
              "flex-1 rounded-xl py-2 transition-all",
              activeTab === "seo"
                ? "bg-slate-900 text-white shadow-sm"
                : "hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            SEO Settings
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "flex-1 rounded-xl py-2 transition-all lg:hidden",
              activeTab === "preview"
                ? "bg-slate-900 text-white shadow-sm"
                : "hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            Live Preview
          </button>
        </div>

        {/* Message banners */}
        {successMsg && (
          <div className="border-emerald-250 flex items-center space-x-2 rounded-xl border bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 duration-150 animate-in fade-in">
            <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="border-rose-250 flex items-center space-x-2 rounded-xl border bg-rose-50 p-3 text-xs font-semibold text-rose-800 duration-150 animate-in fade-in">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {draftRestored && (
          <div className="flex select-none items-center space-x-2 rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-[10px] font-bold text-blue-800 duration-150 animate-in fade-in">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue-600" />
            <span>Autosave draft restored successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TAB 1: Business Information */}
          {activeTab === "info" && (
            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Clinic Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Display / Public Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleFieldChange("displayName", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      placeholder="e.g. Northside Wellness"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Website URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleFieldChange("website", e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                        placeholder="https://northsidehealth.co.uk"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Clinic Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Telephone Line
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Physical Street Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => handleFieldChange("address", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Google Maps Share Link
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.googleMapsUrl}
                        onChange={(e) => handleFieldChange("googleMapsUrl", e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                        placeholder="Paste maps location URL"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Welcome Booking Guidelines
                    </label>
                    <input
                      type="text"
                      value={formData.welcomeMessage}
                      onChange={(e) => handleFieldChange("welcomeMessage", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      placeholder="e.g. Please bring a photo ID for your slot"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Clinic Description / About Us
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    className="h-24 w-full resize-none rounded-xl border border-slate-200 p-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    placeholder="Briefly describe your clinical specialisms..."
                  />
                </div>

                {/* Social media inputs */}
                <div className="space-y-3.5 border-t border-slate-100 pt-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Social Media Profiles
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Facebook className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        value={formData.facebookUrl}
                        onChange={(e) => handleFieldChange("facebookUrl", e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[11px] font-semibold focus:outline-none"
                        placeholder="Facebook URL"
                      />
                    </div>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        value={formData.twitterUrl}
                        onChange={(e) => handleFieldChange("twitterUrl", e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[11px] font-semibold focus:outline-none"
                        placeholder="Twitter/X URL"
                      />
                    </div>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        value={formData.instagramUrl}
                        onChange={(e) => handleFieldChange("instagramUrl", e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[11px] font-semibold focus:outline-none"
                        placeholder="Instagram URL"
                      />
                    </div>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={(e) => handleFieldChange("linkedinUrl", e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[11px] font-semibold focus:outline-none"
                        placeholder="LinkedIn URL"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Branding & Gallery */}
          {activeTab === "brand" && (
            <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              {/* Brand settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Brand Aesthetics
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  {/* Color picker */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Brand Accent Color
                    </label>
                    <div className="flex select-none items-center space-x-3.5">
                      <input
                        type="color"
                        value={formData.brandColor}
                        onChange={(e) => handleFieldChange("brandColor", e.target.value)}
                        className="h-11 w-11 cursor-pointer rounded-xl border border-slate-200"
                      />
                      <input
                        type="text"
                        value={formData.brandColor}
                        onChange={(e) => handleFieldChange("brandColor", e.target.value)}
                        className="h-11 w-24 rounded-xl border border-slate-200 px-3 text-center font-mono text-xs font-bold uppercase focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Logo upload */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Logo Attachment
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative flex h-12 w-12 shrink-0 select-none items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Building className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <label className="text-slate-655 flex h-9 cursor-pointer select-none items-center justify-center space-x-1.5 rounded-xl border border-slate-200 px-3.5 text-[10px] font-bold transition-colors hover:bg-slate-50">
                        <Upload className="h-3.5 w-3.5 text-slate-400" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery upload (R2) */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                    Clinic Gallery Showroom
                  </h3>
                  <p className="text-slate-455 mt-0.5 text-[10px] font-normal">
                    Upload clinic photos to display on your public marketplace details page.
                  </p>
                </div>

                {/* Upload Button */}
                <div className="select-none">
                  <label className="hover:border-slate-350 inline-flex h-10 cursor-pointer items-center justify-center space-x-2 rounded-xl border-2 border-dashed border-slate-200 px-4 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50/50">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span>{uploadingGallery ? "Processing files..." : "Add Clinic Images"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleGalleryChange}
                      className="hidden"
                      disabled={uploadingGallery}
                    />
                  </label>
                </div>

                {/* Gallery Previews Grid */}
                {galleryUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {galleryUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative h-20 select-none overflow-hidden rounded-2xl border bg-slate-50 shadow-sm"
                      >
                        <img src={url} alt="Gallery" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeleteGalleryItem(url, idx)}
                          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-rose-600/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          title="Delete photo"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SEO Configuration */}
          {activeTab === "seo" && (
            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                SEO Custom Metadata
              </h3>

              <div className="space-y-4 pt-1">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Custom SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => handleFieldChange("seoTitle", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    placeholder="e.g. Best Community Pharmacy in Manchester | Northside"
                  />
                  <span className="block text-[9px] font-medium text-slate-400">
                    Recommended length: 50-60 characters. Shows up in browser tabs and search
                    engines.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Custom SEO Meta Description
                  </label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => handleFieldChange("seoDescription", e.target.value)}
                    className="h-24 w-full resize-none rounded-xl border border-slate-200 p-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    placeholder="Provide a compelling snippet description..."
                  />
                  <span className="block text-[9px] font-medium text-slate-400">
                    Recommended length: 150-160 characters. Summarizes the clinic for search results
                    pages.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Mobile hours/preview sub-toggle (only visible on mobile layout) */}
          {activeTab === "preview" && (
            <div className="block space-y-6 lg:hidden">
              <BookingWizardPreview
                formData={formData}
                pharmacy={pharmacy}
                logoPreview={logoPreview}
                galleryUrls={galleryUrls}
                daysLabelMap={daysLabelMap}
              />
            </div>
          )}

          {/* Actions Footer */}
          {activeTab !== "preview" && (
            <div className="flex select-none justify-end">
              <Button
                type="submit"
                disabled={isPending}
                className="hover:bg-slate-850 active:scale-98 flex h-10 items-center justify-center space-x-1.5 rounded-xl bg-slate-900 px-6 font-extrabold text-white transition-all"
              >
                <Save className="h-4 w-4" />
                <span>{isPending ? "Saving changes..." : "Save Settings"}</span>
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Desktop Preview Column (2 cols) */}
      <div className="sticky top-6 hidden space-y-4 self-start lg:col-span-2 lg:block">
        <h4 className="select-none text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Live Booking Page Preview
        </h4>
        <BookingWizardPreview
          formData={formData}
          pharmacy={pharmacy}
          logoPreview={logoPreview}
          galleryUrls={galleryUrls}
          daysLabelMap={daysLabelMap}
        />
      </div>
    </div>
  );
}

// Sub-component: Booking Wizard Preview
function BookingWizardPreview({
  formData,
  pharmacy,
  logoPreview,
  galleryUrls,
  daysLabelMap,
}: {
  formData: any;
  pharmacy: any;
  logoPreview: string | null;
  galleryUrls: string[];
  daysLabelMap: string[];
}) {
  return (
    <div className="flex select-none flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white font-sans shadow-md duration-200 animate-in fade-in">
      {/* Whitelabel wizard header */}
      <div
        style={{ borderColor: formData.brandColor + "20" }}
        className="flex items-center justify-between border-b px-5 py-4"
      >
        <div className="flex items-center space-x-2.5">
          <div
            style={{ backgroundColor: formData.brandColor + "15", color: formData.brandColor }}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-slate-100/60 text-sm font-extrabold"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              (formData.displayName || pharmacy.name)
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>
          <div>
            <h5 className="text-xs font-extrabold leading-none text-slate-900">
              {formData.displayName || pharmacy.name}
            </h5>
            <p className="text-slate-455 mt-1 text-[9px] font-medium">
              Subdomain slug: {pharmacy.slug}
            </p>
          </div>
        </div>

        <span
          style={{ backgroundColor: formData.brandColor, color: "#fff" }}
          className="select-none rounded-full px-2 py-0.5 text-[9px] font-bold"
        >
          Book Now
        </span>
      </div>

      {/* Preview Content Body */}
      <div className="max-h-[360px] space-y-4 overflow-y-auto p-5">
        {/* Description welcome message */}
        <div className="space-y-1">
          <h6 className="text-[11px] font-extrabold text-slate-900">About Our Clinic</h6>
          <p className="text-[10px] font-normal leading-relaxed text-slate-500">
            {formData.description || "Describe your clinical services to guide patient bookings..."}
          </p>
        </div>

        {/* Welcome Guideline message box */}
        {formData.welcomeMessage && (
          <div className="flex items-start space-x-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div className="leading-normal">
              <span className="block text-[9px] font-extrabold uppercase text-slate-800">
                Booking Instructions
              </span>
              <p className="mt-0.5 text-[9px] font-normal text-slate-500">
                {formData.welcomeMessage}
              </p>
            </div>
          </div>
        )}

        {/* Gallery Showroom Carousel Mock */}
        {galleryUrls.length > 0 && (
          <div className="space-y-1.5">
            <span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
              Clinic Photo Gallery
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border bg-slate-50"
                >
                  <img src={url} alt="Gallery item" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configured Hours Schedule Preview */}
        <div className="space-y-2 border-t border-slate-100 pt-3.5">
          <span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
            Clinic Opening Hours
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-semibold leading-normal text-slate-500">
            {pharmacy.availability && pharmacy.availability.length > 0 ? (
              pharmacy.availability.map((day: any, idx: number) => (
                <div key={idx} className="flex justify-between border-b border-slate-50 py-0.5">
                  <span className="font-bold text-slate-800">{daysLabelMap[day.dayOfWeek]}</span>
                  <span>
                    {day.openTime} - {day.closeTime}
                  </span>
                </div>
              ))
            ) : (
              <span className="col-span-2 italic text-slate-400">
                No schedule roster configured.
              </span>
            )}
          </div>
        </div>

        {/* Services Showcase Preview list */}
        <div className="space-y-2 border-t border-slate-100 pt-3.5">
          <span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
            Active Clinical Services ({pharmacy.services?.length || 0})
          </span>
          <div className="grid gap-2">
            {pharmacy.services && pharmacy.services.length > 0 ? (
              pharmacy.services.map((srv: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border bg-slate-50/50 p-2 text-[10px] font-semibold text-slate-700"
                >
                  <span className="max-w-[130px] truncate font-bold">{srv.name}</span>
                  <span className="font-bold text-slate-900">£{Number(srv.price).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <span className="text-[9px] italic text-slate-400">No services registered.</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer clinical verified badge */}
      <div className="flex items-center justify-between border-t bg-slate-50 px-5 py-3.5 text-[9px] font-bold uppercase text-slate-400">
        <div className="flex items-center space-x-1.5">
          <FileCheck2 className="h-3.5 w-3.5 text-slate-400" />
          <span>Clinical CQC Registered</span>
        </div>
        <span className="font-mono text-slate-500">{pharmacy.phone}</span>
      </div>
    </div>
  );
}
