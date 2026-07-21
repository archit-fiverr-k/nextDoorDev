"use client";

import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Key,
  Calendar,
  CreditCard,
  Mail,
  Smartphone,
  Globe,
  Lock,
  Save,
  CheckCircle2,
  ScrollText,
} from "lucide-react";

interface SettingsPageProps {
  params: {
    tenantId: string;
  };
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<"general" | "security" | "integrations" | "audit">(
    "general"
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="select-text space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Pharmacy Workspace & System Settings
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Manage business configurations, 2FA security policies, API integrations, and audit logs.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
        >
          <Save className="h-4 w-4" />
          <span>{savedSuccess ? "Saved Successfully!" : "Save Settings"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-semibold dark:border-zinc-800">
        {(["general", "security", "integrations", "audit"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 capitalize transition-all ${
              activeTab === tab
                ? "bg-slate-900 font-bold text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: General Business Settings */}
      {activeTab === "general" && (
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
            General Clinic Details
          </h3>

          <div className="grid grid-cols-1 gap-4 text-xs font-medium text-slate-700 dark:text-zinc-300 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Pharmacy / Clinic Name
              </label>
              <input
                type="text"
                defaultValue="NextDoor Pharmacy & Travel Clinic"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                CQC / GPhC Registration Number
              </label>
              <input
                type="text"
                defaultValue="GPHC-901428"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Public Email
              </label>
              <input
                type="email"
                defaultValue="clinic@nextdoorclinic.co.uk"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Contact Telephone
              </label>
              <input
                type="text"
                defaultValue="+44 20 7946 0912"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & API Keys */}
      {activeTab === "security" && (
        <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="space-y-4">
            <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Two-Factor Authentication (2FA) & Security Policy</span>
            </h3>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 p-4 text-xs dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <div>
                <span className="block font-bold text-slate-900 dark:text-slate-100">
                  Enforce 2FA for All Staff Members
                </span>
                <span className="text-[10px] text-slate-400">
                  Require TOTP authenticator app code on login
                </span>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 cursor-pointer rounded text-teal-600"
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-zinc-900">
            <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
              <Key className="h-4 w-4 text-teal-600" />
              <span>API Keys & Webhooks</span>
            </h3>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3 text-slate-100 dark:bg-zinc-900">
                <span>ndc_live_pk_8f94a2b109c...</span>
                <button
                  onClick={() => alert("API key copied to clipboard.")}
                  className="font-sans text-xs font-bold text-teal-400 hover:underline"
                >
                  Copy Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Integrations */}
      {activeTab === "integrations" && (
        <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
          {[
            {
              name: "Google Calendar Sync",
              desc: "Bi-directional calendar sync for staff slots",
              icon: Calendar,
              connected: true,
            },
            {
              name: "Outlook / Office 365",
              desc: "Sync practitioner appointments to Microsoft Outlook",
              icon: Calendar,
              connected: true,
            },
            {
              name: "Stripe Billing Gateway",
              desc: "Process credit card prepayments & deposits",
              icon: CreditCard,
              connected: true,
            },
            {
              name: "Twilio SMS & WhatsApp",
              desc: "Deliver automated SMS lead notices & reminders",
              icon: Smartphone,
              connected: true,
            },
            {
              name: "SMTP Custom Mail Server",
              desc: "Send emails using your pharmacy custom domain",
              icon: Mail,
              connected: false,
            },
            {
              name: "Google Maps Platform",
              desc: "Live location lookup and geolocation pin",
              icon: Globe,
              connected: true,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h4>
                    <p className="mt-0.5 text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                    item.connected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  {item.connected ? "Connected" : "Configure"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === "audit" && (
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <h3 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <ScrollText className="h-4 w-4 text-slate-500" />
            <span>Compliance & Information Governance Audit Log</span>
          </h3>

          <div className="space-y-2 text-xs">
            {[
              {
                action: "UPDATE",
                entity: "Pharmacy Profile",
                user: "admin@nextdoorclinic.co.uk",
                time: "10 mins ago",
              },
              {
                action: "CREATE",
                entity: "Appointment Slot #849",
                user: "staff@nextdoorclinic.co.uk",
                time: "42 mins ago",
              },
              {
                action: "LOGIN",
                entity: "Provider Console",
                user: "doctor@nextdoorclinic.co.uk",
                time: "2 hours ago",
              },
            ].map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-zinc-800/40 dark:bg-zinc-900/40"
              >
                <div>
                  <span className="mr-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                    [{log.action}]
                  </span>
                  <span className="text-slate-700 dark:text-zinc-300">{log.entity}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">By {log.user}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
