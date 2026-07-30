"use client";

import React, { useState } from "react";
import {
  Building2,
  Clock,
  SlidersHorizontal,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

interface SettingsPageProps {
  params: {
    tenantId: string;
  };
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<"business" | "hours" | "rules" | "password">(
    "business"
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [businessName, setBusinessName] = useState("Briggate Pharmacy & Health Clinic");
  const [gphcNumber, setGphcNumber] = useState("GPHC-901428");
  const [email, setEmail] = useState("clinic@briggatepharmacy.co.uk");
  const [phone, setPhone] = useState("+44 113 245 8901");
  const [address, setAddress] = useState("85 Briggate, Leeds, West Yorkshire, LS1 6AZ");

  // Booking Rules state
  const [advanceNotice, setAdvanceNotice] = useState("2");
  const [cancellationNotice, setCancellationNotice] = useState("24");
  const [maxAdvanceDays, setMaxAdvanceDays] = useState("60");

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
            Settings
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Manage your pharmacy business details, opening hours, booking rules, and account
            password.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-[#10B981] px-4 py-2 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600 active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>{savedSuccess ? "Saved!" : "Save Changes"}</span>
          </button>
        </div>
      </div>

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
            Pharmacy Business Information
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
            Patient Booking Rules & Lead Time
          </h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-zinc-300">
                Minimum Advance Notice Required (Hours)
              </label>
              <input
                type="number"
                value={advanceNotice}
                onChange={(e) => setAdvanceNotice(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
              <p className="text-[11px] text-slate-400">
                Patients cannot book appointments starting sooner than this lead time.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-zinc-300">
                Free Cancellation Window (Hours)
              </label>
              <input
                type="number"
                value={cancellationNotice}
                onChange={(e) => setCancellationNotice(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
              <p className="text-[11px] text-slate-400">
                Allow patients to cancel or reschedule free of charge up to this many hours prior.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-zinc-300">
                Maximum Future Booking Window (Days)
              </label>
              <input
                type="number"
                value={maxAdvanceDays}
                onChange={(e) => setMaxAdvanceDays(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
              <p className="text-[11px] text-slate-400">
                How far into the future patients can book calendar slots.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Password Security */}
      {activeTab === "password" && (
        <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Change Account Password
          </h2>

          <div className="max-w-md space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-zinc-300">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-zinc-300">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#10B981] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <button
              onClick={handleSave}
              className="shadow-xs rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
