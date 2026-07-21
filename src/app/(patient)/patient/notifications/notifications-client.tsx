"use client";

import { useState, useTransition, useOptimistic } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  CheckCheck,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/patient-notifications";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: Date;
}

type FilterTab = "ALL" | "UNREAD" | "BOOKING" | "REMINDERS";

// ─── Icon config ─────────────────────────────────────────────────────────────

interface IconConfig {
  Icon: React.ElementType;
  bgClassName: string;
  iconClassName: string;
}

const TYPE_ICON_MAP: Record<string, IconConfig> = {
  BOOKING_CONFIRMED: {
    Icon: CheckCircle2,
    bgClassName: "bg-emerald-100",
    iconClassName: "text-emerald-600",
  },
  BOOKING_PENDING: {
    Icon: Clock,
    bgClassName: "bg-amber-100",
    iconClassName: "text-amber-600",
  },
  BOOKING_CANCELLED: {
    Icon: XCircle,
    bgClassName: "bg-rose-100",
    iconClassName: "text-rose-600",
  },
  BOOKING_REJECTED: {
    Icon: AlertCircle,
    bgClassName: "bg-rose-100",
    iconClassName: "text-rose-600",
  },
  RESCHEDULE: {
    Icon: Calendar,
    bgClassName: "bg-purple-100",
    iconClassName: "text-purple-600",
  },
  REMINDER: {
    Icon: Bell,
    bgClassName: "bg-blue-100",
    iconClassName: "text-blue-600",
  },
};

const DEFAULT_ICON_CONFIG: IconConfig = {
  Icon: Bell,
  bgClassName: "bg-slate-100",
  iconClassName: "text-slate-500",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRelativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  if (diffWeeks < 5) return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
}

function matchesFilter(n: Notification, tab: FilterTab): boolean {
  switch (tab) {
    case "UNREAD":
      return !n.isRead;
    case "BOOKING":
      return n.type.startsWith("BOOKING") || n.type === "RESCHEDULE";
    case "REMINDERS":
      return n.type === "REMINDER";
    default:
      return true;
  }
}

// ─── Single notification row ─────────────────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
  isPending,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isPending: boolean;
}) {
  const { id, type, title, message, isRead, link, createdAt } = notification;
  const config = TYPE_ICON_MAP[type] ?? DEFAULT_ICON_CONFIG;
  const { Icon, bgClassName, iconClassName } = config;

  const inner = (
    <div
      className={cn(
        "group flex items-start gap-3.5 rounded-xl border px-4 py-4 transition-all duration-150",
        isRead
          ? "border-slate-100 bg-white hover:bg-slate-50/60"
          : "border-blue-100 bg-blue-50/40 hover:bg-blue-50/70"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          bgClassName
        )}
      >
        <Icon className={cn("h-4.5 w-4.5", iconClassName)} />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm leading-snug",
                isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"
              )}
            >
              {title}
            </p>
            {!isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
          </div>

          {!isRead && (
            <button
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkRead(id);
              }}
              className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-400 transition-all hover:bg-slate-100 hover:text-emerald-600 disabled:opacity-40"
              title="Mark as read"
            >
              Mark read
            </button>
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{message}</p>

        <p className="mt-2 text-[10px] font-medium text-slate-400">{getRelativeTime(createdAt)}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} className="block no-underline">
        {inner}
      </a>
    );
  }

  return inner;
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "UNREAD", label: "Unread" },
  { id: "BOOKING", label: "Booking" },
  { id: "REMINDERS", label: "Reminders" },
];

// ─── Notifications client ─────────────────────────────────────────────────────

interface NotificationsClientProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

export function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
}: NotificationsClientProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [isPending, startTransition] = useTransition();

  const [notifications, setOptimistic] = useOptimistic(
    initialNotifications,
    (state: Notification[], action: { type: "markRead"; id: string } | { type: "markAll" }) => {
      if (action.type === "markRead") {
        return state.map((n) => (n.id === action.id ? { ...n, isRead: true } : n));
      }
      return state.map((n) => ({ ...n, isRead: true }));
    }
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered = notifications.filter((n) => matchesFilter(n, activeTab));

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      setOptimistic({ type: "markRead", id });
      await markNotificationReadAction(id);
    });
  };

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    startTransition(async () => {
      setOptimistic({ type: "markAll" });
      await markAllNotificationsReadAction();
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <Bell className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {notifications.length} total notification
              {notifications.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            isLoading={isPending}
            className="gap-2 self-start sm:self-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
        <Filter className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
        {FILTER_TABS.map((tab) => {
          const count =
            tab.id === "UNREAD"
              ? unreadCount
              : tab.id === "ALL"
                ? notifications.length
                : notifications.filter((n) => matchesFilter(n, tab.id)).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Notification list ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-14 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
            <Bell className="h-7 w-7 text-slate-300" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-700">
            {activeTab === "UNREAD" ? "All caught up!" : "No notifications here"}
          </p>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-400">
            {activeTab === "UNREAD"
              ? "You have no unread notifications."
              : "Nothing to show for this filter yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Pending overlay hint */}
      {isPending && (
        <p className="animate-pulse text-center text-xs text-slate-400">Updating notifications…</p>
      )}
    </div>
  );
}
