"use client";

import React, { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  Building2,
  Clock,
  Upload,
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ImageIcon,
  Check,
} from "lucide-react";
import { saveFirstTimeOnboardingAction, DayScheduleInput } from "@/actions/onboarding";

interface FirstTimeOnboardingModalProps {
  pharmacy: {
    id: string;
    name: string;
    email: string;
    phone: string;
    logoUrl?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 0, label: "Sunday" },
];

export function FirstTimeOnboardingModal({
  pharmacy,
  isOpen,
  onClose,
}: FirstTimeOnboardingModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Step state: 1 = Basic Info & Logo, 2 = Opening Hours Schedule
  const [step, setStep] = useState<1 | 2>(1);

  // Form state pre-filled with admin registration email & phone
  const [publicEmail, setPublicEmail] = useState(pharmacy.email || "");
  const [publicPhone, setPublicPhone] = useState(pharmacy.phone || "");

  // Logo file state
  const [logoPreview, setLogoPreview] = useState<string | null>(pharmacy.logoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Opening Hours Schedule state (Default: Mon-Fri 09:00-18:00, Sat 09:00-17:00, Sun Closed)
  const [openingHours, setOpeningHours] = useState<DayScheduleInput[]>([
    { dayOfWeek: 1, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 2, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 3, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 6, isOpen: true, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 0, isOpen: false, openTime: "09:00", closeTime: "17:00" },
  ]);

  if (!isOpen) return null;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg("Logo image file size must be less than 3MB.");
        return;
      }
      setErrorMsg("");
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setOpeningHours((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isOpen: !d.isOpen } : d))
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: "openTime" | "closeTime", value: string) => {
    setOpeningHours((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  const handleSubmitOnboarding = () => {
    setErrorMsg("");
    startTransition(async () => {
      const data = new FormData();
      data.append("pharmacyId", pharmacy.id);
      data.append("email", publicEmail);
      data.append("phone", publicPhone);
      data.append("openingHours", JSON.stringify(openingHours));
      if (logoFile) {
        data.append("logoFile", logoFile);
      }

      const res = await saveFirstTimeOnboardingAction(data);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to complete initial pharmacy setup.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex select-text items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in-50">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        {/* Top Header Badge */}
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#10B981]">
          <Sparkles className="h-4 w-4" />
          <span>First-Time Pharmacy Onboarding Setup</span>
        </div>

        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Welcome to NextDoorClinic! 🏥
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Configure your public pharmacy details, brand logo, and opening hours for patient
          bookings.
        </p>

        {/* Step indicator */}
        <div className="mt-5 flex items-center space-x-3 border-b border-slate-100 pb-4 dark:border-zinc-800">
          <div
            className={cn(
              "flex items-center space-x-2 text-xs font-bold",
              step === 1 ? "text-slate-900 dark:text-white" : "text-slate-400"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black",
                step === 1
                  ? "bg-[#10B981] text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-zinc-800"
              )}
            >
              1
            </span>
            <span>Pharmacy Contact & Logo</span>
          </div>

          <span className="text-slate-300 dark:text-zinc-700">•</span>

          <div
            className={cn(
              "flex items-center space-x-2 text-xs font-bold",
              step === 2 ? "text-slate-900 dark:text-white" : "text-slate-400"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black",
                step === 2
                  ? "bg-[#10B981] text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-zinc-800"
              )}
            >
              2
            </span>
            <span>Opening Hours Schedule</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: PUBLIC EMAIL, PHONE & LOGO */}
        {step === 1 && (
          <div className="mt-5 space-y-4 animate-in fade-in-50">
            {/* Pharmacy Logo Upload */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Pharmacy Brand Logo
              </label>
              <div className="flex items-center space-x-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="shadow-2xs h-14 w-14 rounded-2xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400 dark:border-zinc-700 dark:bg-zinc-900">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="shadow-2xs inline-flex cursor-pointer items-center space-x-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">
                    <Upload className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>{logoPreview ? "Change Logo" : "Upload Logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400">Recommended 512x512px (PNG or JPG)</p>
                </div>
              </div>
            </div>

            {/* Public Inquiry Email */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Public Patient Inquiry Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="clinic@pharmacy.com"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Pre-filled with admin registration email. Change if your branch has a dedicated
                patient email.
              </p>
            </div>

            {/* Public Contact Phone */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Public Pharmacy Contact Telephone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={publicPhone}
                  onChange={(e) => setPublicPhone(e.target.value)}
                  className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="020 7946 0912"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Pre-filled with admin registration mobile. Update with your pharmacy branch landline
                if needed.
              </p>
            </div>

            {/* Step 1 Actions */}
            <div className="mt-6 flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center space-x-2 rounded-xl bg-[#10B981] px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-600 active:scale-95"
              >
                <span>Continue to Opening Hours</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OPENING HOURS SCHEDULE */}
        {step === 2 && (
          <div className="mt-5 space-y-4 animate-in fade-in-50">
            <div className="max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
              {DAYS_OF_WEEK.map((item) => {
                const dayConfig = openingHours.find((d) => d.dayOfWeek === item.dayOfWeek) || {
                  dayOfWeek: item.dayOfWeek,
                  isOpen: true,
                  openTime: "09:00",
                  closeTime: "18:00",
                };

                return (
                  <div
                    key={item.dayOfWeek}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleToggleDay(item.dayOfWeek)}
                        className={cn(
                          "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                          dayConfig.isOpen ? "bg-[#10B981]" : "bg-slate-300 dark:bg-zinc-700"
                        )}
                      >
                        <span
                          className={cn(
                            "shadow-2xs h-4 w-4 rounded-full bg-white transition-transform",
                            dayConfig.isOpen ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span className="w-24 font-bold text-slate-900 dark:text-white">
                        {item.label}
                      </span>
                    </div>

                    {dayConfig.isOpen ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={dayConfig.openTime}
                          onChange={(e) =>
                            handleTimeChange(item.dayOfWeek, "openTime", e.target.value)
                          }
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                        <span className="text-[11px] text-slate-400">to</span>
                        <input
                          type="time"
                          value={dayConfig.closeTime}
                          onChange={(e) =>
                            handleTimeChange(item.dayOfWeek, "closeTime", e.target.value)
                          }
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-black uppercase tracking-wider text-rose-500">
                        Closed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 2 Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleSubmitOnboarding}
                disabled={isPending}
                className="inline-flex items-center space-x-2 rounded-xl bg-[#10B981] px-6 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>Complete Setup & Enter Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
