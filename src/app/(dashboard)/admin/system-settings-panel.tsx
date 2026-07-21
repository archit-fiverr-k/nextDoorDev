"use client";

import React, { useState, useTransition } from "react";
import { updateSystemSettingsAction } from "@/actions/admin-settings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Shield,
  Megaphone,
  BarChart3,
  Tag,
  Plus,
  X,
  ListCollapse,
  MessageSquare,
  Text,
} from "lucide-react";

interface SettingsPanelProps {
  initialMaintenance: boolean;
  initialBanner: string | null;
  initialMetrics: any;
  initialTabs: any;
  initialTicker: any;
  initialTickerTitle: string | null;
}

export function SystemSettingsPanel({
  initialMaintenance,
  initialBanner,
  initialMetrics,
  initialTabs,
  initialTicker,
  initialTickerTitle,
}: SettingsPanelProps) {
  const [isMaintenance, setIsMaintenance] = useState(initialMaintenance);
  const [banner, setBanner] = useState(initialBanner || "");
  const [tickerTitle, setTickerTitle] = useState(initialTickerTitle || "Trust Verification:");

  // Trust Metrics State
  const defaultMetrics = [
    { value: "120+", label: "Verified Providers" },
    { value: "15,000+", label: "Appointments Completed" },
    { value: "4.9★", label: "Patient Rating" },
    { value: "99.9%", label: "Platform Uptime" },
  ];
  const [metrics, setMetrics] = useState<Array<{ value: string; label: string }>>(
    initialMetrics && Array.isArray(initialMetrics) && initialMetrics.length > 0
      ? initialMetrics
      : defaultMetrics
  );

  // Trust Tabs State
  const defaultTabs = ["Real-time Availability", "Transparent Pricing", "Instant Booking"];
  const [tabs, setTabs] = useState<string[]>(
    initialTabs && Array.isArray(initialTabs) && initialTabs.length > 0 ? initialTabs : defaultTabs
  );
  const [newTab, setNewTab] = useState("");

  // Trust Announcement Ticker lines State
  const defaultTicker = [
    "Official UK Healthcare Directory - Search Verified CQC Compliant Partners",
  ];
  const [tickerLines, setTickerLines] = useState<string[]>(
    initialTicker && Array.isArray(initialTicker) && initialTicker.length > 0
      ? initialTicker
      : defaultTicker
  );
  const [newTickerLine, setNewTickerLine] = useState("");

  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const handleUpdateMetric = (index: number, key: "value" | "label", val: string) => {
    const updated = [...metrics];
    updated[index] = { ...updated[index], [key]: val };
    setMetrics(updated);
  };

  const handleAddTab = () => {
    if (newTab.trim()) {
      setTabs([...tabs, newTab.trim()]);
      setNewTab("");
    }
  };

  const handleRemoveTab = (index: number) => {
    setTabs(tabs.filter((_, i) => i !== index));
  };

  const handleAddTickerLine = () => {
    if (newTickerLine.trim()) {
      setTickerLines([...tickerLines, newTickerLine.trim()]);
      setNewTickerLine("");
    }
  };

  const handleRemoveTickerLine = (index: number) => {
    setTickerLines(tickerLines.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setSuccess(false);
    startTransition(async () => {
      const res = await updateSystemSettingsAction(isMaintenance, null, metrics, tabs, [], null);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(res.error || "Failed to update configurations");
      }
    });
  };

  return (
    <Card className="shadow-premium border-slate-200/80 font-sans dark:border-zinc-800/80 dark:bg-zinc-950">
      <CardHeader>
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Global System Controls
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 text-xs">
        {/* Maintenance Toggle */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-900/60">
          <div className="flex items-center space-x-2.5">
            <Shield className="text-slate-455 h-4 w-4 dark:text-zinc-500" />
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">Maintenance Mode</div>
              <div className="text-[10px] text-slate-400">Blocks public portals for patients</div>
            </div>
          </div>
          <button
            onClick={() => setIsMaintenance(!isMaintenance)}
            className={`cursor-pointer rounded-md border px-3 py-1 text-[10px] font-bold transition-colors ${
              isMaintenance
                ? "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {isMaintenance ? "Active (Offline)" : "Inactive (Online)"}
          </button>
        </div>

        {/* Trust Metrics Section */}
        <div className="space-y-3 border-b border-slate-100 pb-4 dark:border-zinc-900/60">
          <div className="flex items-center space-x-2.5">
            <BarChart3 className="text-slate-455 h-4 w-4 dark:text-zinc-500" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              Marketplace Trust Metrics
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric, idx) => (
              <div
                key={idx}
                className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <span className="text-[9px] font-black uppercase text-slate-400">
                  Metric {idx + 1}
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={metric.value}
                    onChange={(e) => handleUpdateMetric(idx, "value", e.target.value)}
                    className="w-16 rounded border bg-white p-1.5 text-xs font-black outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="e.g. 120+"
                  />
                  <input
                    type="text"
                    required
                    value={metric.label}
                    onChange={(e) => handleUpdateMetric(idx, "label", e.target.value)}
                    className="flex-1 rounded border bg-white p-1.5 text-xs font-semibold outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="e.g. Verified Providers"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Tabs (Bottom Row) Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5">
            <Tag className="text-slate-455 h-4 w-4 dark:text-zinc-500" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              Trust Bar Tabs / Badges
            </span>
          </div>

          {/* Active Tabs list */}
          <div className="flex select-none flex-wrap gap-2">
            {tabs.map((tab, idx) => (
              <span
                key={idx}
                className="bg-slate-105 dark:text-zinc-350 inline-flex items-center gap-1.5 rounded-lg border border-slate-200/60 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {tab}
                <button
                  type="button"
                  onClick={() => handleRemoveTab(idx)}
                  className="cursor-pointer transition-colors hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {tabs.length === 0 && (
              <span className="text-[10px] italic text-slate-400">
                No tabs configured. Add one below.
              </span>
            )}
          </div>

          {/* Add a Tab field */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter new trust tag..."
              value={newTab}
              onChange={(e) => setNewTab(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus:bg-zinc-950"
            />
            <button
              type="button"
              onClick={handleAddTab}
              className="h-8.5 flex cursor-pointer items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <Plus className="mr-1 size-4" /> Add Tab
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-zinc-900/60">
          {success && (
            <span className="text-[10px] font-bold text-emerald-600">
              ✓ System configurations saved!
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isPending}
            className="ml-auto cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-[11px] font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
