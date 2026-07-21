"use client";

import React, { useState } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  ShieldCheck,
  Trash2,
  LogOut,
  MapPin,
  Clock,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

export interface DeviceSession {
  id: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  loginTime: string;
  lastActive: string;
  isCurrent: boolean;
}

interface ActiveSessionsViewProps {
  initialSessions?: DeviceSession[];
}

export function ActiveSessionsView({ initialSessions }: ActiveSessionsViewProps) {
  const [sessions, setSessions] = useState<DeviceSession[]>(
    initialSessions || [
      {
        id: "sess-1",
        deviceName: "MacBook Pro 16-inch",
        deviceType: "desktop",
        browser: "Chrome 126.0",
        os: "macOS Sonoma",
        ipAddress: "86.142.109.14",
        location: "London, United Kingdom",
        loginTime: new Date().toISOString(),
        lastActive: "Active Now",
        isCurrent: true,
      },
      {
        id: "sess-2",
        deviceName: "iPhone 15 Pro",
        deviceType: "mobile",
        browser: "Safari 17.4",
        os: "iOS 17.5",
        ipAddress: "86.142.109.88",
        location: "London, United Kingdom",
        loginTime: new Date(Date.now() - 3600000 * 5).toISOString(),
        lastActive: "2 hours ago",
        isCurrent: false,
      },
      {
        id: "sess-3",
        deviceName: "Windows 11 Workstation",
        deviceType: "desktop",
        browser: "Edge 125.0",
        os: "Windows 11 Pro",
        ipAddress: "192.168.1.45",
        location: "Manchester, United Kingdom",
        loginTime: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        lastActive: "1 day ago",
        isCurrent: false,
      },
    ]
  );

  const handleRevokeSingle = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRevokeAllOthers = () => {
    if (
      confirm(
        "Are you sure you want to revoke all other device sessions? You will need to log back in on those devices."
      )
    ) {
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    }
  };

  return (
    <div className="max-w-5xl select-text space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 md:flex-row md:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Active Login Sessions & Recognized Devices
            </h1>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/30 dark:text-teal-300">
              {sessions.length} Connected
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Review devices currently authenticated to your account. If you spot an unrecognized
            session, revoke it immediately.
          </p>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={handleRevokeAllOthers}
            className="flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout All Other Devices</span>
          </button>
        )}
      </div>

      {/* Active Sessions List */}
      <div className="space-y-3">
        {sessions.map((sess) => (
          <div
            key={sess.id}
            className={`flex flex-col items-start justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all dark:bg-zinc-950 sm:flex-row sm:items-center ${
              sess.isCurrent
                ? "border-teal-300 ring-2 ring-teal-500/10 dark:border-teal-800/60"
                : "border-slate-200/80 dark:border-zinc-800/80"
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-100 text-slate-700 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-300">
                {sess.deviceType === "mobile" ? (
                  <Smartphone className="h-5 w-5 text-teal-600" />
                ) : sess.deviceType === "tablet" ? (
                  <Tablet className="h-5 w-5 text-teal-600" />
                ) : (
                  <Laptop className="h-5 w-5 text-teal-600" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
                    {sess.deviceName}
                  </h3>
                  {sess.isCurrent && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                      This Device (Current)
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  {sess.browser} • {sess.os}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 font-mono text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>{sess.ipAddress}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{sess.location}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Last active: {sess.lastActive}</span>
                  </span>
                </div>
              </div>
            </div>

            {!sess.isCurrent && (
              <button
                onClick={() => handleRevokeSingle(sess.id)}
                className="flex items-center space-x-1.5 rounded-xl border border-rose-200/60 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Revoke Session</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
