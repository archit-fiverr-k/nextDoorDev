"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Bell,
  Check,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  getPatientNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/patient-notifications";

type PatientNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: Date;
};

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [isPending, startTransition] = useTransition();

  const loadNotifications = () => {
    getPatientNotificationsAction().then((res) => {
      if (res.success && res.data) {
        setNotifications(res.data as PatientNotification[]);
        setUnreadCount(res.unreadCount);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      const res = await markNotificationReadAction(id);
      if (res.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const res = await markAllNotificationsReadAction();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    });
  };

  const getRelativeTime = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "BOOKING_CONFIRMED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "BOOKING_PENDING":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "BOOKING_CANCELLED":
      case "BOOKING_REJECTED":
        return <XCircle className="h-4 w-4 text-rose-600" />;
      case "RESCHEDULE":
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-800">
            Notifications
            {unreadCount > 0 && (
              <span className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Stay up to date with confirmations, reminders and updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-slate-100 pb-1">
        {[
          { label: "All Alert Activity", value: "ALL" as const },
          { label: "Unread Messages", value: "UNREAD" as const },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`border-b-2 pb-2 text-xs font-bold transition-all ${
              filter === t.value
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${
                n.isRead
                  ? "border-slate-100 bg-white"
                  : "border-emerald-100/50 bg-emerald-50/20 shadow-sm"
              }`}
            >
              {/* Notification icon wrapper */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  n.isRead ? "bg-slate-100" : "bg-emerald-100/40"
                }`}
              >
                {getIcon(n.type)}
              </div>

              {/* Text content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-xs leading-tight ${n.isRead ? "font-bold text-slate-700" : "font-black text-slate-800"}`}
                  >
                    {n.title}
                  </h3>
                  <span className="shrink-0 text-[9px] font-bold text-slate-400">
                    {getRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
                  {n.message}
                </p>
              </div>

              {/* Action */}
              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  disabled={isPending}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-200/50 bg-slate-50 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                  title="Mark as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <Bell className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="mb-1 text-sm font-black text-slate-600">No notifications found</h3>
          <p className="text-xs font-medium text-slate-400">
            You&apos;re all caught up! Booking updates will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
