"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, Stethoscope, Building2, Loader2, ArrowRight, Clock } from "lucide-react";
import { searchProvidersAction } from "@/actions/patient";

import { SearchBar } from "@/components/shared/search-bar";

type Provider = {
  id: string;
  name: string;
  slug: string;
  address: string;
  logoUrl?: string | null;
  description?: string | null;
  services: { name: string; price: any; color?: string | null }[];
  availability: { dayOfWeek: number; openTime: string; closeTime: string }[];
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isOpenToday(availability: Provider["availability"]): { open: boolean; hours?: string } {
  const today = new Date().getDay();
  const slot = availability.find((a) => a.dayOfWeek === today);
  if (!slot) return { open: false };
  return { open: true, hours: `${slot.openTime} – ${slot.closeTime}` };
}

function ProviderCard({ provider }: { provider: Provider }) {
  const todayStatus = isOpenToday(provider.availability);
  const initials = provider.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        {provider.logoUrl ? (
          <img
            src={provider.logoUrl}
            alt={provider.name}
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black leading-tight text-slate-800">{provider.name}</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
            <p className="truncate text-[10px] font-medium text-slate-500">{provider.address}</p>
          </div>
          {provider.description && (
            <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
              {provider.description}
            </p>
          )}
        </div>
      </div>

      {/* Services List */}
      {provider.services.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-slate-50 pt-3">
          {provider.services.slice(0, 3).map((s, idx) => (
            <span
              key={idx}
              className="rounded-md bg-slate-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-600"
            >
              {s.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {todayStatus.open ? (
            <span className="text-[10px] font-bold text-emerald-600">
              Open today: {todayStatus.hours}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-400">Closed today</span>
          )}
        </div>
        <Link
          href={`/patient/provider/${provider.slug}`}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3.5 text-[10px] font-bold text-white transition-colors hover:bg-emerald-700"
        >
          <span>Book Now</span>
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default function PatientProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback((loc: string, svc: string) => {
    startTransition(async () => {
      const res = await searchProvidersAction({
        service: svc || undefined,
        location: loc || undefined,
      });
      setProviders((res.data as Provider[]) || []);
      setHasSearched(true);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800">Find Providers</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Search verified pharmacies, GPs and clinics across the UK.
        </p>
      </div>

      {/* Search Panel */}
      <SearchBar
        showServiceInput={true}
        onSearch={handleSearch}
        className="border border-slate-100/80 bg-white shadow-sm"
      />

      {/* Results */}
      {isPending && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}

      {!isPending && hasSearched && providers.length === 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="mb-1 text-sm font-black text-slate-600">No providers found</h3>
          <p className="text-xs font-medium text-slate-400">
            Try adjusting your search terms or searching by service type.
          </p>
        </div>
      )}

      {!isPending && !hasSearched && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="mb-1 text-sm font-black text-slate-500">Search for providers</h3>
          <p className="text-xs font-medium text-slate-400">
            Use the search above to find verified healthcare providers near you.
          </p>
        </div>
      )}

      {!isPending && providers.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold text-slate-500">
            {providers.length} provider{providers.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
