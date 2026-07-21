import Link from "next/link";
import {
  Search,
  MapPin,
  Stethoscope,
  Sparkles,
  HeartPulse,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const POPULAR_SERVICES = [
  { name: "Flu Vaccination", desc: "Protect yourself against seasonal influenza." },
  { name: "Ear Wax Removal", desc: "Micro-suction ear wax removal treatment." },
  { name: "Travel Vaccination", desc: "Get travel health advice and vaccinations." },
  { name: "Private GP Consultation", desc: "Consult a private GP clinic in person or online." },
];

export default function PatientBookPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800">Book Appointment</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Choose a service or find local verified providers across the UK.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-slate-700">Find Clinic / Pharmacy</h2>
        <p className="text-xs font-medium leading-relaxed text-slate-500">
          Search for providers that offer the service you need near your location.
        </p>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Link
            href="/patient/providers"
            className="group flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="bg-emerald-105 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <Search className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Search Providers</p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                  Search by name, location, or service.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Popular services grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
          Popular Clinic Services
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {POPULAR_SERVICES.map((s) => (
            <Link
              key={s.name}
              href={`/patient/providers?service=${encodeURIComponent(s.name)}`}
              className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-black leading-tight text-slate-800">{s.name}</h4>
                </div>
                <p className="text-[10px] font-medium leading-relaxed text-slate-500">{s.desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-600 group-hover:underline">
                Find clinics offering this <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Booking Trust info banner */}
      <div className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white">
          <HeartPulse className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-black leading-none text-slate-800">
            Verified Partner Clinical Systems{" "}
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          </h4>
          <p className="text-slate-550 mt-1 text-[10px] font-medium leading-relaxed">
            All clinics listed on NextDoorClinic are fully registered with the General
            Pharmaceutical Council (GPhC) or the Care Quality Commission (CQC) in the UK. Your
            consultations are fully confidential and NHS compliant.
          </p>
        </div>
      </div>
    </div>
  );
}
