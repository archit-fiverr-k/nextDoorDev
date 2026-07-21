"use client";

import Link from "next/link";
import { CheckCircle2, Clock, XCircle, AlertCircle, Calendar, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string | null;
    createdAt: Date;
  };
  onMarkRead?: (id: string) => void;
}

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

function getRelativeTime(date: Date): string {
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

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const { id, type, title, message, isRead, link, createdAt } = notification;
  const config = TYPE_ICON_MAP[type] ?? DEFAULT_ICON_CONFIG;
  const { Icon, bgClassName, iconClassName } = config;

  const relativeTime = getRelativeTime(createdAt);

  const handleClick = () => {
    if (!isRead && onMarkRead) {
      onMarkRead(id);
    }
  };

  const content = (
    <div
      onClick={handleClick}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-all duration-150",
        isRead
          ? "border-slate-100 bg-white hover:bg-slate-50/60"
          : "border-blue-100 bg-blue-50/40 hover:bg-blue-50/70"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          bgClassName
        )}
      >
        <Icon className={cn("h-4 w-4", iconClassName)} />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug",
              isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"
            )}
          >
            {title}
          </p>

          {/* Unread indicator dot */}
          {!isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
        </div>

        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{message}</p>

        <p className="mt-1.5 text-xs font-medium text-slate-400">{relativeTime}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
