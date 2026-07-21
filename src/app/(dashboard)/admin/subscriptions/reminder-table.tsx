"use client";

import React, { useState, useTransition } from "react";
import { Mail, MessageSquare, AlertTriangle, Loader2, CheckCircle2, Send } from "lucide-react";
import {
  sendSubscriptionEmailReminderAction,
  sendSubscriptionWhatsappReminderAction,
  sendBulkSubscriptionRemindersAction,
} from "@/actions/super-admin";

export interface PharmacyWithoutSub {
  id: string;
  name: string;
  email: string;
  phone: string;
  subStatus: string;
}

interface SubscriptionReminderTableProps {
  pharmacies: PharmacyWithoutSub[];
}

export function SubscriptionReminderTable({ pharmacies }: SubscriptionReminderTableProps) {
  const [isPending, startTransition] = useTransition();
  const [loadingMap, setLoadingMap] = useState<{ [key: string]: "email" | "whatsapp" | null }>({});
  const [statusMap, setStatusMap] = useState<{
    [key: string]: { type: "success" | "error"; msg: string };
  }>({});

  // Bulk states
  const [isBulking, setIsBulking] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );

  const handleSendEmail = (id: string) => {
    setLoadingMap((prev) => ({ ...prev, [id]: "email" }));
    setStatusMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    startTransition(async () => {
      const res = await sendSubscriptionEmailReminderAction(id);
      setLoadingMap((prev) => ({ ...prev, [id]: null }));
      if (res.success) {
        setStatusMap((prev) => ({
          ...prev,
          [id]: { type: "success", msg: "Email reminder dispatched!" },
        }));
      } else {
        setStatusMap((prev) => ({
          ...prev,
          [id]: { type: "error", msg: res.error || "Failed to send email" },
        }));
      }
    });
  };

  const handleSendWhatsapp = (id: string) => {
    setLoadingMap((prev) => ({ ...prev, [id]: "whatsapp" }));
    setStatusMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    startTransition(async () => {
      const res = await sendSubscriptionWhatsappReminderAction(id);
      setLoadingMap((prev) => ({ ...prev, [id]: null }));
      if (res.success) {
        setStatusMap((prev) => ({
          ...prev,
          [id]: { type: "success", msg: "WhatsApp reminder dispatched!" },
        }));
      } else {
        setStatusMap((prev) => ({
          ...prev,
          [id]: { type: "error", msg: res.error || "Failed to send message" },
        }));
      }
    });
  };

  const handleSendBulk = () => {
    if (
      !confirm(
        `Are you sure you want to send Email & WhatsApp subscription reminders to all ${pharmacies.length} unsubscribed pharmacies?`
      )
    ) {
      return;
    }

    setIsBulking(true);
    setBulkStatus(null);

    startTransition(async () => {
      const res = await sendBulkSubscriptionRemindersAction();
      setIsBulking(false);
      if (res.success) {
        setBulkStatus({
          type: "success",
          msg: `Successfully dispatched reminders to all ${res.count || pharmacies.length} pharmacies in one click!`,
        });
        setStatusMap({});
      } else {
        setBulkStatus({
          type: "error",
          msg: res.error || "Failed to dispatch bulk reminders.",
        });
      }
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NONE":
        return {
          label: "No Sub plan",
          color:
            "bg-slate-50 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-800",
        };
      case "EXPIRED":
        return {
          label: "Expired",
          color:
            "bg-slate-50 text-amber-600 dark:bg-zinc-900 dark:text-amber-400 border border-slate-200/80 dark:border-zinc-800",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          color:
            "bg-slate-50 text-slate-500 dark:bg-zinc-900 dark:text-zinc-550 border border-slate-200/80 dark:border-zinc-800",
        };
      case "FAILED_PAYMENT":
      default:
        return {
          label: "Billing Failed",
          color:
            "bg-slate-50 text-rose-500 dark:bg-zinc-900 dark:text-rose-450 border border-slate-200/80 dark:border-zinc-800",
        };
    }
  };

  if (pharmacies.length === 0) {
    return (
      <div className="rounded border border-slate-200/80 p-8 text-center dark:border-zinc-900 dark:bg-zinc-950">
        <p className="text-slate-450 text-xs font-bold">
          All registered platform pharmacies have active SaaS subscription plans.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
      {/* Table Header Row with Bulk Dispatch Action */}
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-900/60 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Targeted Reminders
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
            {pharmacies.length} pharmacies without active subscription plans.
          </span>
        </div>

        <button
          onClick={handleSendBulk}
          disabled={isPending || isBulking}
          className="inline-flex h-8 cursor-pointer select-none items-center justify-center rounded bg-slate-900 px-4 text-xs font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isBulking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-3.5 w-3.5" />
          )}
          <span>Send Reminders to All</span>
        </button>
      </div>

      {/* Bulk Status Feedback Panel */}
      {bulkStatus && (
        <div
          className={`flex items-center gap-2 border-b p-4 text-xs ${
            bulkStatus.type === "success"
              ? "border-emerald-100 bg-slate-50 text-emerald-600 dark:border-zinc-900/30 dark:bg-zinc-900/20 dark:text-emerald-400"
              : "dark:text-rose-450 border-rose-100 bg-slate-50 text-rose-600 dark:border-zinc-900/30 dark:bg-zinc-900/20"
          }`}
        >
          {bulkStatus.type === "success" ? (
            <CheckCircle2 className="dark:text-emerald-450 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="dark:text-rose-450 h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span className="font-semibold">{bulkStatus.msg}</span>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-slate-450 border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider dark:border-zinc-900/60 dark:bg-zinc-900">
              <th className="p-4">Clinic Details</th>
              <th className="p-4">Subscription Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs dark:divide-zinc-900/60">
            {pharmacies.map((p) => {
              const badge = getStatusLabel(p.subStatus);
              const isLoadingEmail = loadingMap[p.id] === "email";
              const isLoadingWhatsapp = loadingMap[p.id] === "whatsapp";
              const statusFeedback = statusMap[p.id];

              return (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                >
                  <td className="p-4">
                    <div>
                      <strong className="block font-bold text-slate-800 dark:text-slate-200">
                        {p.name}
                      </strong>
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        {p.email} | {p.phone}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`select-none rounded px-2.5 py-0.5 text-[10px] font-black ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center space-x-2">
                        {/* Email reminder button */}
                        <button
                          onClick={() => handleSendEmail(p.id)}
                          disabled={isPending || isLoadingEmail || isLoadingWhatsapp || isBulking}
                          className="inline-flex h-7 cursor-pointer select-none items-center justify-center rounded border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold text-slate-700 transition-all hover:bg-slate-100 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                          title="Send subscription activation email reminder"
                        >
                          {isLoadingEmail ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Mail className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          <span>Email</span>
                        </button>

                        {/* WhatsApp reminder button */}
                        <button
                          onClick={() => handleSendWhatsapp(p.id)}
                          disabled={isPending || isLoadingEmail || isLoadingWhatsapp || isBulking}
                          className="inline-flex h-7 cursor-pointer select-none items-center justify-center rounded border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold text-slate-700 transition-all hover:bg-slate-100 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                          title="Send subscription activation WhatsApp reminder"
                        >
                          {isLoadingWhatsapp ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          <span>WhatsApp</span>
                        </button>
                      </div>

                      {/* Status feedbacks */}
                      {statusFeedback && (
                        <span
                          className={`flex items-center text-[10px] font-semibold ${
                            statusFeedback.type === "success" ? "text-brand-teal" : "text-rose-500"
                          }`}
                        >
                          {statusFeedback.type === "success" && (
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5 shrink-0" />
                          )}
                          {statusFeedback.type === "error" && (
                            <AlertTriangle className="mr-1 h-3.5 w-3.5 shrink-0" />
                          )}
                          {statusFeedback.msg}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
