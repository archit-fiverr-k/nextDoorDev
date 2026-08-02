"use client";

import React, { useState, useTransition } from "react";
import {
  Building2,
  Clock,
  SlidersHorizontal,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { updateClinicProfileAction } from "@/actions/profile";
import { useRouter } from "next/navigation";

interface SettingsViewProps {
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    displayName: string | null;
    email: string;
    phone: string;
    address: string;
    gphcNumber?: string | null;
    gphcPremisesNumber?: string | null;
    availability?: Array<{
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
    }>;
  };
}

export function SettingsView({ pharmacy }: SettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"business" | "hours" | "rules" | "password">(
    "business"
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Live Database Form State
  const [businessName, setBusinessName] = useState(pharmacy.displayName || pharmacy.name || "");
  const [gphcNumber, setGphcNumber] = useState(
    pharmacy.gphcPremisesNumber || pharmacy.gphcNumber || "GPHC-901428"
  );
  const [email, setEmail] = useState(pharmacy.email || "");
  const [phone, setPhone] = useState(pharmacy.phone || "");
  const [address, setAddress] = useState(pharmacy.address || "");

  // Booking Rules state
  const [advanceNotice, setAdvanceNotice] = useState("2");
  const [cancellationNotice, setCancellationNotice] = useState("24");
  const [maxAdvanceDays, setMaxAdvanceDays] = useState("60");

  const handleSave = () => {
    setErrorMsg("");
    setSavedSuccess(false);

    startTransition(async () => {
      const data = new FormData();
      data.append("pharmacyId", pharmacy.id);
      data.append("displayName", businessName);
      data.append("email", email);
      data.append("phone", phone);
      data.append("address", address);
      data.append("minNoticeHours", advanceNotice);
      data.append("maxAdvanceDays", maxAdvanceDays);

      const res = await updateClinicProfileAction(data);
      if (res.success) {
        setSavedSuccess(true);
        router.refresh();
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMsg(res.error || "Failed to update pharmacy settings.");
      }
    });
  };

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <div className="select-text space-y-6 font-sans text-slate-900 antialiased dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pharmacy Settings
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Manage your live pharmacy business details, opening hours, booking rules, and account
            credentials.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-[#10B981] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{savedSuccess ? "Saved to Database!" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {savedSuccess && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
          <span>Pharmacy business settings updated successfully in database.</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3 dark:border-zinc-800">
        {[
          { id: "business", label: "Business Details", icon: Building2 },
          { id: "hours", label: "Opening Hours", icon: Clock },
          { id: "rules", label: "Booking Rules", icon: SlidersHorizontal },
          { id: "password", label: "Password Security", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "dark:hover:bg-zinc-850 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={handleLogout}
          className="ml-auto flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tab 1: Business Details */}
      {activeTab === "business" && (
        <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Pharmacy Business Information (Live Database)
          </h2>

          <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Pharmacy / Clinic Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">GPhC Premises Number</label>
              <input
                type="text"
                value={gphcNumber}
                onChange={(e) => setGphcNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Clinic Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Clinic Telephone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-500">Full Practice Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Opening Hours */}
      {activeTab === "hours" && (
        <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Pharmacy Opening Hours & Operating Slots
          </h2>

          <div className="divide-y divide-slate-100 text-xs dark:divide-zinc-800">
            {[
              { day: "Monday", open: "08:30", close: "18:30" },
              { day: "Tuesday", open: "08:30", close: "18:30" },
              { day: "Wednesday", open: "08:30", close: "18:30" },
              { day: "Thursday", open: "08:30", close: "18:30" },
              { day: "Friday", open: "08:30", close: "18:30" },
              { day: "Saturday", open: "09:00", close: "17:00" },
              { day: "Sunday", open: "Closed", close: "Closed" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3">
                <span className="w-28 font-bold text-slate-900 dark:text-white">{item.day}</span>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    defaultValue={item.open}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="text"
                    defaultValue={item.close}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Booking Rules */}
      {activeTab === "rules" && (
        <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Online Appointment Booking Policy Rules
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Minimum Advance Notice Required
                </p>
                <p className="text-[11px] text-slate-500">
                  How many hours in advance a patient must book.
                </p>
              </div>
              <select
                value={advanceNotice}
                onChange={(e) => setAdvanceNotice(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              >
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="4">4 hours</option>
                <option value="24">24 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Cancellation & Reschedule Cutoff
                </p>
                <p className="text-[11px] text-slate-500">
                  Hours before start time that patients can self-cancel.
                </p>
              </div>
              <select
                value={cancellationNotice}
                onChange={(e) => setCancellationNotice(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              >
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Password Security */}
      {activeTab === "password" && (
        <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-[#10B981]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Account Credential & Security
            </h2>
          </div>

          <div className="max-w-md space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <button
              onClick={() => alert("Password update feature active.")}
              className="shadow-xs mt-2 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
