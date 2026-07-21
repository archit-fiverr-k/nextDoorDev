import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    slug: string;
    address: string;
    logoUrl?: string | null;
    description?: string | null;
    services: {
      name: string;
      price: number | string | null;
      color?: string | null;
    }[];
    availability: {
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
    }[];
  };
}

function ProviderInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-teal to-emerald-600 text-base font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "…";
}

function getTodayAvailability(
  availability: ProviderCardProps["provider"]["availability"]
): { isOpen: boolean; openTime: string; closeTime: string } | null {
  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  const todayJs = new Date().getDay();
  // Normalize: assume dayOfWeek uses 0=Sun..6=Sat (same as JS) or 1=Mon..7=Sun
  // Try matching both conventions
  const slot =
    availability.find((a) => a.dayOfWeek === todayJs) ??
    availability.find((a) => a.dayOfWeek === (todayJs === 0 ? 7 : todayJs));

  if (!slot) return null;
  return { isOpen: true, openTime: slot.openTime, closeTime: slot.closeTime };
}

function formatTime12h(time: string): string {
  // time is expected as "HH:MM" or "HH:MM:SS"
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

function formatPrice(price: number | string | null): string {
  if (price === null || price === undefined) return "Free";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const { name, slug, address, logoUrl, description, services, availability } = provider;

  const todayAvailability = getTodayAvailability(availability);
  const visibleServices = services.slice(0, 3);
  const extraServicesCount = services.length - visibleServices.length;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-4 p-5">
        {/* Provider header */}
        <div className="flex items-start gap-3">
          {logoUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 shadow-sm">
              <Image src={logoUrl} alt={name} fill className="object-cover" sizes="56px" />
            </div>
          ) : (
            <ProviderInitials name={name} />
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-900">{name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">{address}</span>
            </p>

            {/* Availability pill */}
            <div className="mt-1.5">
              {todayAvailability ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Open today &nbsp;
                  <Clock className="h-3 w-3" />
                  {formatTime12h(todayAvailability.openTime)} –{" "}
                  {formatTime12h(todayAvailability.closeTime)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Closed today
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs leading-relaxed text-slate-500">{truncate(description, 80)}</p>
        )}

        {/* Divider */}
        {(services.length > 0 || description) && <div className="border-t border-slate-100" />}

        {/* Services */}
        {visibleServices.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Services
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visibleServices.map((service, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: service.color ?? "#10B981",
                    }}
                  />
                  {service.name}
                  <span className="text-slate-400">· {formatPrice(service.price)}</span>
                </span>
              ))}
              {extraServicesCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                  +{extraServicesCount} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <Link href={`/patient/provider/${slug}`} className="block w-full">
          <Button variant="primary" size="sm" className="w-full gap-1.5 text-xs">
            View &amp; Book
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
