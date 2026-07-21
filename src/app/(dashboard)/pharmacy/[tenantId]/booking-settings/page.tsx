"use client";

import React, { useState } from "react";
import {
  Sliders,
  Clock,
  ShieldCheck,
  QrCode,
  Code,
  Copy,
  CheckCircle2,
  ExternalLink,
  Mail,
  MessageSquare,
  PhoneCall,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

interface BookingSettingsPageProps {
  params: {
    tenantId: string;
  };
}

export default function BookingSettingsPage({ params }: BookingSettingsPageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [approvalMode, setApprovalMode] = useState<"AUTOMATIC" | "MANUAL">("AUTOMATIC");
  const [minNotice, setMinNotice] = useState(2);
  const [maxAdvance, setMaxAdvance] = useState(60);

  const hostedUrl = `https://${params.tenantId}.nextdoorclinic.co.uk/book`;
  const iframeCode = `<iframe src="${hostedUrl}" width="100%" height="700" frameborder="0" style="border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.08);"></iframe>`;
  const buttonCode = `<a href="${hostedUrl}" target="_blank" style="background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:12px;font-weight:bold;text-decoration:none;display:inline-block;">Book Appointment at NextDoorClinic</a>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="select-text space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Booking Engine & Widget Configuration
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Configure lead times, automated approvals, cancellation policies, and generate embeddable
          widgets & QR codes.
        </p>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Column 1: Rules & Policies */}
        <div className="space-y-6">
          {/* Approval & Lead Times */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
              <Sliders className="h-4 w-4 text-teal-600" />
              <span>Approval Mode & Lead Times</span>
            </h3>

            <div className="space-y-4 text-xs font-medium text-slate-700 dark:text-zinc-300">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Approval Workflow
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setApprovalMode("AUTOMATIC")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      approvalMode === "AUTOMATIC"
                        ? "border-teal-300 bg-teal-50 font-bold dark:border-teal-800 dark:bg-teal-950/30"
                        : "border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <span className="block font-bold text-slate-900 dark:text-slate-100">
                      Automatic Approval
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Instantly confirm bookings
                    </span>
                  </button>

                  <button
                    onClick={() => setApprovalMode("MANUAL")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      approvalMode === "MANUAL"
                        ? "border-teal-300 bg-teal-50 font-bold dark:border-teal-800 dark:bg-teal-950/30"
                        : "border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <span className="block font-bold text-slate-900 dark:text-slate-100">
                      Manual Approval
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Staff review before confirming
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Minimum Notice (Hours)
                  </label>
                  <input
                    type="number"
                    value={minNotice}
                    onChange={(e) => setMinNotice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Max Advance Booking (Days)
                  </label>
                  <input
                    type="number"
                    value={maxAdvance}
                    onChange={(e) => setMaxAdvance(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation & No-Show Policies */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Cancellation & No-Show Rules</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Patient Cancellation Window
                </label>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900">
                  <option>Up to 24 hours prior to appointment (Full Refund)</option>
                  <option>Up to 48 hours prior to appointment</option>
                  <option>Non-refundable deposit</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Patient Terms & Conditions Note
                </label>
                <textarea
                  rows={3}
                  defaultValue="Patients arriving more than 10 minutes past their scheduled time slot may need to be rescheduled."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Embed Widgets & QR Code */}
        <div className="space-y-6">
          {/* Embed Generator */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
              <Code className="h-4 w-4 text-teal-600" />
              <span>Embeddable Booking Widget & Snippets</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-zinc-300">
                    Hosted Booking Link
                  </span>
                  <button
                    onClick={() => copyToClipboard(hostedUrl, "url")}
                    className="flex items-center space-x-1 font-bold text-teal-600 hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedCode === "url" ? "Copied!" : "Copy URL"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={hostedUrl}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-zinc-300">
                    Embed iFrame Widget Code
                  </span>
                  <button
                    onClick={() => copyToClipboard(iframeCode, "iframe")}
                    className="flex items-center space-x-1 font-bold text-teal-600 hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedCode === "iframe" ? "Copied!" : "Copy Snippet"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={3}
                  value={iframeCode}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-[11px] text-slate-100 dark:bg-zinc-900 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* QR Code Printable Generator */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-slate-50">
              <QrCode className="h-4 w-4 text-teal-600" />
              <span>Printable QR Code for Window & Counters</span>
            </h3>

            <div className="flex items-center space-x-4 rounded-xl border border-slate-200/60 bg-slate-50 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
                <QrCode className="h-20 w-20 text-slate-900" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-slate-50">
                  Scan & Book Standee QR
                </h4>
                <p className="text-[10px] leading-relaxed text-slate-400">
                  Print this high-resolution QR code for your pharmacy front counter or window
                  stickers so walk-in patients can book slots on their mobile phones.
                </p>
                <button
                  onClick={() => alert("Downloading High-Res Printable PDF Flyer with QR Code...")}
                  className="mt-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white dark:bg-slate-100 dark:text-slate-950"
                >
                  Download PDF Standee Flyer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
