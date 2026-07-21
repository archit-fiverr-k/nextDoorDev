"use client";

import React, { useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Save,
} from "lucide-react";

interface NotificationsPageProps {
  params: {
    tenantId: string;
  };
}

export default function NotificationsPage({ params }: NotificationsPageProps) {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
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
            Automated Patient Notifications & Alerts
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Configure automated appointment confirmation emails, SMS reminders, WhatsApp
            notifications & templates.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
        >
          <Save className="h-4 w-4" />
          <span>{savedSuccess ? "Saved Settings!" : "Save Configuration"}</span>
        </button>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Notification Channels */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
            <Bell className="h-4 w-4 text-teal-600" />
            <span>Active Communication Channels</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-teal-600" />
                <div>
                  <span className="block font-bold text-slate-900 dark:text-slate-100">
                    Automated Email Gateway
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Resend & AWS SES Infrastructure
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded text-teal-600"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="block font-bold text-slate-900 dark:text-slate-100">
                    SMS Text Messages (Twilio)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    24h & 2h appointment lead reminders
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded text-teal-600"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                <div>
                  <span className="block font-bold text-slate-900 dark:text-slate-100">
                    WhatsApp Business API
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Instant interactive appointment confirmations
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded text-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
            <FileText className="h-4 w-4 text-teal-600" />
            <span>Notification Template Snippets</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Booking Confirmation SMS Template
              </label>
              <textarea
                rows={3}
                defaultValue="Hi {{patient_name}}, your booking for {{service_name}} at NextDoorClinic is confirmed for {{time}} on {{date}}. Reply CANCEL to modify."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
