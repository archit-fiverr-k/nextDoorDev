"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Clock,
  CalendarDays,
  CreditCard,
  Hash,
  ExternalLink,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { AppointmentStatusBadge } from "@/components/patient/appointment-status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
    notes?: string | null;
    pharmacy: {
      name: string;
      address: string;
      logoUrl?: string | null;
      slug: string;
    };
    service: {
      name: string;
      duration: number;
      price: number | string | null;
      color?: string | null;
    };
  };
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function formatPrice(price: number | string | null): string {
  if (price === null || price === undefined) return "Free";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function ProviderInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-teal text-sm font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

const ACTIONABLE_STATUSES = ["PENDING", "CONFIRMED"];

export function AppointmentCard({ appointment, onCancel, onReschedule }: AppointmentCardProps) {
  const { id, startTime, endTime, status, pharmacy, service } = appointment;
  const isActionable = ACTIONABLE_STATUSES.includes(status);
  const bookingRef = id.replace(/-/g, "").slice(0, 8).toUpperCase();

  const serviceDotColor = service.color ?? "#1D9E75";

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Top accent strip based on status */}
      <div
        className={cn(
          "h-1 w-full",
          status === "CONFIRMED" && "bg-emerald-400",
          status === "PENDING" && "bg-amber-400",
          status === "COMPLETED" && "bg-slate-300",
          status === "CANCELLED" && "bg-rose-400",
          status === "REJECTED" && "bg-rose-500",
          status === "RESCHEDULE_REQUESTED" && "bg-purple-400"
        )}
      />

      <div className="flex flex-col gap-4 p-5">
        {/* Provider row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {pharmacy.logoUrl ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-100 shadow-sm">
                <Image
                  src={pharmacy.logoUrl}
                  alt={pharmacy.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <ProviderInitials name={pharmacy.name} />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{pharmacy.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{pharmacy.address}</span>
              </p>
            </div>
          </div>
          <AppointmentStatusBadge status={status} />
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Service + details grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {/* Service */}
          <div className="col-span-2 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: serviceDotColor }}
            />
            <span className="text-sm font-semibold text-slate-800">{service.name}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{formatDate(startTime)}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              {formatTime(startTime)} – {formatTime(endTime)}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <CreditCard className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{formatPrice(service.price)}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{service.duration} min</span>
          </div>
        </div>

        {/* Booking reference */}
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
          <Hash className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Booking ref:</span>
          <span className="font-mono text-xs font-semibold tracking-wider text-slate-700">
            {bookingRef}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link href={`/patient/appointments/${id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              View Details
            </Button>
          </Link>

          {isActionable && onReschedule && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => onReschedule(id)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reschedule
            </Button>
          )}

          {isActionable && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onCancel(id)}
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
