import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ElementType;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-[#10B981]/10 text-[#059669] border-[#10B981]/30",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  RESCHEDULE_REQUESTED: {
    label: "Reschedule Requested",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    icon: RefreshCw,
  },
};

interface AppointmentStatusBadgeProps {
  status: string;
  className?: string;
}

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "shadow-2xs inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-wide",
        config.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
