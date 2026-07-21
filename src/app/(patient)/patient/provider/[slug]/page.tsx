import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Star,
} from "lucide-react";
import { getProviderBySlugAction } from "@/actions/patient";

interface Props {
  params: { slug: string };
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function PatientProviderDetailPage({ params }: Props) {
  const res = await getProviderBySlugAction(params.slug);

  if (!res.success || !res.data) {
    notFound();
  }

  const provider = res.data;
  const initials = provider.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Group availability by day index
  const schedule = DAY_NAMES.map((dayName, idx) => {
    const slot = provider.availability.find((a) => a.dayOfWeek === idx);
    return {
      dayName,
      hours: slot ? `${slot.openTime} – ${slot.closeTime}` : "Closed",
      isOpen: !!slot,
    };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/patient/providers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to search
        </Link>
      </div>

      {/* Provider Hero / Identity block */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Cover image placeholder */}
        <div className="relative flex h-32 items-end bg-slate-100 bg-gradient-to-r from-emerald-500/20 to-teal-500/10 p-6">
          <div className="absolute right-4 top-4 flex gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-white/90 px-2.5 py-1 text-[9px] font-bold text-slate-700 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> CQC Regulated
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="relative flex flex-col gap-6 border-b border-slate-50 p-6 pt-0 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-6 flex items-start gap-4">
            {provider.logoUrl ? (
              <img
                src={provider.logoUrl}
                alt={provider.name}
                className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white bg-white object-cover shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-emerald-100 text-xl font-black text-emerald-700 shadow-md">
                {initials}
              </div>
            )}
            <div className="min-w-0 pt-6">
              <h1 className="text-xl font-black leading-tight text-slate-800">{provider.name}</h1>
              <div className="mt-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate text-xs font-semibold text-slate-500">
                  {provider.address}
                </span>
              </div>
            </div>
          </div>

          <a
            href={`/book/${provider.slug}`}
            target="_blank"
            className="inline-flex select-none items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99]"
          >
            Book Appointment <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Contacts */}
        <div className="grid grid-cols-1 gap-4 bg-slate-50/50 px-6 py-4 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              Call Clinic:{" "}
              <a href={`tel:${provider.phone}`} className="text-slate-850 hover:underline">
                {provider.phone}
              </a>
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              Email Clinic:{" "}
              <a href={`mailto:${provider.email}`} className="text-slate-850 hover:underline">
                {provider.email}
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.6fr_1fr]">
        {/* Left: Services */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="border-b border-slate-100 pb-3 text-sm font-black uppercase tracking-wider text-slate-800">
              Services Offered ({provider.services.length})
            </h2>

            {provider.services.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {provider.services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: s.color || "#1D9E75" }}
                        />
                        <h3 className="text-xs font-black leading-snug text-slate-800">{s.name}</h3>
                      </div>
                      {s.description && (
                        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
                          {s.description}
                        </p>
                      )}
                      <div className="mt-2 flex gap-4">
                        <span className="text-[10px] font-bold text-slate-400">
                          {s.duration} mins duration
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-black text-slate-800">
                        £{Number(s.price).toFixed(2)}
                      </p>
                      <a
                        href={`/book/${provider.slug}?service=${s.id}`}
                        target="_blank"
                        className="mt-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 hover:underline"
                      >
                        Book <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-semibold text-slate-400">
                No active services are listed for this clinic.
              </div>
            )}
          </div>
        </div>

        {/* Right: Opening Hours & Description */}
        <div className="space-y-6">
          {provider.description && (
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="border-b border-slate-100 pb-2 text-xs font-black uppercase tracking-wider text-slate-800">
                About the Clinic
              </h2>
              <p className="text-xs font-medium leading-relaxed text-slate-600">
                {provider.description}
              </p>
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="border-b border-slate-100 pb-2 text-xs font-black uppercase tracking-wider text-slate-800">
              Opening Hours
            </h2>
            <div className="space-y-2">
              {schedule.map((item) => (
                <div
                  key={item.dayName}
                  className="flex items-center justify-between text-xs font-semibold"
                >
                  <span className="text-slate-500">{item.dayName}</span>
                  <span className={item.isOpen ? "text-slate-700" : "text-slate-400"}>
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
